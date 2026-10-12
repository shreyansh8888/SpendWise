# SpendWise — ML-Based Expense Category Predictor

> **MLT College Microproject**  
> Developed using FastAPI, scikit-learn, React, Vite, and Recharts.

---

## 1. Project Abstract

**SpendWise** is a full-stack, machine learning-driven web application designed to automatically classify personal expense entries into standardized financial categories based on raw text descriptions (e.g., *"Swiggy dinner order"* $\rightarrow$ **Food & Dining**, *"BESCOM electric bill"* $\rightarrow$ **Bills & Utilities**). By utilizing Natural Language Processing (NLP) with **TF-IDF (Term Frequency-Inverse Document Frequency) vectorization** and a **Multinomial Logistic Regression** classifier, SpendWise replaces manual expense categorization with automated, real-time probabilistic classification. The application features an interactive SaaS dashboard providing spending statistics, persistent local storage, and transparent model evaluation metrics directly on the client.

---

## 2. Problem Statement

Manual budget tracking requires users to manually select expense categories for every transaction. This introduces cognitive friction, leads to inconsistent tagging, and frequently causes users to abandon expense logging altogether. 

Traditional rule-based keyword matchers (such as `if 'swiggy' in text`) are brittle, fail to handle vocabulary variations or compound sentences, and do not provide probabilistic confidence. **SpendWise** addresses this challenge by training a genuine supervised machine learning classifier capable of computing posterior class probabilities across 8 standardized financial categories.

---

## 3. Objectives

1. **Automate Categorization:** Train a reproducible scikit-learn machine learning pipeline to classify expense text with sub-second inference latency.
2. **Expose RESTful Inference API:** Build a lightweight, scalable FastAPI backend providing endpoints for health checking, real-time prediction with probability distributions, and genuine training evaluation metrics.
3. **Interactive SaaS Dashboard:** Create a modern React frontend featuring spending analytics, dynamic charts (Recharts), local persistence, and transparency into model performance (confusion matrix and classification report).
4. **Prevent Data Leakage:** Implement strict train-test separation with stratified sampling and reproducible random states.
5. **Production Readiness:** Enable cloud deployment with Render (Python backend) and Vercel (React frontend).

---

## 4. Supported Expense Categories

SpendWise classifies text into eight standardized categories:

1. **Food & Dining** (e.g., Swiggy, Zomato, cafes, dining, restaurants)
2. **Transport** (e.g., Uber, Ola, Metro card, petrol, train tickets, Fastag)
3. **Shopping** (e.g., Amazon, Flipkart, apparel, electronics, footwear)
4. **Bills & Utilities** (e.g., electricity, broadband, LPG cylinder, mobile recharge)
5. **Entertainment** (e.g., Netflix, Spotify, BookMyShow movie tickets, Steam)
6. **Health** (e.g., Apollo pharmacy, doctor visits, diagnostic tests, vitamins)
7. **Education** (e.g., Udemy, Coursera, college tuition fees, textbooks)
8. **Groceries** (e.g., BigBasket, Blinkit, Zepto, milk, fruits, vegetables)

---

## 5. Technology Stack

### Backend
- **Language:** Python 3.11+
- **Framework:** FastAPI (Asynchronous REST API)
- **Server:** Uvicorn (ASGI web server)
- **Machine Learning:** scikit-learn (Pipeline, `TfidfVectorizer`, `LogisticRegression`)
- **Data Manipulation:** pandas, NumPy
- **Model Serialization:** joblib
- **Data Validation:** Pydantic v2

### Frontend
- **Framework:** React 18
- **Tooling / Bundler:** Vite
- **Data Visualization:** Recharts (Pie & Bar charts)
- **Icons:** Lucide React
- **Styling:** Modular CSS3 with custom design tokens

### Cloud & Deployment
- **Frontend Hosting:** Vercel (Single Page App rewrites)
- **Backend Hosting:** Render (Python Web Service)

---

## 6. System Architecture

```mermaid
flowchart TD
    User["User / Web Browser"] -->|Enters expense & amount| Frontend["SpendWise React Frontend (Vite)"]
    Frontend -->|POST /predict (JSON)| API["FastAPI Backend (Uvicorn)"]
    API -->|Normalize text| Pipeline["Trained ML Pipeline (model.pkl)"]
    Pipeline -->|1. Tokenize & Vectorize| TFIDF["TF-IDF Vectorizer (Unigrams + Bigrams)"]
    Pipeline -->|2. Compute Softmax Logits| Classifier["Logistic Regression Classifier"]
    Classifier -->|Predicted Class + Probabilities| API
    API -->|JSON Response| Frontend
    Frontend -->|Update State & localStorage| Storage[("Browser localStorage")]
    Frontend -->|Re-render Charts| Dashboard["Interactive Dashboard & Analytics"]
    
    TrainingScript["train_model.py"] -->|Reads & Validates| CSV[("expenses.csv (480 records)")]
    TrainingScript -->|Stratified 80/20 Split| Split["Train / Test Splits"]
    TrainingScript -->|Outputs| ModelFile[("model.pkl")]
    TrainingScript -->|Outputs Genuine Metrics| MetricsFile[("metrics.json")]
    MetricsFile -->|GET /metrics| API
```

