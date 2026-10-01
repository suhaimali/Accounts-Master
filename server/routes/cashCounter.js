const express = require('express');
const router = express.Router();
const DailyAccount = require('../models/DailyAccount');
const { calculateDenominations, calculatePhysicalCash, calculateReconciliation } = require('../utils/accountingEngine');

// @GET /api/cash-counter/:date
router.get('/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const branch = req.query.branch || 'Main';
    const account = await DailyAccount.findOne({ dateString: date, branch });
    if (!account) return res.status(404).json({ success: false, message: 'No account for this date' });
    res.json({ success: true, data: { denominations: account.denominations, physicalCashTotal: account.physicalCashTotal, expectedCash: account.expectedCash, difference: account.difference, status: account.status } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// @PUT /api/cash-counter/:accountId - update denomination counts
router.put('/:accountId', async (req, res) => {
  try {
    const account = await DailyAccount.findById(req.params.accountId);
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    const { denominations } = req.body;
    const calculated = calculateDenominations(denominations);
    const physicalCashTotal = calculatePhysicalCash(calculated);
    const { difference, status } = calculateReconciliation(account.expectedCash, physicalCashTotal);
    const updated = await DailyAccount.findByIdAndUpdate(req.params.accountId, { denominations: calculated, physicalCashTotal, actualCash: physicalCashTotal, difference, status }, { new: true });
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
