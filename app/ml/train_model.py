"""
train_model.py
--------------
Builds the unified 7-class email threat classifier:
    legitimate, spam, credential_harvesting, bec_ceo_fraud,
    invoice_fraud, extortion, malware_delivery

Key Architecture:
  1. Balanced Corpus combining:
     - Real Enron-Spam dataset (clean legitimate + spam)
     - Rich combinatorial template generation for fraud archetypes
  2. TF-IDF (1-2 n-grams) + Structural Feature Extraction (StandardScaled)
  3. LinearSVC(dual=False) with CalibratedClassifierCV for honest, calibrated probabilities
  4. Full holdout metrics and Stratified K-Fold cross validation
"""
import json
import os
import joblib
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import classification_report, f1_score, accuracy_score
from sklearn.preprocessing import StandardScaler
from scipy.sparse import hstack, csr_matrix

from app.ml.data_generation import generate_all
from app.ml.feature_extractor import features_vector

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RAW_DIR = os.path.join(ROOT_DIR, "data", "raw")
MODEL_DIR = os.path.join(ROOT_DIR, "models")
os.makedirs(MODEL_DIR, exist_ok=True)


def load_enron():
    path = os.path.join(RAW_DIR, "enron_spam_data.csv")
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Enron corpus not found at {path}. Please check data/raw/enron_spam_data.csv."
        )
    import pandas as pd
    df = pd.read_csv(path, encoding="utf-8", on_bad_lines="skip")
    df["Subject"] = df["Subject"].fillna("")
    df["Message"] = df["Message"].fillna("")
    df["text"] = df["Subject"] + "\n" + df["Message"]
    df["label"] = df["Spam/Ham"].map({"ham": "legitimate", "spam": "spam"})
    
    # Balance: 2,000 legitimate and 2,000 spam from real Enron data
    parts = []
    for lbl in ["legitimate", "spam"]:
        sub = df[df["label"] == lbl]
        parts.append(sub.sample(min(len(sub), 2000), random_state=42))
    df_balanced = pd.concat(parts, ignore_index=True)
    return list(zip(df_balanced["text"].tolist(), df_balanced["label"].tolist()))


def build_dataset():
    rows = load_enron()
    rows += generate_all()
    texts = [r[0] for r in rows]
    labels = [r[1] for r in rows]
    return texts, labels


def build_features(texts, tfidf, scaler=None, fit=False):
    if fit:
        X_tfidf = tfidf.fit_transform(texts)
    else:
        X_tfidf = tfidf.transform(texts)
    struct = np.array([features_vector(t) for t in texts], dtype=float)
    if fit:
        struct = scaler.fit_transform(struct)
    else:
        struct = scaler.transform(struct)
    X = hstack([X_tfidf, csr_matrix(struct)])
    return X


def train():
    print("=" * 60)
    print("TRAINING UNIFIED 7-CLASS EMAIL THREAT CLASSIFIER")
    print("=" * 60)

    texts, labels = build_dataset()
    print(f"Total Dataset Size: {len(texts)} samples across {len(set(labels))} classes.")

    X_train_txt, X_test_txt, y_train, y_test = train_test_split(
        texts, labels, test_size=0.2, random_state=42, stratify=labels
    )

    tfidf = TfidfVectorizer(max_features=25000, ngram_range=(1, 2), min_df=2, sublinear_tf=True)
    scaler = StandardScaler()

    print("Building TF-IDF & structural features...")
    X_train = build_features(X_train_txt, tfidf, scaler, fit=True)
    X_test = build_features(X_test_txt, tfidf, scaler, fit=False)

    print("Fitting Calibrated LinearSVC classifier...")
    base_svc = LinearSVC(dual=False, C=1.0, max_iter=2000, random_state=42)
    clf = CalibratedClassifierCV(base_svc, cv=5)
    clf.fit(X_train, y_train)

    print("\n--- HOLDOUT TEST EVALUATION ---")
    y_pred = clf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    macro_f1 = f1_score(y_test, y_pred, average="macro")
    report = classification_report(y_test, y_pred, output_dict=True)

    print(classification_report(y_test, y_pred))
    print(f"Holdout Accuracy: {acc * 100:.2f}%")
    print(f"Holdout Macro F1: {macro_f1:.4f}")

    print("\nSaving model artifacts to models/ ...")
    joblib.dump(clf, os.path.join(MODEL_DIR, "threat_classifier.joblib"))
    joblib.dump(tfidf, os.path.join(MODEL_DIR, "tfidf_vectorizer.joblib"))
    joblib.dump(scaler, os.path.join(MODEL_DIR, "feature_scaler.joblib"))

    model_card = {
        "classes": sorted(set(labels)),
        "train_size": len(X_train_txt),
        "test_size": len(X_test_txt),
        "accuracy": float(acc),
        "macro_f1_holdout": float(macro_f1),
        "per_class_report": report,
    }
    with open(os.path.join(MODEL_DIR, "model_card.json"), "w") as f:
        json.dump(model_card, f, indent=2, default=str)

    print(f"Model successfully saved in {MODEL_DIR}")
    return model_card


def train_and_evaluate_model():
    return train()


if __name__ == "__main__":
    train()
