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

const CURRENT_WEEKDAY = new Date().toLocaleDateString('en-IN', { weekday: 'short' });

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
            {CURRENT_WEEKDAY}, {today}
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

      </div>
    </header>
  );
}
