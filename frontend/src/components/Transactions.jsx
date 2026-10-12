import React, { useState, useMemo } from 'react';
import { 
  Trash2, 
  Search, 
  Filter, 
  Receipt, 
  Calendar, 
  IndianRupee,
  AlertCircle
} from 'lucide-react';
import { getCategoryBadgeClass } from './Dashboard';

export default function Transactions({ transactions, onDeleteExpense, onClearAll, onNavigatePredict }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

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

  const totalFilteredAmount = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  }, [filteredTransactions]);

  return (
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

            <div style={{ minWidth: '180px' }}>
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
            <span>Showing {filteredTransactions.length} of {transactions.length} records</span>
            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
              Subtotal: ₹{totalFilteredAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Table */}
          {filteredTransactions.length === 0 ? (
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
                    <th>Predicted Category</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => (
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
                      <td style={{ fontWeight: 600 }}>{tx.description}</td>
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
  );
}
