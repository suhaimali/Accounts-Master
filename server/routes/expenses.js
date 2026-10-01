const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const { protect, authorize } = require('../middleware/auth');
const { createAuditLog } = require('../utils/auditLogger');

// @GET /api/expenses
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 50, startDate, endDate, category, paymentMode, branch, search, dailyAccountId } = req.query;
    const query = {};
    if (branch) query.branch = branch;
    if (category) query.category = category;
    if (paymentMode) query.paymentMode = paymentMode;
    if (dailyAccountId) query.dailyAccountId = dailyAccountId;
    if (startDate || endDate) {
      query.dateString = {};
      if (startDate) query.dateString.$gte = startDate;
      if (endDate) query.dateString.$lte = endDate;
    }
    if (search) query.description = { $regex: search, $options: 'i' };
    const total = await Expense.countDocuments(query);
    const data = await Expense.find(query).sort({ date: -1 }).limit(parseInt(limit)).skip((parseInt(page) - 1) * parseInt(limit)).populate('createdBy', 'name');
    const totalAmount = await Expense.aggregate([{ $match: query }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
    res.json({ success: true, data, total, totalAmount: totalAmount[0]?.total || 0, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// @POST /api/expenses
router.post('/', protect, authorize('admin', 'manager', 'cashier'), async (req, res) => {
  try {
    const expense = await Expense.create({ ...req.body, createdBy: req.user._id, approvedBy: req.user._id });
    await createAuditLog({ action: 'CREATE', module: 'Expense', documentId: expense._id, userId: req.user._id, userName: req.user.name, userRole: req.user.role, after: expense, req });
    res.status(201).json({ success: true, data: expense });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// @PUT /api/expenses/:id
router.put('/:id', protect, authorize('admin', 'manager', 'cashier'), async (req, res) => {
  try {
    const before = await Expense.findById(req.params.id);
    const updated = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Expense not found' });
    await createAuditLog({ action: 'UPDATE', module: 'Expense', documentId: updated._id, userId: req.user._id, userName: req.user.name, userRole: req.user.role, before, after: updated, req });
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// @DELETE /api/expenses/:id
router.delete('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    await createAuditLog({ action: 'DELETE', module: 'Expense', documentId: expense._id, userId: req.user._id, userName: req.user.name, userRole: req.user.role, before: expense, req });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// @GET /api/expenses/categories
router.get('/categories/summary', protect, async (req, res) => {
  try {
    const { startDate, endDate, branch } = req.query;
    const match = {};
    if (branch) match.branch = branch;
    if (startDate || endDate) {
      match.dateString = {};
      if (startDate) match.dateString.$gte = startDate;
      if (endDate) match.dateString.$lte = endDate;
    }
    const data = await Expense.aggregate([{ $match: match }, { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } }, { $sort: { total: -1 } }]);
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
