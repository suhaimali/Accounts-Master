const express = require('express');
const router = express.Router();
const GpayTransaction = require('../models/GpayTransaction');
const { protect, authorize } = require('../middleware/auth');
const { createAuditLog } = require('../utils/auditLogger');

router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 50, startDate, endDate, type, branch, search, dailyAccountId } = req.query;
    const query = {};
    if (branch) query.branch = branch;
    if (type) query.type = type;
    if (dailyAccountId) query.dailyAccountId = dailyAccountId;
    if (startDate || endDate) { query.dateString = {}; if (startDate) query.dateString.$gte = startDate; if (endDate) query.dateString.$lte = endDate; }
    if (search) query.$or = [{ senderName: { $regex: search, $options: 'i' } }, { transactionId: { $regex: search, $options: 'i' } }];
    const total = await GpayTransaction.countDocuments(query);
    const data = await GpayTransaction.find(query).sort({ date: -1 }).limit(parseInt(limit)).skip((parseInt(page) - 1) * parseInt(limit)).populate('createdBy', 'name');
    const totals = await GpayTransaction.aggregate([{ $match: query }, { $group: { _id: '$type', total: { $sum: '$amount' } } }]);
    res.json({ success: true, data, total, totals, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', protect, authorize('admin', 'manager', 'cashier'), async (req, res) => {
  try {
    const entry = await GpayTransaction.create({ ...req.body, createdBy: req.user._id });
    await createAuditLog({ action: 'CREATE', module: 'GpayTransaction', documentId: entry._id, userId: req.user._id, userName: req.user.name, userRole: req.user.role, after: entry, req });
    res.status(201).json({ success: true, data: entry });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', protect, authorize('admin', 'manager', 'cashier'), async (req, res) => {
  try {
    const updated = await GpayTransaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    await GpayTransaction.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
