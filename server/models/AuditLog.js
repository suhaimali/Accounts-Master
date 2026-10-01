const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true }, // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, CLOSE_DAY
  module: { type: String, required: true }, // DailyAccount, Expense, Credit, etc.
  documentId: { type: mongoose.Schema.Types.ObjectId },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String },
  userRole: { type: String },
  before: { type: mongoose.Schema.Types.Mixed }, // snapshot before change
  after: { type: mongoose.Schema.Types.Mixed },  // snapshot after change
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  branch: { type: String, default: 'Main' },
  description: { type: String, default: '' },
}, { timestamps: true });

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ module: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
