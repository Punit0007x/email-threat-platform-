"""
train_model.py
---------------
Builds the 7-class threat classifier:
    legitimate, spam, credential_harvesting, bec_ceo_fraud,
    invoice_fraud, extortion, malware_delivery

Data sources (documented honestly, on purpose):
  - legitimate / spam  -> REAL Enron-Spam corpus (33,716 real emails)
  - the 5 fraud archetypes -> template-augmented data (see data_generation.py),
    because no real, license-clean, multi-class fraud corpus was reachable
    from this environment. This is disclosed in the model card written
    alongside the trained model, not hidden.

Design choices that fix the audit's root causes:
  1. NO post-hoc logit bonuses. All signals (TF-IDF text + structural features)
     go into the model as real training features, not after-the-fact score
     hacks in a separate classifier module.
  2. Proper stratified train/test split + k-fold CV reported honestly.
  3. Calibrated probabilities (CalibratedClassifierCV) so the output can be
     trusted as a probability, not just a rank.
  4. A single unified model instead of two disconnected/conflicting ones
     (the old spam_model.py trained on SMS text is retired entirely).
"""
import json
import os
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import classification_report, f1_score
from sklearn.preprocessing import StandardScaler
from scipy.sparse import hstack, csr_matrix

import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ml.data_generation import generate_all
from ml.feature_extractor import features_vector

RAW_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "raw")
MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "models")
os.makedirs(MODEL_DIR, exist_ok=True)


def load_enron():
    path = os.path.join(RAW_DIR, "enron_spam_data.csv")
    df = pd.read_csv(path, encoding="utf-8", on_bad_lines="skip")
    df["Subject"] = df["Subject"].fillna("")
    df["Message"] = df["Message"].fillna("")
    df["text"] = df["Subject"] + "\n" + df["Message"]
    df["label"] = df["Spam/Ham"].map({"ham": "legitimate", "spam": "spam"})
    # Cap volume per class for balance / training speed
    parts = []
    for lbl in df["label"].unique():
        sub = df[df["label"] == lbl]
        parts.append(sub.sample(min(len(sub), 3000), random_state=42))
    df = pd.concat(parts, ignore_index=True)
    return list(zip(df["text"].tolist(), df["label"].tolist()))


def build_dataset():
    rows = load_enron()
    rows += generate_all()
    texts = [r[0] for r in rows]
    labels = [r[1] for r in rows]
    return texts, labels


def build_features(texts, tfidf: TfidfVectorizer, scaler: StandardScaler = None, fit=False):
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
    texts, labels = build_dataset()
    X_train_txt, X_test_txt, y_train, y_test = train_test_split(
        texts, labels, test_size=0.2, random_state=42, stratify=labels
    )

    tfidf = TfidfVectorizer(max_features=20000, ngram_range=(1, 2), min_df=2, sublinear_tf=True)
    scaler = StandardScaler()

    X_train = build_features(X_train_txt, tfidf, scaler, fit=True)
    X_test = build_features(X_test_txt, tfidf, scaler, fit=False)

    base = LinearSVC(class_weight="balanced", max_iter=5000)
    clf = CalibratedClassifierCV(base, cv=5)
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    report = classification_report(y_test, y_pred, output_dict=True)
    macro_f1 = f1_score(y_test, y_pred, average="macro")

    print(classification_report(y_test, y_pred))
    print(f"Macro F1: {macro_f1:.4f}")

    # Cross-validated score on the training split for an additional honest check
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(CalibratedClassifierCV(LinearSVC(class_weight="balanced", max_iter=5000), cv=3),
                                 X_train, y_train, cv=skf, scoring="f1_macro", n_jobs=-1)
    print(f"5-fold CV macro F1 (train split): {cv_scores.mean():.4f} +/- {cv_scores.std():.4f}")

    joblib.dump(clf, os.path.join(MODEL_DIR, "threat_classifier.joblib"))
    joblib.dump(tfidf, os.path.join(MODEL_DIR, "tfidf_vectorizer.joblib"))
    joblib.dump(scaler, os.path.join(MODEL_DIR, "feature_scaler.joblib"))

    model_card = {
        "classes": sorted(set(labels)),
        "train_size": len(X_train_txt),
        "test_size": len(X_test_txt),
        "macro_f1_holdout": macro_f1,
        "cv_macro_f1_mean": float(cv_scores.mean()),
        "cv_macro_f1_std": float(cv_scores.std()),
        "per_class_report": report,
        "data_sources": {
            "legitimate": "Real Enron-Spam corpus (ham)",
            "spam": "Real Enron-Spam corpus (spam)",
            "credential_harvesting": "Template-augmented synthetic data (see data_generation.py)",
            "bec_ceo_fraud": "Template-augmented synthetic data (see data_generation.py)",
            "invoice_fraud": "Template-augmented synthetic data (see data_generation.py)",
            "extortion": "Template-augmented synthetic data (see data_generation.py)",
            "malware_delivery": "Template-augmented synthetic data (see data_generation.py)",
        },
        "honesty_note": (
            "Two of seven classes are trained on real labeled email data. "
            "The five fraud archetype classes are trained on combinatorially-"
            "varied template data because no real multi-class fraud corpus was "
            "reachable from the build environment. Replace with real incident "
            "data as it is collected."
        ),
    }
    with open(os.path.join(MODEL_DIR, "model_card.json"), "w") as f:
        json.dump(model_card, f, indent=2, default=str)

    return model_card


if __name__ == "__main__":
    train()
