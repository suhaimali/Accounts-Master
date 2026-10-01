const express = require('express');
const router = express.Router();
const DailyAccount = require('../models/DailyAccount');

// Opening balance is derived from previous day's carry forward
// @GET /api/opening-balance/:date
router.get('/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const branch = req.query.branch || 'Main';
    const prevDate = new Date(date);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = prevDate.toISOString().split('T')[0];
    const prevAccount = await DailyAccount.findOne({ dateString: prevDateStr, branch });
    const openingBalance = prevAccount ? prevAccount.carryForward : 0;
    res.json({ success: true, data: { date, openingBalance, prevDate: prevDateStr, prevCarryForward: prevAccount?.carryForward || 0 } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// @GET /api/opening-balance/history
router.get('/', async (req, res) => {
  try {
    const { limit = 30, branch } = req.query;
    const query = branch ? { branch } : {};
    const accounts = await DailyAccount.find(query, 'dateString openingBalance carryForward branch').sort({ dateString: -1 }).limit(parseInt(limit));
    res.json({ success: true, data: accounts });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
