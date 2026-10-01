const mongoose = require('mongoose');

// Cash denomination schema (Indian currency denominations)
const denominationSchema = new mongoose.Schema({
  denomination: { type: Number, required: true }, // 2000, 500, 200, 100, 50, 20, 10, 5, 2, 1
  count: { type: Number, default: 0 },
  total: { type: Number, default: 0 }, // denomination * count
}, { _id: false });

const dailyAccountSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  dateString: { type: String, required: true }, // YYYY-MM-DD for easy lookup

  // Opening balance
  openingBalance: { type: Number, default: 0 },

  // Sales / Collections
  totalSales: { type: Number, default: 0 },
  cashSales: { type: Number, default: 0 },
  creditSales: { type: Number, default: 0 },
  gpaySales: { type: Number, default: 0 },
  pcSales: { type: Number, default: 0 },

  // Expenses
  totalExpenses: { type: Number, default: 0 },

  // Cash Counter (actual physical count)
  denominations: [denominationSchema],
  physicalCashTotal: { type: Number, default: 0 },

  // Carry forward
  carryForward: { type: Number, default: 0 },

  // Reconciliation
  expectedCash: { type: Number, default: 0 },    // openingBalance + cashSales - expenses - carryForward(outgoing)
  actualCash: { type: Number, default: 0 },       // physicalCashTotal
  difference: { type: Number, default: 0 },       // actualCash - expectedCash
  status: { type: String, enum: ['BALANCED', 'SHORT', 'EXCESS', 'PENDING'], default: 'PENDING' },

  // Metadata
  notes: { type: String, default: '' },
  isClosed: { type: Boolean, default: false },
  closedAt: { type: Date },
  closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  branch: { type: String, default: 'Main' },
}, { timestamps: true });

dailyAccountSchema.index({ dateString: 1, branch: 1 }, { unique: true });

module.exports = mongoose.model('DailyAccount', dailyAccountSchema);
