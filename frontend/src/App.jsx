import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import ExpenseForm from './components/ExpenseForm';
import Transactions from './components/Transactions';
import ModelInsights from './components/ModelInsights';
import { Menu } from 'lucide-react';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const STORAGE_KEY = 'spendwise_transactions_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState({ online: false, modelLoaded: false });

  // Initialize transactions from localStorage
  const [transactions, setTransactions] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error reading localStorage:', e);
    }
    return [];
  });

  // Sync transactions state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (e) {
      console.error('Error writing to localStorage:', e);
    }
  }, [transactions]);

  // Periodic health check with backend
  useEffect(() => {
    let isMounted = true;

    const checkApiHealth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
          const data = await response.json();
          if (isMounted) {
            setApiStatus({
              online: data.status === 'healthy',
              modelLoaded: Boolean(data.model_loaded)
            });
          }
        } else {
          if (isMounted) setApiStatus({ online: false, modelLoaded: false });
        }
      } catch (err) {
        if (isMounted) setApiStatus({ online: false, modelLoaded: false });
      }
    };

    checkApiHealth();
    const interval = setInterval(checkApiHealth, 20000); // Poll every 20s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleAddExpense = (newExpense) => {
    setTransactions((prev) => [newExpense, ...prev]);
  };

  const handleDeleteExpense = (id) => {
    setTransactions((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    setTransactions([]);
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Financial Overview & Analytics';
      case 'predict': return 'ML Expense Categorizer';
      case 'transactions': return 'Recorded Transactions';
      case 'insights': return 'Machine Learning Performance';
      default: return 'SpendWise';
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        apiStatus={apiStatus}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        {/* Top Navbar */}
        <header className="top-navbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              className="mobile-nav-toggle"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={22} />
            </button>
            <h1 className="nav-title">{getPageTitle()}</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              API: <code style={{ color: 'var(--text-main)', fontSize: '0.75rem' }}>{API_BASE_URL}</code>
            </span>
          </div>
        </header>

        {/* Dynamic Tab Body */}
        <main className="content-body">
          {activeTab === 'dashboard' && (
            <Dashboard
              transactions={transactions}
              onNavigatePredict={() => setActiveTab('predict')}
            />
          )}

          {activeTab === 'predict' && (
            <ExpenseForm
              apiUrl={API_BASE_URL}
              onAddExpense={handleAddExpense}
            />
          )}

          {activeTab === 'transactions' && (
            <Transactions
              transactions={transactions}
              onDeleteExpense={handleDeleteExpense}
              onClearAll={handleClearAll}
              onNavigatePredict={() => setActiveTab('predict')}
            />
          )}

          {activeTab === 'insights' && (
            <ModelInsights
              apiUrl={API_BASE_URL}
            />
          )}
        </main>
      </div>
    </div>
  );
}
