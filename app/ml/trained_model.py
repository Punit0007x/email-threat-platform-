import os
import joblib
import numpy as np
from typing import Dict, Any, List, Tuple
from app.ml.train_model import MODEL_SAVE_PATH, train_and_evaluate_model

_LOADED_MODEL = None

def get_trained_model():
    """Singleton loader for the trained Scikit-Learn TF-IDF pipeline."""
    global _LOADED_MODEL
    if _LOADED_MODEL is not None:
        return _LOADED_MODEL
        
    if os.path.exists(MODEL_SAVE_PATH):
        try:
            _LOADED_MODEL = joblib.load(MODEL_SAVE_PATH)
            return _LOADED_MODEL
        except Exception:
            pass
            
    # Auto-train if model artifact is missing or corrupted
    _LOADED_MODEL = train_and_evaluate_model()
    return _LOADED_MODEL

def predict_ml_probabilities(text: str) -> Dict[str, float]:
    """
    Passes raw email text through the trained TF-IDF + Calibrated Logistic Regression pipeline
    to output normalized class probabilities across all 7 threat categories.
    """
    model = get_trained_model()
    if not text or len(text.strip()) == 0:
        return {cls: 1.0 / len(model.classes_) for cls in model.classes_}
        
    probs = model.predict_proba([text])[0]
    return {cls: round(float(probs[i]), 4) for i, cls in enumerate(model.classes_)}

def extract_top_predictive_tokens(text: str, predicted_class: str, top_n: int = 4) -> List[str]:
    """
    Identifies the top explainable TF-IDF n-grams in the email that contributed to the model's prediction.
    """
    try:
        model = get_trained_model()
        vectorizer = model.named_steps['tfidf']
        classifier = model.named_steps['clf']
        
        if predicted_class not in classifier.classes_:
            return []
            
        class_idx = list(classifier.classes_).index(predicted_class)
        class_weights = classifier.coef_[class_idx]
        
        # Transform input text
        feature_names = np.array(vectorizer.get_feature_names_out())
        x_vec = vectorizer.transform([text]).toarray()[0]
        
        # Multiply TF-IDF weights by classifier weights
        token_scores = x_vec * class_weights
        active_indices = np.where(token_scores > 0)[0]
        
        if len(active_indices) == 0:
            return []
            
        sorted_active = active_indices[np.argsort(token_scores[active_indices])[::-1]]
        top_tokens = feature_names[sorted_active][:top_n]
        return list(top_tokens)
    except Exception:
        return []
