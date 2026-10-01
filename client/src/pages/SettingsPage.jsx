import { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Save, Plus, Trash2, Database, Download, Settings, Building2, Calculator } from 'lucide-react';
import { backupsAPI } from '../api/services';

export default function SettingsPage() {
  const { settings, bulkUpdate } = useSettings();
  const { can } = useAuth();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [newCategory, setNewCategory] = useState('');
  const [backups, setBackups] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);

  useEffect(() => {
    if (activeTab === 'backups') {
      loadBackups();
    }
  }, [activeTab]);

  const loadBackups = async () => {
    try {
      setLoadingBackups(true);
      const res = await backupsAPI.getAll();
      setBackups(res.data);
    } catch (err) {
      toast.error('Failed to load backups');
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setCreatingBackup(true);
      const res = await backupsAPI.create();
      toast.success(res.message);
      loadBackups();
    } catch (err) {
      toast.error('Failed to create backup');
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleDeleteBackup = async (filename) => {
    if (!window.confirm('Delete this backup?')) return;
    try {
      await backupsAPI.delete(filename);
      toast.success('Backup deleted');
      loadBackups();
    } catch (err) {
      toast.error('Failed to delete backup');
    }
  };

  useEffect(() => {
    setForm({
      business_name: settings.business_name || '',
      business_address: settings.business_address || '',
      business_phone: settings.business_phone || '',
      currency: settings.currency || 'INR',
      currency_symbol: settings.currency_symbol || '₹',
      date_format: settings.date_format || 'DD/MM/YYYY',
      financial_year_start: settings.financial_year_start || '04',
      balance_tolerance: settings.balance_tolerance || 1,
      expense_categories: [...(settings.expense_categories || [])],
    });
  }, [settings]);

  const handleSave = async () => {
    if (!can(['admin', 'manager'])) return toast.error('Not authorized');
    setSaving(true);
    try {
      await bulkUpdate(form);
      toast.success('Settings saved successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const addCategory = () => {
    if (!newCategory.trim()) return;
    if (form.expense_categories.includes(newCategory.trim())) return toast.error('Category already exists');
    setForm(p => ({ ...p, expense_categories: [...p.expense_categories, newCategory.trim()] }));
    setNewCategory('');
  };

  const removeCategory = (cat) => {
    setForm(p => ({ ...p, expense_categories: p.expense_categories.filter(c => c !== cat) }));
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Building2, color: '#3b82f6' },
    { id: 'accounting', label: 'Accounting', icon: Calculator, color: '#10b981' },
    { id: 'backups', label: 'Backups', icon: Database, color: '#f59e0b' }
  ];

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 40 }}>
      {/* ── Colourful Header Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        borderRadius: 'var(--r-lg)',
        padding: '24px',
        marginBottom: 20,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        boxShadow: '0 10px 25px -5px rgba(79,70,229,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 50, height: 50, background: 'rgba(255,255,255,0.2)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Settings size={26} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>Settings</h1>
            <p style={{ fontSize: 13, opacity: 0.9, margin: '4px 0 0' }}>Configure business preferences and accounting parameters.</p>
          </div>
        </div>
        
        {can(['admin', 'manager']) && (
          <button 
            onClick={handleSave} 
            disabled={saving}
            style={{ 
              background: '#fff', color: '#4f46e5', border: 'none', 
              padding: '10px 16px', borderRadius: 'var(--r-md)', fontSize: 13, fontWeight: 700, 
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          >
            <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
        )}
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

      {activeTab === 'general' && (
        <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, background: '#eff6ff', color: '#3b82f6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building2 size={18} /></div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Business Information</h3>
          </div>
          <div className="form-row form-row-2">
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-sub)' }}>Business Name</label>
              <input
                type="text"
                className="form-input"
                style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff' }}
                value={form.business_name || ''}
                onChange={e => setForm(p => ({ ...p, business_name: e.target.value }))}
                disabled={!can(['admin', 'manager'])}
                id="setting-business-name"
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-sub)' }}>Phone Number</label>
              <input
                type="text"
                className="form-input"
                style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff' }}
                value={form.business_phone || ''}
                onChange={e => setForm(p => ({ ...p, business_phone: e.target.value }))}
                disabled={!can(['admin', 'manager'])}
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-sub)' }}>Business Address</label>
              <textarea
                className="form-textarea"
                style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff' }}
                value={form.business_address || ''}
                onChange={e => setForm(p => ({ ...p, business_address: e.target.value }))}
                disabled={!can(['admin', 'manager'])}
                rows={2}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-sub)' }}>Currency Code</label>
              <select
                className="form-select"
                style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff' }}
                value={form.currency || 'INR'}
                onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}
                disabled={!can(['admin', 'manager'])}
              >
                <option value="INR">INR - Indian Rupee</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="AED">AED - UAE Dirham</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-sub)' }}>Currency Symbol</label>
              <input
                type="text"
                className="form-input"
                style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff' }}
                value={form.currency_symbol || '₹'}
                onChange={e => setForm(p => ({ ...p, currency_symbol: e.target.value }))}
                disabled={!can(['admin', 'manager'])}
                id="setting-currency-symbol"
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-sub)' }}>Date Format</label>
              <select
                className="form-select"
                style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff' }}
                value={form.date_format || 'DD/MM/YYYY'}
                onChange={e => setForm(p => ({ ...p, date_format: e.target.value }))}
                disabled={!can(['admin', 'manager'])}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'accounting' && (
        <div className="grid grid-2" style={{ gap: 20 }}>
          <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 32, height: 32, background: '#ecfdf5', color: '#10b981', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Calculator size={18} /></div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Accounting Rules</h3>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-sub)' }}>Financial Year Start Month</label>
              <select
                className="form-select"
                style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff' }}
                value={form.financial_year_start || '04'}
                onChange={e => setForm(p => ({ ...p, financial_year_start: e.target.value }))}
                disabled={!can(['admin', 'manager'])}
              >
                {[
                  ['01', 'January'],
                  ['02', 'February'],
                  ['03', 'March'],
                  ['04', 'April'],
                  ['07', 'July'],
                  ['10', 'October'],
                ].map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-sub)' }}>Balance Tolerance (₹)</label>
              <input
                type="number"
                className="form-input"
                style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff' }}
                value={form.balance_tolerance || 1}
                onChange={e => setForm(p => ({ ...p, balance_tolerance: Number(e.target.value) }))}
                disabled={!can(['admin', 'manager'])}
                min="0"
                step="0.01"
                id="setting-balance-tolerance"
              />
              <div style={{ color: 'var(--text-muted)', fontSize: 11.5, marginTop: 4 }}>
                Amount within which variance is treated as BALANCED
              </div>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 32, height: 32, background: '#fef2f2', color: '#ef4444', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Calculator size={18} /></div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Expense Categories</h3>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {(form.expense_categories || []).map(cat => (
                <div
                  key={cat}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    borderRadius: 'var(--r-full)',
                    padding: '6px 14px',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <span style={{ color: 'var(--text)' }}>{cat}</span>
                  {can(['admin', 'manager']) && (
                    <button
                      onClick={() => removeCategory(cat)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}
                      title="Delete category"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {can(['admin', 'manager']) && (
              <div className="flex gap-2">
                <input
                  type="text"
                  className="form-input"
                  style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff' }}
                  placeholder="New category..."
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                />
                <button 
                  className="btn btn-secondary btn-sm" 
                  onClick={addCategory}
                  style={{ borderRadius: 10, fontWeight: 600, padding: '0 16px' }}
                >
                  <Plus size={16} /> Add
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'backups' && (
        <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, background: '#fef3c7', color: '#d97706', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Database size={20} /></div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>System Backups</h3>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-sub)' }}>Manage and create database backups</p>
              </div>
            </div>
            {can(['admin']) && (
              <button 
                className="btn btn-primary" 
                onClick={handleCreateBackup} 
                disabled={creatingBackup}
                style={{ borderRadius: 10, fontWeight: 600, padding: '10px 20px' }}
              >
                <Database size={16} style={{ marginRight: 8 }} />
                {creatingBackup ? 'Creating...' : 'Create Backup'}
              </button>
            )}
          </div>
          
          <div className="table-container" style={{ borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table className="simple-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Date Created</th>
                  <th>Size</th>
                  <th style={{ width: 100, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingBackups ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: 20 }}>Loading backups...</td>
                  </tr>
                ) : backups.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
                      No backups found.
                    </td>
                  </tr>
                ) : (
                  backups.map(backup => (
                    <tr key={backup.filename}>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{backup.filename}</td>
                      <td>{new Date(backup.createdAt).toLocaleString()}</td>
                      <td>{(backup.size / 1024).toFixed(2)} KB</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button
                            onClick={() => window.open(backupsAPI.download(backup.filename), '_blank')}
                            title="Download Backup"
                            style={{ background: '#eff6ff', border: 'none', width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#3b82f6', transition: '0.2s' }}
                          >
                            <Download size={14} />
                          </button>
                          {can(['admin']) && (
                            <button
                              onClick={() => handleDeleteBackup(backup.filename)}
                              title="Delete Backup"
                              style={{ background: '#fef2f2', border: 'none', width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444', transition: '0.2s' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
