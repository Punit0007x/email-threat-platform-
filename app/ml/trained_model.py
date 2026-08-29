"""
trained_model.py
----------------
Thin access layer over the unified trained threat classifier artifacts
(threat_classifier.joblib / tfidf_vectorizer.joblib / feature_scaler.joblib).
Kept for API compatibility with callers that expect TF-IDF probability helpers.
"""
import os
import joblib
import numpy as np
from scipy.sparse import hstack, csr_matrix
from typing import Dict, Any, List

from app.ml.feature_extractor import features_vector

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "models")

_LOADED = None


def get_trained_model():
    """Singleton loader for the unified (clf, tfidf, scaler) artifacts."""
    global _LOADED
    if _LOADED is not None:
        return _LOADED
    _LOADED = {
        "clf": joblib.load(os.path.join(MODEL_DIR, "threat_classifier.joblib")),
        "tfidf": joblib.load(os.path.join(MODEL_DIR, "tfidf_vectorizer.joblib")),
        "scaler": joblib.load(os.path.join(MODEL_DIR, "feature_scaler.joblib")),
    }
    return _LOADED


def predict_ml_probabilities(text: str) -> Dict[str, float]:
    """Passes raw email text through the calibrated unified model and returns
    normalized class probabilities across all threat categories."""
    m = get_trained_model()
    clf, tfidf, scaler = m["clf"], m["tfidf"], m["scaler"]
    if not text or len(text.strip()) == 0:
        return {str(c): 1.0 / len(clf.classes_) for c in clf.classes_}
    X_tfidf = tfidf.transform([text])
    struct = scaler.transform(np.array([features_vector(text)], dtype=float))
    X = hstack([X_tfidf, csr_matrix(struct)])
    probs = clf.predict_proba(X)[0]
    return {str(c): round(float(probs[i]), 4) for i, c in enumerate(clf.classes_)}


def extract_top_predictive_tokens(text: str, predicted_class: str, top_n: int = 4) -> List[str]:
    """Identifies the top TF-IDF n-grams that contributed most to a prediction.

    LinearSVC exposes per-class coefficient vectors over the TF-IDF feature space,
    so contribution is approximated as TF-IDF weight * class coefficient.
    """
    try:
        m = get_trained_model()
        clf, tfidf = m["clf"], m["tfidf"]
        if predicted_class not in clf.named_steps_kind:
            pass
        linear = _linear_svc(clf)
        if linear is None or predicted_class not in linear.classes_:
            return []
        class_idx = list(linear.classes_).index(predicted_class)
        class_coef = linear.coef_[class_idx]
        feature_names = np.array(tfidf.get_feature_names_out())
        x_vec = tfidf.transform([text or ""]).toarray()[0]
        token_scores = x_vec * class_coef
        active_indices = np.where(token_scores > 0)[0]
        if len(active_indices) == 0:
            return []
        sorted_active = active_indices[np.argsort(token_scores[active_indices])[::-1]]
        return list(feature_names[sorted_active][:top_n])
    except Exception:
        return []


def _linear_svc(clf):
    """Unwrap the calibrated estimator to reach the underlying LinearSVC."""
    try:
        # CalibratedClassifierCV stores estimators in calib_estimators (>=1.3)
        est = getattr(clf, "calib_estimators_", None)
        if est is not None and len(est):
            return est[0].estimator
    except Exception:
        pass
    return None
