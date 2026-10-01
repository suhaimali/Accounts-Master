const express = require('express');
const router = express.Router();
const DailyAccount = require('../models/DailyAccount');

// @GET /api/carry-forward/history
router.get('/', async (req, res) => {
  try {
    const { limit = 30, branch } = req.query;
    const query = branch ? { branch } : {};
    const accounts = await DailyAccount.find(query, 'dateString openingBalance carryForward physicalCashTotal status isClosed branch').sort({ dateString: -1 }).limit(parseInt(limit));
    res.json({ success: true, data: accounts });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// @PUT /api/carry-forward/:accountId - set carry forward amount
router.put('/:accountId', async (req, res) => {
  try {
    const { carryForward } = req.body;
    const account = await DailyAccount.findByIdAndUpdate(req.params.accountId, { carryForward }, { new: true });
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    res.json({ success: true, data: account });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
