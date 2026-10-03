import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  TrendingUp, TrendingDown, Wallet, CreditCard,
  AlertTriangle, CheckCircle2, ArrowRight,
  BookOpen, Calculator, Plus,
  RefreshCw, Search, LogOut
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { dashboardAPI } from '../api/services';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../hooks/useAuth';
import { formatDate, todayString } from '../utils/accountingEngine';

/* Simple Clean Status Badge */
const SimpleStatusBadge = ({ status, difference = 0, formatCurrency }) => {
  const isBalanced = status === 'BALANCED' || difference === 0;
  const isShort = difference < 0;
  const isExcess = difference > 0;

  if (isBalanced) {
    return (
      <span className="badge badge-success">
        <CheckCircle2 size={12} /> Balanced
      </span>
    );
  }

  if (isShort) {
    return (
      <span className="badge badge-danger">
        <AlertTriangle size={12} /> Short {formatCurrency ? formatCurrency(Math.abs(difference)) : `₹${Math.abs(difference)}`}
      </span>
    );
  }

  if (isExcess) {
    return (
      <span className="badge badge-warning">
        <AlertTriangle size={12} /> Excess +{formatCurrency ? formatCurrency(difference) : `₹${difference}`}
      </span>
    );
  }

  return <span className="badge badge-secondary">Pending Count</span>;
};

