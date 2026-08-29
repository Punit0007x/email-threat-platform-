"""
threat_classifier.py
---------------------
Loads the trained unified threat classifier (LinearSVC + CalibratedClassifierCV)
and returns its real, unmodified calibrated class probabilities.

This is the direct fix for audit findings #2 and #3:
  - NO post-hoc +4.5/-3.0 logit bonuses. The model's output is returned as-is.
  - NO separate conflicting SMS spam model — "spam" is one of the classes in the
    single unified model, so there is exactly one source of truth for the label.
  - Structural/lexical signals are TRAINING FEATURES the model learned weights for
    (see feature_extractor.py), not runtime arithmetic grafted on top of logits.

Any additional, genuinely separate signal (URL risk, auth hard-fails, lookalike
domain, Reply-To mismatch) is combined transparently, with fixed documented
weights, in scoring/fraud_score.py — never silently blended into "the ML score".
"""

import os
import joblib
import numpy as np
from scipy.sparse import hstack, csr_matrix
from typing import Dict, Any

from app.ml.feature_extractor import features_vector

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "models")

# Map the unified model's class labels to the platform's existing display labels.
MODEL_TO_PLATFORM_LABEL = {
    "legitimate": "clean",
    "spam": "spam",
    "credential_harvesting": "phishing_credential_harvesting",
    "bec_ceo_fraud": "bec_executive_impersonation",
    "invoice_fraud": "invoice_payment_fraud",
    "extortion": "extortion_blackmail",
    "malware_delivery": "malware_delivery",
}

PLATFORM_TO_MODEL_LABEL = {v: k for k, v in MODEL_TO_PLATFORM_LABEL.items()}

# Platform labels considered benign / non-actionable.
BENIGN_LABELS = {"clean", "legitimate"}

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


def classify(text: str) -> Dict[str, Any]:
    """Returns the model's real, unmodified calibrated probability distribution.

    Keys: predicted_class (platform label), confidence, class_probabilities
    (mapped to platform labels), model_classes (raw model class names).

    This is the 007-clean path: exactly the model's output, nothing added.
    """
    clf, tfidf, scaler = _load()
    X_tfidf = tfidf.transform([text or ""])
    struct = scaler.transform(np.array([features_vector(text or "")], dtype=float))
    X = hstack([X_tfidf, csr_matrix(struct)])

    proba = clf.predict_proba(X)[0]
    raw_classes = [str(c) for c in clf.classes_]
    dist = {
        MODEL_TO_PLATFORM_LABEL.get(c, c): float(p)
        for c, p in zip(raw_classes, proba)
    }
    top_class = max(dist, key=dist.get)
    return {
        "predicted_class": top_class,
        "confidence": dist[top_class],
        "class_probabilities": dist,
        "model_classes": raw_classes,
    }


def classify_email_threat(
    features: Dict[str, Any] = None,
    domain_check: Dict[str, Any] = None,
    auth_analysis: Dict[str, Any] = None,
    bec_analysis: Dict[str, Any] = None,
    raw_text: str = "",
    **kwargs
) -> Dict[str, Any]:
    """Compatibility wrapper retained for the AI/ML pipeline.

    Unlike the legacy implementation this does NOT apply any heuristic logit
    bonuses — it returns the calibrated model's honest output. `raw_text` is the
    only input that affects the prediction; the other args are accepted for
    signature compatibility and surfaced unchanged in the output.
    """
    result = classify(raw_text or "")

    primary_threat = result["predicted_class"]
    is_threat = primary_threat not in BENIGN_LABELS

    return {
        "primary_threat": primary_threat,
        "confidence": result["confidence"],
        "predicted_class": result["predicted_class"],
        "class_probabilities": result["class_probabilities"],
        "model_classes": result["model_classes"],
        "is_threat": is_threat,
        "trained_model_used": True,
        "heuristic_bonus_applied": False,
    }
