import os
import joblib
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix

MODEL_SAVE_PATH = "app/ml/models/threat_model.joblib"
SPAM_CSV_PATH = "spam.csv"


def load_all_training_samples():
    """Loads the massive synthetic corporate dataset."""
    import json
    dataset_path = os.path.join(os.path.dirname(__file__), "synthetic_dataset.json")
    with open(dataset_path, 'r') as f:
        samples = json.load(f)
    return [tuple(x) for x in samples]

def train_and_evaluate_model():
    """
    Trains a TF-IDF + Calibrated Multi-Class Classifier, evaluates precision/recall/F1,
    and serializes the production model artifact.
    """
    print("=" * 70)
    print("AI/ML THREAT CLASSIFIER: TRAINING & EVALUATION PIPELINE")
    print("=" * 70)

    dataset = load_all_training_samples()
    texts = [item[0] for item in dataset]
    labels = [item[1] for item in dataset]

    # Stratified Train/Test Split (80% Train, 20% Holdout Test Set)
    X_train, X_test, y_train, y_test = train_test_split(
        texts, labels, test_size=0.20, random_state=42, stratify=labels
    )

    print(f"Total Dataset Samples : {len(texts)}")
    print(f"Training Samples      : {len(X_train)}")
    print(f"Holdout Test Samples  : {len(X_test)}")
    print(f"Target Threat Classes : {len(set(labels))}")

    # Build Pipeline: TF-IDF (Unigrams + Bigrams) -> Calibrated Logistic Regression
    from sklearn.ensemble import RandomForestClassifier, VotingClassifier
    
    # Advanced Ensemble Threat Classification Pipeline
    tfidf = TfidfVectorizer(
        ngram_range=(1, 3),
        max_features=10000,
        sublinear_tf=True,
        stop_words='english'
    )
    
    # 1. Calibrated Logistic Regression
    lr = LogisticRegression(
        C=5.0,
        max_iter=1500,
        class_weight='balanced',
        random_state=42
    )
    
    # 2. Random Forest for Non-linear Threat Signatures
    rf = RandomForestClassifier(
        n_estimators=150,
        max_depth=None,
        class_weight='balanced',
        random_state=42
    )
    
    # Combine into a powerful Voting Ensemble
    ensemble = VotingClassifier(
        estimators=[('lr', lr), ('rf', rf)],
        voting='soft' # Soft voting enables probability calibration
    )
    
    pipeline = Pipeline([
        ('tfidf', tfidf),
        ('clf', ensemble)
    ])

    print("\nTraining Scikit-Learn Model...")
    pipeline.fit(X_train, y_train)

    # Evaluate on Holdout Test Set
    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"\n>>> Holdout Test Set Accuracy: {acc * 100:.2f}% <<<\n")

    print("--- DETAILED CLASSIFICATION REPORT (PRECISION / RECALL / F1) ---")
    print(classification_report(y_test, y_pred, zero_division=0))

    # Save Model Artifact
    os.makedirs(os.path.dirname(MODEL_SAVE_PATH), exist_ok=True)
    joblib.dump(pipeline, MODEL_SAVE_PATH)
    print(f"Model successfully saved to: {MODEL_SAVE_PATH}")

    # Extract Top Informative N-grams per Class (For Explainability)
    vectorizer = pipeline.named_steps['tfidf']
    classifier = pipeline.named_steps['clf'].named_estimators_['lr']
    feature_names = np.array(vectorizer.get_feature_names_out())

    print("\n" + "=" * 70)
    print("EXPLAINABILITY: TOP INFORMATIVE N-GRAMS PER THREAT CLASS")
    print("=" * 70)
    for i, class_label in enumerate(pipeline.classes_):
        top10 = np.argsort(classifier.coef_[i])[-5:]
        top_features = feature_names[top10]
        print(f"[{class_label.upper()}]")
        print(f"  Top Predictive Features: {', '.join(top_features)}")

    return pipeline

if __name__ == "__main__":
    train_and_evaluate_model()
