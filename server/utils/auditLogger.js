const AuditLog = require('../models/AuditLog');

const createAuditLog = async ({ action, module, documentId, userId, userName, userRole, before, after, req, description }) => {
  try {
    await AuditLog.create({
      action,
      module,
      documentId,
      userId,
      userName,
      userRole,
      before,
      after,
      ipAddress: req?.ip || '',
      userAgent: req?.headers?.['user-agent'] || '',
      description,
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

module.exports = { createAuditLog };
