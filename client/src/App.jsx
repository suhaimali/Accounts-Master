import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppLayout from './layouts/AppLayout';

// Pages
import DashboardPage from './pages/DashboardPage';
import DailyAccountsPage from './pages/DailyAccountsPage';
import CashCounterPage from './pages/CashCounterPage';
import CarryForwardPage from './pages/CarryForwardPage';
import CreditPage from './pages/CreditPage';
import ExpensesPage from './pages/ExpensesPage';
import GpayPage from './pages/GpayPage';
import PCPage from './pages/PCPage';
import OpeningBalancePage from './pages/OpeningBalancePage';
import ReportsPage from './pages/ReportsPage';
import HistoryPage from './pages/HistoryPage';
import LoginPage from './pages/LoginPage';

function App() {
  return (
    <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#10b981', secondary: 'white' } },
              error: { iconTheme: { primary: '#ef4444', secondary: 'white' } },
            }}
          />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="daily-accounts" element={<DailyAccountsPage />} />
              <Route path="cash-counter" element={<CashCounterPage />} />
              <Route path="carry-forward" element={<CarryForwardPage />} />
              <Route path="credit" element={<CreditPage />} />
              <Route path="expenses" element={<ExpensesPage />} />
              <Route path="gpay" element={<GpayPage />} />
              <Route path="pc" element={<PCPage />} />
              <Route path="opening-balance" element={<OpeningBalancePage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
    </BrowserRouter>
  );
}

export default App;
