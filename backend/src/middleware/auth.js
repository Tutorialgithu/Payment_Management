const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_payment_lending_tracker_2026');

      req.admin = await Admin.findById(decoded.id).select('-passwordHash');
      if (!req.admin) {
        return res.status(401).json({ success: false, message: 'Not authorized, admin account not found' });
      }

      next();
    } catch (error) {
      console.error('[Auth Protect Middleware Error]:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed or expired' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no session token provided' });
  }
};

module.exports = { protect };
