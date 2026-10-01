const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const DailyAccount = require('./models/DailyAccount');
const Expense = require('./models/Expense');
const CreditEntry = require('./models/CreditEntry');
const GpayTransaction = require('./models/GpayTransaction');
const PCEntry = require('./models/PCEntry');
const Settings = require('./models/Settings');
const AuditLog = require('./models/AuditLog');

const seedAdmin = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('Deleting all documents from all collections...');
    await Promise.all([
      User.deleteMany({}),
      DailyAccount.deleteMany({}),
      Expense.deleteMany({}),
      CreditEntry.deleteMany({}),
      GpayTransaction.deleteMany({}),
      PCEntry.deleteMany({}),
      Settings.deleteMany({}),
      AuditLog.deleteMany({})
    ]);
    
    console.log('Creating fresh admin user...');
    const hashedPassword = await bcrypt.hash('12345678', 12);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@accountsmaster.com',
      password: hashedPassword,
      role: 'admin',
      branch: 'Main'
    });
    
    const settingsData = [
      { key: 'business_name',       value: 'Accounts Master Store' },
      { key: 'business_address',    value: '12, Gandhi Nagar, Main Road, Bengaluru - 560001' },
      { key: 'business_phone',      value: '+91 98765 43210' },
      { key: 'currency',            value: 'INR' },
      { key: 'currency_symbol',     value: '₹' },
      { key: 'date_format',         value: 'DD/MM/YYYY' },
      { key: 'financial_year_start',value: '04' },
      { key: 'balance_tolerance',   value: 5 },
      { key: 'expense_categories',  value: ['Rent', 'Salary', 'Utilities', 'Transport', 'Supplies', 'Maintenance', 'Marketing', 'Miscellaneous'] },
      { key: 'denominations',       value: [2000, 500, 200, 100, 50, 20, 10, 5, 2, 1] },
    ];
    await Settings.insertMany(settingsData.map(s => ({ ...s, updatedBy: admin._id })));
    
    console.log('Done! Database is 100% empty except for Admin and Settings.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
};

seedAdmin();
