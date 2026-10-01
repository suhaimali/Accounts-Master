import { useState, useEffect } from 'react';
import { usersAPI } from '../api/services';
import { useAuth } from '../contexts/AuthContext';
import Modal, { ConfirmModal } from '../components/Modal';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Shield, Users } from 'lucide-react';
import { formatDate } from '../utils/accountingEngine';

const ROLE_COLORS = { admin: 'badge-danger', manager: 'badge-warning', cashier: 'badge-info', viewer: 'badge-secondary' };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'cashier', branch: 'Main', isActive: true });
  const { user: currentUser, can } = useAuth();

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await usersAPI.getAll();
      setUsers(res.data || []);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  const openForm = (item = null) => {
    setEditItem(item);
    setForm(item ? { name: item.name, email: item.email, password: '', role: item.role, branch: item.branch || 'Main', isActive: item.isActive } : { name: '', email: '', password: '', role: 'cashier', branch: 'Main', isActive: true });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) return toast.error('Name and email required');
    if (!editItem && !form.password) return toast.error('Password required for new users');
    setSaving(true);
    try {
      if (editItem) await usersAPI.update(editItem._id, { name: form.name, role: form.role, branch: form.branch, isActive: form.isActive });
      else await usersAPI.create(form);
      toast.success(editItem ? 'User updated!' : 'User created!');
      setShowForm(false);
      loadUsers();
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await usersAPI.delete(deleteId);
      toast.success('User deleted');
      setDeleteId(null);
      loadUsers();
    } catch (err) { toast.error(err.message); }
  };

  if (!can(['admin'])) return (
    <div className="card" style={{ textAlign: 'center', padding: 60 }}>
      <Shield size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
      <h3>Access Restricted</h3>
      <p style={{ color: 'var(--text-muted)' }}>Only administrators can manage users.</p>
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 40 }}>
      {/* ── Colourful Header Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
        borderRadius: 'var(--r-lg)',
        padding: '24px',
        marginBottom: 20,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        boxShadow: '0 10px 25px -5px rgba(225,29,72,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 50, height: 50, background: 'rgba(255,255,255,0.2)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={26} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>User Management</h1>
            <p style={{ fontSize: 13, opacity: 0.9, margin: '4px 0 0' }}>Manage team members and their access levels.</p>
          </div>
        </div>
        
        <button 
          onClick={() => openForm()}
          style={{ 
            background: '#fff', color: '#e11d48', border: 'none', 
            padding: '10px 16px', borderRadius: 'var(--r-md)', fontSize: 13, fontWeight: 700, 
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        {['admin', 'manager', 'cashier', 'viewer'].map(role => (
          <div key={role} className="stat-card blue">
            <div className="stat-label">{role.charAt(0).toUpperCase() + role.slice(1)}s</div>
            <div className="stat-value">{users.filter(u => u.role === role).length}</div>
          </div>
        ))}
      </div>

      <div className="card">
        {loading ? <div className="loading-overlay"><div className="loading-spinner" /></div> : (
          <div className="table-container">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Branch</th><th>Status</th><th>Last Login</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--brand-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                        <strong>{u.name}{u._id === currentUser?.id && <span className="badge badge-primary" style={{ marginLeft: 6 }}>You</span>}</strong>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                    <td><span className={`badge ${ROLE_COLORS[u.role]}`}>{u.role}</span></td>
                    <td>{u.branch || 'Main'}</td>
                    <td>{u.isActive ? <span className="badge badge-success">Active</span> : <span className="badge badge-secondary">Inactive</span>}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{u.lastLogin ? formatDate(u.lastLogin, 'DD/MM/YYYY') : 'Never'}</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-ghost btn-icon-sm" onClick={() => openForm(u)}><Edit2 size={14} /></button>
                        {u._id !== currentUser?.id && <button className="btn btn-ghost btn-icon-sm" onClick={() => setDeleteId(u._id)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editItem ? 'Edit User' : 'Add User'}
        footer={<><button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></>}>
        <div className="form-row form-row-2">
          <div className="form-group">
            <label className="form-label">Full Name <span className="required">*</span></label>
            <input type="text" className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Email <span className="required">*</span></label>
            <input type="email" className="form-input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} disabled={!!editItem} />
          </div>
          {!editItem && (
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Password <span className="required">*</span></label>
              <input type="password" className="form-input" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="cashier">Cashier</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Branch</label>
            <input type="text" className="form-input" value={form.branch} onChange={e => setForm(p => ({ ...p, branch: e.target.value }))} placeholder="e.g. Main, Branch 1" />
          </div>
          {editItem && (
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.isActive ? 'active' : 'inactive'} onChange={e => setForm(p => ({ ...p, isActive: e.target.value === 'active' }))}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete User" message="Are you sure you want to delete this user? This action cannot be undone." />
    </div>
  );
}
