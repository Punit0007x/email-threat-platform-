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

# The high-severity template fraud classes. These were trained on synthetic
# template data only (see the model card), so an overfit text-only model can
# confidently assign a *legitimate* email to one of them purely on vocabulary
# overlap (e.g. "Dear", "account", a URL). We therefore gate them with
# independent, non-textual evidence before reporting them as a verdict.
TEMPLATE_THREAT_LABELS = {
    "phishing_credential_harvesting",
    "bec_executive_impersonation",
    "invoice_payment_fraud",
    "extortion_blackmail",
    "malware_delivery",
    "brand_impersonation",
}

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


def _strong_auth(auth_analysis: Dict[str, Any]) -> bool:
    """Independent protocol evidence: SPF/DKIM/DMARC all pass AND From aligned."""
    a = auth_analysis or {}
    return (
        a.get("spf") == "pass"
        and a.get("dkim") == "pass"
        and a.get("dmarc") == "pass"
        and a.get("domain_alignment_pass", False)
    )


def _url_risk(features: Dict[str, Any]) -> bool:
    """Independent URL evidence: genuine untrusted malicious hosting / path / shortener / typosquat."""
    ur = (features or {}).get("url_risks") or {}
    return bool(
        ur.get("has_suspicious_hosting")
        or ur.get("has_suspicious_path")
        or ur.get("has_shortener")
        or ur.get("has_typosquat")
        or ur.get("has_punycode_or_homograph")
    )


def _lookalike(domain_check: Dict[str, Any]) -> bool:
    dc = domain_check or {}
    return bool(dc.get("is_lookalike") or dc.get("is_subdomain_spoof"))


def calibrate(
    model_result: Dict[str, Any],
    auth_analysis: Dict[str, Any] = None,
    domain_check: Dict[str, Any] = None,
    features: Dict[str, Any] = None,
) -> Dict[str, Any]:
    """Apply a transparent, documented calibration to the overfit template model.

    The text-only model can confidently sweep a legitimate email into a template
    fraud class purely on vocabulary overlap. We do NOT modify its probabilities
    (those stay honest). Instead we use an independent gating rule: if the email
    passes strong authentication, From-domain alignment, has no suspicious URL
    signals and the sender domain is not a lookalike, then a high-severity
    template-fraud verdict is NOT reported — a real phishing/BEC email essentially
    never co-occurs with all of those benign signals.

    Returns a dict with the calibrated verdict plus the raw model output so the
    override is fully auditable.
    """
    cls = model_result.get("class_probabilities", {})
    raw_primary = model_result.get("predicted_class", "clean")

    p_legit_raw = cls.get("legitimate", 0.0)

    # Default: trust the model.
    calibrated_primary = raw_primary
    calibrated_threat = raw_primary not in BENIGN_LABELS
    calibration_note = None
    fraud_prob = 1.0 - p_legit_raw

    # Independent benign evidence (only touches template FRAUD classes, not spam).
    if raw_primary in TEMPLATE_THREAT_LABELS:
        benign_evidence = (
            _strong_auth(auth_analysis)
            and not _url_risk(features)
            and not _lookalike(domain_check)
        )
        if benign_evidence:
            calibrated_primary = "clean"
            calibrated_threat = False
            # Trust independent evidence: a fully-authenticated, aligned, clean
            # sender is far more likely legit than the overfit template guess.
            fraud_prob = 0.0
            calibration_note = (
                "Model text-only prediction overridden to 'clean': strong "
                "independent evidence (SPF/DKIM/DMARC PASS, From-domain alignment, "
                "no suspicious URL signals, sender not a lookalike) contradicts the "
                "template-based classification. Raw model prediction was "
                f"'{raw_primary}' (confidence {model_result.get('confidence', 0):.2f})."
            )

    return {
        "primary_threat": calibrated_primary,
        "confidence": model_result["confidence"],
        "predicted_class": calibrated_primary,
        "class_probabilities": cls,
        "model_classes": model_result.get("model_classes", []),
        "is_threat": calibrated_threat,
        "raw_model_prediction": raw_primary,
        "raw_confidence": model_result["confidence"],
        "calibrated_fraud_probability": round(fraud_prob, 4),
        "calibrated_is_legitimate": p_legit_raw if not calibration_note else 1.0,
        "calibration_applied": calibration_note is not None,
        "calibration_note": calibration_note,
        "trained_model_used": True,
        "heuristic_bonus_applied": False,
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

    Returns the model's honest, calibrated output with a transparent independent-
    evidence gate applied (see `calibrate`). No heuristic logit bonuses are applied
    to the model's probabilities — the gating is an auditable decision rule that
    overrides only the reported *verdict* on strong independent evidence.
    """
    result = classify(raw_text or "")
    return calibrate(
        result,
        auth_analysis=auth_analysis,
        domain_check=domain_check,
        features=features,
    )
