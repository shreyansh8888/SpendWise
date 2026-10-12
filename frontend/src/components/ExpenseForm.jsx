import React, { useState } from 'react';
import { 
  Sparkles, 
  IndianRupee, 
  PlusCircle, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  Loader2,
  Edit3
} from 'lucide-react';
import { getCategoryBadgeClass } from './Dashboard';

const ALL_CATEGORIES = [
  'Food & Dining',
  'Transport',
  'Shopping',
  'Bills & Utilities',
  'Entertainment',
  'Health',
  'Education',
  'Groceries'
];

const EXAMPLE_QUERIES = [
  { text: 'Swiggy dinner order with friends', amount: '450' },
  { text: 'Uber cab ride to railway station', amount: '280' },
  { text: 'Electricity bill payment BESCOM', amount: '1240' },
  { text: 'Amazon wireless earbuds order', amount: '1499' },
  { text: 'BookMyShow movie tickets and popcorn', amount: '650' },
  { text: 'Apollo Pharmacy cough syrup and tablets', amount: '320' },
  { text: 'Udemy complete Python machine learning course', amount: '499' },
  { text: 'Zepto instant milk, fruits and veggies delivery', amount: '365' }
];

export default function ExpenseForm({ apiUrl, onAddExpense }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [predictionResult, setPredictionResult] = useState(null);
  const [chosenCategory, setChosenCategory] = useState('');
  const [addedSuccess, setAddedSuccess] = useState(false);

  const handlePredict = async (e) => {
    e?.preventDefault();
    setErrorMsg(null);
    setPredictionResult(null);
    setAddedSuccess(false);

    if (!description.trim()) {
      setErrorMsg('Please enter an expense description.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Please enter a valid expense amount greater than 0.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${apiUrl}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          amount: numAmount
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      setPredictionResult(data);
      setChosenCategory(data.predicted_category);
    } catch (err) {
      setErrorMsg(`Prediction failed: ${err.message}. Ensure backend is running.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveExpense = () => {
    if (!predictionResult) return;

    // Collision-resistant ID generation
    const uniqueId = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    onAddExpense({
      id: uniqueId,
      description: predictionResult.description,
      amount: predictionResult.amount,
      category: chosenCategory || predictionResult.predicted_category,
      originalPredictedCategory: predictionResult.predicted_category,
      wasOverridden: chosenCategory !== predictionResult.predicted_category,
      confidence: predictionResult.confidence,
      date: new Date().toISOString()
    });

    setAddedSuccess(true);
    setPredictionResult(null);
    setChosenCategory('');
    setDescription('');
    setAmount('');
  };

  const handleSelectExample = (ex) => {
    setDescription(ex.text);
    setAmount(ex.amount);
    setErrorMsg(null);
    setPredictionResult(null);
    setAddedSuccess(false);
  };

  const getConfidenceTierInfo = (conf) => {
    if (conf >= 0.60) {
      return {
        label: 'High Statistical Likelihood',
        badgeBg: '#ecfdf5',
        badgeColor: '#047857',
        borderColor: '#a7f3d0'
      };
    } else if (conf >= 0.30) {
      return {
        label: 'Moderate Statistical Likelihood',
        badgeBg: '#eff6ff',
        badgeColor: '#1d4ed8',
        borderColor: '#bfdbfe'
      };
    } else {
      return {
        label: 'Ambiguous / Low Confidence',
        badgeBg: '#f8fafc',
        badgeColor: '#475569',
        borderColor: '#cbd5e1'
      };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="predictor-grid">
        {/* Left Card: Input Form */}
        <div className="card">
          <div className="card-title">Predict Expense Category</div>
          <div className="card-subtitle">
            Enter expense details to classify with our scikit-learn FeatureUnion model
          </div>

          {errorMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.75rem 1rem',
              backgroundColor: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '1rem'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {addedSuccess && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.75rem 1rem',
              backgroundColor: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '1rem'
            }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <span>Expense successfully saved to your transactions!</span>
            </div>
          )}

          <form onSubmit={handlePredict}>
            <div className="form-group">
              <label className="form-label" htmlFor="expense-desc">
                Expense Description
              </label>
              <input
                id="expense-desc"
                type="text"
                className="form-input"
                placeholder="e.g. Swiggy biryani dinner, Metro card recharge..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                maxLength={500}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="expense-amount">
                Amount (₹ INR)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}>
                  ₹
                </span>
                <input
                  id="expense-amount"
                  type="number"
                  step="any"
                  className="form-input"
                  style={{ paddingLeft: '2rem' }}
                  placeholder="350.00"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Evaluating Model Pipeline...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Predict Category</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Examples */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)' }}>
            <span style={{ fontSize: '0.785rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Quick Test Examples (Click to fill):
            </span>
            <div className="quick-tags">
              {EXAMPLE_QUERIES.map((ex, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="quick-tag"
                  onClick={() => handleSelectExample(ex)}
                >
                  {ex.text}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Card: Model Prediction Output */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-title">Prediction Result & Probabilities</div>
          <div className="card-subtitle">
            Multi-class softmax probability distribution across 8 financial categories
          </div>

          {!predictionResult ? (
            <div className="empty-state" style={{ margin: 'auto' }}>
              <Sparkles size={40} />
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '0.5rem' }}>
                Ready to Predict
              </div>
              <p style={{ fontSize: '0.825rem', maxWidth: '300px', margin: '0.35rem auto' }}>
                Fill in the expense description and amount to run live model inference.
              </p>
            </div>
          ) : (
            <div className="prediction-result-box" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Model Predicted Category
                  </span>
                  <div style={{ marginTop: '0.25rem' }}>
                    <span className={`badge ${getCategoryBadgeClass(predictionResult.predicted_category)}`} style={{ fontSize: '0.95rem', padding: '0.35rem 0.85rem' }}>
                      {predictionResult.predicted_category}
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  {(() => {
                    const tier = getConfidenceTierInfo(predictionResult.confidence);
                    return (
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          Model Confidence
                        </span>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                          {(predictionResult.confidence * 100).toFixed(1)}%
                        </div>
                        <span style={{
                          display: 'inline-block',
                          fontSize: '0.675rem',
                          fontWeight: 700,
                          backgroundColor: tier.badgeBg,
                          color: tier.badgeColor,
                          border: `1px solid ${tier.borderColor}`,
                          padding: '0.1rem 0.45rem',
                          borderRadius: '4px',
                          marginTop: '2px'
                        }}>
                          {tier.label}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Human-in-the-Loop Category Override Dropdown */}
              <div style={{
                marginTop: '1.25rem',
                padding: '0.85rem 1rem',
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                  <Edit3 size={15} style={{ color: 'var(--primary)' }} />
                  <label htmlFor="category-override" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Assigned Category (Review or Override):
                  </label>
                </div>
                <select
                  id="category-override"
                  className="form-input"
                  style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
                  value={chosenCategory}
                  onChange={(e) => setChosenCategory(e.target.value)}
                >
                  {ALL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat} {cat === predictionResult.predicted_category ? '(Model Predicted)' : ''}
                    </option>
                  ))}
                </select>
                {chosenCategory !== predictionResult.predicted_category && (
                  <div style={{ marginTop: '0.35rem', fontSize: '0.725rem', color: '#b45309', fontWeight: 600 }}>
                    ✏️ You changed category from "{predictionResult.predicted_category}" to "{chosenCategory}"
                  </div>
                )}
              </div>

              {/* Class Probability Breakdown */}
              <div style={{ marginTop: '1.25rem' }}>
                <span style={{ fontSize: '0.785rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Class Probabilities Breakdown:
                </span>
                <div className="probability-list">
                  {Object.entries(predictionResult.probabilities).map(([category, prob]) => {
                    const isPredicted = category === predictionResult.predicted_category;
                    const isSelected = category === chosenCategory;
                    const percentage = (prob * 100).toFixed(1);
                    return (
                      <div key={category} className="probability-item">
                        <div className="probability-label-row">
                          <span style={{
                            color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                            fontWeight: isSelected ? 700 : 500
                          }}>
                            {category} {isSelected ? '✓' : ''}
                          </span>
                          <span>{percentage}%</span>
                        </div>
                        <div className="progress-track">
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: isPredicted ? 'var(--primary)' : '#94a3b8'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Statistical Note */}
              <div style={{
                marginTop: '1.25rem',
                padding: '0.65rem 0.85rem',
                backgroundColor: '#f8fafc',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'flex-start'
              }}>
                <Info size={15} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--primary)' }} />
                <span>
                  <strong>Statistical Context:</strong> Across 8 classes (where random baseline is 12.5%), probability indicates relative model affinity based on vocabulary weights.
                </span>
              </div>

              {/* Add Expense Action Button */}
              <button
                type="button"
                className="btn btn-primary"
                style={{ marginTop: '1.25rem', width: '100%' }}
                onClick={handleSaveExpense}
              >
                <PlusCircle size={18} />
                <span>Add Expense as {chosenCategory} (₹{predictionResult.amount})</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
