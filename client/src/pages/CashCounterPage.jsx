import { useState, useEffect } from 'react';
import { dailyAccountsAPI, cashCounterAPI } from '../api/services';
import { useSettings } from '../hooks/useSettings';
import {
  calculatePhysicalCash, calculateDifference, getReconciliationStatus,
  todayString, formatDate, DENOMINATIONS
} from '../utils/accountingEngine';
import toast from 'react-hot-toast';
import { Save, RefreshCw, AlertTriangle, CheckCircle, AlertCircle, Clock, Calculator } from 'lucide-react';

const DENOM_LABELS = {
  2000: '₹2000',
  500: '₹500',
  200: '₹200',
  100: '₹100',
  50: '₹50',
  20: '₹20',
  10: '₹10',
  5: '₹5',
  2: '₹2',
  1: '₹1',
};

export default function CashCounterPage() {
  const [account, setAccount] = useState(null);
  const [denominations, setDenominations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayString());
  const { formatCurrency, settings } = useSettings();

  useEffect(() => {
    loadAccount();
  }, [selectedDate]);

  const loadAccount = async () => {
    setLoading(true);
    try {
      let res;
      if (selectedDate === todayString()) res = await dailyAccountsAPI.getToday();
      else res = await dailyAccountsAPI.getByDate(selectedDate);
      const acc = res.data;
      setAccount(acc);
      const existingDenoms =
        acc.denominations?.length > 0
          ? acc.denominations
          : DENOMINATIONS.map((d) => ({ denomination: d, count: 0, total: 0 }));
      setDenominations(existingDenoms);
    } catch {
      setAccount(null);
      setDenominations(
        DENOMINATIONS.map((d) => ({ denomination: d, count: 0, total: 0 }))
      );
    } finally {
      setLoading(false);
    }
  };

  const updateCount = (denomination, count) => {
    const parsed = parseInt(count, 10) || 0;
    setDenominations((prev) =>
      prev.map((d) =>
        d.denomination === denomination
          ? {
              ...d,
              count: parsed >= 0 ? parsed : 0,
              total: denomination * (parsed >= 0 ? parsed : 0),
            }
          : d
      )
    );
  };

  const physicalTotal = calculatePhysicalCash(denominations);
  const expectedCash = account?.expectedCash || 0;
  const difference = calculateDifference(expectedCash, physicalTotal);
  const status = getReconciliationStatus(
    difference,
    settings.balance_tolerance || 1
  );

  const handleSave = async () => {
    if (!account) return toast.error('No account loaded for this date');
    setSaving(true);
    try {
      await cashCounterAPI.update(account._id, denominations);
      toast.success('Cash count successfully saved!');
      loadAccount();
    } catch (err) {
      toast.error(err.message || 'Failed to save cash count');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setDenominations(
      DENOMINATIONS.map((d) => ({ denomination: d, count: 0, total: 0 }))
    );
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner" />
      </div>
    );
  }

  // Determine styling based on status
  let statusColor = '#64748b'; // default pending
  let statusBg = '#f1f5f9';
  let StatusIcon = Clock;

  if (status === 'BALANCED') {
    statusColor = '#10b981';
    statusBg = '#ecfdf5';
    StatusIcon = CheckCircle;
  } else if (status === 'SHORT') {
    statusColor = '#ef4444';
    statusBg = '#fef2f2';
    StatusIcon = AlertTriangle;
  } else if (status === 'EXCESS') {
    statusColor = '#f59e0b';
    statusBg = '#fffbeb';
    StatusIcon = AlertCircle;
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1240, margin: '0 auto', paddingBottom: 40 }}>
      
      {/* ── Colourful Header Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
        borderRadius: 'var(--r-lg)',
        padding: '24px',
        marginBottom: 20,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        boxShadow: '0 10px 25px -5px rgba(124,58,237,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 50, height: 50, background: 'rgba(255,255,255,0.2)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calculator size={26} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>Cash Counter</h1>
            <p style={{ fontSize: 13, opacity: 0.85, margin: '4px 0 0' }}>Count physical cash by denomination and reconcile with register.</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'rgba(255,255,255,0.15)', padding: '6px 6px 6px 12px', borderRadius: 'var(--r-md)' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ 
              background: '#fff', 
              border: 'none', 
              padding: '6px 12px', 
              borderRadius: 'var(--r-sm)',
              fontSize: 13,
              fontWeight: 600,
              color: '#333',
              outline: 'none',
              cursor: 'pointer'
            }}
          />
          {selectedDate !== todayString() && (
            <button
              onClick={() => setSelectedDate(todayString())}
              style={{ background: 'var(--brand-primary)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 'var(--r-sm)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              Today
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, alignItems: 'start' }}>
        
        {/* ── Denomination Entry Card ── */}
        <div className="card" style={{ borderTop: '4px solid #7c3aed' }}>
          <div className="card-header" style={{ paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <div className="card-title" style={{ fontSize: 18, color: '#7c3aed' }}>Denomination Count</div>
            <button className="btn btn-ghost btn-sm" onClick={handleReset} title="Reset all" style={{ color: 'var(--text-muted)' }}>
              <RefreshCw size={14} /> Reset
            </button>
          </div>

          <div style={{ padding: '16px 0' }}>
            {denominations.map((d) => (
              <div key={d.denomination} style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                padding: '8px 16px', borderBottom: '1px solid var(--border-light)',
                transition: 'background 0.2s',
                backgroundColor: d.count > 0 ? '#f8fafc' : 'transparent'
              }}>
                <div style={{ width: 80 }}>
                  <span style={{ 
                    display: 'inline-block',
                    padding: '4px 10px', 
                    borderRadius: 20, 
                    fontSize: 13, 
                    fontWeight: 700,
                    background: d.denomination >= 100 ? '#e0e7ff' : '#f1f5f9',
                    color: d.denomination >= 100 ? '#4338ca' : '#64748b'
                  }}>
                    {DENOM_LABELS[d.denomination]}
                  </span>
                </div>

                <div style={{ flex: 1, padding: '0 20px' }}>
                  <input
                    type="number"
                    value={d.count === 0 ? '' : d.count}
                    onChange={(e) => updateCount(d.denomination, e.target.value)}
                    min="0"
                    placeholder="Count..."
                    disabled={account?.isClosed}
                    style={{ 
                      width: '100%', padding: '10px 14px', borderRadius: 8, 
                      border: '1.5px solid var(--border)', fontSize: 15, fontWeight: 600,
                      textAlign: 'center', outline: 'none', transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#7c3aed'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>

                <div style={{ width: 100, textAlign: 'right', fontWeight: 700, fontSize: 15, color: d.count > 0 ? 'var(--text)' : 'var(--text-muted)' }}>
                  {formatCurrency(d.denomination * (d.count || 0))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ 
            background: '#f8fafc', padding: '20px', borderRadius: '0 0 var(--r-md) var(--r-md)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderTop: '1px solid var(--border)'
          }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-sub)' }}>Total Physical Cash</span>
            <span style={{ fontSize: 26, fontWeight: 900, color: '#7c3aed', letterSpacing: '-0.5px' }}>
              {formatCurrency(physicalTotal)}
            </span>
          </div>

          {!account?.isClosed && (
            <div style={{ padding: '0 20px 20px' }}>
              <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: 16, fontWeight: 700, borderRadius: 12, background: '#7c3aed', borderColor: '#7c3aed' }}
                onClick={handleSave}
                disabled={saving}
              >
                <Save size={18} /> {saving ? 'Saving...' : 'Save Cash Count'}
              </button>
            </div>
          )}
        </div>

        {/* ── Reconciliation Cards ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          <div className="card" style={{ borderTop: `4px solid ${statusColor}`, overflow: 'hidden' }}>
            <div style={{ 
              background: statusBg, padding: '30px 20px', textAlign: 'center',
              borderBottom: '1px solid rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: '#fff', color: statusColor, marginBottom: 16, boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                <StatusIcon size={32} strokeWidth={2.5} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: statusColor, margin: '0 0 8px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                {status}
              </h2>
              <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)', marginBottom: 8, letterSpacing: '-1px' }}>
                {formatCurrency(Math.abs(difference))}
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-sub)', margin: 0, fontWeight: 500 }}>
                {status === 'SHORT' && 'Physical cash is short by this amount.'}
                {status === 'EXCESS' && 'Physical cash has an excess of this amount.'}
                {status === 'BALANCED' && 'Physical drawer cash perfectly matches calculations!'}
                {status === 'PENDING' && 'Enter denomination counts to reconcile drawer.'}
              </p>
            </div>

            <div style={{ padding: '24px' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-sub)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reconciliation Breakdown</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dashed var(--border)' }}>
                  <span style={{ color: 'var(--text-sub)', fontWeight: 500 }}>Opening Balance</span>
                  <span style={{ fontWeight: 700 }}>{formatCurrency(account?.openingBalance || 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dashed var(--border)' }}>
                  <span style={{ color: 'var(--text-sub)', fontWeight: 500 }}>+ Cash Sales</span>
                  <span style={{ fontWeight: 700, color: 'var(--green)' }}>{formatCurrency(account?.cashSales || 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dashed var(--border)' }}>
                  <span style={{ color: 'var(--text-sub)', fontWeight: 500 }}>- Cash Expenses</span>
                  <span style={{ fontWeight: 700, color: 'var(--red)' }}>{formatCurrency(account?.totalExpenses || 0)}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', background: '#f8fafc', borderRadius: 8, marginTop: 8 }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-sub)' }}>Expected Drawer Cash</span>
                  <span style={{ fontWeight: 800, fontSize: 16 }}>{formatCurrency(expectedCash)}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', background: '#f8fafc', borderRadius: 8 }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-sub)' }}>Actual Counted Cash</span>
                  <span style={{ fontWeight: 800, fontSize: 16, color: '#7c3aed' }}>{formatCurrency(physicalTotal)}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', background: statusBg, borderRadius: 8, border: `1px solid ${statusColor}40` }}>
                  <span style={{ fontWeight: 700, color: statusColor }}>Variance (Difference)</span>
                  <span style={{ fontWeight: 900, fontSize: 16, color: statusColor }}>
                    {difference > 0 ? `+${formatCurrency(difference)}` : formatCurrency(difference)}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
