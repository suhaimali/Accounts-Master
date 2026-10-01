require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const DailyAccount = require('./models/DailyAccount');
const Expense = require('./models/Expense');
const CreditEntry = require('./models/CreditEntry');
const GpayTransaction = require('./models/GpayTransaction');
const PCEntry = require('./models/PCEntry');
const Settings = require('./models/Settings');
const AuditLog = require('./models/AuditLog');
const { getDefaultDenominations, calculatePhysicalCash } = require('./utils/accountingEngine');

// ─── Realistic data pools ────────────────────────────────────────────────────

const CUSTOMERS = [
  { name: 'Ramesh Verma',    phone: '9812345670' },
  { name: 'Sunil Gupta',     phone: '9823456781' },
  { name: 'Kavya Nair',      phone: '9834567892' },
  { name: 'Arjun Reddy',     phone: '9845678903' },
  { name: 'Priya Sharma',    phone: '9856789014' },
  { name: 'Mohan Lal',       phone: '9867890125' },
  { name: 'Deepa Iyer',      phone: '9878901236' },
  { name: 'Vikram Singh',    phone: '9889012347' },
  { name: 'Anita Mishra',    phone: '9890123458' },
  { name: 'Ravi Krishnan',   phone: '9801234569' },
  { name: 'Sunita Agarwal',  phone: '9812340987' },
  { name: 'Ajay Patel',      phone: '9823451098' },
];

const GPAY_SENDERS = [
  'Rahul Kumar', 'Priya Sharma', 'Amit Singh', 'Sneha Patel',
  'Vijay Mehta', 'Rekha Joshi', 'Sanjay Das', 'Meena Pillai',
  'Rohit Yadav', 'Neha Kapoor', 'Kiran Rao', 'Tarun Bhat',
];

const EXPENSE_DATA = {
  Rent:          ['Monthly shop rent',        'Godown rent',            'Parking space rent'    ],
  Salary:        ['Staff salary - Oct',       'Cashier salary',         'Delivery boy wages'    ],
  Utilities:     ['Electricity bill',         'Water bill',             'Internet bill'         ],
  Transport:     ['Goods transport charges',  'Delivery vehicle fuel',  'Auto fare reimbursement'],
  Supplies:      ['Packing materials',        'Stationery purchase',    'Carry bags & pouches'  ],
  Maintenance:   ['AC servicing',             'CCTV maintenance',       'Shop painting charges' ],
  Marketing:     ['Newspaper ad',             'Banner printing',        'Social media promotion'],
  Miscellaneous: ['Tea & refreshments',       'Office cleaning',        'Miscellaneous expense' ],
};

