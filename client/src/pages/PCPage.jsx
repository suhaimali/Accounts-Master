import { useState, useEffect } from 'react';
import { pcAPI } from '../api/services';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import Modal, { ConfirmModal } from '../components/Modal';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Wallet } from 'lucide-react';
import { formatDate, todayString } from '../utils/accountingEngine';

export default function PCPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: 'petty_cash', description: '', amount: '', givenTo: '', purpose: '', status: 'pending', notes: '' });
  const { formatCurrency, settings } = useSettings();
  const { can } = useAuth();
  const today = todayString();

  useEffect(() => { loadEntries(); }, [page, statusFilter]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const res = await pcAPI.getAll({ page, limit: 20, status: statusFilter });
      setEntries(res.data || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
      setTotalAmount(res.totalAmount || 0);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const openForm = (item = null) => {
    setEditItem(item);
    setForm(item ? { type: item.type, description: item.description, amount: item.amount, givenTo: item.givenTo || '', purpose: item.purpose || '', status: item.status, notes: item.notes || '' } : { type: 'petty_cash', description: '', amount: '', givenTo: '', purpose: '', status: 'pending', notes: '' });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.description || !form.amount) return toast.error('Description and amount required');
    setSaving(true);
    try {
      const payload = { ...form, amount: Number(form.amount), date: new Date(today), dateString: today };
      if (editItem) await pcAPI.update(editItem._id, payload);
      else await pcAPI.create(payload);
      toast.success(editItem ? 'Updated!' : 'PC entry added!');
      setShowForm(false);
      loadEntries();
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await pcAPI.delete(deleteId);
      toast.success('Deleted');
      setDeleteId(null);
      loadEntries();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-title">Petty Cash (PC)</h1>
            <p className="page-desc">Track petty cash disbursements, advances, and reimbursements.</p>
          </div>
          {can(['admin', 'manager', 'cashier']) && (
            <button className="btn btn-primary" onClick={() => openForm()} id="add-pc-btn"><Plus size={16} /> Add Entry</button>
          )}
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 20 }}>
        <div className="stat-card blue"><div className="stat-label">Total Entries</div><div className="stat-value">{total}</div></div>
        <div className="stat-card orange"><div className="stat-label">Total Amount</div><div className="stat-value">{formatCurrency(totalAmount)}</div></div>
        <div className="stat-card red"><div className="stat-label">Pending</div><div className="stat-value">{entries.filter(e => e.status === 'pending').length}</div></div>
      </div>

      <div className="filters-bar">
        <select
          className="form-select filter-select"
          style={{ width: 160 }}
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          id="pc-status-filter"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="settled">Settled</option>
          <option value="cancelled">Cancelled</option>
        </select>
        {statusFilter && (
          <button
            className="btn btn-ghost btn-sm"
            style={{ height: 38 }}
            onClick={() => {
              setStatusFilter('');
              setPage(1);
            }}
          >
            Clear
          </button>
        )}
        <div className="filter-count">
          Showing {entries.length} of {total} entries
        </div>
      </div>

      <div className="card">
        {loading ? <div className="loading-overlay"><div className="loading-spinner" /></div> : entries.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon"><Wallet size={40} strokeWidth={1.2} /></div><h3>No petty cash entries</h3></div>
        ) : (
          <div className="table-container">
            <table>
              <thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Given To</th><th>Status</th><th className="text-right">Amount</th>{can(['admin','manager','cashier']) && <th>Actions</th>}</tr></thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e._id}>
                    <td>{formatDate(e.dateString, settings.date_format)}</td>
                    <td><span className="badge badge-secondary">{e.type.replace('_', ' ')}</span></td>
                    <td>{e.description}{e.purpose && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.purpose}</div>}</td>
                    <td>{e.givenTo || '—'}</td>
                    <td><span className={`badge ${e.status === 'settled' ? 'badge-success' : e.status === 'pending' ? 'badge-warning' : 'badge-secondary'}`}>{e.status}</span></td>
                    <td className="text-right font-bold text-warning">{formatCurrency(e.amount)}</td>
                    {can(['admin','manager','cashier']) && (
                      <td><div className="flex gap-2">
                        <button className="btn btn-ghost btn-icon-sm" onClick={() => openForm(e)}><Edit2 size={14} /></button>
                        {can(['admin','manager']) && <button className="btn btn-ghost btn-icon-sm" onClick={() => setDeleteId(e._id)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>}
                      </div></td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editItem ? 'Edit PC Entry' : 'Add Petty Cash Entry'}
        footer={<><button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></>}>
        <div className="form-row form-row-2">
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-select" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
              <option value="petty_cash">Petty Cash</option>
              <option value="advance">Advance</option>
              <option value="reimbursement">Reimbursement</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Amount <span className="required">*</span></label>
            <input type="number" className="form-input" placeholder="0.00" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} min="0" step="0.01" />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Description <span className="required">*</span></label>
            <input type="text" className="form-input" placeholder="Purpose description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Given To</label>
            <input type="text" className="form-input" placeholder="Employee / person name" value={form.givenTo} onChange={e => setForm(p => ({ ...p, givenTo: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              <option value="pending">Pending</option>
              <option value="settled">Settled</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </Modal>
      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete PC Entry" message="Delete this petty cash entry?" />
    </div>
  );
}