const CURRENT_DATE = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export default function DashboardPage() {
  const navigate = useNavigate();
  const { formatCurrency, settings } = useSettings();
  const { user, logout } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setRefreshing(true);
      const res = await dashboardAPI.getSummary();
      setData(res.data);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const today = data?.today;
  const month = data?.month;
  const pending = data?.pendingCredits;

  // Chart data mapping
  const chartData = useMemo(() => {
    return (data?.last7Days || [])
      .map((d) => ({
        date: formatDate(d.dateString, 'DD/MM'),
        Sales: d.totalSales || 0,
        Expenses: d.totalExpenses || 0,
      }))
      .reverse();
  }, [data?.last7Days]);

  // Financial Metrics
  const todaySales = today?.totalSales || 0;
  const todayCashSales = today?.cashSales || 0;
  const todayExpenses = today?.totalExpenses || 0;
  const todayExpectedCash = today?.expectedCash || 0;
  const todayPhysicalCash = today?.physicalCash || 0;
  const todayDifference = today ? today.difference : 0;
  const reconciliationStatus = today?.status || (todayDifference === 0 ? 'BALANCED' : todayDifference < 0 ? 'SHORT' : 'EXCESS');

  const gpayVal = today?.gpaySales || (month?.totalGpay ? Math.round(month.totalGpay / 7) : Math.round(todaySales * 0.35));
  const creditVal = today?.creditSales || (Math.max(0, todaySales - todayCashSales - gpayVal) || Math.round(todaySales * 0.13));

  // Calculated Detailed Summary Fields
  const balWithout = todaySales - (todayExpenses + (today?.gpaySales || 0)) + (today?.openingBalance || 0);
  const balWithPc = balWithout + (today?.pcSales || 0);
  const balWithPcCf = balWithPc + (today?.carryForward || 0);

  const diffWithout = todayPhysicalCash - balWithout;
  const diffWithPc = todayPhysicalCash - balWithPc;
  const diffWithPcCf = todayPhysicalCash - balWithPcCf;

  const channels = [
    { name: 'Cash Sales', value: todayCashSales, color: '#2563eb' },
    { name: 'GPAY / UPI', value: gpayVal > 0 ? gpayVal : 0, color: '#3b82f6' },
    { name: 'Customer Credit', value: creditVal > 0 ? creditVal : 0, color: '#f59e0b' },
  ];
  const totalChannels = channels.reduce((acc, c) => acc + c.value, 0) || 1;

  // Filtered Ledger
  const filteredLedger = useMemo(() => {
    return (data?.last7Days || []).filter((row) => {
      // Exclude auto-created empty accounts (where everything is 0)
      const isEmpty = (row.totalSales || 0) === 0 && (row.cashSales || 0) === 0 && (row.totalExpenses || 0) === 0 && (row.physicalCashTotal || 0) === 0 && (row.difference || 0) === 0 && (row.carryForward || 0) === 0;
      if (isEmpty) return false;
      
      const dateFormatted = formatDate(row.dateString, settings?.date_format || 'DD/MM/YYYY').toLowerCase();
      const matchesSearch = dateFormatted.includes(searchTerm.toLowerCase());
      const rowStatus = row.status || (row.difference === 0 ? 'BALANCED' : row.difference < 0 ? 'SHORT' : 'EXCESS');
      const matchesStatus = statusFilter === 'ALL' || rowStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data?.last7Days, searchTerm, statusFilter, settings?.date_format]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#3b82f6' }}>
        <div className="spinning" style={{ width: 40, height: 40, borderRadius: '50%', border: '4px solid #eff6ff', borderTopColor: '#3b82f6' }}></div>
      </div>
    );
  }

  return (
    <div className="simple-dash-container animate-fade-in">
      {/* 1. Welcome Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12, marginBottom: 20,
        background: '#fff', border: '1px solid #f1f5f9',
        borderRadius: 12, padding: '14px 20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        {/* Left: greeting */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: '#2563eb', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 16, flexShrink: 0,
          }}>
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
              Welcome back, {user?.name || 'Admin'}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>
              {CURRENT_DATE}
            </div>
          </div>
        </div>

        {/* Right: quick actions */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn btn-secondary btn-sm btn-icon" onClick={loadDashboard} disabled={refreshing} title="Refresh">
            <RefreshCw size={14} className={refreshing ? 'spinning' : ''} />
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/cash-counter')}>
            <Calculator size={14} /> Count Cash
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/expenses')}>
            <Plus size={14} /> Add Expense
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/daily-accounts')}>
            <BookOpen size={14} /> Daily Accounts
          </button>
          <button className="btn btn-secondary btn-sm btn-icon" style={{ color: '#ef4444', borderColor: '#fee2e2', background: '#fef2f2' }} onClick={() => { logout(); navigate('/login'); }} title="Log out">
            <LogOut size={14} />
          </button>
        </div>
      </div>

      {/* 2. Simple Reconciliation Status Card */}
      <div className="card dash-recon-card">
        <div className="recon-left">
          <div className={`recon-icon-box ${reconciliationStatus.toLowerCase()}`}>
            {reconciliationStatus === 'BALANCED' ? (
              <CheckCircle2 size={20} />
            ) : (
              <AlertTriangle size={20} />
            )}
          </div>
          <div>
            <div className="recon-title-row">
              <span className="recon-title">Cash Drawer Status</span>
              <SimpleStatusBadge
                status={reconciliationStatus}
                difference={todayDifference}
                formatCurrency={formatCurrency}
              />
            </div>
            <p className="recon-desc">
              {reconciliationStatus === 'BALANCED'
                ? 'Physical cash matches the expected system ledger calculation.'
                : `Discrepancy detected: ${formatCurrency(Math.abs(todayDifference))} ${todayDifference < 0 ? 'short' : 'excess'}.`}
            </p>
          </div>
        </div>

        <div className="recon-numbers">
          <div className="recon-stat">
            <span className="recon-stat-lbl">Expected System</span>
            <span className="recon-stat-val">{formatCurrency(todayExpectedCash)}</span>
          </div>
          <div className="recon-divider" />
          <div className="recon-stat">
            <span className="recon-stat-lbl">Physical Counted</span>
            <span className="recon-stat-val">{formatCurrency(todayPhysicalCash)}</span>
          </div>
          <div className="recon-divider" />
          <div className="recon-stat">
            <span className="recon-stat-lbl">Variance</span>
            <span className={`recon-stat-val ${todayDifference === 0 ? 'val-green' : 'val-red'}`}>
              {todayDifference === 0 ? '₹0.00' : formatCurrency(todayDifference)}
            </span>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/cash-counter')}
            style={{ marginLeft: 8 }}
          >
            Recount Drawer →
          </button>
        </div>
      </div>

      {/* 2.5 Modern Detailed Reconciliation Summary */}
      <div className="card" style={{ padding: '20px' }}>
        <div className="chart-header" style={{ marginBottom: '16px' }}>
          <div>
            <h3 className="chart-title">Detailed Reconciliation</h3>
            <p className="chart-subtitle">Step-by-step breakdown of balances</p>
          </div>
          <div style={{ padding: '6px 12px', background: diffWithout >= 0 ? '#ecfdf5' : '#fef2f2', color: diffWithout >= 0 ? '#059669' : '#dc2626', borderRadius: '8px', fontWeight: 700, fontSize: '14px', border: `1px solid ${diffWithout >= 0 ? '#a7f3d0' : '#fecaca'}`, display: 'flex', alignItems: 'center', gap: '6px' }}>
            STATUS: {diffWithout > 0 ? `+${formatCurrency(diffWithout)} EXCESS` : diffWithout < 0 ? `${formatCurrency(Math.abs(diffWithout))} SHORT` : 'BALANCED'}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '20px' }}>
          {/* Breakdown List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', borderRadius: '6px' }}>
              <span style={{ fontWeight: 600, color: '#475569' }}>Total Sales</span>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatCurrency(todaySales)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', borderRadius: '6px' }}>
              <span style={{ fontWeight: 600, color: '#475569' }}>Balance (Without PC/CF)</span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{formatCurrency(balWithout)}</div>
                <div style={{ fontSize: '11px', color: diffWithout >= 0 ? '#059669' : '#dc2626', fontWeight: 600 }}>{diffWithout > 0 ? `+${diffWithout} EXES` : diffWithout < 0 ? `${Math.abs(diffWithout)} SHORT` : 'BALANCED'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', borderRadius: '6px' }}>
              <span style={{ fontWeight: 600, color: '#475569' }}>Balance (With PC)</span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{formatCurrency(balWithPc)}</div>
                <div style={{ fontSize: '11px', color: diffWithPc >= 0 ? '#059669' : '#dc2626', fontWeight: 600 }}>{diffWithPc > 0 ? `+${diffWithPc} EXES` : diffWithPc < 0 ? `${Math.abs(diffWithPc)} SHORT` : 'BALANCED'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
              <span style={{ fontWeight: 700, color: '#1e3a8a' }}>Final Balance (+CF)</span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, color: '#1d4ed8' }}>{formatCurrency(balWithPcCf)}</div>
                <div style={{ fontSize: '11px', color: diffWithPcCf >= 0 ? '#059669' : '#dc2626', fontWeight: 600 }}>{diffWithPcCf > 0 ? `+${diffWithPcCf} EXES` : diffWithPcCf < 0 ? `${Math.abs(diffWithPcCf)} SHORT` : 'BALANCED'}</div>
              </div>
            </div>
          </div>

          {/* Additional Info Cards (CF) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '16px', height: '100%' }}>
              <div style={{ fontSize: '13px', color: '#b45309', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Carry Forward (CF) Breakdown</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#92400e', marginBottom: '16px' }}>{formatCurrency(today?.carryForward || 0)}</div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #fcd34d' }}>
                  <span style={{ color: '#b45309', fontWeight: 600 }}>180</span>
                  <span style={{ fontWeight: 800, color: '#92400e' }}>{today?.cfBreakdown?.cf180 || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #fcd34d' }}>
                  <span style={{ color: '#b45309', fontWeight: 600 }}>20</span>
                  <span style={{ fontWeight: 800, color: '#92400e' }}>{today?.cfBreakdown?.cf20 || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#b45309', fontWeight: 700, gridColumn: 'span 2' }}>
                  <span>OTHERS</span>
                  <span style={{ fontWeight: 800, color: '#92400e' }}>{formatCurrency(today?.cfBreakdown?.cfOthers || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Four Simple Metric Cards */}
      <div className="dash-metrics-grid">
        {/* Card 1: Today's Revenue */}
        <div className="card metric-box">
          <div className="metric-box-top">
            <span className="metric-box-label">Today's Revenue</span>
            <div className="metric-box-icon blue">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="metric-box-value">{formatCurrency(todaySales)}</div>
          <div className="metric-box-footer">
            <span>Cash: {formatCurrency(todayCashSales)}</span>
            <span>UPI: {formatCurrency(gpayVal)}</span>
          </div>
        </div>

        {/* Card 2: Drawer Cash Balance */}
        <div className="card metric-box">
          <div className="metric-box-top">
            <span className="metric-box-label">Drawer Cash Balance</span>
            <div className="metric-box-icon green">
              <Wallet size={16} />
            </div>
          </div>
          <div className="metric-box-value">{formatCurrency(todayExpectedCash)}</div>
          <div className="metric-box-footer">
            <span>Counted: {formatCurrency(todayPhysicalCash)}</span>
            <span className={todayDifference === 0 ? 'val-green' : 'val-red'}>
              {todayDifference === 0 ? 'Balanced' : `${formatCurrency(todayDifference)}`}
            </span>
          </div>
        </div>

        {/* Card 3: Today's Expenses */}
        <div className="card metric-box">
          <div className="metric-box-top">
            <span className="metric-box-label">Today's Expenses</span>
            <div className="metric-box-icon red">
              <TrendingDown size={16} />
            </div>
          </div>
          <div className="metric-box-value" style={{ color: '#dc2626' }}>
            {formatCurrency(todayExpenses)}
          </div>
          <div className="metric-box-footer">
            <span>Month: {formatCurrency(month?.totalExpenses || 0)}</span>
            <span>{todaySales > 0 ? `${((todayExpenses / todaySales) * 100).toFixed(1)}%` : '0%'} of sales</span>
          </div>
        </div>

        {/* Card 4: Customer Credit */}
        <div className="card metric-box">
          <div className="metric-box-top">
            <span className="metric-box-label">Customer Credit Book</span>
            <div className="metric-box-icon amber">
              <CreditCard size={16} />
            </div>
          </div>
          <div className="metric-box-value">{formatCurrency(pending?.total || 0)}</div>
          <div className="metric-box-footer">
            <span>{pending?.count || 0} open debtors</span>
            <span
              onClick={() => navigate('/credit')}
              style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}
            >
              View Ledger →
            </span>
          </div>
        </div>
      </div>

      {/* 4. Charts Section (Sales vs Expenses + Payment Channels) */}
      <div className="dash-charts-grid">
        {/* 7-Day Bar Chart */}
        <div className="card chart-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Sales vs Expenses (Last 7 Days)</h3>
              <p className="chart-subtitle">Daily sales revenue compared to operating expenses</p>
            </div>
            <div className="chart-legend">
              <span className="legend-item"><span className="dot blue" /> Sales</span>
              <span className="legend-item"><span className="dot red" /> Expenses</span>
            </div>
          </div>
          <div style={{ width: '100%', height: 240, marginTop: 12 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val) => formatCurrency(val)}
                  contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="Sales" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="Expenses" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Channels Breakdown */}
        <div className="card chart-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Payment Channels</h3>
              <p className="chart-subtitle">Breakdown by cash, UPI, and credit</p>
            </div>
          </div>
          <div className="channels-list">
            {channels.map((c) => {
              const pct = Math.round((c.value / totalChannels) * 100);
              return (
                <div key={c.name} className="channel-row">
                  <div className="channel-row-top">
                    <span className="channel-name">
                      <span className="dot" style={{ background: c.color }} />
                      {c.name}
                    </span>
                    <span className="channel-pct">{pct}%</span>
                  </div>
                  <div className="channel-bar-bg">
                    <div className="channel-bar-fill" style={{ width: `${pct}%`, background: c.color }} />
                  </div>
                  <div className="channel-amount">{formatCurrency(c.value)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Clean Recent Ledger Table */}
      <div className="card" style={{ padding: '20px' }}>
        <div className="table-header-row">
          <div>
            <h3 className="chart-title">Recent Daily Accounts</h3>
            <p className="chart-subtitle">Recent daily registers and reconciliation status</p>
          </div>

          <div className="table-toolbar">
            <div className="search-wrap">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                className="table-search-input"
                placeholder="Search date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/history')}
            >
              View All History <ArrowRight size={13} />
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="simple-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Revenue</th>
                <th>Cash Inflow</th>
                <th>Expenses</th>
                <th>Variance</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 0 }}>
                    <div className="empty-state" style={{ minHeight: 250, border: 'none' }}>
                      <div className="empty-state-icon"><BookOpen size={40} strokeWidth={1.2} /></div>
                      <h3>No daily records found</h3>
                      <p>Start by creating a new daily account.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLedger.map((row) => (
                  <tr key={row._id}>
                    <td>
                      <strong>{formatDate(row.dateString, settings?.date_format || 'DD/MM/YYYY')}</strong>
                    </td>
                    <td>
                      <span style={{ color: '#2563eb', fontWeight: 600 }}>
                        {formatCurrency(row.totalSales || 0)}
                      </span>
                    </td>
                    <td>{formatCurrency(row.cashSales || 0)}</td>
                    <td>
                      <span style={{ color: '#dc2626' }}>{formatCurrency(row.totalExpenses || 0)}</span>
                    </td>
                    <td>
                      <span className={row.difference === 0 ? 'val-green' : 'val-red'}>
                        {row.difference === 0 ? '₹0.00' : formatCurrency(row.difference)}
                      </span>
                    </td>
                    <td>
                      <SimpleStatusBadge
                        status={row.status}
                        difference={row.difference || 0}
                        formatCurrency={formatCurrency}
                      />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-link"
                        onClick={() => navigate(`/daily-accounts?date=${row.dateString}`)}
                      >
                        View Details →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        /* ===== SIMPLE CLEAN DASHBOARD STYLES ===== */
        .simple-dash-container {
          display: flex;
          flex-direction: column;
          gap: 18px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .dash-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 2px;
        }

        .dash-title {
          font-size: 22px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .dash-sub {
          font-size: 13px;
          color: #64748b;
          margin: 3px 0 0;
        }

        .dash-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        /* Reconciliation Card */
        .dash-recon-card {
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          background: #ffffff;
        }

        .recon-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .recon-icon-box {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .recon-icon-box.balanced {
          background: #ecfdf5;
          color: #059669;
        }

        .recon-icon-box.short, .recon-icon-box.excess {
          background: #fef2f2;
          color: #dc2626;
        }

        .recon-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .recon-title {
          font-size: 14.5px;
          font-weight: 700;
          color: #0f172a;
        }

        .recon-desc {
          font-size: 12.5px;
          color: #64748b;
          margin: 2px 0 0;
        }

        .recon-numbers {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .recon-stat {
          display: flex;
          flex-direction: column;
        }

        .recon-stat-lbl {
          font-size: 10.5px;
          color: #94a3b8;
          font-weight: 600;
          text-transform: uppercase;
        }

        .recon-stat-val {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
        }

        .recon-divider {
          width: 1px;
          height: 24px;
          background: #e2e8f0;
        }

        /* 4 Metrics Grid */
        .dash-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px;
        }

        .metric-box {
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: #ffffff;
        }

        .metric-box-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .metric-box-label {
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
        }

        .metric-box-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .metric-box-icon.blue { background: #eff6ff; color: #2563eb; }
        .metric-box-icon.green { background: #ecfdf5; color: #059669; }
        .metric-box-icon.red { background: #fef2f2; color: #dc2626; }
        .metric-box-icon.amber { background: #fffbeb; color: #d97706; }

        .metric-box-value {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
        }

        .metric-box-footer {
          margin-top: 10px;
          padding-top: 8px;
          border-top: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          color: #64748b;
        }

        /* Charts Grid */
        .dash-charts-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 14px;
        }

        @media (max-width: 900px) {
          .dash-charts-grid {
            grid-template-columns: 1fr;
          }
        }

        .chart-card {
          padding: 18px 20px;
          background: #ffffff;
        }

        .chart-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }

        .chart-title {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .chart-subtitle {
          font-size: 12px;
          color: #64748b;
          margin: 2px 0 0;
        }

        .chart-legend {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 12px;
          color: #64748b;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }

        .dot.blue { background: #2563eb; }
        .dot.red { background: #f87171; }

        /* Payment Channels */
        .channels-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-top: 18px;
        }

        .channel-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .channel-row-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12.5px;
        }

        .channel-name {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
          color: #334155;
        }

        .channel-pct {
          font-weight: 700;
          color: #0f172a;
        }

        .channel-bar-bg {
          height: 6px;
          border-radius: 999px;
          background: #f1f5f9;
          overflow: hidden;
        }

        .channel-bar-fill {
          height: 100%;
          border-radius: 999px;
        }

        .channel-amount {
          font-size: 12px;
          color: #64748b;
          text-align: right;
        }

        /* Table Styles */
        .table-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 14px;
        }

        .table-toolbar {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .search-wrap {
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .table-search-input {
          height: 32px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 0 10px 0 30px;
          font-size: 12.5px;
          background: #ffffff;
          outline: none;
          color: #0f172a;
        }

        .table-search-input:focus {
          border-color: #2563eb;
        }

        .table-responsive {
          overflow-x: auto;
        }

        .simple-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .simple-table th {
          background: #f8fafc;
          color: #475569;
          font-weight: 600;
          font-size: 12px;
          padding: 10px 12px;
          border-bottom: 1px solid #e2e8f0;
          text-align: left;
          white-space: nowrap;
        }

        .simple-table td {
          padding: 11px 12px;
          border-bottom: 1px solid #f1f5f9;
          color: #1e293b;
          white-space: nowrap;
        }

        .simple-table tr:hover td {
          background: #f8fafc;
        }

        .btn-link {
          background: none;
          border: none;
          color: #2563eb;
          font-weight: 600;
          cursor: pointer;
          font-size: 12px;
          padding: 0;
        }

        .btn-link:hover {
          text-decoration: underline;
        }

        .val-green { color: #059669; font-weight: 600; }
        .val-red { color: #dc2626; font-weight: 600; }
      `}</style>
    </div>
  );
}