const PC_DESCRIPTIONS = [
  { desc: 'Tea & snacks for staff',   to: 'Canteen'         },
  { desc: 'Auto fare for errand',     to: 'Delivery staff'  },
  { desc: 'Postage & courier',        to: 'Post office'     },
  { desc: 'Emergency stationery',     to: 'Stationery shop' },
  { desc: 'Cleaning supplies',        to: 'Supplier'        },
  { desc: 'Petty repairs',            to: 'Handyman'        },
];

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = arr => arr[rand(0, arr.length - 1)];
const maybe = (prob = 0.5) => Math.random() < prob;

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // ── Clear all collections ─────────────────────────────────────────────
    await Promise.all([
      User.deleteMany(),
      DailyAccount.deleteMany(),
      Expense.deleteMany(),
      CreditEntry.deleteMany(),
      GpayTransaction.deleteMany(),
      PCEntry.deleteMany(),
      Settings.deleteMany(),
      AuditLog.deleteMany(),
    ]);
    console.log('🗑️  Cleared existing data');

    // ── Users ─────────────────────────────────────────────────────────────
    const adminPass = await bcrypt.hash('12345678', 12);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@accountsmaster.com',
      password: adminPass,
      role: 'admin',
      branch: 'Main'
    });
    const manager = admin;
    const cashier = admin;
    console.log('👥 Admin user created (1)');

    // ── Business Settings ─────────────────────────────────────────────────
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
    console.log('⚙️  Settings created');

    // ── 60 days of daily accounts ──────────────────────────────────────────
    const today = new Date();
    let previousCarryForward = 8500;
    let totalAccounts = 0, totalExpenses = 0, totalGpay = 0, totalCredit = 0, totalPC = 0;

    for (let i = 59; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay(); // 0=Sun
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isClosed = i > 0;

      // Realistic sales — weekends higher, seasonal variation
      const salesMultiplier = isWeekend ? 1.4 : 1.0;
      const cashSales   = Math.round(rand(12000, 28000) * salesMultiplier);
      const creditSales = Math.round(rand(2000,  8000)  * salesMultiplier);
      const gpaySales   = Math.round(rand(5000,  15000) * salesMultiplier);
      const pcSales     = rand(500, 3000);
      const totalSales  = cashSales + creditSales + gpaySales + pcSales;

      // Expenses: vary by category mix
      const expenseTotal = rand(1500, 5500);
      const openingBalance = previousCarryForward;

      // Denominations for physical count
      const denoms = getDefaultDenominations();
      const expectedCash = openingBalance + cashSales - expenseTotal;
      const variancePct  = maybe(0.3) ? rand(-150, 150) : rand(-20, 20); // mostly balanced
      const physicalCash = Math.max(0, expectedCash + variancePct);

      // Fill denominations realistically
      let remaining = physicalCash;
      const denomValues = [2000, 500, 200, 100, 50, 20, 10, 5, 2, 1];
      denoms.forEach((d, idx) => {
        if (remaining <= 0) { d.count = 0; return; }
        const maxNotes = Math.floor(remaining / d.denomination);
        d.count = idx < 3 ? Math.min(maxNotes, rand(2, 12)) : Math.min(maxNotes, rand(0, 8));
        remaining -= d.count * d.denomination;
        d.total = d.count * d.denomination;
      });

      const physicalCashTotal = calculatePhysicalCash(denoms);
      const difference = physicalCashTotal - expectedCash;
      const status = Math.abs(difference) <= 5 ? 'BALANCED' : difference < 0 ? 'SHORT' : 'EXCESS';
      const carryForward = Math.min(physicalCashTotal, rand(8000, 12000));

      const account = await DailyAccount.create({
        date, dateString,
        openingBalance,
        cashSales, creditSales, gpaySales, pcSales,
        totalSales,
        totalExpenses: expenseTotal,
        denominations: denoms,
        physicalCashTotal,
        expectedCash,
        actualCash: physicalCashTotal,
        difference,
        status,
        carryForward,
        isClosed,
        closedAt: isClosed ? new Date(date.getTime() + 3600000 * 20) : null,
        closedBy: isClosed ? manager._id : null,
        createdBy: cashier._id,
        branch: 'Main',
        notes: maybe(0.2) ? 'All entries verified and reconciled.' : '',
      });
      totalAccounts++;

      // ── Expenses (2–6 per day) ─────────────────────────────────────────
      const numExpenses = rand(2, 6);
      const usedCategories = [];
      let expenseRemaining = expenseTotal;

      for (let j = 0; j < numExpenses; j++) {
        const cats = Object.keys(EXPENSE_DATA);
        const category = pick(cats);
        usedCategories.push(category);
        const descriptions = EXPENSE_DATA[category];
        const isLast = j === numExpenses - 1;
        const amount = isLast
          ? Math.max(50, expenseRemaining)
          : rand(200, Math.max(300, Math.floor(expenseRemaining / (numExpenses - j))));
        expenseRemaining -= amount;

        await Expense.create({
          date, dateString,
          category,
          description: pick(descriptions),
          amount: Math.abs(amount),
          paymentMode: maybe(0.65) ? 'cash' : pick(['gpay', 'card', 'bank']),
          vendor: maybe(0.4) ? pick(['Local Supplier', 'Amazon', 'Flipkart', 'BigBasket', 'Swiggy']) : '',
          dailyAccountId: account._id,
          createdBy: cashier._id,
          approvedBy: maybe(0.8) ? manager._id : admin._id,
          isApproved: true,
          branch: 'Main',
        });
        totalExpenses++;
      }

      // ── GPay Transactions (1–4 per day, 85% chance) ───────────────────
      if (maybe(0.85)) {
        const numGpay = rand(1, 4);
        let gpayRemaining = gpaySales;
        for (let g = 0; g < numGpay; g++) {
          const isLast = g === numGpay - 1;
          const amount = isLast
            ? Math.max(100, gpayRemaining)
            : rand(500, Math.max(600, Math.floor(gpayRemaining / (numGpay - g))));
          gpayRemaining = Math.max(0, gpayRemaining - amount);

          await GpayTransaction.create({
            date, dateString,
            transactionId: `TXN${dateString.replace(/-/g, '')}${String(g).padStart(3, '0')}${rand(1000,9999)}`,
            senderName: pick(GPAY_SENDERS),
            amount: Math.abs(amount),
            type: 'received',
            status: 'success',
            dailyAccountId: account._id,
            createdBy: cashier._id,
            branch: 'Main',
          });
          totalGpay++;
        }
      }

      // ── Credit Entries (1–3 per day, 70% chance) ──────────────────────
      if (maybe(0.7)) {
        const numCredit = rand(1, 3);
        let creditRemaining = creditSales;
        for (let c = 0; c < numCredit; c++) {
          const customer = pick(CUSTOMERS);
          const isLast = c === numCredit - 1;
          const amount = isLast
            ? Math.max(200, creditRemaining)
            : rand(500, Math.max(600, Math.floor(creditRemaining / (numCredit - c))));
          creditRemaining = Math.max(0, creditRemaining - amount);

          // Older entries more likely paid
          const ageDays = i;
          const paidProbability = ageDays > 30 ? 0.8 : ageDays > 14 ? 0.5 : 0.2;
          const statusVal = maybe(paidProbability) ? 'paid' : maybe(0.4) ? 'partial' : 'pending';
          const paidAmount = statusVal === 'paid' ? amount : statusVal === 'partial' ? rand(Math.floor(amount * 0.3), Math.floor(amount * 0.7)) : 0;

          await CreditEntry.create({
            date, dateString,
            customerName: customer.name,
            customerPhone: customer.phone,
            amount: Math.abs(amount),
            paidAmount,
            balanceAmount: Math.abs(amount) - paidAmount,
            description: pick(['Grocery purchase', 'Monthly tab', 'Advance booking', 'Regular customer credit', 'Festival purchase']),
            paymentMode: 'cash',
            status: statusVal,
            dueDate: new Date(date.getTime() + 1000 * 60 * 60 * 24 * rand(7, 30)),
            dailyAccountId: account._id,
            createdBy: cashier._id,
            branch: 'Main',
          });
          totalCredit++;
        }
      }

      // ── Petty Cash (1–2 per day, 60% chance) ──────────────────────────
      if (maybe(0.6)) {
        const numPC = rand(1, 2);
        for (let p = 0; p < numPC; p++) {
          const pc = pick(PC_DESCRIPTIONS);
          const amount = rand(50, 800);
          const statusVal = maybe(0.7) ? 'settled' : 'pending';

          await PCEntry.create({
            date, dateString,
            type: 'petty_cash',
            description: pc.desc,
            amount,
            givenTo: pc.to,
            purpose: pc.desc,
            status: statusVal,
            settledAmount: statusVal === 'settled' ? amount : 0,
            settledDate: statusVal === 'settled' ? new Date(date.getTime() + 86400000) : undefined,
            dailyAccountId: account._id,
            createdBy: cashier._id,
            branch: 'Main',
          });
          totalPC++;
        }
      }

      // ── Audit Logs (key actions) ───────────────────────────────────────
      if (isClosed) {
        await AuditLog.create({
          userId: manager._id,
          userName: 'Store Manager',
          userRole: 'manager',
          action: 'CLOSE_DAY',
          module: 'DailyAccount',
          documentId: account._id,
          description: `Day ${dateString} closed. Status: ${status}. Difference: ₹${difference}`,
          ipAddress: '127.0.0.1',
          branch: 'Main',
        });
      }

      previousCarryForward = carryForward;
    }

    console.log(`\n✅ Seed complete! Summary:`);
    console.log(`   📅 Daily Accounts : ${totalAccounts} days (60 days)`);
    console.log(`   💸 Expenses       : ${totalExpenses} vouchers`);
    console.log(`   📱 GPay Txns      : ${totalGpay} transactions`);
    console.log(`   🤝 Credit Entries : ${totalCredit} entries`);
    console.log(`   💰 Petty Cash     : ${totalPC} entries`);
    console.log(`\n📋 Login Credentials:`);
    console.log(`   Admin: admin@accountsmaster.com / 12345678`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seed();
