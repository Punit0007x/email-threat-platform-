"""
threat_classifier.py
---------------------
Loads the trained model and returns calibrated class probabilities.

This is the direct fix for audit finding #2 (heuristics overriding ML
probabilities arbitrarily). This module does exactly one thing: run the
model and return its real output. It does NOT add +4.5/-3.0-style bonuses,
does NOT special-case keywords here, and does NOT let a regex hit override
the model's prediction. Any additional heuristic signal (URL risk, auth
failures, BEC regex rules) is combined transparently later, in
scoring/fraud_score.py, with fixed documented weights — not silently
folded into "the ML score" where it can't be audited.
"""
import os
import joblib
from scipy.sparse import hstack, csr_matrix
import numpy as np

from app.ml.feature_extractor import features_vector

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "models")

_clf = None
_tfidf = None
_scaler = None


def _load():
    global _clf, _tfidf, _scaler
    if _clf is None:
        _clf = joblib.load(os.path.join(MODEL_DIR, "threat_classifier.joblib"))
        _tfidf = joblib.load(os.path.join(MODEL_DIR, "tfidf_vectorizer.joblib"))
        _scaler = joblib.load(os.path.join(MODEL_DIR, "feature_scaler.joblib"))
    return _clf, _tfidf, _scaler


def classify(text: str) -> dict:
    """Returns the model's real, unmodified calibrated probability distribution."""
    clf, tfidf, scaler = _load()
    X_tfidf = tfidf.transform([text])
    struct = scaler.transform(np.array([features_vector(text)], dtype=float))
    X = hstack([X_tfidf, csr_matrix(struct)])

    proba = clf.predict_proba(X)[0]
    classes = clf.classes_
    dist = {cls: float(p) for cls, p in zip(classes, proba)}
    top_class = max(dist, key=dist.get)
    return {
        "predicted_class": top_class,
        "confidence": dist[top_class],
        "class_probabilities": dist,
    }
