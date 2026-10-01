const express = require('express');
const router = express.Router();
const CreditEntry = require('../models/CreditEntry');
const { protect, authorize } = require('../middleware/auth');
const { createAuditLog } = require('../utils/auditLogger');

// @GET /api/credit
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 50, startDate, endDate, status, search, branch } = req.query;
    const query = {};
    if (branch) query.branch = branch;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.dateString = {};
      if (startDate) query.dateString.$gte = startDate;
      if (endDate) query.dateString.$lte = endDate;
    }
    if (search) query.$or = [{ customerName: { $regex: search, $options: 'i' } }, { customerPhone: { $regex: search, $options: 'i' } }];
    const total = await CreditEntry.countDocuments(query);
    const data = await CreditEntry.find(query).sort({ date: -1 }).limit(parseInt(limit)).skip((parseInt(page) - 1) * parseInt(limit)).populate('createdBy', 'name');
    const totalPending = await CreditEntry.aggregate([{ $match: { ...query, status: { $ne: 'paid' } } }, { $group: { _id: null, total: { $sum: '$balanceAmount' } } }]);
    res.json({ success: true, data, total, totalPending: totalPending[0]?.total || 0, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// @POST /api/credit
router.post('/', protect, authorize('admin', 'manager', 'cashier'), async (req, res) => {
  try {
    const entry = await CreditEntry.create({ ...req.body, createdBy: req.user._id, balanceAmount: req.body.amount });
    await createAuditLog({ action: 'CREATE', module: 'CreditEntry', documentId: entry._id, userId: req.user._id, userName: req.user.name, userRole: req.user.role, after: entry, req });
    res.status(201).json({ success: true, data: entry });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// @PUT /api/credit/:id
router.put('/:id', protect, authorize('admin', 'manager', 'cashier'), async (req, res) => {
  try {
    const before = await CreditEntry.findById(req.params.id);
    const updated = await CreditEntry.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Entry not found' });
    // Update balance
    updated.balanceAmount = updated.amount - updated.paidAmount;
    if (updated.paidAmount >= updated.amount) updated.status = 'paid';
    else if (updated.paidAmount > 0) updated.status = 'partial';
    await updated.save();
    await createAuditLog({ action: 'UPDATE', module: 'CreditEntry', documentId: updated._id, userId: req.user._id, userName: req.user.name, userRole: req.user.role, before, after: updated, req });
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// @DELETE /api/credit/:id
router.delete('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const entry = await CreditEntry.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    await createAuditLog({ action: 'DELETE', module: 'CreditEntry', documentId: entry._id, userId: req.user._id, userName: req.user.name, userRole: req.user.role, before: entry, req });
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
