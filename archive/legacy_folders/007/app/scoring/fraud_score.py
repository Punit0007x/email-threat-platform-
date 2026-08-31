"""
fraud_score.py
---------------
Produces a single 0-100 risk score AND a full breakdown of exactly how it
was computed. This directly fixes audit findings #2 and #3: instead of raw
ML logits being bombarded with hardcoded +4.5/-3.0 arithmetic based on regex
hits (which discards what the model learned), this module:

  1. Keeps the ML classification's output completely separate and unmodified
     (see ml/threat_classifier.py — nothing here changes it).
  2. Defines a small number of independent, named risk components with FIXED,
     DOCUMENTED weights (below). Nothing here is tuned ad hoc per-email.
  3. Combines them with simple weighted addition, capped at 100, and returns
     the full breakdown so every point of the score is explainable to a judge
     or a SOC analyst — "why did this get flagged" always has a real answer.

WEIGHTS (edit here, not scattered through the codebase, if you need to tune):
"""
WEIGHTS = {
    "ml_fraud_probability": 40,   # 1 - P(legitimate), scaled
    "auth_hard_fail": 20,          # any of SPF/DKIM/DMARC hard-fails
    "url_risk": 25,                 # max URL risk score / 100, scaled
    "lookalike_domain": 10,        # sender domain typosquat
    "reply_to_mismatch": 5,         # Reply-To silently different from From
}

RISK_BANDS = [
    (80, "critical"),
    (60, "high"),
    (35, "medium"),
    (15, "low"),
    (0, "minimal"),
]


def risk_band(score: float) -> str:
    for threshold, label in RISK_BANDS:
        if score >= threshold:
            return label
    return "minimal"


def compute_score(ml_result: dict, auth_result: dict, url_result: dict,
                   domain_result: dict, reply_to_result: dict) -> dict:
    components = {}

    p_legit = ml_result.get("class_probabilities", {}).get("legitimate", 0.0)
    fraud_prob = 1.0 - p_legit
    components["ml_fraud_probability"] = {
        "raw_value": round(fraud_prob, 4),
        "weight": WEIGHTS["ml_fraud_probability"],
        "contribution": round(fraud_prob * WEIGHTS["ml_fraud_probability"], 2),
        "explanation": (
            f"Model's calibrated probability the email is NOT legitimate. "
            f"Top predicted class: {ml_result.get('predicted_class')} "
            f"(confidence {ml_result.get('confidence', 0):.2f})"
        ),
    }

    auth_fail = bool(auth_result.get("any_hard_fail"))
    components["auth_hard_fail"] = {
        "raw_value": auth_fail,
        "weight": WEIGHTS["auth_hard_fail"],
        "contribution": WEIGHTS["auth_hard_fail"] if auth_fail else 0,
        "explanation": f"SPF/DKIM/DMARC failed checks: {auth_result.get('failed_checks')}",
    }

    url_risk_norm = (url_result.get("max_url_risk", 0) or 0) / 100.0
    components["url_risk"] = {
        "raw_value": url_result.get("max_url_risk", 0),
        "weight": WEIGHTS["url_risk"],
        "contribution": round(url_risk_norm * WEIGHTS["url_risk"], 2),
        "explanation": f"Highest-risk URL found: {url_result.get('url_findings', [{}])[0] if url_result.get('url_findings') else 'none'}",
    }

    is_lookalike = bool(domain_result.get("is_lookalike"))
    components["lookalike_domain"] = {
        "raw_value": is_lookalike,
        "weight": WEIGHTS["lookalike_domain"],
        "contribution": WEIGHTS["lookalike_domain"] if is_lookalike else 0,
        "explanation": f"Sender domain '{domain_result.get('domain')}' resembles '{domain_result.get('closest_brand')}'"
                       if is_lookalike else "Sender domain does not resemble a protected brand",
    }

    mismatch = bool(reply_to_result.get("reply_to_mismatch"))
    components["reply_to_mismatch"] = {
        "raw_value": mismatch,
        "weight": WEIGHTS["reply_to_mismatch"],
        "contribution": WEIGHTS["reply_to_mismatch"] if mismatch else 0,
        "explanation": "Reply-To domain differs from From domain" if mismatch else "Reply-To matches From domain",
    }

    total = sum(c["contribution"] for c in components.values())
    total = min(round(total, 2), 100)

    return {
        "risk_score": total,
        "risk_band": risk_band(total),
        "components": components,
        "weights_used": WEIGHTS,
    }
