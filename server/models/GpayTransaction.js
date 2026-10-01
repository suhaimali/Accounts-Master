const mongoose = require('mongoose');

const gpayTransactionSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  dateString: { type: String, required: true },
  transactionId: { type: String, default: '' },
  senderName: { type: String, default: '' },
  senderPhone: { type: String, default: '' },
  amount: { type: Number, required: true, min: 0 },
  description: { type: String, default: '' },
  type: { type: String, enum: ['received', 'sent'], default: 'received' },
  upiId: { type: String, default: '' },
  status: { type: String, enum: ['success', 'pending', 'failed'], default: 'success' },
  dailyAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'DailyAccount' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  branch: { type: String, default: 'Main' },
  notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('GpayTransaction', gpayTransactionSchema);
