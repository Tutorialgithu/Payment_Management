const Admin = require('../models/Admin');
const { logAudit } = require('../models/auditLogger');

// @desc    Get Admin Settings
// @route   GET /api/settings
// @access  Private
const getSettings = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('-passwordHash');
    res.json({ success: true, settings: admin });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Admin Settings
// @route   PUT /api/settings
// @access  Private
const updateSettings = async (req, res, next) => {
  try {
    const {
      name,
      mobile,
      businessName,
      businessLogo,
      businessAddress,
      businessPhone,
      currencySymbol,
      receiptPrefix,
      receiptFooterText,
      notificationSettings
    } = req.body;

    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    if (name !== undefined) admin.name = name;
    if (mobile !== undefined) admin.mobile = mobile;
    if (businessName !== undefined) admin.businessName = businessName;
    if (businessLogo !== undefined) admin.businessLogo = businessLogo;
    if (businessAddress !== undefined) admin.businessAddress = businessAddress;
    if (businessPhone !== undefined) admin.businessPhone = businessPhone;
    if (currencySymbol !== undefined) admin.currencySymbol = currencySymbol;
    if (receiptPrefix !== undefined) admin.receiptPrefix = receiptPrefix;
    if (receiptFooterText !== undefined) admin.receiptFooterText = receiptFooterText;

    if (notificationSettings) {
      admin.notificationSettings = {
        ...admin.notificationSettings.toObject(),
        ...notificationSettings
      };
    }

    await admin.save();

    await logAudit({
      adminId: admin._id,
      action: 'SETTINGS_UPDATED',
      entityType: 'Settings',
      entityId: admin._id,
      description: 'Updated application settings and parameters',
      req
    });

    res.json({ success: true, settings: admin });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSettings, updateSettings };
