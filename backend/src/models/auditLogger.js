const AuditLog = require('../models/AuditLog');

const logAudit = async ({ adminId, action, entityType, entityId, description, req }) => {
  try {
    const ipAddress = req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || '127.0.0.1';
    const userAgent = req?.headers['user-agent'] || 'Web App Admin';

    await AuditLog.create({
      adminId: adminId || req?.admin?._id,
      action,
      entityType,
      entityId: entityId ? String(entityId) : '',
      description,
      ipAddress,
      userAgent
    });
  } catch (error) {
    console.error('[Audit Logger Error]:', error.message);
  }
};

module.exports = { logAudit };
