import numpy as np

THREAT_CATEGORIES = [
    "clean",
    "phishing_credential_harvesting",
    "bec_executive_impersonation",
    "invoice_payment_fraud",
    "extortion_blackmail",
    "malware_delivery",
    "brand_impersonation"
]

ml_probs = {
    "bec_executive_impersonation": 0.1479,
    "brand_impersonation": 0.0752,
    "clean": 0.4223,
    "extortion_blackmail": 0.0599,
    "invoice_payment_fraud": 0.0611,
    "malware_delivery": 0.0494,
    "phishing_credential_harvesting": 0.1843
}

logits = {cat: np.log(max(ml_probs.get(cat, 0.05), 1e-4)) for cat in THREAT_CATEGORIES}

print("Logits:")
for cat in THREAT_CATEGORIES:
    print(f"{cat}: {logits[cat]}")

e_x = np.exp(list(logits.values()) - np.max(list(logits.values())))
probs = e_x / e_x.sum(axis=0)

prob_dict = {cat: round(float(probs[i]), 4) for i, cat in enumerate(THREAT_CATEGORIES)}
print("\nFinal Probabilities:")
for cat, p in prob_dict.items():
    print(f"{cat}: {p}")

