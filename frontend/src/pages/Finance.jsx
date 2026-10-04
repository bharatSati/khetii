import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { financeService } from '../services/financeService';
import {
  IndianRupee,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  Trash2,
  Edit,
  AlertCircle
} from 'lucide-react';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';

const INCOME_CATEGORIES = [
  'Crop Sale',
  'Subsidy/Scheme Payment',
  'Equipment Rental Income',
  'Dairy & Livestock',
  'Other Income'
];

const EXPENSE_CATEGORIES = [
  'Seeds',
  'Fertiliser',
  'Pesticide & Spray',
  'Labour & Harvester',
  'Irrigation & Electricity',
  'Equipment & Repair',
  'Diesel & Fuel',
  'Loan Repayment',
  'Transport & Mandi Fee',
  'Other Expense'
];

export const Finance = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();

  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(searchParams.get('action') === 'new');
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [modalForm, setModalForm] = useState({
    type: 'expense',
    amount: '',
    category: 'Seeds',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const loadFinanceData = async () => {
    setLoading(true);
    try {
      const [txRes, sumRes] = await Promise.all([
        financeService.getTransactions({
          type: typeFilter !== 'All' ? typeFilter : undefined,
          category: categoryFilter !== 'All' ? categoryFilter : undefined
        }),
        financeService.getSummary()
      ]);
      setTransactions(txRes.transactions || []);
      setSummary(sumRes);
    } catch (err) {
      console.error('Failed to load finance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinanceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, categoryFilter]);

  const handleOpenAddModal = (defaultType = 'expense') => {
    setEditingTransaction(null);
    setModalForm({
      type: defaultType,
      amount: '',
      category: defaultType === 'income' ? 'Crop Sale' : 'Seeds',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tx) => {
    setEditingTransaction(tx);
    setModalForm({
      type: tx.type,
      amount: tx.amount,
      category: tx.category,
      description: tx.description || '',
      date: new Date(tx.date).toISOString().split('T')[0]
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('क्या आप इस प्रविष्टि को हटाना चाहते हैं? / Delete entry?')) return;
    try {
      await financeService.deleteTransaction(id);
      loadFinanceData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!modalForm.amount || Number(modalForm.amount) <= 0) {
      setFormError('Please enter a valid amount.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      if (editingTransaction) {
        await financeService.updateTransaction(editingTransaction._id, modalForm);
      } else {
        await financeService.createTransaction(modalForm);
      }
      setIsModalOpen(false);
      loadFinanceData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('finance.title')}</h1>
          <p className="page-subtitle">{t('finance.subtitle')}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => handleOpenAddModal('expense')} className="btn btn-danger btn-sm">
            <TrendingDown size={18} strokeWidth={2.5} />
            <span>खर्च जोड़ें / Add Expense</span>
          </button>
          <button onClick={() => handleOpenAddModal('income')} className="btn btn-primary btn-sm">
            <TrendingUp size={18} strokeWidth={2.5} />
            <span>आय जोड़ें / Add Income</span>
          </button>
        </div>
      </div>

      {/* Neo-Brutalist Summary Cards */}
      <div className="grid grid-cols-4" style={{ marginBottom: 'var(--space-xl)' }}>
        <div
          className="card"
          style={{
            backgroundColor: 'var(--nb-green-light)',
            border: 'var(--border-thick)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <div style={{ fontSize: '0.85rem', fontWeight: '900', textTransform: 'uppercase', color: 'var(--nb-black)' }}>
            {t('finance.totalIncome')}
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '950', color: 'var(--nb-black)', marginTop: '4px' }}>
            ₹{summary?.totalIncome?.toLocaleString('en-IN') || 0}
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#166534', marginTop: '2px' }}>
            इस महीने: ₹{summary?.thisMonth?.income?.toLocaleString('en-IN') || 0}
          </div>
        </div>

        <div
          className="card"
          style={{
            backgroundColor: 'var(--nb-red-light)',
            border: 'var(--border-thick)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <div style={{ fontSize: '0.85rem', fontWeight: '900', textTransform: 'uppercase', color: 'var(--nb-black)' }}>
            {t('finance.totalExpense')}
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '950', color: 'var(--nb-black)', marginTop: '4px' }}>
            ₹{summary?.totalExpense?.toLocaleString('en-IN') || 0}
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#991b1b', marginTop: '2px' }}>
            इस महीने: ₹{summary?.thisMonth?.expense?.toLocaleString('en-IN') || 0}
          </div>
        </div>

        <div
          className="card"
          style={{
            backgroundColor: 'var(--nb-yellow-light)',
            border: 'var(--border-thick)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <div style={{ fontSize: '0.85rem', fontWeight: '900', textTransform: 'uppercase', color: 'var(--nb-black)' }}>
            {t('finance.netBalance')}
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '950', color: 'var(--nb-black)', marginTop: '4px' }}>
            ₹{summary?.netBalance?.toLocaleString('en-IN') || 0}
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#854d0e', marginTop: '2px' }}>
            इस महीने की बचत: ₹{summary?.thisMonth?.net?.toLocaleString('en-IN') || 0}
          </div>
        </div>

        <div
          className="card"
          style={{
            backgroundColor: 'var(--nb-blue-light)',
            border: 'var(--border-thick)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <div style={{ fontSize: '0.85rem', fontWeight: '900', textTransform: 'uppercase', color: 'var(--nb-black)' }}>
            कुल प्रविष्टियां / Records
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '950', color: 'var(--nb-black)', marginTop: '4px' }}>
            {summary?.totalTransactions || 0}
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#075985', marginTop: '2px' }}>
            पारदर्शी किसान बहीखाता
          </div>
        </div>
      </div>

      {/* Visual Category Breakdown & Monthly Trend */}
      {summary && summary.totalTransactions > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
          {/* Category Breakdown */}
          <div className="card" style={{ border: 'var(--border-thick)', boxShadow: 'var(--shadow-md)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--nb-black)', marginBottom: 'var(--space-md)' }}>
              {t('finance.breakdown')}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(summary.categoryBreakdown.expense || {}).map(([cat, amt]) => {
                const pct = summary.totalExpense > 0 ? ((amt / summary.totalExpense) * 100).toFixed(1) : 0;
                return (
                  <div key={cat}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '800' }}>{cat}</span>
                      <span style={{ color: 'var(--nb-black)', fontWeight: '900', backgroundColor: 'var(--nb-red-light)', padding: '1px 6px', border: '1px solid #000' }}>
                        ₹{amt} ({pct}%)
                      </span>
                    </div>
                    <div
                      style={{
                        height: '14px',
                        backgroundColor: 'var(--nb-canvas-alt)',
                        border: 'var(--border-thin)',
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{ height: '100%', width: `${pct}%`, backgroundColor: 'var(--nb-red-bright)', borderRight: '1.5px solid #000' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly Trend Snapshot */}
          <div className="card" style={{ border: 'var(--border-thick)', boxShadow: 'var(--shadow-md)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--nb-black)', marginBottom: 'var(--space-md)' }}>
              {t('finance.monthlyTrend')} (Current Year)
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(summary.monthlyTrends || []).filter((m) => m.income > 0 || m.expense > 0).map((m) => (
                <div
                  key={m.monthIndex}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--nb-canvas-alt)',
                    border: 'var(--border-thin)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <span style={{ fontWeight: '900', fontSize: '0.95rem' }}>{m.monthName}</span>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.9rem', alignItems: 'center' }}>
                    <span style={{ color: 'var(--nb-green)', fontWeight: '800' }}>+₹{m.income}</span>
                    <span style={{ color: 'var(--nb-red)', fontWeight: '800' }}>-₹{m.expense}</span>
                    <span
                      style={{
                        fontWeight: '900',
                        color: 'var(--nb-black)',
                        backgroundColor: m.net >= 0 ? 'var(--nb-green-light)' : 'var(--nb-red-light)',
                        padding: '2px 8px',
                        border: '1.5px solid #000'
                      }}
                    >
                      ₹{m.net}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Transaction History Filter Card */}
      <div
        className="card"
        style={{
          marginBottom: 'var(--space-xl)',
          backgroundColor: 'var(--nb-yellow-light)',
          border: 'var(--border-thick)',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--nb-black)' }}>
            {t('finance.history')} 📜
          </h2>

          <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
            <select
              className="form-select"
              style={{ minHeight: '40px', padding: '6px 12px', fontSize: '0.88rem', fontWeight: '800', backgroundColor: 'var(--nb-white)' }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="All">सभी प्रकार / All Types</option>
              <option value="income">केवल आमदनी / Income</option>
              <option value="expense">केवल खर्च / Expense</option>
            </select>

            <select
              className="form-select"
              style={{ minHeight: '40px', padding: '6px 12px', fontSize: '0.88rem', fontWeight: '800', backgroundColor: 'var(--nb-white)' }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">सभी श्रेणियां / All Categories</option>
              {[...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      {loading ? (
        <Loader message={t('common.loading')} />
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={IndianRupee}
          title="कोई लेनदेन नहीं मिला"
          description="खाद, बीज, डीजल, मजदूरी या फसल बिक्री का नया हिसाब जोड़ें।"
          actionText={t('finance.addTransaction')}
          onAction={() => handleOpenAddModal('expense')}
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>तारीख / Date</th>
                <th>प्रकार / Type</th>
                <th>श्रेणी / Category</th>
                <th>विवरण / Description</th>
                <th style={{ textAlign: 'right' }}>रकम / Amount (₹)</th>
                <th style={{ textAlign: 'right' }}>कार्य / Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx._id}>
                  <td style={{ fontSize: '0.9rem', fontWeight: '700', whiteSpace: 'nowrap' }}>
                    {new Date(tx.date).toLocaleDateString()}
                  </td>
                  <td>
                    <span className={`badge ${tx.type === 'income' ? 'badge-success' : 'badge-danger'}`}>
                      {tx.type === 'income' ? 'आय / Income' : 'खर्च / Expense'}
                    </span>
                  </td>
                  <td style={{ fontWeight: '800', color: 'var(--nb-black)' }}>
                    {tx.category}
                  </td>
                  <td style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                    {tx.description || '-'}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '950', fontSize: '1.1rem' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        border: '1.5px solid #000',
                        borderRadius: '4px',
                        backgroundColor: tx.type === 'income' ? 'var(--nb-green-light)' : 'var(--nb-red-light)'
                      }}
                    >
                      {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        onClick={() => handleOpenEditModal(tx)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px' }}
                        title="Edit"
                      >
                        <Edit size={16} strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => handleDelete(tx._id)}
                        className="btn btn-danger btn-sm"
                        style={{ padding: '6px' }}
                        title="Delete"
                      >
                        <Trash2 size={16} strokeWidth={2.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Transaction Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingTransaction ? 'हिसाब बदलें / Edit Record' : t('finance.addTransaction')}
          maxWidth="520px"
        >
          {formError && (
            <div className="alert alert-danger" style={{ marginBottom: 'var(--space-md)' }}>
              <AlertCircle size={20} strokeWidth={2.5} />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{t('finance.type')} *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  className={`btn ${modalForm.type === 'expense' ? 'btn-danger' : 'btn-secondary'}`}
                  onClick={() => setModalForm({ ...modalForm, type: 'expense', category: 'Seeds' })}
                >
                  <TrendingDown size={18} strokeWidth={2.5} />
                  <span>खर्च (Expense)</span>
                </button>
                <button
                  type="button"
                  className={`btn ${modalForm.type === 'income' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setModalForm({ ...modalForm, type: 'income', category: 'Crop Sale' })}
                >
                  <TrendingUp size={18} strokeWidth={2.5} />
                  <span>आमदनी (Income)</span>
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('finance.amount')} *</label>
              <input
                type="number"
                min="1"
                step="any"
                className="form-input"
                placeholder="उदा. 4500"
                value={modalForm.amount}
                onChange={(e) => setModalForm({ ...modalForm, amount: e.target.value })}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('finance.category')} *</label>
              <select
                className="form-select"
                value={modalForm.category}
                onChange={(e) => setModalForm({ ...modalForm, category: e.target.value })}
                required
              >
                {(modalForm.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t('finance.date')} *</label>
              <input
                type="date"
                className="form-input"
                value={modalForm.date}
                onChange={(e) => setModalForm({ ...modalForm, date: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('finance.description')}</label>
              <input
                type="text"
                className="form-input"
                placeholder="उदा. 2 बोरी डीएपी और 1 बोरी पोटाश"
                value={modalForm.description}
                onChange={(e) => setModalForm({ ...modalForm, description: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)', marginTop: 'var(--space-lg)' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsModalOpen(false)}
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Finance;
