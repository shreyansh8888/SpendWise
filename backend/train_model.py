"""
SpendWise - Model Training Script
=================================
Trains a text classification pipeline (TF-IDF Vectorizer + Logistic Regression)
on expense descriptions to predict 8 spending categories.

Saves:
  - backend/model.pkl: Serialized scikit-learn pipeline
  - backend/metrics.json: Genuine test-set evaluation metrics & confusion matrix
"""

import os
import json
from datetime import datetime, timezone
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    confusion_matrix,
    classification_report
)
import joblib

# Fixed random state for reproducibility
RANDOM_SEED = 42

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "expenses.csv")
MODEL_OUTPUT_PATH = os.path.join(BASE_DIR, "model.pkl")
METRICS_OUTPUT_PATH = os.path.join(BASE_DIR, "metrics.json")


def clean_text(text: str) -> str:
    """Basic text normalization: lowercase, strip whitespace."""
    if not isinstance(text, str):
        return ""
    return text.strip().lower()


def train_and_evaluate():
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Starting SpendWise Model Training...")

    # 1. Load dataset
    if not os.path.exists(DATASET_PATH):
        raise FileNotFoundError(f"Dataset not found at {DATASET_PATH}")

    df = pd.read_csv(DATASET_PATH)
    print(f"Loaded {len(df)} initial records from {DATASET_PATH}")

    # 2. Dataset validation and cleaning
    # Ensure required columns exist
    if "description" not in df.columns or "category" not in df.columns:
        raise ValueError("Dataset must contain 'description' and 'category' columns.")

    # Drop nulls and empty strings
    df["description"] = df["description"].fillna("").astype(str)
    df["category"] = df["category"].fillna("").astype(str).str.strip()

    df["description_clean"] = df["description"].apply(clean_text)
    df = df[df["description_clean"] != ""]
    df = df[df["category"] != ""]

    # Remove exact duplicate text to prevent train/test leakage
    df = df.drop_duplicates(subset=["description_clean"]).reset_index(drop=True)
    total_valid = len(df)
    print(f"Valid distinct records after cleaning: {total_valid}")

    # Inspect class distribution
    class_counts = df["category"].value_counts()
    print("Class distribution:")
    for cat, count in class_counts.items():
        print(f"  - {cat}: {count}")

    X = df["description_clean"].values
    y = df["category"].values

    # 3. Stratified Train-Test Split (80% train, 20% test)
    # Stratification ensures all categories are equally represented in train and test splits
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=RANDOM_SEED,
        stratify=y
    )

    print(f"Training samples: {len(X_train)}, Testing samples: {len(X_test)}")

    # 4. Pipeline Construction
    # TfidfVectorizer converts text into numerical n-gram token weights.
    # LogisticRegression is a linear classifier with soft max probabilities, ideal for fast,
    # high-precision sparse text classification.
    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(
            ngram_range=(1, 2),        # Capture unigrams and bigrams
            max_df=0.95,               # Ignore terms appearing in >95% docs
            min_df=1,                  # Include terms appearing at least once
            sublinear_tf=True          # Apply sublinear scaling: 1 + log(tf)
        )),
        ("classifier", LogisticRegression(
            C=1.5,
            max_iter=1000,
            random_state=RANDOM_SEED,
            solver="lbfgs"
        ))
    ])

    # 5. Model Training (Only on train data to prevent data leakage)
    print("Fitting TF-IDF + LogisticRegression pipeline on training data...")
    pipeline.fit(X_train, y_train)

    # 6. Evaluation on held-out test data
    y_pred = pipeline.predict(X_test)
    labels = sorted(list(np.unique(y)))

    accuracy = float(accuracy_score(y_test, y_pred))
    prec_macro, rec_macro, f1_macro, _ = precision_recall_fscore_support(
        y_test, y_pred, average="macro", zero_division=0
    )
    prec_weighted, rec_weighted, f1_weighted, _ = precision_recall_fscore_support(
        y_test, y_pred, average="weighted", zero_division=0
    )

    cm = confusion_matrix(y_test, y_pred, labels=labels)
    cr_dict = classification_report(y_test, y_pred, labels=labels, output_dict=True, zero_division=0)

    print("\n================ TEST SET EVALUATION ================")
    print(f"Accuracy:          {accuracy:.4f} ({accuracy * 100:.2f}%)")
    print(f"Macro Precision:   {prec_macro:.4f}")
    print(f"Macro Recall:      {rec_macro:.4f}")
    print(f"Macro F1-Score:    {f1_macro:.4f}")
    print(f"Weighted F1-Score: {f1_weighted:.4f}")
    print("=====================================================\n")

    # 7. Save model pipeline
    joblib.dump(pipeline, MODEL_OUTPUT_PATH)
    print(f"Trained model pipeline saved to: {MODEL_OUTPUT_PATH}")

    # 8. Save metrics to JSON
    # Structure metrics clearly for API consumption and Viva display
    metrics_data = {
        "model_name": "TF-IDF + Logistic Regression Expense Classifier",
        "random_seed": RANDOM_SEED,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "total_samples": int(total_valid),
        "train_samples": int(len(X_train)),
        "test_samples": int(len(X_test)),
        "classes": labels,
        "accuracy": round(accuracy, 4),
        "precision_macro": round(float(prec_macro), 4),
        "recall_macro": round(float(rec_macro), 4),
        "f1_macro": round(float(f1_macro), 4),
        "precision_weighted": round(float(prec_weighted), 4),
        "recall_weighted": round(float(rec_weighted), 4),
        "f1_weighted": round(float(f1_weighted), 4),
        "confusion_matrix": cm.tolist(),
        "per_class_metrics": {
            cat: {
                "precision": round(cr_dict[cat]["precision"], 4),
                "recall": round(cr_dict[cat]["recall"], 4),
                "f1_score": round(cr_dict[cat]["f1-score"], 4),
                "support": int(cr_dict[cat]["support"])
            }
            for cat in labels if cat in cr_dict
        },
        "dataset_note": (
            "The training dataset (expenses.csv) is a curated, self-created dataset of realistic "
            "Indian and global everyday expense entries across 8 categories. "
            "Limitation: Like all n-gram models, accuracy may degrade on completely novel slang, "
            "non-English native script, or ambiguous 1-word inputs without merchant context."
        )
    }

    with open(METRICS_OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics_data, f, indent=2)

    print(f"Evaluation metrics saved to: {METRICS_OUTPUT_PATH}")
    print("Training and evaluation completed successfully!")


if __name__ == "__main__":
    train_and_evaluate()
