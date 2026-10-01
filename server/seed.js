require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const DailyAccount = require('./models/DailyAccount');
const Expense = require('./models/Expense');
const CreditEntry = require('./models/CreditEntry');
const GpayTransaction = require('./models/GpayTransaction');
const { getDefaultDenominations, calculatePhysicalCash } = require('./utils/accountingEngine');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([User.deleteMany(), DailyAccount.deleteMany(), Expense.deleteMany(), CreditEntry.deleteMany(), GpayTransaction.deleteMany()]);
    console.log('Cleared existing data');

    // Create users
    const adminPass = await bcrypt.hash('admin123', 12);
    const cashierPass = await bcrypt.hash('cashier123', 12);
    const [admin, manager, cashier] = await User.insertMany([
      { name: 'Admin User', email: 'admin@accountsmaster.com', password: adminPass, role: 'admin', branch: 'Main' },
      { name: 'Store Manager', email: 'manager@accountsmaster.com', password: await bcrypt.hash('manager123', 12), role: 'manager', branch: 'Main' },
      { name: 'Cashier Staff', email: 'cashier@accountsmaster.com', password: cashierPass, role: 'cashier', branch: 'Main' },
    ]);
    console.log('✅ Users created');

    // Create last 30 days of daily accounts
    const today = new Date();
    let previousCarryForward = 5000;

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      const cashSales = Math.floor(Math.random() * 15000) + 5000;
      const creditSales = Math.floor(Math.random() * 5000) + 1000;
      const gpaySales = Math.floor(Math.random() * 8000) + 2000;
      const pcSales = Math.floor(Math.random() * 2000);
      const totalSales = cashSales + creditSales + gpaySales + pcSales;

      const cashExpenses = Math.floor(Math.random() * 3000) + 500;
      const openingBalance = previousCarryForward;

      // Denominations
      const denoms = getDefaultDenominations();
      const actualCash = cashSales + openingBalance - cashExpenses;
      const variance = Math.floor(Math.random() * 201) - 100; // -100 to +100
      const physicalCash = actualCash + variance;

      denoms[1].count = Math.floor(physicalCash / 500); // 500 notes
      const remainder = physicalCash % 500;
      denoms[2].count = Math.floor(remainder / 200);
      denoms[3].count = Math.floor((remainder % 200) / 100);
      denoms[4].count = Math.floor((remainder % 100) / 50);

      const physicalCashTotal = calculatePhysicalCash(denoms);
      const difference = physicalCashTotal - actualCash;
      const status = Math.abs(difference) < 1 ? 'BALANCED' : difference < 0 ? 'SHORT' : 'EXCESS';
      const carryForward = Math.min(physicalCashTotal, 10000);

      const account = await DailyAccount.create({
        date, dateString,
        openingBalance,
        cashSales, creditSales, gpaySales, pcSales,
        totalSales,
        totalExpenses: cashExpenses,
        denominations: denoms,
        physicalCashTotal,
        expectedCash: actualCash,
        actualCash: physicalCashTotal,
        difference,
        status,
        carryForward,
        isClosed: i > 0,
        closedAt: i > 0 ? new Date() : null,
        closedBy: i > 0 ? manager._id : null,
        createdBy: cashier._id,
      });

      // Create expenses for this day
      const expenseCategories = ['Rent', 'Salary', 'Utilities', 'Transport', 'Supplies', 'Maintenance', 'Marketing', 'Miscellaneous'];
      const numExpenses = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < numExpenses; j++) {
        await Expense.create({
          date, dateString,
          category: expenseCategories[Math.floor(Math.random() * expenseCategories.length)],
          description: `Daily expense ${j + 1}`,
          amount: Math.floor(Math.random() * 1000) + 100,
          paymentMode: Math.random() > 0.5 ? 'cash' : 'gpay',
          dailyAccountId: account._id,
          createdBy: cashier._id,
          approvedBy: manager._id,
        });
      }

      // Create GPay transactions
      if (Math.random() > 0.3) {
        await GpayTransaction.create({
          date, dateString,
          transactionId: `TXN${Date.now()}${i}`,
          senderName: ['Rahul Kumar', 'Priya Sharma', 'Amit Singh', 'Sneha Patel'][Math.floor(Math.random() * 4)],
          amount: Math.floor(Math.random() * 5000) + 500,
          type: 'received',
          status: 'success',
          dailyAccountId: account._id,
          createdBy: cashier._id,
        });
      }

      // Create credit entries
      if (Math.random() > 0.5) {
        const creditAmount = Math.floor(Math.random() * 3000) + 500;
        await CreditEntry.create({
          date, dateString,
          customerName: ['Ramesh Verma', 'Sunil Gupta', 'Kavya Nair', 'Arjun Reddy'][Math.floor(Math.random() * 4)],
          customerPhone: `98${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
          amount: creditAmount,
          balanceAmount: creditAmount,
          paymentMode: 'cash',
          status: Math.random() > 0.7 ? 'paid' : Math.random() > 0.5 ? 'partial' : 'pending',
          dailyAccountId: account._id,
          createdBy: cashier._id,
        });
      }

      previousCarryForward = carryForward;
    }

    console.log('✅ 30 days of demo data created');
    console.log('\n📋 Login Credentials:');
    console.log('  Admin:   admin@accountsmaster.com / admin123');
    console.log('  Manager: manager@accountsmaster.com / manager123');
    console.log('  Cashier: cashier@accountsmaster.com / cashier123');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seed();