---

## 7. Machine Learning Methodology

### 7.1 Text Preprocessing & TF-IDF Vectorization
Text is converted to lowercase and stripped of redundant whitespace. We use scikit-learn's `TfidfVectorizer`:
- **N-gram Range:** `(1, 2)` (captures both single words like `"metro"` and word pairs like `"movie tickets"`).
- **Sublinear Term Frequency Scaling:** Applies $1 + \log(\text{tf})$ to dampen the effect of unusually frequent words.
- **Maximum Document Frequency (`max_df`):** $0.95$ (disregards words appearing in more than 95% of documents).

### 7.2 Classification Algorithm: Multinomial Logistic Regression
Logistic Regression is a linear classifier using the softmax function for multi-class prediction:

$$P(Y = k \mid \mathbf{x}) = \frac{e^{\mathbf{w}_k^T \mathbf{x} + b_k}}{\sum_{j=1}^{K} e^{\mathbf{w}_j^T \mathbf{x} + b_j}}$$

**Why Logistic Regression for this microproject?**
1. **High dimensional sparse text efficiency:** Excellent performance on sparse TF-IDF matrices without overfitting.
2. **Calibrated Probabilities:** Outputs genuine probabilities sum-to-1 via softmax, allowing SpendWise to visualize confidence distributions.
3. **Fast inference:** Sub-millisecond CPU inference latency, optimal for low-latency web applications.

### 7.3 Data Leakage Prevention
To guarantee scientific validity:
- Vectorizer parameters and IDF weights are fitted **strictly on the 80% training split**.
- The remaining 20% test split is kept completely held-out until final metric evaluation.
- No synthetic oversampling or duplicate leakage across splits.

---

## 8. Dataset Description & Limitations

- **File:** `backend/expenses.csv`
- **Total Valid Records:** 720 balanced records (90 samples across each of the 8 classes, with zero duplicates).
- **Nature of Dataset:** Curated benchmark dataset modeling typical everyday Indian and global spending entries (e.g., Swiggy, Zomato, Uber, BESCOM, Airtel, Blinkit, Apollo Pharmacy, Coursera).
- **Model Architecture:** FeatureUnion combining Word-level TF-IDF (1, 2) + Character-level `char_wb` (3, 5) with Multinomial Logistic Regression ($C=3.0$).
- **Held-Out Test Accuracy:** **89.58%** | **Macro F1:** **89.70%** (Stratified 5-Fold Cross-Validation: **90.83%**).
- **Known Limitations:**
  - Performs best on English descriptions and transliterated brand names.
  - Very ambiguous one-word inputs (e.g., *"charge"*, *"payment"*) will naturally yield lower top-class probabilities.
  - The model does not parse unstructured PDF/SMS banking messages directly.

---

## 9. Project Directory Structure

```
SpendWise/
├── backend/
│   ├── expenses.csv         # Curated 8-category training dataset (720 records)
│   ├── train_model.py       # Reproducible training & evaluation script
│   ├── main.py              # FastAPI application server with CORS & confidence tiers
│   ├── requirements.txt     # Python backend dependencies
│   ├── model.pkl            # Serialized scikit-learn pipeline (generated)
│   └── metrics.json         # Genuine test-set evaluation results (generated)
├── frontend/
│   ├── package.json         # React + Vite dependencies
│   ├── index.html           # HTML5 entrypoint with Google Fonts
│   ├── vite.config.js       # Vite build configuration
│   ├── vercel.json          # Vercel SPA routing rewrite rules
│   ├── .env.example         # Template for environment variables
│   ├── .env                 # Local environment config (VITE_API_URL)
│   └── src/
│       ├── main.jsx         # React application root mount
│       ├── App.jsx          # Top-level state and layout container
│       ├── App.css          # Component layout styles and animations
│       ├── index.css        # Design tokens, typography, and badges
│       └── components/
│           ├── Navbar.jsx        # Sidebar navigation & API status monitor
│           ├── Dashboard.jsx     # Spending stats & Recharts visualizers
│           ├── ExpenseForm.jsx   # Expense text input & probability bars
│           ├── Transactions.jsx  # History table with delete & search
│           └── ModelInsights.jsx # Confusion matrix & test metric cards
├── .gitignore
└── README.md
```

---

## 10. Local Setup & Execution Guide

