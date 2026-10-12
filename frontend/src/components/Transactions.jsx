import React, { useState, useMemo } from 'react';
import { 
  Trash2, 
  Search, 
  Filter, 
  Receipt, 
  Calendar, 
  IndianRupee, 
  AlertCircle,
  ArrowUpDown,
  HardDrive
} from 'lucide-react';
import { getCategoryBadgeClass } from './Dashboard';

export default function Transactions({ transactions, onDeleteExpense, onClearAll, onNavigatePredict }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  const categories = useMemo(() => {
    const set = new Set(transactions.map((t) => t.category));
    return Array.from(set).filter(Boolean);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((item) => {
      const matchesSearch = item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [transactions, searchTerm, categoryFilter]);

  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'oldest') return new Date(a.date) - new Date(b.date);
      if (sortBy === 'amount_desc') return (Number(b.amount) || 0) - (Number(a.amount) || 0);
      if (sortBy === 'amount_asc') return (Number(a.amount) || 0) - (Number(b.amount) || 0);
      return 0;
    });
  }, [filteredTransactions, sortBy]);

  const totalFilteredAmount = useMemo(() => {
    return sortedTransactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  }, [sortedTransactions]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Persistence Notice Card */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        padding: '0.75rem 1rem',
        backgroundColor: '#f0fdfa',
        border: '1px solid #99f6e4',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.8rem',
        color: '#0f766e'
      }}>
        <HardDrive size={16} style={{ flexShrink: 0 }} />
        <span>
          <strong>Browser LocalStorage Notice:</strong> All recorded expenses persist in your browser's local cache. Clearing browser site data or using Incognito mode will reset these records.
        </span>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div className="card-title">Transaction History</div>
            <div className="card-subtitle" style={{ marginBottom: 0 }}>
              All recorded expenses stored locally in your browser
            </div>
          </div>

          {transactions.length > 0 && (
            <button
              className="btn btn-danger"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
              onClick={() => {
                if (window.confirm('Are you sure you want to delete all transactions?')) {
                  onClearAll();
                }
              }}
            >
              <Trash2 size={14} />
              <span>Clear All</span>
            </button>
          )}
        </div>

        {transactions.length === 0 ? (
          <div className="empty-state">
            <Receipt size={44} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--text-main)' }}>
              No Transactions Stored
            </h4>
            <p style={{ maxWidth: '380px', margin: '0.5rem auto 1rem', fontSize: '0.85rem' }}>
              No expenses found in local storage. Use the predictor to classify and add transactions.
            </p>
            <button className="btn btn-primary" onClick={onNavigatePredict}>
              Predict & Add Expense
            </button>
          </div>
        ) : (
          <>
            {/* Search & Filter Toolbar */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              {/* Search input */}
              <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
                <Search 
                  size={16} 
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} 
                />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.25rem', width: '100%', fontSize: '0.85rem' }}
                  placeholder="Search by description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Category Filter */}
              <div style={{ minWidth: '170px' }}>
                <select
                  className="form-input"
                  style={{ width: '100%', fontSize: '0.85rem' }}
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="ALL">All Categories ({transactions.length})</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Sort By Dropdown */}
              <div style={{ minWidth: '170px' }}>
                <select
                  className="form-input"
                  style={{ width: '100%', fontSize: '0.85rem' }}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">📅 Newest Date First</option>
                  <option value="oldest">📅 Oldest Date First</option>
                  <option value="amount_desc">💰 Amount: High to Low</option>
                  <option value="amount_asc">💰 Amount: Low to High</option>
                </select>
              </div>
            </div>

            {/* Filter Summary Banner */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.6rem 0.85rem',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              marginBottom: '1rem'
            }}>
              <span>Showing {sortedTransactions.length} of {transactions.length} records</span>
              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                Subtotal: ₹{totalFilteredAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Table */}
            {sortedTransactions.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                <AlertCircle size={32} />
                <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>No transactions matched your filters.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Category</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                      <th style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTransactions.map((tx) => (
                      <tr key={tx.id}>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Calendar size={13} style={{ color: 'var(--text-dim)' }} />
                            {new Date(tx.date).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {tx.description}
                          {tx.wasOverridden && (
                            <span 
                              style={{ 
                                marginLeft: '0.5rem', 
                                fontSize: '0.675rem', 
                                backgroundColor: '#fef3c7', 
                                color: '#b45309', 
                                padding: '0.1rem 0.35rem', 
                                borderRadius: '3px' 
                              }}
                              title={`Model predicted: ${tx.originalPredictedCategory}, overridden by user`}
                            >
                              Overridden
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${getCategoryBadgeClass(tx.category)}`}>
                            {tx.category}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-main)' }}>
                          ₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-danger"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                            title="Delete transaction"
                            onClick={() => onDeleteExpense(tx.id)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
