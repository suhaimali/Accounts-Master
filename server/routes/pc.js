const express = require('express');
const router = express.Router();
const PCEntry = require('../models/PCEntry');
const { protect, authorize } = require('../middleware/auth');
const { createAuditLog } = require('../utils/auditLogger');

router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 50, startDate, endDate, status, branch, dailyAccountId } = req.query;
    const query = {};
    if (branch) query.branch = branch;
    if (status) query.status = status;
    if (dailyAccountId) query.dailyAccountId = dailyAccountId;
    if (startDate || endDate) { query.dateString = {}; if (startDate) query.dateString.$gte = startDate; if (endDate) query.dateString.$lte = endDate; }
    const total = await PCEntry.countDocuments(query);
    const data = await PCEntry.find(query).sort({ date: -1 }).limit(parseInt(limit)).skip((parseInt(page) - 1) * parseInt(limit)).populate('createdBy', 'name');
    const totalAmount = await PCEntry.aggregate([{ $match: query }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
    res.json({ success: true, data, total, totalAmount: totalAmount[0]?.total || 0, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', protect, authorize('admin', 'manager', 'cashier'), async (req, res) => {
  try {
    const entry = await PCEntry.create({ ...req.body, createdBy: req.user._id });
    await createAuditLog({ action: 'CREATE', module: 'PCEntry', documentId: entry._id, userId: req.user._id, userName: req.user.name, userRole: req.user.role, after: entry, req });
    res.status(201).json({ success: true, data: entry });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', protect, authorize('admin', 'manager', 'cashier'), async (req, res) => {
  try {
    const updated = await PCEntry.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    await PCEntry.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
