import { useState, useEffect } from 'react';
import { auditLogsAPI } from '../api/services';
import { useAuth } from '../hooks/useAuth';
import { Shield, ShieldOff } from 'lucide-react';
import { formatDate, todayString } from '../utils/accountingEngine';
import toast from 'react-hot-toast';

const ACTION_COLORS = {
  CREATE: 'badge-success', UPDATE: 'badge-info', DELETE: 'badge-danger',
  LOGIN: 'badge-secondary', LOGOUT: 'badge-secondary', CLOSE_DAY: 'badge-warning',
  REOPEN_DAY: 'badge-warning',
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const { can } = useAuth();

  useEffect(() => { loadLogs(); }, [page, actionFilter, moduleFilter]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await auditLogsAPI.getAll({ page, limit: 30, action: actionFilter, module: moduleFilter });
      setLogs(res.data || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } catch { toast.error('Failed to load audit logs'); }
    finally { setLoading(false); }
  };

  if (!can(['admin', 'manager'])) return (
    <div className="card" style={{ textAlign: 'center', padding: 60 }}>
      <Shield size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
      <h3>Access Restricted</h3>
      <p style={{ color: 'var(--text-muted)' }}>Admin and Manager access only.</p>
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 40 }}>
      {/* ── Colourful Header Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        borderRadius: 'var(--r-lg)',
        padding: '24px',
        marginBottom: 20,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        boxShadow: '0 10px 25px -5px rgba(16,185,129,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 50, height: 50, background: 'rgba(255,255,255,0.2)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={26} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>Audit Logs</h1>
            <p style={{ fontSize: 13, opacity: 0.9, margin: '4px 0 0' }}>Complete trail of all system actions and changes.</p>
          </div>
        </div>
      </div>

      <div className="filters-bar">
        <select
          className="form-select filter-select"
          style={{ width: 160 }}
          value={actionFilter}
          onChange={e => { setActionFilter(e.target.value); setPage(1); }}
          id="audit-action-filter"
        >
          <option value="">All Actions</option>
          {['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'CLOSE_DAY', 'REOPEN_DAY'].map(a => <option key={a}>{a}</option>)}
        </select>
        <select
          className="form-select filter-select"
          style={{ width: 180 }}
          value={moduleFilter}
          onChange={e => { setModuleFilter(e.target.value); setPage(1); }}
          id="audit-module-filter"
        >
          <option value="">All Modules</option>
          {['DailyAccount', 'Expense', 'CreditEntry', 'GpayTransaction', 'PCEntry', 'Auth', 'User'].map(m => <option key={m}>{m}</option>)}
        </select>
        {(actionFilter || moduleFilter) && (
          <button
            className="btn btn-ghost btn-sm"
            style={{ height: 38 }}
            onClick={() => {
              setActionFilter('');
              setModuleFilter('');
              setPage(1);
            }}
          >
            Clear
          </button>
        )}
        <div className="filter-count">{total} audit entries</div>
      </div>

      <div className="card">
        {loading ? <div className="loading-overlay"><div className="loading-spinner" /></div> : logs.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon"><ShieldOff size={40} strokeWidth={1.2} /></div><h3>No audit logs</h3></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Module</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Description</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log._id}>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString('en-IN')}
                    </td>
                    <td><span className={`badge ${ACTION_COLORS[log.action] || 'badge-secondary'}`}>{log.action}</span></td>
                    <td><span className="badge badge-primary">{log.module}</span></td>
                    <td>{log.userName || (log.userId?.name) || '—'}</td>
                    <td><span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{log.userRole || '—'}</span></td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{log.description || `${log.action} on ${log.module}`}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{log.ipAddress || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div className="pagination">
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>«</button>
            {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="page-btn" disabled={page === pages} onClick={() => setPage(p => p + 1)}>»</button>
          </div>
        )}
      </div>
    </div>
  );
}
