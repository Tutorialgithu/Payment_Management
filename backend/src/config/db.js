const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/payment_management';
    const conn = await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`[MongoDB Connected]: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[MongoDB Direct Connection Failed]: ${error.message}`);
    console.log('[MongoDB]: Attempting fallback or using memory server if required...');
    try {
      // Attempting mongo memory server as fallback if installed or throw error
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
      console.log(`[MongoDB Memory Server Connected]: ${mongoUri}`);
    } catch (memErr) {
      console.error(`[MongoDB Connection Fatal Error]: ${memErr.message}`);
      process.exit(1);
    }
  }

  // Ensure default admin and sample data exist in DB
  const { ensureDefaultAdmin } = require('../utils/seed');
  await ensureDefaultAdmin();
};

module.exports = connectDB;
