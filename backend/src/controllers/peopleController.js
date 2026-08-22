const fs = require('fs');
const path = require('path');
const Person = require('../models/Person');
const Account = require('../models/Account');
const Payment = require('../models/Payment');
const EMI = require('../models/EMI');
const Notification = require('../models/Notification');
const { logAudit } = require('../models/auditLogger');

// Helper function to save Base64 strings to disk inside /uploads subfolders
const saveBase64Image = (base64Str, fieldName, personName = '') => {
  if (!base64Str || typeof base64Str !== 'string') return '';
  if (!base64Str.startsWith('data:image/')) {
    return base64Str; // Already a URL path like /uploads/ProfileImg/profile_123.jpg
  }

  try {
    let subFolder = 'ProfileImg';
    let prefix = 'profile';
    if (fieldName === 'idProofImage') {
      subFolder = 'IdProof';
      prefix = 'id';
    } else if (fieldName === 'chequeImage') {
      subFolder = 'Cheque';
      prefix = 'cheque';
    }

    const uploadDir = path.join(__dirname, `../../uploads/${subFolder}`);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const matches = base64Str.match(/^data:image\/([a-zA-Z0-9\+\-]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return '';

    let ext = matches[1].toLowerCase();
    if (ext === 'jpeg') ext = 'jpg';
    if (ext.includes('png')) ext = 'png';
    if (ext.includes('webp')) ext = 'webp';

    const dataBuffer = Buffer.from(matches[2], 'base64');

    const cleanName = personName ? personName.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
    const namePrefix = cleanName ? `${cleanName}_` : `${prefix}_`;
    const filename = `${namePrefix}${Date.now()}.${ext}`;
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, dataBuffer);
    return `/uploads/${subFolder}/${filename}`;
  } catch (err) {
    console.error(`[saveBase64Image Error for ${fieldName}]:`, err);
    return '';
  }
};

// @desc    Get all people with financial summaries
// @route   GET /api/people
// @access  Private
const getPeople = async (req, res, next) => {
  try {
    const { search, status = 'active', page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    let query = {};
    if (status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const total = await Person.countDocuments(query);
    const peopleList = await Person.find(query).sort(sort).skip(skip).limit(Number(limit));

    // Aggregate stats for each person across their separate accounts
    const peopleWithStats = await Promise.all(
      peopleList.map(async (person) => {
        const accounts = await Account.find({ personId: person._id, isSoftDeleted: false });
        
        let totalGiven = 0;
        let expectedReturn = 0;
        let totalReceived = 0;
        let outstanding = 0;
        let overdue = 0;
        let bounceAmount = 0;
        let activeAccountsCount = 0;

        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        for (let acc of accounts) {
          totalGiven += Number(acc.amountGiven) || 0;
          expectedReturn += Number(acc.expectedReturn) || 0;
          totalReceived += Number(acc.totalReceived) || 0;
          outstanding += Number(acc.outstanding) || 0;

          if (acc.status === 'overdue') {
            overdue += Number(acc.outstanding) || 0;
          }

          if (acc.repaymentType === 'emi') {
            const accEmis = await EMI.find({ accountId: acc._id });
            const missedEmis = accEmis.filter((e) => {
              const isOverdueStatus = e.status === 'overdue';
              const isPastDue = e.dueDate && new Date(e.dueDate) <= endOfToday && Number(e.remainingAmount) > 0 && e.status !== 'paid';
              return isOverdueStatus || isPastDue;
            });
            const accBounce = missedEmis.reduce((sum, e) => sum + (Number(e.remainingAmount) || Number(e.amount) || 0), 0);
            bounceAmount += accBounce;
          } else {
            const isPastDue = acc.dueDate && new Date(acc.dueDate) <= endOfToday;
            if (isPastDue && (Number(acc.outstanding) > 0)) {
              bounceAmount += Number(acc.outstanding);
            }
          }

          if (acc.status === 'active' || acc.status === 'partial' || acc.status === 'overdue') {
            activeAccountsCount++;
          }
        }

        return {
          ...person.toObject(),
          totalGiven,
          expectedReturn,
          totalReceived,
          outstanding,
          overdue,
          bounceAmount,
          activeAccountsCount,
          totalAccountsCount: accounts.length
        };
      })
    );

    res.json({
      success: true,
      count: peopleWithStats.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      people: peopleWithStats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single Person detailed financial profile
// @route   GET /api/people/:id
// @access  Private
const getPersonById = async (req, res, next) => {
  try {
    const person = await Person.findById(req.params.id);
    if (!person) {
      return res.status(404).json({ success: false, message: 'Person not found' });
    }

    // Accounts
    const accounts = await Account.find({ personId: person._id, isSoftDeleted: false }).sort({ createdAt: -1 });

    // Auto-sync and aggregate metrics for each account
    let totalGiven = 0;
    let expectedReturn = 0;
    let totalReceived = 0;
    let outstanding = 0;
    let overdue = 0;

    for (let acc of accounts) {
      const accPayments = await Payment.find({ accountId: acc._id });
      const actualReceived = Math.round(accPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) * 100) / 100;
      const actualOutstanding = Math.max(0, Math.round((acc.expectedReturn - actualReceived) * 100) / 100);

      if (acc.totalReceived !== actualReceived || acc.outstanding !== actualOutstanding) {
        acc.totalReceived = actualReceived;
        acc.outstanding = actualOutstanding;
        if (acc.outstanding <= 0) {
          acc.status = 'completed';
        } else if (acc.totalReceived > 0) {
          acc.status = 'partial';
        } else {
          acc.status = 'active';
        }
        await acc.save();
      }

      totalGiven += Number(acc.amountGiven) || 0;
      expectedReturn += Number(acc.expectedReturn) || 0;
      totalReceived += actualReceived;
      outstanding += actualOutstanding;
      if (acc.status === 'overdue') {
        overdue += actualOutstanding;
      }
    }

    // Payments
    const payments = await Payment.find({ personId: person._id }).populate('accountId', 'accountNumber purpose').sort({ paymentDate: -1 });

    // EMI Schedule across all accounts
    const emis = await EMI.find({ personId: person._id }).populate('accountId', 'accountNumber purpose').sort({ dueDate: 1 });

    // Notifications
    const notifications = await Notification.find({ personId: person._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      person,
      summary: {
        totalAccounts: accounts.length,
        totalGiven,
        expectedReturn,
        totalReceived,
        outstanding,
        overdue
      },
      accounts,
      payments,
      emis,
      notifications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new Person
// @route   POST /api/people
// @access  Private
const createPerson = async (req, res, next) => {
  try {
    const { name, mobile, profileImage, photo, idProofImage, chequeImage } = req.body;
    if (!name || !mobile) {
      return res.status(400).json({ success: false, message: 'Full name and mobile number are required' });
    }

    let pImg = saveBase64Image(profileImage || photo || '', 'profileImage', name);
    let idImg = saveBase64Image(idProofImage || '', 'idProofImage', name);
    let chqImg = saveBase64Image(chequeImage || '', 'chequeImage', name);

    // Multer upload file fallback
    if (req.files) {
      if (req.files.profileImage && req.files.profileImage[0]) {
        pImg = `/uploads/ProfileImg/${req.files.profileImage[0].filename}`;
      }
      if (req.files.idProofImage && req.files.idProofImage[0]) {
        idImg = `/uploads/IdProof/${req.files.idProofImage[0].filename}`;
      }
      if (req.files.chequeImage && req.files.chequeImage[0]) {
        chqImg = `/uploads/Cheque/${req.files.chequeImage[0].filename}`;
      }
    }

    const personData = {
      name: req.body.name,
      mobile: req.body.mobile,
      whatsappNumber: req.body.whatsappNumber || '',
      alternateMobile: req.body.alternateMobile || '',
      email: req.body.email || '',
      address: req.body.address || '',
      city: req.body.city || '',
      state: req.body.state || '',
      pincode: req.body.pincode || '',
      idProofType: req.body.idProofType || '',
      idProofNumber: req.body.idProofNumber || '',
      notes: req.body.notes || '',
      status: req.body.status || 'active',
      profileImage: pImg || '',
      idProofImage: idImg || '',
      chequeImage: chqImg || ''
    };

    const person = await Person.create(personData);

    console.log(`[Backend Person Created]: ${person.name}, Profile Image: ${person.profileImage}, ID Proof: ${person.idProofImage}, Cheque: ${person.chequeImage}`);

    await logAudit({
      adminId: req.admin._id,
      action: 'PERSON_CREATED',
      entityType: 'Person',
      entityId: person._id,
      description: `Added new borrower: ${person.name} (${person.mobile})`,
      req
    });

    res.status(201).json({ success: true, person });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Person
// @route   PUT /api/people/:id
// @access  Private
const updatePerson = async (req, res, next) => {
  try {
    let person = await Person.findById(req.params.id);
    if (!person) {
      return res.status(404).json({ success: false, message: 'Person not found' });
    }

    const updateFields = { ...req.body };
    delete updateFields.photo;
    const pName = updateFields.name || person.name || '';

    // Multer Upload Handling
    if (req.files) {
      if (req.files.profileImage && req.files.profileImage[0]) {
        updateFields.profileImage = `/uploads/ProfileImg/${req.files.profileImage[0].filename}`;
      }
      if (req.files.idProofImage && req.files.idProofImage[0]) {
        updateFields.idProofImage = `/uploads/IdProof/${req.files.idProofImage[0].filename}`;
      }
      if (req.files.chequeImage && req.files.chequeImage[0]) {
        updateFields.chequeImage = `/uploads/Cheque/${req.files.chequeImage[0].filename}`;
      }
    }

    // Convert Base64 strings to disk file URL if sent in body
    if (updateFields.profileImage && updateFields.profileImage.startsWith('data:image/')) {
      updateFields.profileImage = saveBase64Image(updateFields.profileImage, 'profileImage', pName);
    }

    if (updateFields.idProofImage && updateFields.idProofImage.startsWith('data:image/')) {
      updateFields.idProofImage = saveBase64Image(updateFields.idProofImage, 'idProofImage', pName);
    }

    if (updateFields.chequeImage && updateFields.chequeImage.startsWith('data:image/')) {
      updateFields.chequeImage = saveBase64Image(updateFields.chequeImage, 'chequeImage', pName);
    }

    // Explicitly preserve existing image fields if not provided or empty
    if (updateFields.profileImage === undefined) {
      updateFields.profileImage = person.profileImage || '';
    }

    if (updateFields.idProofImage === undefined) {
      updateFields.idProofImage = person.idProofImage || '';
    }

    if (updateFields.chequeImage === undefined) {
      updateFields.chequeImage = person.chequeImage || '';
    }

    person = await Person.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true
    });

    console.log(`[Backend Person Updated]: ${person.name}, Profile Image: ${person.profileImage}, ID Proof: ${person.idProofImage}, Cheque: ${person.chequeImage}`);

    await logAudit({
      adminId: req.admin._id,
      action: 'PERSON_UPDATED',
      entityType: 'Person',
      entityId: person._id,
      description: `Updated profile for: ${person.name}`,
      req
    });

    res.json({ success: true, person });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete / Archive Person
// @route   DELETE /api/people/:id
// @access  Private
const deletePerson = async (req, res, next) => {
  try {
    const person = await Person.findById(req.params.id);
    if (!person) {
      return res.status(404).json({ success: false, message: 'Person not found' });
    }

    const { permanent, restore } = req.query;

    if (restore === 'true') {
      person.status = 'active';
      await person.save();
      await logAudit({
        adminId: req.admin._id,
        action: 'PERSON_RESTORED',
        entityType: 'Person',
        entityId: person._id,
        description: `Restored person record to active: ${person.name}`,
        req
      });
      return res.json({ success: true, message: 'Person restored to active successfully', person });
    }

    if (permanent === 'true' || person.status === 'archived') {
      // Permanent Delete: Delete person and related accounts, payments, EMIs
      await Account.deleteMany({ personId: person._id });
      await EMI.deleteMany({ personId: person._id });
      await Payment.deleteMany({ personId: person._id });
      await Person.findByIdAndDelete(person._id);

      await logAudit({
        adminId: req.admin._id,
        action: 'PERSON_DELETED_PERMANENTLY',
        entityType: 'Person',
        entityId: person._id,
        description: `Permanently deleted person record: ${person.name}`,
        req
      });

      return res.json({ success: true, message: 'Person permanently deleted successfully' });
    }

    person.status = 'archived';
    await person.save();

    await logAudit({
      adminId: req.admin._id,
      action: 'PERSON_ARCHIVED',
      entityType: 'Person',
      entityId: person._id,
      description: `Archived person record: ${person.name}`,
      req
    });

    res.json({ success: true, message: 'Person archived successfully', person });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPeople,
  getPersonById,
  createPerson,
  updatePerson,
  deletePerson
};
