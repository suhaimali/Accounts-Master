import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dailyAccountsAPI, expensesAPI } from '../api/services';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../hooks/useAuth';
import {
  calculateTotalSales, calculateDifference,
  getReconciliationStatus, todayString, formatDate
} from '../utils/accountingEngine';
import toast from 'react-hot-toast';
import Modal, { ConfirmModal } from '../components/Modal';
import {
  Save, Lock, Unlock, RefreshCw,
  Calculator, CheckCircle, AlertTriangle, AlertCircle, Clock,
  ArrowRight, Calendar
} from 'lucide-react';

function SalesForm({ account, onUpdate, disabled }) {
  const { formatCurrency } = useSettings();
  const [form, setForm] = useState({ cashSales: '', pcSales: '', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (account) {
      setForm({
        cashSales: account.cashSales || '',
        pcSales: account.pcSales || '',
        notes: account.notes || '',
      });
    }
  }, [account?._id]);

  const totalSales = calculateTotalSales({
    cashSales: form.cashSales || 0,
    creditSales: account?.creditSales || 0,
    gpaySales: account?.gpaySales || 0,
    pcSales: form.pcSales || 0,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate({
        cashSales: Number(form.cashSales) || 0,
        pcSales: Number(form.pcSales) || 0,
        notes: form.notes,
      });
      toast.success('Sales updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to save sales');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header" style={{ marginBottom: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="card-title">Sales Breakdown &amp; Entry</div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: 999 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
              LIVE DB
            </span>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
            Register sales channels for {formatDate(account?.dateString, 'DD/MM/YYYY')}
          </div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '3px 10px', borderRadius: 9999 }}>
          Total: {formatCurrency(totalSales)}
        </span>
      </div>

      <div className="form-row form-row-2" style={{ gap: 12 }}>
        <div className="form-group">
          <label className="form-label" style={{ fontWeight: 600 }}>
            Cash Sales <span className="required">*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600, fontSize: 13 }}>₹</span>
            <input
              id="da-cash-sales"
              type="number"
              className="form-input"
              placeholder="0.00"
              value={form.cashSales}
              onChange={(e) => setForm((p) => ({ ...p, cashSales: e.target.value }))}
              disabled={disabled}
              min="0"
              step="0.01"
              style={{ paddingLeft: 26, fontWeight: 600 }}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ fontWeight: 600 }}>
            PC Sales
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600, fontSize: 13 }}>₹</span>
            <input
              id="da-pc-sales"
              type="number"
              className="form-input"
              placeholder="0.00"
              value={form.pcSales}
              onChange={(e) => setForm((p) => ({ ...p, pcSales: e.target.value }))}
              disabled={disabled}
              min="0"
              step="0.01"
              style={{ paddingLeft: 26, fontWeight: 600 }}
            />
          </div>
        </div>

        <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
          <label className="form-label">Notes &amp; Remarks</label>
          <textarea
            className="form-textarea"
            placeholder="Optional daily notes, register remarks..."
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            disabled={disabled}
            rows={2}
            style={{ fontSize: 13 }}
          />
        </div>
      </div>

      {/* Live DB Channel Summary */}
      <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', border: '1px solid #e2e8f0', marginTop: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Live Channel Totals (from DB)</div>
        {[
          { label: 'Cash Sales', value: form.cashSales || 0, color: '#10b981', live: false },
          { label: 'Credit Sales (DB)', value: account?.creditSales || 0, color: '#f59e0b', live: true },
          { label: 'GPAY / UPI (DB)', value: account?.gpaySales || 0, color: '#8b5cf6', live: true },
          { label: 'Petty Cash Sales', value: form.pcSales || 0, color: '#64748b', live: false },
        ].map(row => (
          <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#475569' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: row.color, flexShrink: 0 }} />
              {row.label}
              {row.live && <span style={{ fontSize: 9, fontWeight: 700, color: '#15803d', background: '#dcfce7', padding: '1px 5px', borderRadius: 999 }}>LIVE</span>}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{formatCurrency(row.value)}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0 0', marginTop: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Total Revenue</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#2563eb' }}>{formatCurrency(totalSales)}</span>
        </div>
      </div>

      {!disabled && (
        <button
          className="btn btn-primary"
          style={{ marginTop: 14, width: '100%' }}
          onClick={handleSave}
          disabled={saving}
          id="da-save-sales"
        >
          <Save size={16} /> {saving ? 'Saving...' : 'Save Daily Sales'}
        </button>
      )}
    </div>
  );
}

