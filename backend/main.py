"""
SpendWise - FastAPI Backend Application
=======================================
Provides REST API endpoints for:
  - API Health Check (/health)
  - Expense Category Prediction with Probabilities (/predict)
  - Genuine Test-Set Evaluation Metrics (/metrics)
"""

import os
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional
import joblib
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
METRICS_PATH = os.path.join(BASE_DIR, "metrics.json")

# Initialize FastAPI application
app = FastAPI(
    title="SpendWise Expense Category Predictor API",
    description="ML-powered expense category prediction using TF-IDF and Logistic Regression.",
    version="1.0.0"
)

# CORS Configuration
# Reads ALLOWED_ORIGINS environment variable (comma-separated), with sensible defaults for local dev
raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173")
if raw_origins.strip() == "*":
    allowed_origins = ["*"]
else:
    allowed_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

is_wildcard = (allowed_origins == ["*"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_credentials=not is_wildcard,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model cache loaded during startup
model_pipeline = None


def load_model_safely():
    """Loads the trained pipeline from disk if available."""
    global model_pipeline
    if os.path.exists(MODEL_PATH):
        try:
            model_pipeline = joblib.load(MODEL_PATH)
            print(f"[SpendWise] Successfully loaded ML model from {MODEL_PATH}")
        except Exception as exc:
            print(f"[SpendWise] ERROR loading model: {exc}")
            model_pipeline = None
    else:
        print(f"[SpendWise] WARNING: Model file not found at {MODEL_PATH}. Run train_model.py first.")
        model_pipeline = None


@app.on_event("startup")
def startup_event():
    load_model_safely()


# ---------------- Pydantic Request & Response Schemas ----------------

class PredictRequest(BaseModel):
    description: str = Field(
        ...,
        min_length=2,
        max_length=500,
        description="Expense description text (e.g., 'Swiggy dinner order')"
    )
    amount: float = Field(
        ...,
        gt=0,
        description="Expense amount in Indian Rupees (INR), must be greater than zero"
    )

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("Description cannot be empty or only whitespace.")
        return trimmed


class PredictResponse(BaseModel):
    description: str
    amount: float
    predicted_category: str
    confidence: float
    confidence_tier: str
    probabilities: Dict[str, float]
    disclaimer: str
    timestamp: str


# ---------------- API Endpoints ----------------

@app.get("/", tags=["General"])
def root_endpoint():
    """Root endpoint returning API overview and metadata."""
    return {
        "app": "SpendWise API",
        "description": "ML-Based Expense Category Predictor",
        "version": "1.0.0",
        "model_loaded": model_pipeline is not None,
        "docs_url": "/docs"
    }


@app.get("/health", tags=["Health"])
def health_check():
    """Health status endpoint for uptime checks and monitoring."""
    model_ready = model_pipeline is not None
    metrics_ready = os.path.exists(METRICS_PATH)
    
    return {
        "status": "healthy" if model_ready else "degraded",
        "model_loaded": model_ready,
        "metrics_available": metrics_ready,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@app.post("/predict", response_model=PredictResponse, tags=["Prediction"])
def predict_expense(payload: PredictRequest):
    """
    Accepts an expense description and amount, normalizes the text,
    and predicts the expense category along with model-generated probabilities.
    Never fabricates predictions if the model is unavailable.
    """
    global model_pipeline

    # If model is not in memory, attempt reload once
    if model_pipeline is None:
        load_model_safely()

    if model_pipeline is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Trained model is currently unavailable on the server. Please run train_model.py first."
        )

    cleaned_text = payload.description.strip().lower()

    try:
        # Predict class
        predicted_class = model_pipeline.predict([cleaned_text])[0]

        # Extract probability distribution across all classes
        class_labels = model_pipeline.classes_
        proba_values = model_pipeline.predict_proba([cleaned_text])[0]

        probabilities = {
            label: round(float(prob), 4)
            for label, prob in zip(class_labels, proba_values)
        }

        # Sort probabilities descending for clean UI representation
        sorted_probabilities = dict(sorted(probabilities.items(), key=lambda item: item[1], reverse=True))

        top_confidence = round(float(max(proba_values)), 4)

        if top_confidence >= 0.60:
            tier = "high"
        elif top_confidence >= 0.30:
            tier = "moderate"
        else:
            tier = "low"

        return PredictResponse(
            description=payload.description,
            amount=payload.amount,
            predicted_category=str(predicted_class),
            confidence=top_confidence,
            confidence_tier=tier,
            probabilities=sorted_probabilities,
            disclaimer=(
                "Probability represents statistical model certainty based on training vocabulary, "
                "not absolute real-world guarantee."
            ),
            timestamp=datetime.now(timezone.utc).isoformat()
        )

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction inference failed: {str(exc)}"
        )


@app.get("/metrics", tags=["Metrics"])
def get_metrics():
    """Returns genuine test-set evaluation metrics saved during model training."""
    if not os.path.exists(METRICS_PATH):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluation metrics not found. Run 'python train_model.py' to generate metrics."
        )

    try:
        with open(METRICS_PATH, "r", encoding="utf-8") as f:
            metrics_data = json.load(f)
        return metrics_data
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read metrics file: {str(exc)}"
        )


if __name__ == "__main__":
    import uvicorn
    # Local development server entrypoint
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
