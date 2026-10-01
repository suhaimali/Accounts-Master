import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard, BookOpen, Calculator, CreditCard, TrendingDown,
  Smartphone, PiggyBank, DollarSign, ArrowRight, BarChart3, History,
  LogOut, X
} from 'lucide-react';

const NAV = [
  { id: 'dashboard',       label: 'Dashboard',       icon: LayoutDashboard, path: '/dashboard' },
  { id: 'daily-accounts',  label: 'Daily Accounts',  icon: BookOpen,        path: '/daily-accounts' },
  { id: 'cash-counter',    label: 'Cash Counter',    icon: Calculator,      path: '/cash-counter' },
  null, // divider
  { id: 'credit',          label: 'Credit Book',     icon: CreditCard,      path: '/credit' },
  { id: 'expenses',        label: 'Expenses',        icon: TrendingDown,    path: '/expenses' },
  { id: 'gpay',            label: 'GPAY / UPI',      icon: Smartphone,      path: '/gpay' },
  { id: 'pc',              label: 'Petty Cash',      icon: PiggyBank,       path: '/pc' },
  null, // divider
  { id: 'opening-balance', label: 'Opening Balance', icon: DollarSign,      path: '/opening-balance' },
  { id: 'carry-forward',   label: 'Carry Forward',   icon: ArrowRight,      path: '/carry-forward' },
  null, // divider
  { id: 'reports',         label: 'Reports',         icon: BarChart3,       path: '/reports' },
  { id: 'history',         label: 'History',         icon: History,         path: '/history' },
];

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const go = (path) => { navigate(path); setMobileOpen(false); };
  const handleLogout = () => { logout(); navigate('/login'); };
  const active = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="sb-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`sb ${mobileOpen ? 'sb-open' : ''}`} id="app-sidebar" aria-label="Navigation">

        {/* Header */}
        <div className="sb-head">
          <span className="sb-logo">AM</span>
          <span className="sb-brand">Accounts Master</span>
          <button className="sb-close" onClick={() => setMobileOpen(false)} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="sb-nav">
          {NAV.map((item, i) => {
            if (item === null) return <div key={`div-${i}`} className="sb-divider" />;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                className={`sb-item ${active(item.path) ? 'sb-item--active' : ''}`}
                onClick={() => go(item.path)}
                aria-current={active(item.path) ? 'page' : undefined}
                title={item.label}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sb-foot">
          <div className="sb-avatar">{user?.name?.[0]?.toUpperCase() || 'A'}</div>
          <div className="sb-user-info">
            <div className="sb-user-name">{user?.name || 'Admin'}</div>
            <div className="sb-user-role">Administrator</div>
          </div>
          <button className="sb-logout" onClick={handleLogout} title="Logout" id="sidebar-logout-btn">
            <LogOut size={15} />
          </button>
        </div>

      </aside>
    </>
  );
}
