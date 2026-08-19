const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { initCronJobs } = require('./services/cronService');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const peopleRoutes = require('./routes/peopleRoutes');
const accountsRoutes = require('./routes/accountsRoutes');
const paymentsRoutes = require('./routes/paymentsRoutes');
const emiRoutes = require('./routes/emiRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const notificationsRoutes = require('./routes/notificationsRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const auditRoutes = require('./routes/auditRoutes');

const app = express();

// Connect Database
connectDB();

// Security & Utility Middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve Uploaded Files with Cross-Origin headers
app.use(
  '/uploads',
  (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  },
  express.static(path.join(__dirname, '../uploads'))
);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
    service: 'Payment Management & Lending Tracker API'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/people', peopleRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/emi', emiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/audit-logs', auditRoutes);

// Global Error Handler
app.use(errorHandler);

// Initialize Cron Jobs
initCronJobs();

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`[Lending Tracker API Server]: Running on PORT ${PORT}`);
  console.log(`[Environment]: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=======================================================`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[Error]: Port ${PORT} is already in use. Please check if another process is running or set PORT in .env.`);
    process.exit(1);
  } else {
    console.error('[Server Error]:', err);
  }
});

process.on('unhandledRejection', (err) => {
  console.error('[Unhandled Rejection]:', err.message);
});

module.exports = app;
