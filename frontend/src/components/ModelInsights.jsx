import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  CheckCircle, 
  Target, 
  RotateCcw, 
  Layers, 
  AlertTriangle, 
  Info, 
  Calendar, 
  Hash, 
  Cpu, 
  Loader2,
  RefreshCw
} from 'lucide-react';

export default function ModelInsights({ apiUrl }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/metrics`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server status ${response.status}`);
      }
      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      setError(`Failed to fetch model metrics: ${err.message}. Make sure backend is running.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [apiUrl]);

  if (loading) {
    return (
      <div className="card empty-state">
        <Loader2 size={36} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
        <h4 style={{ marginTop: '0.75rem', fontWeight: 600 }}>Loading Evaluation Metrics...</h4>
        <p style={{ fontSize: '0.85rem' }}>Fetching real test-set metrics from the backend API</p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#b91c1c', marginBottom: '1rem' }}>
          <AlertTriangle size={24} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Model Metrics Unavailable</h3>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          {error || 'Unable to retrieve metrics from the server.'}
        </p>
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
          fontSize: '0.825rem',
          marginBottom: '1.25rem',
          fontFamily: 'var(--font-mono)'
        }}>
          💡 To generate metrics, run in your terminal:
          <br />
          <code>cd backend && python train_model.py</code>
        </div>
        <button className="btn btn-secondary" onClick={fetchMetrics}>
          <RefreshCw size={15} />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  const {
    accuracy,
    precision_macro,
    recall_macro,
    f1_macro,
    total_samples,
    train_samples,
    test_samples,
    classes,
    confusion_matrix: cm,
    per_class_metrics,
    dataset_note,
    trained_at
  } = metrics;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Bar */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="card-title">Model Evaluation & Scientific Insights</div>
          <div className="card-subtitle" style={{ marginBottom: 0 }}>
            Trained Pipeline: TF-IDF Vectorizer + Multinomial Logistic Regression
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Trained: {new Date(trained_at).toLocaleString()}
          </span>
          <button className="btn btn-secondary" onClick={fetchMetrics} style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (Held-Out Test Set) */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
            <CheckCircle size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Test Accuracy</span>
            <span className="stat-value">{(accuracy * 100).toFixed(2)}%</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>On {test_samples} unseen test samples</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
            <Target size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Macro Precision</span>
            <span className="stat-value">{(precision_macro * 100).toFixed(2)}%</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Unweighted average across classes</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
            <RotateCcw size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Macro Recall</span>
            <span className="stat-value">{(recall_macro * 100).toFixed(2)}%</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Sensitivity rate across classes</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#ede9fe', color: '#7c3aed' }}>
            <Layers size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Macro F1-Score</span>
            <span className="stat-value">{(f1_macro * 100).toFixed(2)}%</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Harmonic mean of precision & recall</span>
          </div>
        </div>
      </div>

      {/* Split Details & Dataset Integrity Note */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        <div className="card">
          <div className="card-title">Dataset & Split Architecture</div>
          <div className="card-subtitle">Stratified splitting prevents cross-contamination</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Curated Dataset:</span>
              <strong>{total_samples} records</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Training Split (80%):</span>
              <strong>{train_samples} samples</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Held-Out Test Split (20%):</span>
              <strong>{test_samples} samples</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Number of Target Classes:</span>
              <strong>{classes?.length || 8} distinct categories</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Random Seed:</span>
              <code>seed = {metrics.random_seed} (Reproducible)</code>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Dataset Limitations & Honesty Note</div>
          <div className="card-subtitle">Academic integrity & boundary conditions</div>
          
          <div style={{
            backgroundColor: '#f0fdfa',
            border: '1px solid var(--primary-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            fontSize: '0.825rem',
            color: 'var(--text-main)',
            lineHeight: 1.6
          }}>
            <p style={{ marginBottom: '0.5rem' }}>
              {dataset_note}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.785rem' }}>
              <strong>Zero-Leakage Assurance:</strong> Vectorizer vocabulary is learned strictly from training folds. Held-out test evaluation simulates real-world production inputs.
            </p>
          </div>
        </div>
      </div>

      {/* Per-Class Evaluation Metrics Table */}
      {per_class_metrics && (
        <div className="card">
          <div className="card-title">Per-Category Performance Breakdown</div>
          <div className="card-subtitle">Precision, recall, and F1-score evaluated per expense category</div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th style={{ textAlign: 'right' }}>Precision</th>
                  <th style={{ textAlign: 'right' }}>Recall</th>
                  <th style={{ textAlign: 'right' }}>F1-Score</th>
                  <th style={{ textAlign: 'right' }}>Test Support</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((cls) => {
                  const item = per_class_metrics[cls] || {};
                  return (
                    <tr key={cls}>
                      <td style={{ fontWeight: 600 }}>{cls}</td>
                      <td style={{ textAlign: 'right' }}>{(item.precision * 100).toFixed(1)}%</td>
                      <td style={{ textAlign: 'right' }}>{(item.recall * 100).toFixed(1)}%</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                        {(item.f1_score * 100).toFixed(1)}%
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{item.support}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confusion Matrix */}
      {cm && (
        <div className="card">
          <div className="card-title">Test-Set Confusion Matrix</div>
          <div className="card-subtitle">
            Rows represent Actual Ground Truth categories; Columns represent Model Predictions.
            Diagonal cells (teal) represent correct classifications.
          </div>
          <div className="cm-container">
            <table className="cm-table">
              <thead>
                <tr>
                  <th style={{ backgroundColor: '#fff', border: 'none' }}></th>
                  <th colSpan={classes.length} style={{ backgroundColor: 'var(--bg-subtle)' }}>
                    Predicted Category →
                  </th>
                </tr>
                <tr>
                  <th style={{ width: '130px', textAlign: 'left' }}>Actual ↓</th>
                  {classes.map((cls) => (
                    <th key={cls} title={cls} style={{ maxWidth: '85px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cls.split(' ')[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cm.map((row, rIdx) => (
                  <tr key={rIdx}>
                    <td style={{ fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap', backgroundColor: 'var(--bg-subtle)' }}>
                      {classes[rIdx]}
                    </td>
                    {row.map((val, cIdx) => {
                      const isDiagonal = rIdx === cIdx;
                      let cellClass = 'cm-cell-zero';
                      if (isDiagonal && val > 0) cellClass = 'cm-cell-diagonal';
                      else if (!isDiagonal && val > 0) cellClass = 'cm-cell-mistake';

                      return (
                        <td key={cIdx} className={cellClass} title={`Actual: ${classes[rIdx]}, Pred: ${classes[cIdx]} = ${val}`}>
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
