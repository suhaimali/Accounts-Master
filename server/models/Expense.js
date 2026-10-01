const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  dateString: { type: String, required: true },
  category: { type: String, required: true, trim: true },
  subCategory: { type: String, default: '' },
  description: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  paymentMode: { type: String, enum: ['cash', 'gpay', 'card', 'bank', 'other'], default: 'cash' },
  vendor: { type: String, default: '' },
  receipt: { type: String, default: '' }, // receipt number or reference
  dailyAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'DailyAccount' },
  createdBy: { type: mongoose.Schema.Types.ObjectId },
  branch: { type: String, default: 'Main' },
  notes: { type: String, default: '' },
  isApproved: { type: Boolean, default: true },
  approvedBy: { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
