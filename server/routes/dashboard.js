const express = require('express');
const router = express.Router();
const DailyAccount = require('../models/DailyAccount');
const Expense = require('../models/Expense');
const CreditEntry = require('../models/CreditEntry');
const GpayTransaction = require('../models/GpayTransaction');

// @GET /api/dashboard/summary
router.get('/summary', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const branch = req.query.branch || 'Main';

    // Today's data
    const todayAccount = await DailyAccount.findOne({ dateString: today, branch });

    // This month
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    const [monthSales, monthExpenses, monthGpay, pendingCredits, last7Days] = await Promise.all([
      DailyAccount.aggregate([{ $match: { dateString: { $gte: monthStart }, branch } }, { $group: { _id: null, total: { $sum: '$totalSales' }, cash: { $sum: '$cashSales' } } }]),
      Expense.aggregate([{ $match: { dateString: { $gte: monthStart }, branch } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      GpayTransaction.aggregate([{ $match: { dateString: { $gte: monthStart }, branch, type: 'received' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      CreditEntry.aggregate([{ $match: { status: { $ne: 'paid' }, branch } }, { $group: { _id: null, total: { $sum: '$balanceAmount' }, count: { $sum: 1 } } }]),
      DailyAccount.find({ branch }).sort({ dateString: -1 }).limit(7).select('dateString totalSales cashSales totalExpenses status difference'),
    ]);

    res.json({
      success: true,
      data: {
        today: todayAccount ? {
          date: todayAccount.dateString,
          openingBalance: todayAccount.openingBalance,
          totalSales: todayAccount.totalSales,
          cashSales: todayAccount.cashSales,
          creditSales: todayAccount.creditSales,
          gpaySales: todayAccount.gpaySales,
          pcSales: todayAccount.pcSales,
          totalExpenses: todayAccount.totalExpenses,
          physicalCash: todayAccount.physicalCashTotal,
          expectedCash: todayAccount.expectedCash,
          difference: todayAccount.difference,
          status: todayAccount.status,
          isClosed: todayAccount.isClosed,
          carryForward: todayAccount.carryForward,
          cfBreakdown: todayAccount.cfBreakdown || { cf180: 0, cf20: 0, cfOthers: 0 },
        } : null,
        month: {
          totalSales: monthSales[0]?.total || 0,
          cashSales: monthSales[0]?.cash || 0,
          totalExpenses: monthExpenses[0]?.total || 0,
          totalGpay: monthGpay[0]?.total || 0,
        },
        pendingCredits: { total: pendingCredits[0]?.total || 0, count: pendingCredits[0]?.count || 0 },
        last7Days,
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