function ReconciliationPanel({ account }) {
  const { formatCurrency, settings } = useSettings();
  const navigate = useNavigate();
  if (!account) return null;

  const expectedCash = account.expectedCash || 0;
  const physicalTotal = account.physicalCashTotal || 0;
  const difference = calculateDifference(expectedCash, physicalTotal);
  const status = getReconciliationStatus(difference, settings.balance_tolerance || 1);

  const statusConfig = {
    BALANCED: {
      bg: '#f0fdf4',
      border: '#bbf7d0',
      badgeBg: '#dcfce7',
      badgeColor: '#16a34a',
      title: 'Balanced',
      icon: CheckCircle,
      desc: 'Physical drawer cash perfectly matches calculations.',
    },
    SHORT: {
      bg: '#fef2f2',
      border: '#fecaca',
      badgeBg: '#fee2e2',
      badgeColor: '#dc2626',
      title: 'Cash is Short',
      icon: AlertTriangle,
      desc: `Drawer is SHORT by ${formatCurrency(Math.abs(difference))}. Recount or check vouchers.`,
    },
    EXCESS: {
      bg: '#fffbeb',
      border: '#fde68a',
      badgeBg: '#fef3c7',
      badgeColor: '#d97706',
      title: 'Cash is in Excess',
      icon: AlertCircle,
      desc: `Drawer has an EXCESS of ${formatCurrency(difference)}.`,
    },
    PENDING: {
      bg: '#f8fafc',
      border: '#e2e8f0',
      badgeBg: '#f1f5f9',
      badgeColor: '#64748b',
      title: 'Pending Count',
      icon: Clock,
      desc: 'Please count physical cash denominations in Cash Counter.',
    },
  };

  const cfg = statusConfig[status] || statusConfig.PENDING;
  const Icon = cfg.icon;

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header" style={{ marginBottom: 14 }}>
        <div>
          <div className="card-title">Drawer Reconciliation & Cash Flow</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
            Physical cash drawer vs register expected balance
          </div>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => navigate('/cash-counter')}
          title="Open Denomination Cash Counter"
        >
          <Calculator size={14} /> Cash Counter <ArrowRight size={13} />
        </button>
      </div>

      {/* Modern Status Banner */}
      <div
        style={{
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          borderRadius: 'var(--radius-md)',
          padding: '14px 16px',
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-sm)',
              background: cfg.badgeBg,
              color: cfg.badgeColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={20} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
              {cfg.title}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>
              {cfg.desc}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Variance
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: difference < 0 ? '#dc2626' : difference > 0 ? '#d97706' : '#16a34a',
            }}
          >
            {difference > 0 ? `+${formatCurrency(difference)}` : formatCurrency(difference)}
          </div>
        </div>
      </div>

      {/* Cash Flow Ledger */}
      <div
        style={{
          background: 'var(--bg-primary)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          border: '1px solid var(--border)',
          marginTop: 14,
        }}
      >
        <div className="summary-row" style={{ padding: '4px 0' }}>
          <span className="summary-label">Opening Balance</span>
          <span className="summary-value">{formatCurrency(account.openingBalance || 0)}</span>
        </div>
        <div className="summary-row" style={{ padding: '4px 0' }}>
          <span className="summary-label">+ Cash Sales</span>
          <span className="summary-value text-success" style={{ fontWeight: 600 }}>
            {formatCurrency(account.cashSales || 0)}
          </span>
        </div>
        <div className="summary-row" style={{ padding: '4px 0' }}>
          <span className="summary-label">- Cash Expenses</span>
          <span className="summary-value text-danger" style={{ fontWeight: 600 }}>
            {formatCurrency(account.totalExpenses || 0)}
          </span>
        </div>

        <div className="summary-row total divider" style={{ marginTop: 6, paddingTop: 8 }}>
          <span className="summary-label" style={{ fontWeight: 700 }}>Expected Drawer Cash</span>
          <span className="summary-value" style={{ fontWeight: 700 }}>
            {formatCurrency(expectedCash)}
          </span>
        </div>

        <div className="summary-row total" style={{ padding: '4px 0' }}>
          <span className="summary-label" style={{ fontWeight: 700 }}>Actual Counted Cash</span>
          <span className="summary-value" style={{ fontWeight: 800, color: 'var(--brand-primary)' }}>
            {formatCurrency(physicalTotal)}
          </span>
        </div>
      </div>

      {account.isClosed && (
        <div
          style={{
            marginTop: 12,
            padding: '10px 14px',
            background: 'var(--success-bg)',
            border: '1px solid var(--success-border)',
            borderRadius: 'var(--radius-md)',
            fontSize: 12.5,
            color: 'var(--success)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontWeight: 600,
          }}
        >
          <Lock size={15} /> Day Closed & Reconciled • Carry Forward: {formatCurrency(account.carryForward || 0)}
        </div>
      )}
    </div>
  );
}
export default function DailyAccountsPage() {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [closingDay, setClosingDay] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const { can } = useAuth();
  const { formatCurrency } = useSettings();

  useEffect(() => {
    loadAccount(selectedDate);
  }, [selectedDate]);

  const loadAccount = async (date) => {
    setLoading(true);
    try {
      if (date === todayString()) {
        const res = await dailyAccountsAPI.getToday();
        setAccount(res.data);
      } else {
        try {
          const res = await dailyAccountsAPI.getByDate(date);
          setAccount(res.data);
        } catch {
          setAccount(null);
        }
      }
    } catch {
      toast.error('Failed to load daily account');
      setAccount(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data) => {
    const res = await dailyAccountsAPI.update(account._id, data);
    setAccount(res.data);
  };

  const handleCloseDay = async () => {
    setClosingDay(true);
    try {
      const res = await dailyAccountsAPI.closeDay(account._id);
      setAccount(res.data);
      setShowCloseConfirm(false);
      toast.success('Day closed and balances carried forward!');
    } catch (err) {
      toast.error(err.message || 'Failed to close day');
    } finally {
      setClosingDay(false);
    }
  };

  const handleReopen = async () => {
    try {
      const res = await dailyAccountsAPI.reopenDay(account._id);
      setAccount(res.data);
      toast.success('Day reopened for editing!');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const disabled = account?.isClosed && !can(['admin']);

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1240, margin: '0 auto' }}>
      {/* 1. Page Header */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 className="page-title">Daily Accounts Register</h1>
              {account?.isClosed ? (
                <span className="badge badge-secondary" style={{ fontSize: 11 }}>
                  🔒 Day Closed
                </span>
              ) : (
                <span className="badge badge-success" style={{ fontSize: 11 }}>
                  ● Open for Entries
                </span>
              )}
            </div>
            <p className="page-desc">
              Record sales channels, track daily expenses, and reconcile register cash drawer.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <input
              id="da-date-picker"
              type="date"
              className="form-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ width: 160, fontSize: 13 }}
              aria-label="Select Date"
            />
            {selectedDate !== todayString() && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedDate(todayString())}
              >
                <RefreshCw size={13} /> Today
              </button>
            )}
            {account && !account.isClosed && can(['admin', 'manager']) && (
              <button
                className="btn btn-danger btn-sm"
                onClick={() => setShowCloseConfirm(true)}
                id="close-day-btn"
              >
                <Lock size={14} /> Close Day
              </button>
            )}
            {account?.isClosed && can(['admin']) && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleReopen}
                id="reopen-day-btn"
              >
                <Unlock size={14} /> Reopen
              </button>
            )}
          </div>
        </div>
      </div>

      {!account ? (
        <div className="card">
          <div className="empty-state" style={{ minHeight: 400 }}>
            <div className="empty-state-icon"><Calendar size={40} strokeWidth={1.2} /></div>
            <h3>No Account Found for {formatDate(selectedDate, 'DD/MM/YYYY')}</h3>
            <p>No accounting register entry exists for this selected date.</p>
            <button
              className="btn btn-primary"
              style={{ marginTop: 16 }}
              onClick={() => setSelectedDate(todayString())}
            >
              Go to Today's Register
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 2-Column Split: Sales Entry & Drawer Reconciliation */}
          <div className="grid grid-2" style={{ gap: 16, alignItems: 'stretch' }}>
            <SalesForm
              account={account}
              onUpdate={handleUpdate}
              disabled={disabled}
            />
            <ReconciliationPanel account={account} />
          </div>

        </div>
      )}

      <ConfirmModal
        isOpen={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        onConfirm={handleCloseDay}
        loading={closingDay}
        title="Close & Lock Day Register"
        message={`Are you sure you want to close the daily accounts for ${formatDate(
          selectedDate,
          'DD/MM/YYYY'
        )}? This will calculate carry forward, lock cashier modifications, and finalize today's balances.`}
        confirmLabel="Close Day"
        confirmClass="btn-danger"
      />
    </div>
  );
}
