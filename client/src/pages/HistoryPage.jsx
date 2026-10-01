import { useState, useEffect } from 'react';
import { dailyAccountsAPI } from '../api/services';
import { useSettings } from '../contexts/SettingsContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, ClipboardList, CalendarDays, Filter, X } from 'lucide-react';
import { formatDate, todayString, monthStart } from '../utils/accountingEngine';

export default function HistoryPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [startDate, setStartDate] = useState(monthStart());
  const [endDate, setEndDate] = useState(todayString());
  const [statusFilter, setStatusFilter] = useState('');
  const { formatCurrency, settings } = useSettings();
  const navigate = useNavigate();

  useEffect(() => { loadHistory(); }, [page, startDate, endDate, statusFilter]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await dailyAccountsAPI.getAll({ page, limit: 20, startDate, endDate, status: statusFilter });
      setAccounts(res.data || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } catch { toast.error('Failed to load history'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this daily account? This action cannot be undone.')) return;
    try {
      await dailyAccountsAPI.delete(id);
      toast.success('Record deleted successfully');
      loadHistory();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete record');
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 40 }}>
      
      {/* ── Colourful Header Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
        borderRadius: 'var(--r-lg)',
        padding: '24px',
        marginBottom: 20,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        boxShadow: '0 10px 25px -5px rgba(51,65,85,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 50, height: 50, background: 'rgba(255,255,255,0.15)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ClipboardList size={26} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>Daily History</h1>
            <p style={{ fontSize: 13, opacity: 0.9, margin: '4px 0 0' }}>Browse and review all past daily accounting records.</p>
          </div>
        </div>
        
        <div style={{ background: 'rgba(255,255,255,0.15)', padding: '8px 16px', borderRadius: 'var(--r-full)' }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{total}</span>
          <span style={{ fontSize: 12, opacity: 0.8, marginLeft: 6 }}>Records Found</span>
        </div>
      </div>

      {/* ── Filters Bar ── */}
      <div style={{ 
        background: '#fff', padding: '16px 20px', borderRadius: 'var(--r-md)', 
        marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
          <Filter size={18} /> <span style={{ fontSize: 13, fontWeight: 600 }}>Filters:</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input 
            type="date" 
            value={startDate} 
            onChange={e => setStartDate(e.target.value)}
            style={{ background: '#f8fafc', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: 'var(--text)', outline: 'none' }}
          />
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>to</span>
          <input 
            type="date" 
            value={endDate} 
            onChange={e => setEndDate(e.target.value)}
            style={{ background: '#f8fafc', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: 'var(--text)', outline: 'none' }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ background: '#f8fafc', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: 'var(--text)', outline: 'none', width: 140 }}
        >
          <option value="">All Status</option>
          <option value="BALANCED">Balanced</option>
          <option value="SHORT">Short</option>
          <option value="EXCESS">Excess</option>
          <option value="PENDING">Pending</option>
        </select>


      </div>

      <div className="card">
        {loading ? <div className="loading-overlay" style={{ minHeight: 300 }}><div className="loading-spinner" /></div> : accounts.length === 0 ? (
          <div className="empty-state" style={{ minHeight: 300 }}>
            <div className="empty-state-icon"><Search size={40} strokeWidth={1.2} /></div>
            <h3>No records found</h3>
            <p>Try adjusting your date filters to see more data.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Sl No</th>
                  <th>Date</th>
                  <th className="text-right">Opening</th>
                  <th className="text-right">Total Sales</th>
                  <th className="text-right">Expenses</th>
                  <th className="text-right">Physical Cash</th>
                  <th className="text-right">Difference</th>
                  <th>Status</th>
                  <th>Carry Fwd</th>
                  <th>Closed</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((row, i) => (
                  <tr key={row._id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{((page - 1) * 20) + i + 1}</td>
                    <td>
                      <strong>{formatDate(row.dateString, settings.date_format)}</strong>
                      {row.dateString === todayString() && <span className="badge badge-primary" style={{ marginLeft: 6 }}>Today</span>}
                    </td>
                    <td className="text-right">{formatCurrency(row.openingBalance || 0)}</td>
                    <td className="text-right font-bold">{formatCurrency(row.totalSales || 0)}</td>
                    <td className="text-right" style={{ color: 'var(--red)', fontWeight: 600 }}>{formatCurrency(row.totalExpenses || 0)}</td>
                    <td className="text-right" style={{ color: 'var(--blue)', fontWeight: 700 }}>{formatCurrency(row.physicalCashTotal || 0)}</td>
                    <td className="text-right" style={{ color: (row.difference||0) < 0 ? 'var(--red)' : (row.difference||0) > 0 ? 'var(--orange)' : 'var(--green)', fontWeight: 800 }}>
                      {formatCurrency(row.difference || 0)}
                    </td>
                    <td>
                      <span className={`badge ${row.status === 'BALANCED' ? 'badge-success' : row.status === 'SHORT' ? 'badge-danger' : row.status === 'EXCESS' ? 'badge-warning' : 'badge-secondary'}`}>
                        {row.status || 'PENDING'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--blue)', fontWeight: 700 }}>{formatCurrency(row.carryForward || 0)}</td>
                    <td>{row.isClosed ? <span className="badge badge-success">Yes</span> : <span className="badge badge-secondary">No</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div className="pagination" style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>«</button>
            {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(p => (
              <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="page-btn" disabled={page === pages} onClick={() => setPage(p => p + 1)}>»</button>
          </div>
        )}
      </div>
    </div>
  );
}
