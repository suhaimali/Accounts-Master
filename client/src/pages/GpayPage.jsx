import { useState, useEffect } from 'react';
import { gpayAPI } from '../api/services';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import Modal, { ConfirmModal } from '../components/Modal';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Search, Smartphone } from 'lucide-react';
import { formatDate, todayString } from '../utils/accountingEngine';

export default function GpayPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [totals, setTotals] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ transactionId: '', senderName: '', senderPhone: '', amount: '', description: '', type: 'received', upiId: '', status: 'success', notes: '' });
  const { formatCurrency, settings } = useSettings();
  const { can } = useAuth();
  const today = todayString();

  useEffect(() => { loadEntries(); }, [page, search, typeFilter]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const res = await gpayAPI.getAll({ page, limit: 20, search, type: typeFilter });
      setEntries(res.data || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
      setTotals(res.totals || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const received = totals.find(t => t._id === 'received')?.total || 0;
  const sent = totals.find(t => t._id === 'sent')?.total || 0;

  const openForm = (item = null) => {
    setEditItem(item);
    setForm(item ? { transactionId: item.transactionId || '', senderName: item.senderName || '', senderPhone: item.senderPhone || '', amount: item.amount, description: item.description || '', type: item.type, upiId: item.upiId || '', status: item.status, notes: item.notes || '' } : { transactionId: '', senderName: '', senderPhone: '', amount: '', description: '', type: 'received', upiId: '', status: 'success', notes: '' });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.amount) return toast.error('Amount required');
    setSaving(true);
    try {
      const payload = { ...form, amount: Number(form.amount), date: new Date(today), dateString: today };
      if (editItem) await gpayAPI.update(editItem._id, payload);
      else await gpayAPI.create(payload);
      toast.success(editItem ? 'Updated!' : 'GPAY entry added!');
      setShowForm(false);
      loadEntries();
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await gpayAPI.delete(deleteId);
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
            <h1 className="page-title">GPAY / UPI Transactions</h1>
            <p className="page-desc">Track all digital payment transactions.</p>
          </div>
          {can(['admin', 'manager', 'cashier']) && (
            <button className="btn btn-primary" onClick={() => openForm()} id="add-gpay-btn"><Plus size={16} /> Add Transaction</button>
          )}
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 20 }}>
        <div className="stat-card green">
          <div className="stat-label">Total Received</div>
          <div className="stat-value">{formatCurrency(received)}</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Total Sent</div>
          <div className="stat-value">{formatCurrency(sent)}</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">Net</div>
          <div className="stat-value">{formatCurrency(received - sent)}</div>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search name or transaction ID..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            id="gpay-search"
          />
        </div>
        <select
          className="form-select filter-select"
          style={{ width: 150 }}
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          id="gpay-type-filter"
        >
          <option value="">All Types</option>
          <option value="received">Received</option>
          <option value="sent">Sent</option>
        </select>
        {(search || typeFilter) && (
          <button
            className="btn btn-ghost btn-sm"
            style={{ height: 38 }}
            onClick={() => {
              setSearch('');
              setTypeFilter('');
              setPage(1);
            }}
          >
            Clear
          </button>
        )}
        <div className="filter-count">
          {entries.length} of {total} transactions
        </div>
      </div>

      <div className="card">
        {loading ? <div className="loading-overlay"><div className="loading-spinner" /></div> : entries.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon"><Smartphone size={40} strokeWidth={1.2} /></div><h3>No GPAY transactions</h3></div>
        ) : (
          <div className="table-container">
            <table>
              <thead><tr><th>Date</th><th>TXN ID</th><th>Sender / Name</th><th>UPI ID</th><th>Description</th><th>Type</th><th>Status</th><th className="text-right">Amount</th>{can(['admin','manager','cashier']) && <th>Actions</th>}</tr></thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e._id}>
                    <td>{formatDate(e.dateString, settings.date_format)}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{e.transactionId || '—'}</td>
                    <td>{e.senderName || '—'}{e.senderPhone && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.senderPhone}</div>}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{e.upiId || '—'}</td>
                    <td>{e.description || '—'}</td>
                    <td><span className={`badge ${e.type === 'received' ? 'badge-success' : 'badge-danger'}`}>{e.type}</span></td>
                    <td><span className={`badge ${e.status === 'success' ? 'badge-success' : e.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>{e.status}</span></td>
                    <td className={`text-right font-bold ${e.type === 'received' ? 'text-success' : 'text-danger'}`}>{e.type === 'sent' ? '-' : '+'}{formatCurrency(e.amount)}</td>
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

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editItem ? 'Edit GPAY Entry' : 'Add GPAY Transaction'}
        footer={<><button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></>}>
        <div className="form-row form-row-2">
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-select" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
              <option value="received">Received</option>
              <option value="sent">Sent</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Amount <span className="required">*</span></label>
            <input type="number" className="form-input" placeholder="0.00" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} min="0" step="0.01" />
          </div>
          <div className="form-group">
            <label className="form-label">Sender Name</label>
            <input type="text" className="form-input" placeholder="Sender / Customer name" value={form.senderName} onChange={e => setForm(p => ({ ...p, senderName: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input type="tel" className="form-input" placeholder="Mobile number" value={form.senderPhone} onChange={e => setForm(p => ({ ...p, senderPhone: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Transaction ID</label>
            <input type="text" className="form-input" placeholder="UPI Transaction ID" value={form.transactionId} onChange={e => setForm(p => ({ ...p, transactionId: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Description</label>
            <input type="text" className="form-input" placeholder="Payment description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
        </div>
      </Modal>
      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete GPAY Entry" message="Delete this transaction?" />
    </div>
  );
}
