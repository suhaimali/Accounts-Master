const express = require('express');
const router = express.Router();
const DailyAccount = require('../models/DailyAccount');
const Expense = require('../models/Expense');
const CreditEntry = require('../models/CreditEntry');
const GpayTransaction = require('../models/GpayTransaction');
const { protect, authorize } = require('../middleware/auth');
const { createAuditLog } = require('../utils/auditLogger');
const {
  calculateDenominations, calculatePhysicalCash, calculateExpectedCash,
  calculateReconciliation, calculateTotalSales, getDefaultDenominations
} = require('../utils/accountingEngine');

// Helper to get or create daily account
const getOrCreateDailyAccount = async (dateString, userId, branch = 'Main') => {
  let account = await DailyAccount.findOne({ dateString, branch });
  if (!account) {
    // Get previous day carry forward as opening balance
    const prevDate = new Date(dateString);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = prevDate.toISOString().split('T')[0];
    const prevAccount = await DailyAccount.findOne({ dateString: prevDateStr, branch });
    const openingBalance = prevAccount ? prevAccount.carryForward : 0;

    account = await DailyAccount.create({
      date: new Date(dateString),
      dateString,
      openingBalance,
      denominations: getDefaultDenominations(),
      createdBy: userId,
      branch,
    });
  }
  return account;
};

