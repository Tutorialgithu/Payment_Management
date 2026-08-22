const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Admin = require('../models/Admin');

const ensureDefaultAdmin = async (shouldExit = false) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const connStr = process.env.MONGODB_URI;
      try {
        await mongoose.connect(connStr, { serverSelectionTimeoutMS: 5000 });
        console.log('[MongoDB]: Connected to MongoDB Cluster...');
      } catch (connErr) {
        console.warn(`[MongoDB Direct Connection Failed]: ${connErr.message}`);
        console.log('[MongoDB]: Falling back to Memory Server...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);
        console.log(`[MongoDB Memory Server Connected]: ${mongoUri}`);
      }
    }

    const email = (process.env.ADMIN_EMAIL || 'adarshchoudhary835@gmail.com').toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    
    let admin = await Admin.findOne({ email });
    if (!admin) {
      const passwordHash = await Admin.hashPassword(password);
      // Check if any old admin exists and update email, or create new
      const oldAdmin = await Admin.findOne();
      if (oldAdmin) {
        oldAdmin.email = email;
        await oldAdmin.save();
        console.log(`[Admin Initialization]: Updated existing admin email to ${email}`);
      } else {
        await Admin.create({
          name: 'Super Admin',
          email,
          mobile: '9876543210',
          passwordHash,
          businessName: 'Lending Tracker Admin',
          businessAddress: '',
          businessPhone: '',
          currencySymbol: '₹',
          receiptPrefix: 'REC-',
          notificationSettings: {
            sendPaymentReceived: true,
            sendEmiReminder: true,
            sendDueReminder: true,
            sendOverdueReminder: true,
            sendAccountCompleted: true,
            reminderDaysBefore: 3,
            whatsappEnabled: true,
            smsEnabled: true
          }
        });
        console.log(`[Admin Initialization]: Default admin account created -> Email: ${email}`);
      }
    } else {
      console.log(`[Admin Initialization]: Admin account (${email}) already exists in database.`);
    }

    if (shouldExit) {
      process.exit(0);
    }
  } catch (error) {
    console.error('[Admin Setup Error]:', error);
    if (shouldExit) {
      process.exit(1);
    }
  }
};

if (require.main === module) {
  ensureDefaultAdmin(true);
}

module.exports = {
  seedData: ensureDefaultAdmin,
  ensureDefaultAdmin
};