### Prerequisites
- Python 3.10+ installed
- Node.js 18+ and npm installed

### Step 1: Clone or Navigate to the Project
```bash
cd "d:\Spendwise anti\SpendWise"
```

### Step 2: Set Up Backend
```bash
cd backend

# (Optional) Create and activate a virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the training script to generate model.pkl and metrics.json
python train_model.py

# Start the FastAPI server
python -m uvicorn main:app --reload --port 8000
```
The backend API is now running at `http://localhost:8000`.  
Interactive Swagger docs: `http://localhost:8000/docs`.

### Step 3: Set Up Frontend
Open a new terminal window:
```bash
cd "d:\Spendwise anti\SpendWise\frontend"

# Install frontend dependencies
npm install

# Start Vite development server
npm run dev
```
The frontend is now running at `http://localhost:5173`.

---

## 11. Backend API Specification

| Endpoint | Method | Description | Request Body | Response |
|---|---|---|---|---|
| `/` | `GET` | API overview & status | None | JSON metadata |
| `/health` | `GET` | Health check for model & metrics | None | Health status object |
| `/predict` | `POST` | Predicts category & class probabilities | `{"description": "...", "amount": 350.0}` | Predicted category, top confidence, probability breakdown |
| `/metrics` | `GET` | Test-set evaluation metrics & confusion matrix | None | Complete evaluation payload |

---

## 12. Deployment Guide

### A. Deploy Backend on Render
1. Push your repository to GitHub.
2. Sign in to [Render](https://render.com) and click **New +** $\rightarrow$ **Web Service**.
3. Select your repository.
4. Configure service parameters:
   - **Root Directory:** `SpendWise/backend` (or `backend`)
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt && python train_model.py`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variables:
   - `ALLOWED_ORIGINS`: `https://your-frontend.vercel.app,http://localhost:5173`
6. Click **Deploy Web Service**. Note your Render URL (e.g. `https://spendwise-backend.onrender.com`).

### B. Deploy Frontend on Vercel
1. Sign in to [Vercel](https://vercel.com) and click **Add New** $\rightarrow$ **Project**.
2. Select your repository.
3. Configure project settings:
   - **Root Directory:** `SpendWise/frontend` (or `frontend`)
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add Environment Variable:
   - `VITE_API_URL`: `https://spendwise-backend.onrender.com` (your Render backend URL)
5. Click **Deploy**. Vercel will build and provide your production live URL.

---

## 13. Limitations & Future Enhancements

### Limitations
- **Vocabulary Out-of-Bounds:** Highly abbreviated or novel slang not present in the training vocabulary may produce uniform low confidence across classes.
- **Rule Exclusivity:** Amount is recorded for transaction ledger purposes; category prediction is based on semantic text description.

### Future Enhancements
1. **Active Learning Feedback Loop:** Add a *"Correct Category"* button allowing users to re-label mistakes, appending them to a secondary training file for periodic fine-tuning.
2. **SMS & Receipt OCR Parsing:** Integrate Tesseract OCR or native regex to automatically extract vendor and amount from UPI SMS screenshots.
3. **Monthly Budget Alerts:** Add budget thresholds per category with notification warnings when spending reaches 80%.

---

## 14. Viva Questions & Answers

**Q1: What is TF-IDF and why is it used?**  
> **A:** TF-IDF stands for *Term Frequency-Inverse Document Frequency*. It evaluates how important a word is to an expense description relative to the entire dataset. Frequent generic words receive lower weights, while distinctive vendor terms (e.g., *"Swiggy"*, *"Recharge"*) receive higher weights.

**Q2: Why did you choose Logistic Regression instead of deep learning or an LLM?**  
> **A:** For short text classification on ~500 records, Logistic Regression trains in milliseconds, requires minimal memory, runs without a GPU, does not overfit easily, and provides calibrated multi-class softmax probabilities for real-time web deployment.

**Q3: How did you prevent data leakage during model training?**  
> **A:** We used scikit-learn's `Pipeline`. The `TfidfVectorizer` is fitted strictly on the 80% training split. The 20% test split was transformed using the already-fitted vocabulary, ensuring the model never observed test data statistics during training.

**Q4: What is the difference between Macro F1-score and Weighted F1-score?**  
> **A:** *Macro F1* computes the arithmetic average of F1 scores across all classes equally, treating small classes with equal importance. *Weighted F1* weights each class score by its support (number of samples). Because our dataset is stratified and balanced, both metrics are closely aligned.

**Q5: How does the application handle offline backend scenarios?**  
> **A:** The React frontend periodically checks the `/health` endpoint. If the server is offline or restarting on free-tier hosting (cold starts), the UI displays a clear offline status indicator, friendly fallback alerts, and prevents corrupt submissions.
