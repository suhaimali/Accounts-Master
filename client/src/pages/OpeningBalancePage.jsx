import { useState, useEffect } from 'react';
import { carryForwardAPI, dailyAccountsAPI } from '../api/services';
import { useSettings } from '../hooks/useSettings';
import { formatDate, todayString } from '../utils/accountingEngine';
import { Landmark, Save, Edit2, Trash2, X, DollarSign, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OpeningBalancePage() {
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);
  
  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [amount, setAmount]     = useState('');
  const [saving, setSaving]     = useState(false);

  // Edit modal
  const [editRow, setEditRow]   = useState(null);
  const [editAmt, setEditAmt]   = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Delete modal
  const [deleteRow, setDeleteRow] = useState(null);
  const [deleting, setDeleting]   = useState(false);

  const { formatCurrency, settings } = useSettings();

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    try {
      const res = await carryForwardAPI.getAll({ limit: 30 });
      setHistory(res.data || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val < 0) { toast.error('Enter a valid amount'); return; }
    setSaving(true);
    try {
      // Get today's account, which creates it if it doesn't exist
      const todayRes = await dailyAccountsAPI.getToday();
      const todayAccount = todayRes.data;
      // Update opening balance
      await dailyAccountsAPI.update(todayAccount._id, { openingBalance: val });
      toast.success('Opening balance saved!');
      setAmount('');
      setShowCreate(false);
      loadHistory();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const val = parseFloat(editAmt);
    if (isNaN(val) || val < 0) { toast.error('Enter a valid amount'); return; }
    setEditSaving(true);
    try {
      await dailyAccountsAPI.update(editRow._id, { openingBalance: val });
      toast.success('Updated!');
      setEditRow(null);
      loadHistory();
    } catch (err) { toast.error(err?.message || 'Failed'); }
    finally { setEditSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await carryForwardAPI.delete(deleteRow._id);
      toast.success('Deleted!');
      setDeleteRow(null);
      loadHistory();
    } catch (err) { toast.error(err?.message || 'Failed to delete'); }
    finally { setDeleting(false); }
  };

  if (loading) return <div className="loading-overlay"><div className="loading-spinner" /></div>;

  return (
    <div className="animate-fade-in">

      {/* ── Colourful Header Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
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
            <DollarSign size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Opening Balance</h1>
            <p style={{ fontSize: 12, opacity: 0.8, margin: '2px 0 0' }}>Set today's opening balance or view history from previous carry forwards.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: 'var(--r-full)', fontSize: 12, fontWeight: 600 }}>
            {todayString()}
          </span>
          <button 
            className="btn" 
            style={{ background: '#fff', color: '#1d4ed8', border: 'none', fontWeight: 700 }}
            onClick={() => setShowCreate(true)}
          >
            <Plus size={16} /> Set Balance
          </button>
        </div>
      </div>

      {/* ── History Table ── */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Opening Balance History</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Last 30 days · click Edit to update a record</div>
          </div>
          <span className="badge badge-primary">{history.length} records</span>
        </div>

        {history.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Landmark size={40} strokeWidth={1.2} /></div>
            <h3>No history available</h3>
            <p>Save an opening balance above to get started.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Sl No</th>
                  <th>Date</th>
                  <th className="text-right">Opening Balance</th>
                  <th className="text-right">Carry Forward</th>
                  <th className="text-right">Physical Cash</th>
                  <th>Status</th>
                  <th>Closed</th>
                  <th style={{ width: 90 }}>Actions</th>
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
                    <td className="text-right font-bold" style={{ color: 'var(--blue)' }}>{formatCurrency(row.openingBalance || 0)}</td>
                    <td className="text-right">{formatCurrency(row.carryForward || 0)}</td>
                    <td className="text-right">{formatCurrency(row.physicalCashTotal || 0)}</td>
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
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          className="btn btn-ghost btn-icon-sm"
                          title="Edit"
                          onClick={() => { setEditRow(row); setEditAmt(row.openingBalance || 0); }}
                        ><Edit2 size={13} /></button>
                        <button
                          className="btn btn-ghost btn-icon-sm"
                          title="Delete"
                          style={{ color: 'var(--red)' }}
                          onClick={() => setDeleteRow(row)}
                        ><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create Modal ── */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Set Today's Opening Balance</div>
              <button className="btn btn-ghost btn-icon-sm" onClick={() => setShowCreate(false)}><X size={16} /></button>
            </div>
            <div style={{ marginBottom: 14, padding: '8px 12px', background: 'var(--blue-light)', borderRadius: 'var(--r-md)', fontSize: 13 }}>
              <strong>Date:</strong> {todayString()}
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Opening Balance Amount (₹) <span className="required">*</span></label>
                <input
                  type="number"
                  className="form-input"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  min="0" step="0.01"
                  autoFocus required
                  placeholder="e.g. 10000"
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : <><Save size={14} /> Save Balance</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editRow && (
        <div className="modal-overlay" onClick={() => setEditRow(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Edit Opening Balance</div>
              <button className="btn btn-ghost btn-icon-sm" onClick={() => setEditRow(null)}><X size={16} /></button>
            </div>
            <div style={{ marginBottom: 14, padding: '8px 12px', background: 'var(--blue-light)', borderRadius: 'var(--r-md)', fontSize: 13 }}>
              <strong>Date:</strong> {formatDate(editRow.dateString, settings.date_format)}
            </div>
            <form onSubmit={handleEdit}>
              <div className="form-group">
                <label className="form-label">Opening Balance Amount (₹) <span className="required">*</span></label>
                <input
                  type="number"
                  className="form-input"
                  value={editAmt}
                  onChange={e => setEditAmt(e.target.value)}
                  min="0" step="0.01"
                  autoFocus required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditRow(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={editSaving}>
                  {editSaving ? 'Saving…' : <><Save size={14} /> Save Changes</>}
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
              Are you sure you want to delete the opening balance record for
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
