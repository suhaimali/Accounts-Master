const mongoose = require('mongoose');

const creditEntrySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  dateString: { type: String, required: true },
  customerName: { type: String, required: true, trim: true },
  customerPhone: { type: String, default: '' },
  amount: { type: Number, required: true, min: 0 },
  description: { type: String, default: '' },
  paymentMode: { type: String, enum: ['cash', 'gpay', 'card', 'bank', 'other'], default: 'cash' },
  status: { type: String, enum: ['pending', 'partial', 'paid'], default: 'pending' },
  paidAmount: { type: Number, default: 0 },
  balanceAmount: { type: Number, default: 0 },
  dueDate: { type: Date },
  dailyAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'DailyAccount' },
  createdBy: { type: mongoose.Schema.Types.ObjectId },
  branch: { type: String, default: 'Main' },
  notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('CreditEntry', creditEntrySchema);
