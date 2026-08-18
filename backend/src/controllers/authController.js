const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { logAudit } = require('../models/auditLogger');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_jwt_key_payment_lending_tracker_2026', {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// @desc    Admin Login
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    let admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      const adminCount = await Admin.countDocuments({});
      if (adminCount === 0) {
        const { ensureDefaultAdmin } = require('../utils/seed');
        await ensureDefaultAdmin();
        admin = await Admin.findOne({ email: email.toLowerCase() });
      }
    }

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(admin._id);

    await logAudit({
      adminId: admin._id,
      action: 'ADMIN_LOGIN',
      entityType: 'Auth',
      entityId: admin._id,
      description: `Admin ${admin.email} logged in successfully`,
      req
    });

    res.json({
      success: true,
      token,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        mobile: admin.mobile,
        businessName: admin.businessName,
        currencySymbol: admin.currencySymbol,
        notificationSettings: admin.notificationSettings
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current admin profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('-passwordHash');
    res.json({ success: true, admin });
  } catch (error) {
    next(error);
  }
};

// @desc    Change Password
// @route   POST /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password' });
    }

    const admin = await Admin.findById(req.admin._id);
    const isMatch = await admin.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    admin.passwordHash = await Admin.hashPassword(newPassword);
    await admin.save();

    await logAudit({
      adminId: admin._id,
      action: 'CHANGE_PASSWORD',
      entityType: 'Auth',
      entityId: admin._id,
      description: 'Admin changed password successfully',
      req
    });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot Password Request
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const admin = await Admin.findOne({ email: email?.toLowerCase() });
    
    // Always return clean status to prevent enumeration
    res.json({
      success: true,
      message: 'If the admin email exists in the system, password reset instructions have been logged.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout Admin
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
  try {
    await logAudit({
      adminId: req.admin._id,
      action: 'ADMIN_LOGOUT',
      entityType: 'Auth',
      entityId: req.admin._id,
      description: `Admin ${req.admin.email} logged out`,
      req
    });

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  getMe,
  changePassword,
  forgotPassword,
  logout
};
