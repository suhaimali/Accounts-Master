import { useState, useEffect } from 'react';
import { carryForwardAPI } from '../api/services';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Save, Edit2, X, ArrowRightLeft, Trash2 } from 'lucide-react';
import { formatDate, todayString } from '../utils/accountingEngine';

export default function CarryForwardPage() {
  const [history, setHistory]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [editRow, setEditRow]       = useState(null);
  const [editValue, setEditValue]   = useState('');
  const [saving, setSaving]         = useState(false);
  const [deleteRow, setDeleteRow]   = useState(null);
  const [deleting, setDeleting]     = useState(false);
  const { formatCurrency, settings } = useSettings();
  const { can } = useAuth();

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await carryForwardAPI.getAll({ limit: 30 });
      setHistory(res.data || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const val = parseFloat(editValue);
    if (isNaN(val) || val < 0) { toast.error('Enter a valid amount'); return; }
    setSaving(true);
    try {
      await carryForwardAPI.update(editRow._id, val);
      toast.success('Carry forward updated!');
      setEditRow(null);
      loadHistory();
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await carryForwardAPI.delete(deleteRow._id);
      toast.success('Carry forward deleted!');
      setDeleteRow(null);
      loadHistory();
    } catch (err) { toast.error(err.message || 'Failed to delete'); }
    finally { setDeleting(false); }
  };

  if (loading) return <div className="loading-overlay"><div className="loading-spinner" /></div>;

  const totalCarryForward = history.reduce((s, h) => s + (h.carryForward || 0), 0);

  return (
    <div className="animate-fade-in">

      {/* ── Colourful Header Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
        borderRadius: 'var(--r-lg)',
        padding: '20px 24px',
        marginBottom: 20,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.15)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowRightLeft size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Carry Forward</h1>
            <p style={{ fontSize: 12, opacity: 0.8, margin: '2px 0 0' }}>Manage cash carried forward to the next business day.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: 'var(--r-md)', textAlign: 'center' }}>
            <div style={{ fontSize: 10, opacity: 0.8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Days Tracked</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{history.length}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: 'var(--r-md)', textAlign: 'center' }}>
            <div style={{ fontSize: 10, opacity: 0.8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Latest Carry Fwd</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{formatCurrency(history[0]?.carryForward || 0)}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: 'var(--r-md)', textAlign: 'center' }}>
            <div style={{ fontSize: 10, opacity: 0.8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Total (30d)</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{formatCurrency(totalCarryForward)}</div>
          </div>
        </div>
      </div>

      {/* ── History Table ── */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Carry Forward History</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Carry forward becomes next day's opening balance
            </div>
          </div>
          <span className="badge badge-primary">{history.length} records</span>
        </div>

        {history.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><ArrowRightLeft size={40} strokeWidth={1.2} /></div>
            <h3>No carry forward records</h3>
            <p>Close a day to generate carry forward data.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Sl No</th>
                  <th>Date</th>
                  <th className="text-right">Physical Cash</th>
                  <th className="text-right">Opening Balance</th>
                  <th className="text-right">Carry Forward</th>
                  <th>Status</th>
                  <th>Closed</th>
                  {can(['admin', 'manager']) && <th style={{ width: 90 }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {history.map((row, i) => (
                  <tr key={row._id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{i + 1}</td>
                    <td>
                      <strong>{formatDate(row.dateString, settings.date_format)}</strong>
                      {row.dateString === todayString() && (
                        <span className="badge badge-primary" style={{ marginLeft: 6 }}>Today</span>
                      )}
                    </td>
                    <td className="text-right">{formatCurrency(row.physicalCashTotal || 0)}</td>
                    <td className="text-right">{formatCurrency(row.openingBalance || 0)}</td>
                    <td className="text-right">
                      <strong style={{ color: 'var(--green)' }}>{formatCurrency(row.carryForward || 0)}</strong>
                    </td>
                    <td>
                      <span className={`badge ${
                        row.status === 'BALANCED' ? 'badge-success' :
                        row.status === 'SHORT'    ? 'badge-danger'  :
                        row.status === 'EXCESS'   ? 'badge-warning' : 'badge-secondary'
                      }`}>{row.status || 'PENDING'}</span>
                    </td>
                    <td>
                      {row.isClosed
                        ? <span className="badge badge-success">Yes</span>
                        : <span className="badge badge-secondary">No</span>}
                    </td>
                    {can(['admin', 'manager']) && (
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            className="btn btn-ghost btn-icon-sm"
                            title="Edit carry forward"
                            onClick={() => { setEditRow(row); setEditValue(row.carryForward || 0); }}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            className="btn btn-ghost btn-icon-sm"
                            title="Delete carry forward"
                            style={{ color: 'var(--red)' }}
                            onClick={() => setDeleteRow(row)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Edit Popup Modal ── */}
      {editRow && (
        <div className="modal-overlay" onClick={() => setEditRow(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, background: 'var(--green-bg)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Edit2 size={16} color="var(--green)" />
                </div>
                <div className="modal-title">Edit Carry Forward</div>
              </div>
              <button className="btn btn-ghost btn-icon-sm" onClick={() => setEditRow(null)}><X size={16} /></button>
            </div>

            <div style={{ padding: '8px 12px', background: 'var(--bg)', borderRadius: 'var(--r-md)', marginBottom: 16, fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>Date: </span>
              <strong>{formatDate(editRow.dateString, settings.date_format)}</strong>
              <span style={{ marginLeft: 12, color: 'var(--text-muted)' }}>Current: </span>
              <strong style={{ color: 'var(--green)' }}>{formatCurrency(editRow.carryForward || 0)}</strong>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">New Carry Forward Amount (₹) <span className="required">*</span></label>
                <input
                  type="number"
                  className="form-input"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  min="0" step="0.01"
                  autoFocus required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditRow(null)}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={saving}>
                  {saving ? 'Saving…' : <><Save size={14} /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteRow && (
        <div className="modal-overlay" onClick={() => setDeleteRow(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <div className="modal-title" style={{ color: 'var(--red)' }}>Delete Record</div>
              <button className="btn btn-ghost btn-icon-sm" onClick={() => setDeleteRow(null)}><X size={16} /></button>
            </div>
            <p style={{ fontSize: 13.5, color: 'var(--text-sub)', marginBottom: 6 }}>
              Are you sure you want to delete the carry forward record for
            </p>
            <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 16 }}>
              {formatDate(deleteRow.dateString, settings.date_format)}?
            </p>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteRow(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : <><Trash2 size={14} /> Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
