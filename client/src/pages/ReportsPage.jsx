import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportsAPI, dailyAccountsAPI, expensesAPI, creditAPI } from '../api/services';
import { useSettings } from '../hooks/useSettings';
import { formatDate, formatDateString, monthStart, todayString } from '../utils/accountingEngine';
import toast from 'react-hot-toast';
import { Download, BarChart3, FileText, CreditCard, CalendarDays, PieChart, Pencil, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function ReportsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('daily');
  const [startDate, setStartDate] = useState(monthStart());
  const [endDate, setEndDate] = useState(todayString());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { formatCurrency, settings } = useSettings();

  useEffect(() => { loadReport(); }, [activeTab, startDate, endDate]);

  const loadReport = async () => {
    setLoading(true);
    try {
      let res;
      if (activeTab === 'daily') res = await reportsAPI.getDaily({ startDate, endDate });
      else if (activeTab === 'expenses') res = await reportsAPI.getExpenses({ startDate, endDate });
      else if (activeTab === 'reconciliation') res = await reportsAPI.getReconciliation({ startDate, endDate });
      else if (activeTab === 'credit') res = await reportsAPI.getCreditOutstanding();
      setData(res);
    } catch (err) { toast.error('Failed to load report'); }
    finally { setLoading(false); }
  };

  const handleDeleteDaily = async (id) => {
    if (!window.confirm('Delete this daily account record?')) return;
    try {
      await dailyAccountsAPI.delete(id);
      toast.success('Record deleted');
      loadReport();
    } catch { toast.error('Failed to delete'); }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await expensesAPI.delete(id);
      toast.success('Expense deleted');
      loadReport();
    } catch { toast.error('Failed to delete'); }
  };

  const handleDeleteCredit = async (id) => {
    if (!window.confirm('Delete this customer record?')) return;
    try {
      await creditAPI.delete(id);
      toast.success('Record deleted');
      loadReport();
    } catch { toast.error('Failed to delete'); }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await reportsAPI.exportReport({ type: activeTab === 'reconciliation' ? 'daily' : activeTab, startDate, endDate, format: 'xlsx' });
      const url = URL.createObjectURL(new Blob([res]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}-report-${startDate}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Report downloaded!');
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  const tabs = [
    { id: 'daily', label: 'Daily Summary', icon: BarChart3, color: '#3b82f6' },
    { id: 'expenses', label: 'Expenses', icon: FileText, color: '#ef4444' },
    { id: 'reconciliation', label: 'Reconciliation', icon: PieChart, color: '#10b981' },
    { id: 'credit', label: 'Credit Outstanding', icon: CreditCard, color: '#f59e0b' },
  ];

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 40 }}>
      
      {/* ── Colourful Header Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        borderRadius: 'var(--r-lg)',
        padding: '24px',
        marginBottom: 20,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        boxShadow: '0 10px 25px -5px rgba(234,88,12,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 50, height: 50, background: 'rgba(255,255,255,0.2)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart3 size={26} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>Reports & Analytics</h1>
            <p style={{ fontSize: 13, opacity: 0.9, margin: '4px 0 0' }}>Comprehensive financial reports and data analytics.</p>
          </div>
        </div>
        
        <button 
          onClick={handleExport} 
          disabled={exporting}
          style={{ 
            background: '#fff', color: '#ea580c', border: 'none', 
            padding: '10px 16px', borderRadius: 'var(--r-md)', fontSize: 13, fontWeight: 700, 
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          <Download size={16} /> {exporting ? 'Exporting...' : 'Export Excel'}
        </button>
      </div>

      {/* ── Navigation Tabs ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {tabs.map(t => {
          const isActive = activeTab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 20px', borderRadius: 'var(--r-full)',
                border: 'none', fontSize: 14, fontWeight: isActive ? 700 : 600,
                background: isActive ? t.color : '#fff',
                color: isActive ? '#fff' : 'var(--text-sub)',
                cursor: 'pointer', transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                boxShadow: isActive ? `0 4px 12px ${t.color}40` : '0 2px 5px rgba(0,0,0,0.05)'
              }}
            >
              <Icon size={16} /> {t.label}
            </button>
          )
        })}
      </div>

      {/* ── Date Range (Hidden for Credit) ── */}
      {activeTab !== 'credit' && (
        <div style={{ 
          background: '#fff', padding: '16px 20px', borderRadius: 'var(--r-md)', 
          marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
            <CalendarDays size={18} /> <span style={{ fontSize: 13, fontWeight: 600 }}>Filter by Date:</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              style={{ background: '#f8fafc', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}
            />
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>to</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              style={{ background: '#f8fafc', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            <button 
              onClick={() => { setStartDate(monthStart()); setEndDate(todayString()); }}
              style={{ background: '#f1f5f9', border: 'none', padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, color: 'var(--text-sub)', cursor: 'pointer' }}
            >
              This Month
            </button>
            <button 
              onClick={() => {
                const d = new Date(); d.setDate(d.getDate() - 7);
                setStartDate(formatDateString(d)); setEndDate(todayString());
              }}
              style={{ background: '#f1f5f9', border: 'none', padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, color: 'var(--text-sub)', cursor: 'pointer' }}
            >
              Last 7 Days
            </button>
          </div>
        </div>
      )}

      {loading ? <div className="loading-overlay"><div className="loading-spinner" /></div> : (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
          
          {/* ── Daily Summary Tab ── */}
          {activeTab === 'daily' && data && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                <div style={{ background: '#eff6ff', padding: 20, borderRadius: 12, border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: 1 }}>Total Sales</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#1e3a8a', marginTop: 4 }}>{formatCurrency(data.summary?.totalSales || 0)}</div>
                </div>
                <div style={{ background: '#fef2f2', padding: 20, borderRadius: 12, border: '1px solid #fecaca' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: 1 }}>Total Expenses</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#7f1d1d', marginTop: 4 }}>{formatCurrency(data.summary?.totalExpenses || 0)}</div>
                </div>
                <div style={{ background: '#ecfdf5', padding: 20, borderRadius: 12, border: '1px solid #a7f3d0' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: 1 }}>Net Cash Sales</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#064e3b', marginTop: 4 }}>{formatCurrency(data.summary?.totalCashSales || 0)}</div>
                </div>
                <div style={{ background: '#f5f3ff', padding: 20, borderRadius: 12, border: '1px solid #ddd6fe' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: 1 }}>GPay Total</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#4c1d95', marginTop: 4 }}>{formatCurrency(data.summary?.totalGpay || 0)}</div>
                </div>
              </div>

              {data.data?.length > 0 && (
                <div className="card" style={{ marginBottom: 24 }}>
                  <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 16 }}>
                    <div className="card-title">Sales & Expense Trend</div>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={data.data.map(d => ({ date: formatDate(d.dateString, 'DD/MM'), Sales: d.totalSales || 0, Expenses: d.totalExpenses || 0 }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={v => formatCurrency(v)} contentStyle={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                      <Line type="monotone" dataKey="Sales" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="Expenses" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="card">
                <div className="card-header"><div className="card-title">Daily Data Breakdown</div></div>
                {data.data?.length === 0 ? (
                  <div className="empty-state" style={{ minHeight: 250 }}>
                    <div className="empty-state-icon"><BarChart3 size={40} strokeWidth={1.2} /></div>
                    <h3>No daily records found</h3>
                    <p>Adjust your date filters to see more data.</p>
                  </div>
                ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Opening</th>
                        <th>Cash Sales</th>
                        <th>Credit</th>
                        <th>GPay</th>
                        <th>Total Sales</th>
                        <th>Expenses</th>
                        <th>Expected Cash</th>
                        <th>Physical</th>
                        <th>Diff</th>
                        <th>Status</th>
                        <th style={{ width: 90, textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.data || []).map(row => (
                        <tr key={row._id}>
                          <td><strong>{formatDate(row.dateString, settings.date_format)}</strong></td>
                          <td>{formatCurrency(row.openingBalance || 0)}</td>
                          <td style={{ color: 'var(--green)', fontWeight: 600 }}>{formatCurrency(row.cashSales || 0)}</td>
                          <td>{formatCurrency(row.creditSales || 0)}</td>
                          <td>{formatCurrency(row.gpaySales || 0)}</td>
                          <td style={{ fontWeight: 800 }}>{formatCurrency(row.totalSales || 0)}</td>
                          <td style={{ color: 'var(--red)', fontWeight: 600 }}>{formatCurrency(row.totalExpenses || 0)}</td>
                          <td>{formatCurrency(row.expectedCash || 0)}</td>
                          <td style={{ color: 'var(--blue)', fontWeight: 700 }}>{formatCurrency(row.physicalCashTotal || 0)}</td>
                          <td style={{ color: (row.difference||0) < 0 ? 'var(--red)' : (row.difference||0) > 0 ? 'var(--orange)' : 'var(--green)', fontWeight: 700 }}>
                            {formatCurrency(row.difference || 0)}
                          </td>
                          <td>
                            <span className={`badge ${row.status === 'BALANCED' ? 'badge-success' : row.status === 'SHORT' ? 'badge-danger' : row.status === 'EXCESS' ? 'badge-warning' : 'badge-secondary'}`}>
                              {row.status || '—'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              <button 
                                onClick={() => navigate(`/daily-accounts?date=${row.dateString}`)}
                                title="Edit Day"
                                style={{ background: '#eff6ff', border: 'none', width: 28, height: 28, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#3b82f6' }}
                              >
                                <Pencil size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeleteDaily(row._id)}
                                title="Delete Day"
                                style={{ background: '#fef2f2', border: 'none', width: 28, height: 28, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                )}
              </div>
            </>
          )}

          {/* ── Expenses Tab ── */}
          {activeTab === 'expenses' && data && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                <div style={{ background: '#fef2f2', padding: 20, borderRadius: 12, border: '1px solid #fecaca' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: 1 }}>Total Expenses</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#7f1d1d', marginTop: 4 }}>{formatCurrency(data.total || 0)}</div>
                </div>
                <div style={{ background: '#f0fdfa', padding: 20, borderRadius: 12, border: '1px solid #ccfbf1' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0d9488', textTransform: 'uppercase', letterSpacing: 1 }}>Categories Tracked</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#134e4a', marginTop: 4 }}>{data.byCategory?.length || 0}</div>
                </div>
                <div style={{ background: '#fffbeb', padding: 20, borderRadius: 12, border: '1px solid #fde68a' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: 1 }}>Transactions</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#78350f', marginTop: 4 }}>{data.data?.length || 0}</div>
                </div>
              </div>

              {data.byCategory?.length > 0 && (
                <div className="card" style={{ marginBottom: 24 }}>
                  <div className="card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 16 }}>
                    <div className="card-title">Expense Breakdown by Category</div>
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data.byCategory} layout="vertical" margin={{ left: 80, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="_id" tick={{ fill: 'var(--text-sub)', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} dx={-10} />
                      <Tooltip formatter={v => formatCurrency(v)} cursor={{fill: 'rgba(0,0,0,0.02)'}} contentStyle={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="total" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="card">
                <div className="card-header"><div className="card-title">Expense Transactions</div></div>
                {data.data?.length === 0 ? (
                  <div className="empty-state" style={{ minHeight: 250 }}>
                    <div className="empty-state-icon"><FileText size={40} strokeWidth={1.2} /></div>
                    <h3>No expenses found</h3>
                    <p>Adjust your date filters to see more data.</p>
                  </div>
                ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Category</th>
                        <th>Description</th>
                        <th>Mode</th>
                        <th>Vendor</th>
                        <th className="text-right">Amount</th>
                        <th style={{ width: 90, textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.data || []).map(e => (
                        <tr key={e._id}>
                          <td><strong>{formatDate(e.dateString, settings.date_format)}</strong></td>
                          <td><span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-sub)' }}>{e.category}</span></td>
                          <td>{e.description}</td>
                          <td><span className="badge badge-info">{e.paymentMode}</span></td>
                          <td>{e.vendor || '—'}</td>
                          <td className="text-right font-bold" style={{ color: 'var(--red)' }}>{formatCurrency(e.amount)}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              <button 
                                onClick={() => navigate('/expenses')}
                                title="Edit Expense"
                                style={{ background: '#eff6ff', border: 'none', width: 28, height: 28, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#3b82f6' }}
                              >
                                <Pencil size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeleteExpense(e._id)}
                                title="Delete Expense"
                                style={{ background: '#fef2f2', border: 'none', width: 28, height: 28, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                )}
              </div>
            </>
          )}

          {/* ── Reconciliation Tab ── */}
          {activeTab === 'reconciliation' && data && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                <div style={{ background: '#ecfdf5', padding: 20, borderRadius: 12, border: '1px solid #a7f3d0' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: 1 }}>Balanced Days</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#064e3b', marginTop: 4 }}>{data.stats?.balanced || 0}</div>
                </div>
                <div style={{ background: '#fef2f2', padding: 20, borderRadius: 12, border: '1px solid #fecaca' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: 1 }}>Short Days</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#7f1d1d', marginTop: 4 }}>{data.stats?.short || 0}</div>
                </div>
                <div style={{ background: '#fffbeb', padding: 20, borderRadius: 12, border: '1px solid #fde68a' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1 }}>Excess Days</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#78350f', marginTop: 4 }}>{data.stats?.excess || 0}</div>
                </div>
                <div style={{ background: '#eff6ff', padding: 20, borderRadius: 12, border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: 1 }}>Total Short Amount</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#1e3a8a', marginTop: 4 }}>{formatCurrency(data.stats?.totalShort || 0)}</div>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><div className="card-title">Reconciliation Logs</div></div>
                {data.data?.length === 0 ? (
                  <div className="empty-state" style={{ minHeight: 250 }}>
                    <div className="empty-state-icon"><PieChart size={40} strokeWidth={1.2} /></div>
                    <h3>No reconciliation logs found</h3>
                    <p>Adjust your date filters to see more data.</p>
                  </div>
                ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Opening</th>
                        <th>Cash Sales</th>
                        <th>Expenses</th>
                        <th>Expected</th>
                        <th>Physical</th>
                        <th className="text-right">Difference</th>
                        <th>Status</th>
                        <th>Carry Fwd</th>
                        <th style={{ width: 90, textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.data || []).map(row => (
                        <tr key={row._id}>
                          <td><strong>{formatDate(row.dateString, settings.date_format)}</strong></td>
                          <td>{formatCurrency(row.openingBalance || 0)}</td>
                          <td style={{ color: 'var(--green)', fontWeight: 600 }}>{formatCurrency(row.cashSales || 0)}</td>
                          <td style={{ color: 'var(--red)', fontWeight: 600 }}>{formatCurrency(row.totalExpenses || 0)}</td>
                          <td>{formatCurrency(row.expectedCash || 0)}</td>
                          <td style={{ color: 'var(--blue)', fontWeight: 700 }}>{formatCurrency(row.physicalCashTotal || 0)}</td>
                          <td className="text-right" style={{ color: (row.difference||0) < 0 ? 'var(--red)' : (row.difference||0) > 0 ? 'var(--orange)' : 'var(--green)', fontWeight: 800 }}>
                            {formatCurrency(row.difference || 0)}
                          </td>
                          <td>
                            <span className={`badge ${row.status === 'BALANCED' ? 'badge-success' : row.status === 'SHORT' ? 'badge-danger' : row.status === 'EXCESS' ? 'badge-warning' : 'badge-secondary'}`}>
                              {row.status || '—'}
                            </span>
                          </td>
                          <td style={{ color: 'var(--blue)', fontWeight: 700 }}>{formatCurrency(row.carryForward || 0)}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              <button 
                                onClick={() => navigate(`/daily-accounts?date=${row.dateString}`)}
                                title="Edit Day"
                                style={{ background: '#eff6ff', border: 'none', width: 28, height: 28, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#3b82f6' }}
                              >
                                <Pencil size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeleteDaily(row._id)}
                                title="Delete Day"
                                style={{ background: '#fef2f2', border: 'none', width: 28, height: 28, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                )}
              </div>
            </>
          )}

          {/* ── Credit Outstanding Tab ── */}
          {activeTab === 'credit' && data && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 24 }}>
                <div style={{ background: '#fef2f2', padding: 24, borderRadius: 12, border: '1px solid #fecaca' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ width: 40, height: 40, background: '#fee2e2', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CreditCard size={20} color="#ef4444" />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: 1 }}>Total Outstanding</div>
                      <div style={{ fontSize: 28, fontWeight: 900, color: '#7f1d1d' }}>{formatCurrency(data.total || 0)}</div>
                    </div>
                  </div>
                </div>
                <div style={{ background: '#fffbeb', padding: 24, borderRadius: 12, border: '1px solid #fde68a' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ width: 40, height: 40, background: '#fef3c7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CreditCard size={20} color="#f59e0b" />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: 1 }}>Pending Customers</div>
                      <div style={{ fontSize: 28, fontWeight: 900, color: '#78350f' }}>{data.data?.length || 0}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><div className="card-title">Customer Balances</div></div>
                {data.data?.length === 0 ? (
                  <div className="empty-state" style={{ minHeight: 250 }}>
                    <div className="empty-state-icon"><CreditCard size={40} strokeWidth={1.2} /></div>
                    <h3>No customer balances found</h3>
                    <p>There are no outstanding credit entries.</p>
                  </div>
                ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Phone</th>
                        <th>Total Amount</th>
                        <th>Paid</th>
                        <th className="text-right">Balance Due</th>
                        <th>Status</th>
                        <th style={{ width: 90, textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.data || []).map(c => (
                        <tr key={c._id}>
                          <td><strong>{formatDate(c.dateString, settings.date_format)}</strong></td>
                          <td><span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{c.customerName}</span></td>
                          <td style={{ color: 'var(--text-sub)' }}>{c.customerPhone || '—'}</td>
                          <td>{formatCurrency(c.amount)}</td>
                          <td style={{ color: 'var(--green)', fontWeight: 600 }}>{formatCurrency(c.paidAmount || 0)}</td>
                          <td className="text-right" style={{ color: 'var(--red)', fontWeight: 800, fontSize: 15 }}>{formatCurrency(c.balanceAmount || 0)}</td>
                          <td>
                            <span className={`badge ${c.status === 'paid' ? 'badge-success' : c.status === 'partial' ? 'badge-warning' : 'badge-danger'}`}>
                              {c.status.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              <button 
                                onClick={() => navigate('/credit')}
                                title="Edit Customer"
                                style={{ background: '#eff6ff', border: 'none', width: 28, height: 28, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#3b82f6' }}
                              >
                                <Pencil size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeleteCredit(c._id)}
                                title="Delete Customer"
                                style={{ background: '#fef2f2', border: 'none', width: 28, height: 28, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
