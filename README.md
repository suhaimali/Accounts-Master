# 🏦 Accounts Master (v2.0 Pro)
> **#1 Daily Accounting & Cash Reconciliation Progressive Web Application (PWA)**  
> Built with React 18, Vite, Express.js, MongoDB, and Tailwind-grade Vanilla CSS Design System.

[![PWA Ready](https://img.shields.io/badge/PWA-Ready-success.svg)](#progressive-web-app-pwa)
[![React 18](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](#)

---

## 🌟 Overview

**Accounts Master** is an enterprise-grade financial management and daily cash reconciliation web application designed for retail businesses, multi-counter stores, supermarkets, restaurants, and corporate offices. It automates daily opening balances, sales tracking, petty cash, Google Pay/UPI transactions, customer credit, business expenses, and denomination-based physical cash counting with real-time discrepancy detection (**SHORT / EXCESS / BALANCED**).

---

## 📱 Mobile-First & Responsive (All Screen Sizes)

- **Desktop (1024px+)**: Dual-mode collapsible sidebar, wide-screen data tables, multi-column analytics, interactive charts.
- **Tablet (768px – 1024px)**: Fluid 2-column dashboard grids, responsive modal drawers, touch-friendly inputs.
- **Mobile (320px – 767px)**:
  - **Bottom Tab Navigation Bar** with high-frequency shortcuts (`Home`, `Accounts`, `Cash Counter`, `Reports`, `More`).
  - **Slide-up "More" Drawer Sheet** for accessing all 14 sub-modules smoothly.
  - Safe-area insets (`env(safe-area-inset-bottom)`) for notched iPhones and modern Android devices.
  - Touch-optimized denomination calculator with rapid +/- counters.

---

## 📲 Progressive Web App (PWA) Features

- **Installable**: Install directly on iOS (Safari Add to Home Screen) and Android (Chrome Install App banner).
- **Service Worker (`sw.js`)**: Network-first strategy for dynamic financial APIs and Cache-first for static UI assets.
- **Offline Resilient**: Continues to display shell and cached views if internet connection drops.
- **High-Resolution App Icons**: 512x512 maskable app icon and apple-touch-icon included.
- **Theme Color Synchronization**: Dark navy background (`#080d1a`) matching system status bars.

---

## 🧮 Core Accounting & Reconciliation Formulas

All financial calculations are centrally calculated in `accountingEngine.js` ensuring 100% accuracy:

```
1. Expected Cash In Hand:
   Expected Cash = Opening Cash 
                 + Total Cash Sales 
                 + Credit Recovered 
                 - Total Cash Expenses 
                 - Petty Cash Out 
                 - Cash Deposits to Bank

2. Actual Cash In Hand:
   Actual Cash = ∑ (Denomination × Count)
   [₹2000, ₹500, ₹200, ₹100, ₹50, ₹20, ₹10, ₹5, ₹2, ₹1, Coins]

3. Reconciliation Discrepancy:
   Discrepancy = Actual Cash - Expected Cash

4. Status Determination:
   - Discrepancy == 0  ➔  BALANCED  (Green)
   - Discrepancy > 0   ➔  EXCESS    (Blue / Info)
   - Discrepancy < 0   ➔  SHORT     (Red / Danger)

5. Carry Forward Closing Balance:
   Closing Cash = Actual Cash counted at end of day
   (Automatically pre-fills the next business day's Opening Balance)
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **MongoDB** (running locally on `mongodb://localhost:27017` or MongoDB Atlas URI in `.env`)
- **npm** (v9+)

### 2. Installation
Clone the repository and install dependencies for both root and client:
```bash
# Install root (backend) dependencies
npm install

# Install client (frontend) dependencies
cd client
npm install
cd ..
```
*Or use the unified helper command:*
```bash
npm run install:all
```

### 3. Database Seeding (Demo Data)
Populate the database with sample business settings, admin users, categories, and 30 days of realistic transaction data:
```bash
npm run seed
```

### 4. Running the Development Servers
Start both Express API server (`:5000`) and Vite React server (`:5173`) concurrently:
```bash
npm run dev
```

### 5. Open in Browser
Open your browser and navigate to:
```
http://localhost:5173
```

---

## 🔑 Default Login Credentials

| Role | Email | Password | Permissions |
|:-----|:------|:---------|:------------|
| **Admin** | `admin@accountsmaster.com` | `admin123` | Full access (All modules, user management, system settings, audit logs) |
| **Manager** | `manager@accountsmaster.com` | `manager123` | Accounts, cash counting, reconciliation, credit, reports, audit logs |
| **Cashier** | `cashier@accountsmaster.com` | `cashier123` | Daily entries, denomination counter, cash reconciliation |

---

## 📂 Project Architecture & Folder Structure

```
├── .env                       # Environment variables (PORT, MONGO_URI, JWT_SECRET)
├── package.json               # Backend dependencies & orchestration scripts
├── README.md                  # Complete documentation
│
├── server/                    # Node.js + Express Backend
│   ├── index.js               # Express application entry point & middleware
│   ├── seed.js                # Database seeder (30 days of data + demo users)
│   ├── middleware/
│   │   ├── auth.js            # JWT verification & RBAC role authorization
│   │   └── audit.js           # Automated audit trail logger middleware
│   ├── models/
│   │   ├── User.js            # User model with bcrypt password hashing
│   │   ├── DailyAccount.js    # Daily accounts & closing record
│   │   ├── CashReconciliation.js # Denomination breakdown & variance record
│   │   ├── Credit.js          # Customer credit book (given & recovered)
│   │   ├── Expense.js         # Categorized business expenses & payment mode
│   │   ├── GpayTransaction.js # Digital UPI/GPAY reconciliation & fees
│   │   ├── PettyCash.js       # Petty cash logbook
│   │   ├── OpeningBalance.js  # Opening balances (Cash + Bank)
│   │   ├── AuditLog.js        # Immutable security audit trail
│   │   └── Settings.js        # Business metadata, currency, categories, theme
│   ├── routes/
│   │   ├── auth.js            # Sign in, profile, password update
│   │   ├── dailyAccounts.js   # Daily accounting CRUD & day closing
│   │   ├── cashReconciliation.js # Denominations & reconciliation engine
│   │   ├── credit.js          # Credit ledger & payments
│   │   ├── expenses.js        # Expense tracking & category breakdown
│   │   ├── gpay.js            # UPI / Google Pay transactions
│   │   ├── pc.js              # Petty cash operations
│   │   ├── openingBalance.js  # Daily opening balance configuration
│   │   ├── carryForward.js    # Automated carry-forward calculation
│   │   ├── reports.js         # Monthly & custom date range aggregations
│   │   ├── history.js         # Historical daily records & search
│   │   ├── settings.js        # Store settings & system configuration
│   │   ├── users.js           # User management (Admin only)
│   │   └── auditLogs.js       # System audit logs
│   └── utils/
│       └── accountingEngine.js# Server-side accounting verification formulas
│
└── client/                    # React 18 + Vite Frontend
    ├── index.html             # PWA HTML shell with meta tags & SW registration
    ├── vite.config.js         # Vite config with API proxy to localhost:5000
    ├── public/
    │   ├── manifest.json      # PWA Web App Manifest
    │   ├── sw.js              # Service Worker for offline caching
    │   └── icon-512.jpg       # High-res PWA icon & favicon
    └── src/
        ├── App.jsx            # Route definitions & global providers
        ├── main.jsx           # React DOM root
        ├── index.css          # Mobile-first CSS design system (Dark & Light)
        ├── api/
        │   └── client.js      # Axios instance with JWT interceptor & auto-logout
        ├── contexts/
        │   ├── AuthContext.jsx     # Authentication state, login & logout
        │   └── SettingsContext.jsx # Theme toggle, currency & business info
        ├── components/
        │   ├── AppLayout.jsx  # Main shell: Sidebar + Topbar + Content + BottomNav
        │   ├── Sidebar.jsx    # Responsive desktop & mobile slide-out drawer
        │   ├── Topbar.jsx     # Header with date, theme toggle & user profile
        │   ├── BottomNav.jsx  # Mobile 5-tab bar + slide-up More drawer
        │   ├── Modal.jsx      # Accessible modal dialog with backdrop
        │   └── ProtectedRoute.jsx # Role-based route guard
        ├── utils/
        │   └── accountingEngine.js # Client-side real-time formula calculations
        └── pages/
            ├── LoginPage.jsx          # Modern login screen with demo credentials
            ├── DashboardPage.jsx      # Summary metrics, revenue charts, quick actions
            ├── DailyAccountsPage.jsx  # Primary daily accounting worksheet
            ├── CashCounterPage.jsx    # Denomination calculator & reconciliation
            ├── CreditPage.jsx         # Customer credit management
            ├── ExpensesPage.jsx       # Business expenses with category filter
            ├── GpayPage.jsx           # GPAY / UPI transactions log
            ├── PCPage.jsx             # Petty cash tracking
            ├── OpeningBalancePage.jsx # Morning opening cash & bank configuration
            ├── CarryForwardPage.jsx   # Day-end carry forward balance
            ├── ReportsPage.jsx        # Date range reports with CSV & Excel export
            ├── HistoryPage.jsx        # Past records search & inspection
            ├── SettingsPage.jsx       # Business profile, currency, theme settings
            ├── UsersPage.jsx          # User management (Admin only)
            └── AuditLogsPage.jsx      # Activity audit logs
```

---

## 🛠️ REST API Specification

### Authentication
- `POST /api/auth/login` — Sign in with email and password, returns JWT token & user profile
- `GET /api/auth/me` — Get current logged-in user profile
- `PUT /api/auth/change-password` — Update user password

### Daily Accounts & Calculations
- `GET /api/daily-accounts?date=YYYY-MM-DD` — Retrieve daily account record
- `POST /api/daily-accounts` — Save or update daily account record
- `POST /api/daily-accounts/close` — Mark day as officially closed

### Cash Counter & Reconciliation
- `GET /api/reconciliation?date=YYYY-MM-DD` — Get cash counter breakdown
- `POST /api/reconciliation` — Save denomination counts and reconcile

### Financial Modules
- `GET / POST / PUT / DELETE /api/credit` — Customer credit book
- `GET / POST / PUT / DELETE /api/expenses` — Business expenses
- `GET / POST / PUT / DELETE /api/gpay` — UPI / Google Pay entries
- `GET / POST / PUT / DELETE /api/pc` — Petty cash entries
- `GET / POST /api/opening-balance` — Daily opening balance configuration
- `GET /api/carry-forward?date=YYYY-MM-DD` — Compute closing carry forward balance

### Analytics & System
- `GET /api/reports?startDate=...&endDate=...` — Financial aggregation report
- `GET /api/history` — Historical accounts listing with filters
- `GET / PUT /api/settings` — Business and display settings
- `GET / POST / PUT / DELETE /api/users` — User administration
- `GET /api/audit-logs` — Security audit logs

---

## 🎨 Theme & Customization

The app includes two built-in themes:
- **Dark Mode (Default)**: Deep obsidian navy (`#080d1a`), electric blue accents (`#3b82f6`), and soft slate borders.
- **Light Mode**: Crisp clean daylight palette (`#f8fafc`), pure white cards (`#ffffff`), and high-contrast typography.
- Change the theme in **Settings** or click the Sun/Moon icon in the top header.

---

## 📄 License
This project is licensed under the MIT License.
