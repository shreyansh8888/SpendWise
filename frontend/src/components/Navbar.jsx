import React from 'react';
import { 
  LayoutDashboard, 
  Sparkles, 
  ReceiptText, 
  BarChart3, 
  Wallet,
  Menu,
  X
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, apiStatus, mobileMenuOpen, setMobileMenuOpen }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'predict', label: 'Expense Predictor', icon: Sparkles },
    { id: 'transactions', label: 'Transactions', icon: ReceiptText },
    { id: 'insights', label: 'Model Insights', icon: BarChart3 },
  ];

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    if (setMobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-header">
        <div className="brand-icon">
          <Wallet size={22} strokeWidth={2.4} />
        </div>
        <div>
          <div className="brand-title">SpendWise</div>
          <span className="brand-badge">ML Predictor</span>
        </div>
        {setMobileMenuOpen && (
          <button 
            className="mobile-nav-toggle" 
            style={{ marginLeft: 'auto' }}
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Backend API Status</div>
        <div className={`api-status-badge ${apiStatus.online ? 'api-status-online' : 'api-status-offline'}`}>
          <span className={`status-dot ${apiStatus.online ? 'online' : 'offline'}`} />
          <span>{apiStatus.online ? 'Model Service Online' : 'API Unreachable'}</span>
        </div>
        <div style={{ marginTop: '0.6rem', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
          ML Model: TF-IDF + Logistic Reg
        </div>
      </div>
    </aside>
  );
}
