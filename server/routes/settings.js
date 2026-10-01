const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { protect, authorize } = require('../middleware/auth');

const DEFAULT_SETTINGS = [
  { key: 'currency', value: 'INR', category: 'general', label: 'Currency', description: 'Currency code (INR, USD, EUR)' },
  { key: 'currency_symbol', value: '₹', category: 'general', label: 'Currency Symbol' },
  { key: 'business_name', value: 'Accounts Master', category: 'general', label: 'Business Name' },
  { key: 'business_address', value: '', category: 'general', label: 'Business Address' },
  { key: 'business_phone', value: '', category: 'general', label: 'Business Phone' },
  { key: 'theme', value: 'light', category: 'appearance', label: 'Theme', description: 'dark or light' },
  { key: 'date_format', value: 'DD/MM/YYYY', category: 'general', label: 'Date Format' },
  { key: 'financial_year_start', value: '04', category: 'accounting', label: 'Financial Year Start Month' },
  { key: 'auto_carry_forward', value: true, category: 'accounting', label: 'Auto Carry Forward' },
  { key: 'balance_tolerance', value: 1, category: 'accounting', label: 'Balance Tolerance (amount)' },
  { key: 'expense_categories', value: ['Rent', 'Salary', 'Utilities', 'Transport', 'Supplies', 'Maintenance', 'Marketing', 'Miscellaneous'], category: 'accounting', label: 'Expense Categories' },
  { key: 'denominations', value: [2000, 500, 200, 100, 50, 20, 10, 5, 2, 1], category: 'accounting', label: 'Cash Denominations' },
];

// @GET /api/settings
router.get('/', protect, async (req, res) => {
  try {
    let settings = await Settings.find();
    if (settings.length === 0) {
      settings = await Settings.insertMany(DEFAULT_SETTINGS);
    }
    const settingsObj = {};
    settings.forEach(s => { settingsObj[s.key] = s.value; });
    res.json({ success: true, data: settingsObj, raw: settings });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// @PUT /api/settings/:key
router.put('/:key', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { value } = req.body;
    const setting = await Settings.findOneAndUpdate(
      { key: req.params.key },
      { value, updatedBy: req.user._id },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: setting });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// @PUT /api/settings (bulk update)
router.put('/', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const updates = req.body; // { key: value, ... }
    const promises = Object.entries(updates).map(([key, value]) =>
      Settings.findOneAndUpdate({ key }, { value, updatedBy: req.user._id }, { new: true, upsert: true })
    );
    await Promise.all(promises);
    res.json({ success: true, message: 'Settings updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
