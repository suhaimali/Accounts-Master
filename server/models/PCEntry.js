const mongoose = require('mongoose');

const pcEntrySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  dateString: { type: String, required: true },
  type: { type: String, enum: ['petty_cash', 'advance', 'reimbursement'], default: 'petty_cash' },
  description: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  givenTo: { type: String, default: '' },
  purpose: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'settled', 'cancelled'], default: 'pending' },
  settledAmount: { type: Number, default: 0 },
  settledDate: { type: Date },
  dailyAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'DailyAccount' },
  createdBy: { type: mongoose.Schema.Types.ObjectId },
  branch: { type: String, default: 'Main' },
  notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('PCEntry', pcEntrySchema);
