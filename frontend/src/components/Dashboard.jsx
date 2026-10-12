import React, { useMemo } from 'react';
import { 
  IndianRupee, 
  ArrowUpRight, 
  Hash, 
  PieChart as PieIcon,
  PlusCircle,
  Receipt
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';

const CATEGORY_COLORS = {
  'Food & Dining': '#f97316',
  'Transport': '#0284c7',
  'Shopping': '#db2777',
  'Bills & Utilities': '#d97706',
  'Entertainment': '#7c3aed',
  'Health': '#dc2626',
  'Education': '#0d9488',
  'Groceries': '#16a34a'
};

export const getCategoryBadgeClass = (category) => {
  switch (category) {
    case 'Food & Dining': return 'badge-food';
    case 'Transport': return 'badge-transport';
    case 'Shopping': return 'badge-shopping';
    case 'Bills & Utilities': return 'badge-bills';
    case 'Entertainment': return 'badge-entertainment';
    case 'Health': return 'badge-health';
    case 'Education': return 'badge-education';
    case 'Groceries': return 'badge-groceries';
    default: return 'badge-default';
  }
};

export default function Dashboard({ transactions, onNavigatePredict }) {
  // Aggregate statistics derived strictly from real recorded transactions
  const totalSpend = useMemo(() => {
    return transactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  }, [transactions]);

  const transactionCount = transactions.length;

  const averageSpend = useMemo(() => {
    if (transactionCount === 0) return 0;
    return totalSpend / transactionCount;
  }, [totalSpend, transactionCount]);

  // Aggregate category-wise spending
  const categoryData = useMemo(() => {
    const grouped = {};
    transactions.forEach((t) => {
      const cat = t.category || 'Uncategorized';
      grouped[cat] = (grouped[cat] || 0) + (Number(t.amount) || 0);
    });

    return Object.entries(grouped).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100
    })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const recentTransactions = useMemo(() => {
    return [...transactions].slice(0, 5);
  }, [transactions]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Overview Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#f0fdfa', color: '#0d9488' }}>
            <IndianRupee size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Spending</span>
            <span className="stat-value">₹{totalSpend.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#eef2ff', color: '#6366f1' }}>
            <Hash size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Transactions Count</span>
            <span className="stat-value">{transactionCount}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
            <ArrowUpRight size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Average Expense</span>
            <span className="stat-value">₹{averageSpend.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="card empty-state">
          <Receipt size={48} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.5rem' }}>
            No Transactions Recorded Yet
          </h3>
          <p style={{ maxWidth: '420px', margin: '0.5rem auto 1.25rem', fontSize: '0.875rem' }}>
            Use the Expense Predictor to describe an expense, let the trained machine learning model classify it, and track your spending.
          </p>
          <button className="btn btn-primary" onClick={onNavigatePredict}>
            <PlusCircle size={18} />
            <span>Add First Expense</span>
          </button>
        </div>
      ) : (
        <>
          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
            {/* Category Breakdown (Pie Chart) */}
            <div className="card">
              <div className="card-title">Category Distribution</div>
              <div className="card-subtitle">Spending breakdown across predicted categories</div>
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((entry) => (
                        <Cell 
                          key={`cell-${entry.name}`} 
                          fill={CATEGORY_COLORS[entry.name] || '#94a3b8'} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']} 
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconSize={10} 
                      wrapperStyle={{ fontSize: '0.75rem' }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Spending (Bar Chart) */}
            <div className="card">
              <div className="card-title">Spending by Category</div>
              <div className="card-subtitle">Total Indian Rupees spent per category</div>
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 11, fill: '#64748b' }} 
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: '#64748b' }} 
                      tickFormatter={(v) => `₹${v}`} 
                    />
                    <Tooltip 
                      formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Spent']} 
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {categoryData.map((entry) => (
                        <Cell 
                          key={`bar-${entry.name}`} 
                          fill={CATEGORY_COLORS[entry.name] || '#0d9488'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Transactions Card */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <div className="card-title">Recent Transactions</div>
                <div className="card-subtitle" style={{ marginBottom: 0 }}>
                  Showing latest {recentTransactions.length} recorded expenses
                </div>
              </div>
              <button className="btn btn-secondary" onClick={onNavigatePredict} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                <PlusCircle size={15} />
                <span>Add Expense</span>
              </button>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Predicted Category</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((tx) => (
                    <tr key={tx.id}>
                      <td style={{ fontWeight: 600 }}>{tx.description}</td>
                      <td>
                        <span className={`badge ${getCategoryBadgeClass(tx.category)}`}>
                          {tx.category}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {new Date(tx.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-main)' }}>
                        ₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
