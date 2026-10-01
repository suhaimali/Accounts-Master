import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import {
  LayoutDashboard, BookOpen, Calculator, CreditCard, TrendingDown,
  Smartphone, PiggyBank, DollarSign, ArrowRight, BarChart3, History,
  Settings, Users, Shield, ChevronLeft, ChevronRight, X, LogOut
} from 'lucide-react';

const NAV = [
  {
    label: 'Main',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', color: '#2563eb' },
      { id: 'daily-accounts', label: 'Daily Accounts', icon: BookOpen, path: '/daily-accounts', color: '#4f46e5' },
      { id: 'cash-counter', label: 'Cash Counter', icon: Calculator, path: '/cash-counter', color: '#059669' },
    ]
  },
  {
    label: 'Transactions',
    items: [
      { id: 'credit', label: 'Credit Book', icon: CreditCard, path: '/credit', color: '#d97706' },
      { id: 'expenses', label: 'Expenses', icon: TrendingDown, path: '/expenses', color: '#dc2626' },
      { id: 'gpay', label: 'GPAY / UPI', icon: Smartphone, path: '/gpay', color: '#7c3aed' },
      { id: 'pc', label: 'Petty Cash', icon: PiggyBank, path: '/pc', color: '#0d9488' },
    ]
  },
  {
    label: 'Accounting',
    items: [
      { id: 'opening-balance', label: 'Opening Balance', icon: DollarSign, path: '/opening-balance', color: '#0284c7' },
      { id: 'carry-forward', label: 'Carry Forward', icon: ArrowRight, path: '/carry-forward', color: '#4f46e5' },
    ]
  },
  {
    label: 'Analytics',
    items: [
      { id: 'reports', label: 'Reports & P&L', icon: BarChart3, path: '/reports', color: '#2563eb' },
      { id: 'history', label: 'Audit History', icon: History, path: '/history', color: '#475569' },
    ]
  },
  {
    label: 'System',
    roles: ['admin', 'manager'],
    items: [
      { id: 'settings', label: 'Settings', icon: Settings, path: '/settings', color: '#334155' },
      { id: 'users', label: 'Users', icon: Users, path: '/users', roles: ['admin'], color: '#2563eb' },
      { id: 'audit-logs', label: 'Security Logs', icon: Shield, path: '/audit-logs', roles: ['admin', 'manager'], color: '#e11d48' },
    ]
  },
];

export default function Sidebar({
  mobileOpen,
  setMobileOpen,
  collapsed,
  setCollapsed
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { settings } = useSettings();

  const handleNav = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <aside
        className={`sidebar ${mobileOpen ? 'mobile-open' : ''} ${collapsed ? 'collapsed' : ''}`}
        id="app-sidebar"
        aria-label="Application Navigation"
      >
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-header-expanded" style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
            <div
              className="sidebar-brand"
              onClick={() => handleNav('/dashboard')}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
            >
              <div className="logo-icon">
                <BookOpen size={20} color="white" />
              </div>
              {!collapsed && (
                <div className="brand-info">
                  <span className="brand-title">Accounts Master</span>
                </div>
              )}
            </div>

            {/* Mobile Close Button */}
            <button
              className="sidebar-mobile-close-btn"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              title="Close menu"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="sidebar-nav">
          {NAV.map((section) => {
            const canSeeSection =
              !section.roles || section.roles.includes(user?.role);
            if (!canSeeSection) return null;

            const visibleItems = section.items.filter(
              (item) => !item.roles || item.roles.includes(user?.role)
            );
            if (!visibleItems.length) return null;

            return (
              <div className="nav-section" key={section.label}>
                <div className="nav-section-label">{section.label}</div>
                <div className="nav-items-group">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <button
                        key={item.id}
                        id={`nav-${item.id}`}
                        className={`nav-item ${active ? 'active' : ''}`}
                        onClick={() => handleNav(item.path)}
                        title={item.label}
                        aria-label={item.label}
                        aria-current={active ? 'page' : undefined}
                      >
                        <span className="nav-icon">
                          <Icon size={18} />
                        </span>
                        <span className="nav-label-text">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer / User Profile */}
        <div className="sidebar-footer">
          <div className="sidebar-footer-expanded">
            <div className="user-profile-card">
              <div className="user-avatar">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="user-details">
                <div className="user-name">{user?.name || 'Admin User'}</div>
                <div className="user-role-badge">{user?.role || 'admin'}</div>
              </div>
              <button
                className="user-logout-btn"
                onClick={handleLogout}
                title="Sign out"
                aria-label="Sign out"
                id="sidebar-logout-btn"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
