import { useState, useEffect } from 'react';
import { expensesAPI } from '../api/services';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../hooks/useAuth';
import Modal, { ConfirmModal } from '../components/Modal';
import toast from 'react-hot-toast';
import {
  Plus, Edit2, Trash2, Search, TrendingDown,
  Wallet, Smartphone, PieChart as PieChartIcon,
  ChevronLeft, ChevronRight, Receipt
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts';
import { formatDate, todayString } from '../utils/accountingEngine';

const CATEGORY_COLORS = [
  '#2563eb', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#64748b'
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [modeFilter, setModeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [catSummary, setCatSummary] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    category: '',
    description: '',
    amount: '',
    paymentMode: 'cash',
    vendor: '',
    notes: '',
  });

  const { formatCurrency, settings } = useSettings();
  const { can } = useAuth();
  const today = todayString();

  useEffect(() => {
    loadExpenses();
  }, [page, search, categoryFilter, modeFilter, startDate, endDate]);

  useEffect(() => {
    loadCatSummary();
  }, [startDate, endDate]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const res = await expensesAPI.getAll({
        page,
        limit: 15,
        search,
        category: categoryFilter,
        paymentMode: modeFilter,
        startDate,
        endDate,
      });
      setExpenses(res.data || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } catch {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const loadCatSummary = async () => {
    try {
      const res = await expensesAPI.getCategorySummary({ startDate, endDate });
      setCatSummary(res.data || []);
    } catch {}
  };

  const openForm = (item = null) => {
    setEditItem(item);
    setForm(
      item
        ? {
            category: item.category,
            description: item.description,
            amount: item.amount,
            paymentMode: item.paymentMode,
            vendor: item.vendor || '',
            notes: item.notes || '',
          }
        : {
            category: settings.expense_categories?.[0] || 'Miscellaneous',
            description: '',
            amount: '',
            paymentMode: 'cash',
            vendor: '',
            notes: '',
          }
    );
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.description || !form.amount) {
      return toast.error('Description and amount required');
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        date: new Date(today),
        dateString: today,
      };
      if (editItem) await expensesAPI.update(editItem._id, payload);
      else await expensesAPI.create(payload);
      toast.success(editItem ? 'Expense updated!' : 'Expense recorded!');
      setShowForm(false);
      loadExpenses();
      loadCatSummary();
    } catch (err) {
      toast.error(err.message || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await expensesAPI.delete(deleteId);
      toast.success('Expense deleted');
      setDeleteId(null);
      loadExpenses();
      loadCatSummary();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const grandTotal = catSummary.reduce((acc, c) => acc + c.total, 0) || expenses.reduce((acc, e) => acc + e.amount, 0);
  const cashExpenses = expenses.filter(e => e.paymentMode === 'cash').reduce((acc, e) => acc + e.amount, 0);
  const digitalExpenses = expenses.filter(e => e.paymentMode !== 'cash').reduce((acc, e) => acc + e.amount, 0);
  const topCategory = catSummary[0]?._id || 'None';

  const pieChartData = catSummary.map((c, i) => ({
    name: c._id,
    value: c.total,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  const hasActiveFilters = Boolean(search || categoryFilter || modeFilter || startDate || endDate);

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setModeFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1240, margin: '0 auto' }}>
      {/* 1. Header Bar */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <h1 className="page-title">Expenses Management</h1>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {can(['admin', 'manager', 'cashier']) && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => openForm()}
                id="add-expense-main-btn"
              >
                <Plus size={15} /> Record Expense
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Top Metric KPI Summary (4 Cards) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)' }}>Total Expenses</span>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingDown size={16} />
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
            {formatCurrency(grandTotal)}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
            {total} vouchers recorded
          </div>
        </div>

        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)' }}>Cash Expenses</span>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={16} />
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#059669' }}>
            {formatCurrency(cashExpenses)}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
            Paid from cash drawer
          </div>
        </div>

        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)' }}>Digital / UPI / Bank</span>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Smartphone size={16} />
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#7c3aed' }}>
            {formatCurrency(digitalExpenses)}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
            Online & bank vouchers
          </div>
        </div>

        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)' }}>Top Category</span>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PieChartIcon size={16} />
            </div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {topCategory}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
            {catSummary[0] ? formatCurrency(catSummary[0].total) : 'No entries'}
          </div>
        </div>
      </div>

      {/* 3. Category Breakdown Analytics Card (Compact & Modern) */}
      {showAnalytics && catSummary.length > 0 && (
        <div className="card" style={{ marginBottom: 16, padding: '16px 20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div>
              <div className="card-title">Expense Distribution by Category</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Breakdown of expenses across business operations
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <div className="filter-group-date">
                <input
                  type="date"
                  className="form-input filter-date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ height: 32, fontSize: 12 }}
                  aria-label="Start Date"
                />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>to</span>
                <input
                  type="date"
                  className="form-input filter-date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ height: 32, fontSize: 12 }}
                  aria-label="End Date"
                />
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 20,
              alignItems: 'center',
            }}
          >
            {/* Donut Chart with Center Total */}
            <div style={{ height: 180, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => formatCurrency(val)}
                    contentStyle={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      fontSize: 12,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Total
                </span>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)' }}>
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>

            {/* Category Progress Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {catSummary.slice(0, 6).map((c, i) => {
                const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
                const pct = grandTotal > 0 ? Math.round((c.total / grandTotal) * 100) : 0;
                return (
                  <div key={c._id} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                        {c._id}
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {formatCurrency(c.total)}{' '}
                        <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>({pct}%)</span>
                      </span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: color,
                          borderRadius: 999,
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. Filters Toolbar */}
      <div className="filters-bar">
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search description or vendor..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            id="expense-search"
          />
        </div>

        <select
          className="form-select filter-select"
          style={{ width: 160 }}
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          id="expense-cat-filter"
        >
          <option value="">All Categories</option>
          {(settings.expense_categories || []).map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <select
          className="form-select filter-select"
          style={{ width: 130 }}
          value={modeFilter}
          onChange={(e) => {
            setModeFilter(e.target.value);
            setPage(1);
          }}
          id="expense-mode-filter"
        >
          <option value="">All Modes</option>
          {['cash', 'gpay', 'card', 'bank', 'other'].map((m) => (
            <option key={m}>{m.toUpperCase()}</option>
          ))}
        </select>

        <div className="filter-group-date">
          <input
            type="date"
            className="form-input filter-date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            title="Start Date"
            aria-label="Start Date"
          />
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>to</span>
          <input
            type="date"
            className="form-input filter-date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            title="End Date"
            aria-label="End Date"
          />
        </div>

        {hasActiveFilters && (
          <button
            className="btn btn-ghost btn-sm"
            style={{ height: 38 }}
            onClick={clearFilters}
          >
            Clear
          </button>
        )}

        <div className="filter-count">
          Showing {expenses.length} of {total} vouchers
        </div>
      </div>

      {/* 5. Transactions Table Card */}
      <div className="card">
        {loading ? (
          <div className="loading-overlay">
            <div className="loading-spinner" />
          </div>
        ) : expenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
            <div style={{ marginBottom: 10 }}>
              <Receipt size={40} strokeWidth={1.2} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              No Expenses Found
            </h3>
            <p style={{ fontSize: 13 }}>
              {hasActiveFilters
                ? 'No expense vouchers match your active filters.'
                : 'No business expenses have been recorded yet.'}
            </p>
            {hasActiveFilters ? (
              <button
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 12 }}
                onClick={clearFilters}
              >
                Clear All Filters
              </button>
            ) : (
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: 12 }}
                onClick={() => openForm()}
              >
                <Plus size={14} /> Record First Expense
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Payment Mode</th>
                    <th className="text-right">Amount</th>
                    {can(['admin', 'manager', 'cashier']) && (
                      <th style={{ width: 80, textAlign: 'right' }}>Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e) => (
                    <tr key={e._id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                        {formatDate(e.dateString, settings.date_format)}
                      </td>
                      <td>
                        <span className="badge badge-secondary" style={{ fontWeight: 600 }}>
                          {e.category}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {e.description}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            e.paymentMode === 'cash' ? 'badge-warning' : 'badge-info'
                          }`}
                          style={{ textTransform: 'uppercase', fontSize: 10.5 }}
                        >
                          {e.paymentMode}
                        </span>
                      </td>
                      <td className="text-right text-danger font-bold" style={{ fontSize: 14 }}>
                        {formatCurrency(e.amount)}
                      </td>
                      {can(['admin', 'manager', 'cashier']) && (
                        <td>
                          <div className="flex gap-1 justify-end">
                            <button
                              className="btn btn-ghost btn-icon-sm"
                              onClick={() => openForm(e)}
                              title="Edit Expense"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              className="btn btn-ghost btn-icon-sm"
                              onClick={() => setDeleteId(e._id)}
                              style={{ color: 'var(--danger)' }}
                              title="Delete Expense"
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

            {/* Pagination Controls */}
            {pages > 1 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px 4px',
                  borderTop: '1px solid var(--border)',
                  marginTop: 10,
                }}
              >
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                  Page {page} of {pages}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    disabled={page >= pages}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editItem ? 'Edit Expense Voucher' : 'Record Business Expense'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
              id="save-expense-btn"
            >
              {saving ? 'Saving...' : 'Save Expense'}
            </button>
          </>
        }
      >
        <div className="form-row form-row-2">
          <div className="form-group">
            <label className="form-label">
              Category <span className="required">*</span>
            </label>
            <select
              className="form-select"
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
            >
              {(settings.expense_categories || []).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Amount (₹) <span className="required">*</span>
            </label>
            <input
              type="number"
              className="form-input"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              min="0"
              step="0.01"
              style={{ fontWeight: 600 }}
            />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">
              Description <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Office tea, maintenance, generator fuel"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Payment Mode</label>
            <select
              className="form-select"
              value={form.paymentMode}
              onChange={(e) => setForm((p) => ({ ...p, paymentMode: e.target.value }))}
            >
              {['cash', 'gpay', 'card', 'bank', 'other'].map((m) => (
                <option key={m} value={m}>{m.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Expense"
        message="Are you sure you want to delete this expense record? This action will immediately adjust your accounts and ledger."
      />
    </div>
  );
}
