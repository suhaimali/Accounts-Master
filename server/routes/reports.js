const express = require('express');
const router = express.Router();
const DailyAccount = require('../models/DailyAccount');
const Expense = require('../models/Expense');
const CreditEntry = require('../models/CreditEntry');
const GpayTransaction = require('../models/GpayTransaction');
const XLSX = require('xlsx');

// @GET /api/reports/daily?startDate=&endDate=&branch=
router.get('/daily', async (req, res) => {
  try {
    const { startDate, endDate, branch } = req.query;
    const query = {};
    if (branch) query.branch = branch;
    if (startDate || endDate) { query.dateString = {}; if (startDate) query.dateString.$gte = startDate; if (endDate) query.dateString.$lte = endDate; }
    const accounts = await DailyAccount.find(query).sort({ dateString: 1 });
    const summary = {
      totalSales: accounts.reduce((s, a) => s + a.totalSales, 0),
      totalCashSales: accounts.reduce((s, a) => s + a.cashSales, 0),
      totalExpenses: accounts.reduce((s, a) => s + a.totalExpenses, 0),
      totalGpay: accounts.reduce((s, a) => s + a.gpaySales, 0),
      totalCredit: accounts.reduce((s, a) => s + a.creditSales, 0),
      balanced: accounts.filter(a => a.status === 'BALANCED').length,
      short: accounts.filter(a => a.status === 'SHORT').length,
      excess: accounts.filter(a => a.status === 'EXCESS').length,
    };
    res.json({ success: true, data: accounts, summary });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// @GET /api/reports/expenses?startDate=&endDate=&category=
router.get('/expenses', async (req, res) => {
  try {
    const { startDate, endDate, branch, category } = req.query;
    const match = {};
    if (branch) match.branch = branch;
    if (category) match.category = category;
    if (startDate || endDate) { match.dateString = {}; if (startDate) match.dateString.$gte = startDate; if (endDate) match.dateString.$lte = endDate; }
    const [expenses, byCategory, byMonth] = await Promise.all([
      Expense.find(match).sort({ date: 1 }),
      Expense.aggregate([{ $match: match }, { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } }, { $sort: { total: -1 } }]),
      Expense.aggregate([{ $match: match }, { $group: { _id: { $substr: ['$dateString', 0, 7] }, total: { $sum: '$amount' } } }, { $sort: { _id: 1 } }]),
    ]);
    res.json({ success: true, data: expenses, byCategory, byMonth, total: expenses.reduce((s, e) => s + e.amount, 0) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// @GET /api/reports/reconciliation?startDate=&endDate=
router.get('/reconciliation', async (req, res) => {
  try {
    const { startDate, endDate, branch } = req.query;
    const query = {};
    if (branch) query.branch = branch;
    if (startDate || endDate) { query.dateString = {}; if (startDate) query.dateString.$gte = startDate; if (endDate) query.dateString.$lte = endDate; }
    const accounts = await DailyAccount.find(query, 'dateString openingBalance cashSales totalExpenses physicalCashTotal expectedCash actualCash difference status carryForward').sort({ dateString: 1 });
    const stats = {
      balanced: accounts.filter(a => a.status === 'BALANCED').length,
      short: accounts.filter(a => a.status === 'SHORT').length,
      excess: accounts.filter(a => a.status === 'EXCESS').length,
      totalShort: accounts.filter(a => a.status === 'SHORT').reduce((s, a) => s + Math.abs(a.difference), 0),
      totalExcess: accounts.filter(a => a.status === 'EXCESS').reduce((s, a) => s + a.difference, 0),
    };
    res.json({ success: true, data: accounts, stats });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// @GET /api/reports/credit-outstanding
router.get('/credit-outstanding', async (req, res) => {
  try {
    const branch = req.query.branch;
    const query = { status: { $ne: 'paid' } };
    if (branch) query.branch = branch;
    const data = await CreditEntry.find(query).sort({ dueDate: 1, date: 1 });
    res.json({ success: true, data, total: data.reduce((s, c) => s + c.balanceAmount, 0) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// @GET /api/reports/export?type=daily&startDate=&endDate=&format=xlsx
router.get('/export', async (req, res) => {
  try {
    const { type = 'daily', startDate, endDate, branch, format = 'xlsx' } = req.query;
    let data = [];
    let sheetName = 'Report';

    if (type === 'daily') {
      const query = {};
      if (branch) query.branch = branch;
      if (startDate || endDate) { query.dateString = {}; if (startDate) query.dateString.$gte = startDate; if (endDate) query.dateString.$lte = endDate; }
      const accounts = await DailyAccount.find(query).sort({ dateString: 1 });
      data = accounts.map(a => ({
        Date: a.dateString, Branch: a.branch, 'Opening Balance': a.openingBalance,
        'Cash Sales': a.cashSales, 'Credit Sales': a.creditSales, 'GPay': a.gpaySales, 'PC Sales': a.pcSales,
        'Total Sales': a.totalSales, 'Total Expenses': a.totalExpenses, 'Expected Cash': a.expectedCash,
        'Physical Cash': a.physicalCashTotal, 'Difference': a.difference, 'Status': a.status,
        'Carry Forward': a.carryForward, 'Closed': a.isClosed ? 'Yes' : 'No'
      }));
      sheetName = 'Daily Accounts';
    } else if (type === 'expenses') {
      const match = {};
      if (branch) match.branch = branch;
      if (startDate || endDate) { match.dateString = {}; if (startDate) match.dateString.$gte = startDate; if (endDate) match.dateString.$lte = endDate; }
      const expenses = await Expense.find(match).sort({ date: 1 });
      data = expenses.map(e => ({ Date: e.dateString, Category: e.category, Description: e.description, Amount: e.amount, 'Payment Mode': e.paymentMode, Vendor: e.vendor }));
      sheetName = 'Expenses';
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-report-${startDate || 'all'}.xlsx"`);
    res.send(buffer);
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
