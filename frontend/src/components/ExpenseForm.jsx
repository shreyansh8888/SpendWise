import React, { useState } from 'react';
import { 
  Sparkles, 
  IndianRupee, 
  PlusCircle, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  Loader2 
} from 'lucide-react';
import { getCategoryBadgeClass } from './Dashboard';

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
    } catch (err) {
      setErrorMsg(`Prediction failed: ${err.message}. Ensure backend is running.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveExpense = () => {
    if (!predictionResult) return;

    onAddExpense({
      id: Date.now().toString(),
      description: predictionResult.description,
      amount: predictionResult.amount,
      category: predictionResult.predicted_category,
      confidence: predictionResult.confidence,
      date: new Date().toISOString()
    });

    setAddedSuccess(true);
    setPredictionResult(null);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="predictor-grid">
        {/* Left Card: Input Form */}
        <div className="card">
          <div className="card-title">Predict Expense Category</div>
          <div className="card-subtitle">
            Enter expense details to infer the category using our scikit-learn TF-IDF model
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
                onChange={(e) => setDescription(e.target.value)}
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
                  onChange={(e) => setAmount(e.target.value)}
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

          {/* Quick Examples for examiners/users */}
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
            Live multi-class softmax probabilities from trained Logistic Regression
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Predicted Category
                  </span>
                  <div style={{ marginTop: '0.25rem' }}>
                    <span className={`badge ${getCategoryBadgeClass(predictionResult.predicted_category)}`} style={{ fontSize: '1rem', padding: '0.4rem 0.9rem' }}>
                      {predictionResult.predicted_category}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Top Confidence
                  </span>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {(predictionResult.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Class Probability Breakdown */}
              <div style={{ marginTop: '1.25rem' }}>
                <span style={{ fontSize: '0.785rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Class Probabilities Breakdown:
                </span>
                <div className="probability-list">
                  {Object.entries(predictionResult.probabilities).map(([category, prob]) => {
                    const isTop = category === predictionResult.predicted_category;
                    const percentage = (prob * 100).toFixed(1);
                    return (
                      <div key={category} className="probability-item">
                        <div className="probability-label-row">
                          <span style={{ color: isTop ? 'var(--primary)' : 'var(--text-muted)' }}>
                            {category}
                          </span>
                          <span>{percentage}%</span>
                        </div>
                        <div className="progress-track">
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: isTop ? 'var(--primary)' : '#94a3b8'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Scientific Disclaimer */}
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
                  <strong>Statistical Note:</strong> {predictionResult.disclaimer}
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
                <span>Add Expense to Record (₹{predictionResult.amount})</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
