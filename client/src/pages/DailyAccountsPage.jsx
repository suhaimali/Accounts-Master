import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dailyAccountsAPI } from '../api/services';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../hooks/useAuth';
import {
  calculateTotalSales, calculateDifference,
  getReconciliationStatus, todayString, formatDate
} from '../utils/accountingEngine';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../components/Modal';
import {
  Save, Lock, Unlock, RefreshCw,
  Calculator, CheckCircle, AlertTriangle, AlertCircle, Clock,
  ArrowRight, Calendar
} from 'lucide-react';


function SalesForm({ account, onUpdate, disabled }) {
  const { formatCurrency } = useSettings();
  const [form, setForm] = useState({ cashSales: '', notes: '' });
  const [pcList, setPcList] = useState([]);
  const [cfList, setCfList] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (account) {
      setForm({
        cashSales: account.cashSales || '',
        notes: account.notes || '',
      });
      
      setPcList(account.pcList?.length > 0 ? account.pcList : ['']);
      
      // Migrate old data if present, otherwise use new cfList
      let initialCfList = account.cfList || [];
      if (initialCfList.length === 0 && account.cfBreakdown) {
         if (account.cfBreakdown.cf180 > 0) initialCfList.push({ multiplier: 180, count: account.cfBreakdown.cf180 });
         if (account.cfBreakdown.cf20 > 0) initialCfList.push({ multiplier: 20, count: account.cfBreakdown.cf20 });
         if (account.cfBreakdown.cfOthers > 0) initialCfList.push({ multiplier: 1, count: account.cfBreakdown.cfOthers });
      }
      setCfList(initialCfList);
    }
  }, [account?._id]);

  const pcTotal = pcList.reduce((a, b) => a + (Number(b) || 0), 0);
  const cfTotal = cfList.reduce((acc, item) => acc + ((Number(item.multiplier) || 0) * (Number(item.count) || 0)), 0);

  const totalSales = calculateTotalSales({
    cashSales: form.cashSales || 0,
    creditSales: account?.creditSales || 0,
    gpaySales: account?.gpaySales || 0,
    pcSales: pcTotal,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate({
        cashSales: Number(form.cashSales) || 0,
        pcList: pcList.map(v => Number(v) || 0).filter(v => v > 0),
        notes: form.notes,
        cfList: cfList.map(item => ({
          multiplier: Number(item.multiplier) || 0,
          count: Number(item.count) || 0,
          total: (Number(item.multiplier) || 0) * (Number(item.count) || 0)
        }))
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
          <label className="form-label" style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
            <span>PC Account List</span>
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', maxHeight: '200px', overflowY: 'auto' }}>
            {pcList.map((val, idx) => (
              <div key={idx} style={{ display: 'flex', borderBottom: idx !== pcList.length - 1 ? '1px solid #e2e8f0' : 'none', padding: '4px 0' }}>
                <input
                  type="number"
                  placeholder="0.00"
                  value={val === 0 ? '' : val}
                  onChange={(e) => {
                    const newList = [...pcList];
                    newList[idx] = e.target.value;
                    if (idx === pcList.length - 1 && e.target.value !== '') {
                      newList.push('');
                    }
                    setPcList(newList);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && val === '' && idx > 0 && idx === pcList.length - 1) {
                      e.preventDefault();
                      const newList = [...pcList];
                      newList.pop();
                      setPcList(newList);
                      // Focus previous input
                      setTimeout(() => {
                        const inputs = document.querySelectorAll('.pc-amount-input');
                        if (inputs.length > 0) inputs[inputs.length - 1].focus();
                      }, 10);
                    }
                  }}
                  disabled={disabled}
                  className="pc-amount-input"
                  style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'right', fontWeight: val ? 700 : 500, outline: 'none', fontSize: 14, color: val ? '#b45309' : '#94a3b8' }}
                />
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '2px solid #e2e8f0' }}>
              <span style={{ fontWeight: 700, color: '#475569', fontSize: 14 }}>Total:</span>
              <span style={{ fontWeight: 800, color: '#d97706', fontSize: 15 }}>{formatCurrency(pcTotal)}</span>
            </div>
          </div>
        </div>

        <div className="form-group" style={{ gridColumn: '1 / -1', borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
          <label className="form-label" style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
            <span>Carry Forward (CF) Breakdown</span>
            <span style={{ color: '#d97706' }}>Total CF: {formatCurrency(cfTotal)}</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))', gap: '8px', maxHeight: '180px', overflowY: 'auto', padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            {cfList.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <div style={{ display: 'flex', flex: 1, gap: '4px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 11 }}>₹</span>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Type"
                      value={item.multiplier === 0 ? '' : item.multiplier}
                      onChange={(e) => {
                        const newList = [...cfList];
                        newList[idx].multiplier = e.target.value;
                        setCfList(newList);
                      }}
                      disabled={disabled}
                      style={{ paddingLeft: 18, height: '32px', fontSize: 12, fontWeight: 700 }}
                    />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', display: 'flex', alignItems: 'center' }}>x</span>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Count"
                    value={item.count === 0 ? '' : item.count}
                    onChange={(e) => {
                      const newList = [...cfList];
                      newList[idx].count = e.target.value;
                      setCfList(newList);
                    }}
                    disabled={disabled}
                    style={{ flex: 1, height: '32px', fontSize: 12, fontWeight: 700 }}
                  />
                </div>
                {!disabled && (
                  <button type="button" onClick={() => setCfList(cfList.filter((_, i) => i !== idx))} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '0 10px', fontWeight: 'bold', cursor: 'pointer', height: '32px', flexShrink: 0 }}>
                    &times;
                  </button>
                )}
              </div>
            ))}
            {!disabled && (
              <button 
                type="button" 
                onClick={() => setCfList([...cfList, { multiplier: '', count: '' }])}
                style={{ background: '#fffbeb', border: '1px dashed #d97706', color: '#d97706', padding: '6px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', height: '32px', alignItems: 'center' }}
              >
                + Add CF Rule
              </button>
            )}
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
          { label: 'Procedures Revenue (PC)', value: pcTotal || 0, color: '#64748b', live: false },
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
          style={{ marginTop: 'auto', width: '100%', padding: '14px', fontSize: 15, fontWeight: 700 }}
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
    BALANCED: { bg: '#f0fdf4', border: '#bbf7d0', badgeBg: '#dcfce7', badgeColor: '#16a34a', title: 'BALANCED', icon: CheckCircle },
    SHORT: { bg: '#fef2f2', border: '#fecaca', badgeBg: '#fee2e2', badgeColor: '#dc2626', title: 'SHORT', icon: AlertTriangle },
    EXCESS: { bg: '#fffbeb', border: '#fde68a', badgeBg: '#fef3c7', badgeColor: '#d97706', title: 'EXCESS', icon: AlertCircle },
    PENDING: { bg: '#f8fafc', border: '#e2e8f0', badgeBg: '#f1f5f9', badgeColor: '#64748b', title: 'PENDING', icon: Clock },
  };

  const totalSales = (account.cashSales || 0) + (account.creditSales || 0) + (account.gpaySales || 0) + (account.pcSales || 0);

  // Balance (Without PC/CF)
  const expectedBase = (account.openingBalance || 0) + (account.cashSales || 0) - (account.totalExpenses || 0);
  const actualBase = account.physicalCashTotal || 0;
  const diffBase = actualBase - expectedBase;
  const statBase = getReconciliationStatus(diffBase, settings.balance_tolerance || 1);

  // Balance (With PC)
  const pcPhysicalCash = account.pcDenominations?.reduce((sum, d) => sum + (d.total || 0), 0) || 0;
  const expectedPC = expectedBase + (account.pcSales || 0);
  const actualPC = actualBase + pcPhysicalCash;
  const diffPC = actualPC - expectedPC;
  const statPC = getReconciliationStatus(diffPC, settings.balance_tolerance || 1);

  // Final Balance (+CF)
  // CF applies equally to both, keeping the difference the same, but serves as the final sign-off stage.
  const diffFinal = diffPC; 
  const statFinal = statPC;

  const renderStage = (label, diff, stat) => {
    const cfg = statusConfig[stat] || statusConfig.PENDING;
    const isBalanced = stat === 'BALANCED';
    const color = diff < 0 ? '#dc2626' : diff > 0 ? '#d97706' : '#16a34a';
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-sub)', marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 18, fontWeight: 800, color }}>
             {diff > 0 ? `+${formatCurrency(diff)}` : formatCurrency(diff)}
          </div>
        </div>
        <div style={{ background: cfg.badgeBg, color: cfg.badgeColor, padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
          {stat}
        </div>
      </div>
    );
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

      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Total Sales</span>
          <span style={{ fontSize: 18, fontWeight: 900, color: '#4338ca' }}>{formatCurrency(totalSales)}</span>
        </div>

        {renderStage('Balance (Without PC/CF)', diffBase, statBase)}
        {renderStage('Balance (With PC)', diffPC, statPC)}
        {renderStage('Final Balance (+CF)', diffFinal, statFinal)}
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
