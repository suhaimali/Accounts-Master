import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu, Calendar, Plus,
  ChevronDown, LogOut
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../hooks/useAuth';
import { formatDate, todayString } from '../utils/accountingEngine';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/daily-accounts': 'Daily Accounts',
  '/cash-counter': 'Cash Counter',
  '/credit': 'Credit Book',
  '/expenses': 'Expenses',
  '/gpay': 'GPAY / UPI',
  '/pc': 'Petty Cash',
  '/opening-balance': 'Opening Balance',
  '/carry-forward': 'Carry Forward',
  '/reports': 'Reports & P&L',
  '/history': 'Audit History',
  '/audit-logs': 'Security Logs',
};

export default function Topbar({
  mobileOpen,
  setMobileOpen,
}) {
  const { settings } = useSettings();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const today = formatDate(todayString(), settings.date_format);
  const currentTitle = PAGE_TITLES[location.pathname] || 'Accounts Master';

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setUserDropdownOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <header className="topbar" id="app-topbar">
      {/* Left: Sidebar Toggle & Page Title */}
      <div className="topbar-left">
        {/* Mobile Hamburger Toggle */}
        <button
          className="topbar-icon-btn mobile-menu-btn"
          onClick={() => setMobileOpen((prev) => !prev)}
          id="mobile-menu-btn"
          aria-label="Open navigation menu"
        >
          <Menu size={19} />
        </button>

        {/* Clean Page Title */}
        <div className="topbar-title-wrap">
          <h1 className="topbar-title">{currentTitle}</h1>
        </div>
      </div>

      {/* Right: Date, Quick Action & User */}
      <div className="topbar-right">
        {/* Date Display */}
        <div className="topbar-date-chip">
          <Calendar size={13} className="date-icon" />
          <span>
            {new Date().toLocaleDateString('en-IN', { weekday: 'short' })}, {today}
          </span>
        </div>

        {/* Quick Record Button */}
        <button
          className="btn btn-primary btn-sm topbar-record-btn"
          onClick={() => navigate('/daily-accounts')}
          id="topbar-record-btn"
        >
          <Plus size={14} />
          <span>Record Entry</span>
        </button>

        {/* User Profile Pill with Simple Dropdown */}
        <div className="topbar-user-menu-root" ref={dropdownRef}>
          <button
            className={`topbar-user-pill ${userDropdownOpen ? 'active' : ''}`}
            onClick={() => setUserDropdownOpen((o) => !o)}
            aria-label="User profile menu"
            aria-expanded={userDropdownOpen}
          >
            <div className="topbar-user-avatar">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="topbar-user-meta">
              <span className="topbar-user-name">{user?.name || 'Admin User'}</span>
              <span className="topbar-role-tag">{user?.role || 'admin'}</span>
            </div>
            <ChevronDown size={13} className="topbar-user-chevron" />
          </button>

          {/* Simple Dropdown Menu */}
          {userDropdownOpen && (
            <div className="topbar-dropdown-menu animate-fade-in" role="menu">
              <div className="topbar-dropdown-header">
                <div className="dropdown-user-name">{user?.name || 'Admin User'}</div>
                <div className="dropdown-user-email">{user?.email || 'admin@accountsmaster.com'}</div>
              </div>
              <div className="topbar-dropdown-divider" />
              <button
                className="topbar-dropdown-item danger"
                onClick={handleLogout}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
