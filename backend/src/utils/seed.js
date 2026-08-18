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

    const adminCount = await Admin.countDocuments({});
    if (adminCount === 0) {
      const email = process.env.ADMIN_EMAIL || 'admin@lendingtracker.com';
      const password = process.env.ADMIN_PASSWORD || 'admin123';
      const passwordHash = await Admin.hashPassword(password);

      await Admin.create({
        name: 'Super Admin',
        email: email.toLowerCase(),
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
    } else {
      console.log('[Admin Initialization]: Admin account already exists in database.');
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
