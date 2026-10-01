import { useState, useEffect } from 'react';
import { creditAPI } from '../api/services';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../hooks/useAuth';
import Modal, { ConfirmModal } from '../components/Modal';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Search, CreditCard } from 'lucide-react';
import { formatDate, todayString } from '../utils/accountingEngine';

const STATUS_COLORS = { pending: 'badge-danger', partial: 'badge-warning', paid: 'badge-success' };

export default function CreditPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPending, setTotalPending] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ customerName: '', customerPhone: '', amount: '', description: '', paymentMode: 'cash', status: 'pending', paidAmount: '', dueDate: '', notes: '' });
  const { formatCurrency, settings } = useSettings();
  const { can } = useAuth();
  const today = todayString();

  useEffect(() => { loadEntries(); }, [page, search, statusFilter]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const res = await creditAPI.getAll({ page, limit: 20, search, status: statusFilter });
      setEntries(res.data || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
      setTotalPending(res.totalPending || 0);
    } catch (err) { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const openForm = (item = null) => {
    setEditItem(item);
    setForm(item ? { customerName: item.customerName, customerPhone: item.customerPhone || '', amount: item.amount, description: item.description || '', paymentMode: item.paymentMode || 'cash', status: item.status, paidAmount: item.paidAmount || 0, dueDate: item.dueDate ? item.dueDate.split('T')[0] : '', notes: item.notes || '' } : { customerName: '', customerPhone: '', amount: '', description: '', paymentMode: 'cash', status: 'pending', paidAmount: '', dueDate: '', notes: '' });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.customerName || !form.amount) return toast.error('Customer name and amount required');
    setSaving(true);
    try {
      const payload = { ...form, amount: Number(form.amount), paidAmount: Number(form.paidAmount) || 0, date: new Date(today), dateString: today };
      if (editItem) await creditAPI.update(editItem._id, payload);
      else await creditAPI.create(payload);
      toast.success(editItem ? 'Updated!' : 'Credit entry added!');
      setShowForm(false);
      loadEntries();
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await creditAPI.delete(deleteId);
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
            <h1 className="page-title">Credit Entries</h1>
            <p className="page-desc">Manage credit sales and track outstanding payments.</p>
          </div>
          {can(['admin', 'manager', 'cashier']) && (
            <button className="btn btn-primary" onClick={() => openForm()} id="add-credit-btn"><Plus size={16} /> Add Credit</button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-3" style={{ marginBottom: 20 }}>
        <div className="stat-card blue">
          <div className="stat-label">Total Entries</div>
          <div className="stat-value">{total}</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Pending Amount</div>
          <div className="stat-value">{formatCurrency(totalPending)}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Filtered</div>
          <div className="stat-value">{entries.length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            id="credit-search"
            type="text"
            className="form-input search-input"
            placeholder="Search customer name or phone..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="form-select filter-select"
          style={{ width: 160 }}
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          id="credit-status-filter"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
        </select>
        {(search || statusFilter) && (
          <button
            className="btn btn-ghost btn-sm"
            style={{ height: 38 }}
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              setPage(1);
            }}
          >
            Clear
          </button>
        )}
        <div className="filter-count">
          {entries.length} of {total} entries
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-overlay"><div className="loading-spinner" /></div>
        ) : entries.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon"><CreditCard size={40} strokeWidth={1.2} /></div><h3>No credit entries</h3><p>Add your first credit entry.</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Customer</th><th>Phone</th><th>Description</th>
                  <th className="text-right">Amount</th><th className="text-right">Paid</th><th className="text-right">Balance</th>
                  <th>Status</th><th>Mode</th>{can(['admin', 'manager', 'cashier']) && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e._id}>
                    <td>{formatDate(e.dateString, settings.date_format)}</td>
                    <td><strong>{e.customerName}</strong></td>
                    <td style={{ color: 'var(--text-muted)' }}>{e.customerPhone || '—'}</td>
                    <td>{e.description || '—'}</td>
                    <td className="text-right font-bold">{formatCurrency(e.amount)}</td>
                    <td className="text-right text-success">{formatCurrency(e.paidAmount || 0)}</td>
                    <td className="text-right text-danger font-bold">{formatCurrency(e.balanceAmount || 0)}</td>
                    <td><span className={`badge ${STATUS_COLORS[e.status]}`}>{e.status}</span></td>
                    <td><span className="badge badge-secondary">{e.paymentMode}</span></td>
                    {can(['admin', 'manager', 'cashier']) && (
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-ghost btn-icon-sm" onClick={() => openForm(e)}><Edit2 size={14} /></button>
                          {can(['admin', 'manager']) && <button className="btn btn-ghost btn-icon-sm" onClick={() => setDeleteId(e._id)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="pagination">
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>«</button>
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="page-btn" disabled={page === pages} onClick={() => setPage(p => p + 1)}>»</button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editItem ? 'Edit Credit Entry' : 'Add Credit Entry'}
        footer={<><button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></>}>
        <div className="form-row form-row-2">
          <div className="form-group">
            <label className="form-label">Customer Name <span className="required">*</span></label>
            <input type="text" className="form-input" placeholder="Customer name" value={form.customerName} onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input type="tel" className="form-input" placeholder="Mobile number" value={form.customerPhone} onChange={e => setForm(p => ({ ...p, customerPhone: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Amount <span className="required">*</span></label>
            <input type="number" className="form-input" placeholder="0.00" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} min="0" step="0.01" />
          </div>
          <div className="form-group">
            <label className="form-label">Paid Amount</label>
            <input type="number" className="form-input" placeholder="0.00" value={form.paidAmount} onChange={e => setForm(p => ({ ...p, paidAmount: e.target.value }))} min="0" step="0.01" />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Description</label>
            <input type="text" className="form-input" placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Payment Mode</label>
            <select className="form-select" value={form.paymentMode} onChange={e => setForm(p => ({ ...p, paymentMode: e.target.value }))}>
              {['cash', 'gpay', 'card', 'bank', 'other'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input type="date" className="form-input" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
          </div>
        </div>
      </Modal>

      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Credit Entry" message="Are you sure you want to delete this credit entry?" />
    </div>
  );
}