// Recalculate and update daily account totals
const recalculateAccount = async (accountId) => {
  const account = await DailyAccount.findById(accountId);
  if (!account) return;

  // Sum expenses for this day (cash only)
  const expenses = await Expense.find({ dailyAccountId: accountId });
  const cashExpenses = expenses.filter(e => e.paymentMode === 'cash').reduce((s, e) => s + e.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  // Sum credit sales
  const credits = await CreditEntry.find({ dailyAccountId: accountId });
  const creditSales = credits.reduce((s, c) => s + c.amount, 0);

  // Sum GPay
  const gpays = await GpayTransaction.find({ dailyAccountId: accountId, type: 'received' });
  const gpaySales = gpays.reduce((s, g) => s + g.amount, 0);

  // Calculate physical cash
  const physicalCashTotal = calculatePhysicalCash(account.denominations);

  // Expected cash formula
  const expectedCash = calculateExpectedCash({
    openingBalance: account.openingBalance,
    cashSales: account.cashSales,
    cashExpenses,
    carryForwardOut: 0,
    carryForwardIn: 0,
  });

  const { difference, status } = calculateReconciliation(expectedCash, physicalCashTotal);
  const totalSales = calculateTotalSales({ cashSales: account.cashSales, creditSales, gpaySales, pcSales: account.pcSales });

  await DailyAccount.findByIdAndUpdate(accountId, {
    totalExpenses,
    creditSales,
    gpaySales,
    physicalCashTotal,
    expectedCash,
    actualCash: physicalCashTotal,
    difference,
    status: account.isClosed ? account.status : status,
    totalSales,
  });

  return await DailyAccount.findById(accountId);
};

// @GET /api/daily-accounts
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 30, startDate, endDate, branch, status } = req.query;
    const query = {};
    if (branch) query.branch = branch;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.dateString = {};
      if (startDate) query.dateString.$gte = startDate;
      if (endDate) query.dateString.$lte = endDate;
    }
    const total = await DailyAccount.countDocuments(query);
    const accounts = await DailyAccount.find(query)
      .sort({ dateString: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('createdBy', 'name')
      .populate('closedBy', 'name');
    res.json({ success: true, data: accounts, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// @GET /api/daily-accounts/today
router.get('/today', protect, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const branch = req.query.branch || 'Main';
    const account = await getOrCreateDailyAccount(today, req.user._id, branch);
    const populated = await DailyAccount.findById(account._id).populate('createdBy', 'name').populate('closedBy', 'name');
    res.json({ success: true, data: populated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// @GET /api/daily-accounts/:date
router.get('/:date', protect, async (req, res) => {
  try {
    const { date } = req.params;
    const branch = req.query.branch || 'Main';
    const account = await DailyAccount.findOne({ dateString: date, branch }).populate('createdBy', 'name').populate('closedBy', 'name');
    if (!account) return res.status(404).json({ success: false, message: 'No account found for this date' });
    res.json({ success: true, data: account });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// @PUT /api/daily-accounts/:id - update cash sales, notes, etc.
router.put('/:id', protect, authorize('admin', 'manager', 'cashier'), async (req, res) => {
  try {
    const account = await DailyAccount.findById(req.params.id);
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    if (account.isClosed && req.user.role === 'cashier') return res.status(403).json({ success: false, message: 'Day is closed' });

    const before = account.toObject();
    const { cashSales, pcSales, openingBalance, notes, carryForward } = req.body;
    if (cashSales !== undefined) account.cashSales = cashSales;
    if (pcSales !== undefined) account.pcSales = pcSales;
    if (openingBalance !== undefined && (req.user.role === 'admin' || req.user.role === 'manager')) account.openingBalance = openingBalance;
    if (notes !== undefined) account.notes = notes;
    if (carryForward !== undefined) account.carryForward = carryForward;
    await account.save();

    const updated = await recalculateAccount(account._id);
    await createAuditLog({ action: 'UPDATE', module: 'DailyAccount', documentId: account._id, userId: req.user._id, userName: req.user.name, userRole: req.user.role, before, after: updated, req });
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// @PUT /api/daily-accounts/:id/denominations
router.put('/:id/denominations', protect, authorize('admin', 'manager', 'cashier'), async (req, res) => {
  try {
    const account = await DailyAccount.findById(req.params.id);
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    if (account.isClosed && req.user.role === 'cashier') return res.status(403).json({ success: false, message: 'Day is closed' });

    const { denominations } = req.body;
    account.denominations = calculateDenominations(denominations);
    account.physicalCashTotal = calculatePhysicalCash(account.denominations);
    await account.save();

    const updated = await recalculateAccount(account._id);
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// @POST /api/daily-accounts/:id/close - close the day
router.post('/:id/close', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const account = await DailyAccount.findById(req.params.id);
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    if (account.isClosed) return res.status(400).json({ success: false, message: 'Day already closed' });

    const recalculated = await recalculateAccount(account._id);
    recalculated.isClosed = true;
    recalculated.closedAt = new Date();
    recalculated.closedBy = req.user._id;
    await recalculated.save();

    await createAuditLog({ action: 'CLOSE_DAY', module: 'DailyAccount', documentId: account._id, userId: req.user._id, userName: req.user.name, userRole: req.user.role, req, description: `Day ${account.dateString} closed` });
    res.json({ success: true, data: recalculated, message: 'Day closed successfully' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// @POST /api/daily-accounts/:id/reopen
router.post('/:id/reopen', protect, authorize('admin'), async (req, res) => {
  try {
    const account = await DailyAccount.findByIdAndUpdate(req.params.id, { isClosed: false, closedAt: null }, { new: true });
    await createAuditLog({ action: 'REOPEN_DAY', module: 'DailyAccount', documentId: account._id, userId: req.user._id, userName: req.user.name, userRole: req.user.role, req });
    res.json({ success: true, data: account });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// @DELETE /api/daily-accounts/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const account = await DailyAccount.findById(req.params.id);
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    
    // Also optionally delete associated expenses/credits, or leave them. For now, just delete the account.
    await DailyAccount.findByIdAndDelete(req.params.id);
    
    await createAuditLog({ action: 'DELETE_DAY', module: 'DailyAccount', documentId: account._id, userId: req.user._id, userName: req.user.name, userRole: req.user.role, req, description: `Deleted Day ${account.dateString}` });
    res.json({ success: true, message: 'Day deleted successfully' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
module.exports.recalculateAccount = recalculateAccount;
