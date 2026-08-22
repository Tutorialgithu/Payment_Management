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

const nodemailer = require('nodemailer');

const sendEmailOtp = async (toEmail, otp) => {
  const user = process.env.EMAIL_USER || 'adarshchoudhary835@gmail.com';
  const pass = process.env.EMAIL_PASS;

  console.log('==================================================');
  console.log(`[EMAIL OTP GENERATED]: Email: ${toEmail} | OTP: ${otp}`);
  console.log('==================================================');

  if (pass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: user,
          pass: pass
        }
      });

      await transporter.sendMail({
        from: `"Payment Management" <${user}>`,
        to: toEmail,
        subject: 'Your Login OTP - Payment Management Admin',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #0f172a; color: #ffffff; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid #1e293b;">
            <h2 style="color: #3b82f6; text-align: center; margin-top: 0;">Payment Management Admin</h2>
            <p style="font-size: 14px; color: #94a3b8; line-height: 1.5;">Use the 6-digit OTP code below to sign in to your Admin Dashboard. This OTP is valid for 10 minutes.</p>
            <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 10px; text-align: center; padding: 18px; margin: 24px 0;">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #10b981;">${otp}</span>
            </div>
            <p style="font-size: 12px; color: #64748b; text-align: center;">If you did not request this OTP code, please ignore this email.</p>
          </div>
        `
      });
      console.log(`[EMAIL SENT SUCCESS]: OTP sent to ${toEmail}`);
      return { success: true, emailSent: true };
    } catch (err) {
      console.error('[EMAIL SEND ERROR]:', err.message);
      return { success: true, emailSent: false, error: err.message };
    }
  } else {
    console.log('[EMAIL NOTICE]: EMAIL_PASS not set in .env. OTP printed to server log above.');
    return { success: true, emailSent: false, note: 'EMAIL_PASS not configured' };
  }
};

// @desc    Send OTP to Admin Email
// @route   POST /api/auth/send-otp
// @access  Public
const sendOtp = async (req, res, next) => {
  try {
    const email = (req.body.email || process.env.ADMIN_EMAIL || 'adarshchoudhary835@gmail.com').toLowerCase().trim();

    let admin = await Admin.findOne({ email });
    if (!admin) {
      const { ensureDefaultAdmin } = require('../utils/seed');
      await ensureDefaultAdmin();
      admin = await Admin.findOne({ email }) || await Admin.findOne();
      if (admin && admin.email !== email) {
        admin.email = email;
        await admin.save();
      }
    }

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin account not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    admin.otpCode = otp;
    admin.otpExpiresAt = otpExpiresAt;
    await admin.save();

    await sendEmailOtp(email, otp);

    res.json({
      success: true,
      message: `OTP sent successfully to ${email}`,
      targetEmail: email
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP and login
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const email = (req.body.email || process.env.ADMIN_EMAIL || 'adarshchoudhary835@gmail.com').toLowerCase().trim();

    if (!otp) {
      return res.status(400).json({ success: false, message: 'Please enter the 6-digit OTP code' });
    }

    let admin = await Admin.findOne({ email });
    if (!admin) {
      admin = await Admin.findOne();
    }

    if (!admin || !admin.otpCode || !admin.otpExpiresAt) {
      return res.status(400).json({ success: false, message: 'OTP has not been requested or has expired' });
    }

    if (new Date() > new Date(admin.otpExpiresAt)) {
      admin.otpCode = null;
      admin.otpExpiresAt = null;
      await admin.save();
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new OTP.' });
    }

    if (admin.otpCode.trim() !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP code. Please try again.' });
    }

    admin.otpCode = null;
    admin.otpExpiresAt = null;
    await admin.save();

    const token = generateToken(admin._id);

    await logAudit({
      adminId: admin._id,
      action: 'ADMIN_OTP_LOGIN',
      entityType: 'Auth',
      entityId: admin._id,
      description: `Admin ${admin.email} logged in via Email OTP successfully`,
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
  sendOtp,
  verifyOtp,
  getMe,
  changePassword,
  forgotPassword,
  logout
};
