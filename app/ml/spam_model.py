import os
import joblib

MODEL_SAVE_PATH = "app/ml/models/spam_model.joblib"
_SPAM_MODEL = None

def get_spam_model():
    global _SPAM_MODEL
    if _SPAM_MODEL is not None:
        return _SPAM_MODEL
        
    if os.path.exists(MODEL_SAVE_PATH):
        try:
            _SPAM_MODEL = joblib.load(MODEL_SAVE_PATH)
            return _SPAM_MODEL
        except Exception:
            pass
            
    # If missing, try to train it
    from app.ml.train_spam_model import train_and_evaluate_spam_model
    _SPAM_MODEL = train_and_evaluate_spam_model()
    return _SPAM_MODEL

def predict_spam(text: str) -> dict:
    """
    Predicts if the text is spam or ham using the isolated Naive Bayes spam model.
    """
    if not text or len(text.strip()) == 0:
        return {"prediction": "ham", "confidence": 1.0}
        
    model = get_spam_model()
    probs = model.predict_proba([text])[0]
    
    classes = model.classes_
    prob_dict = {cls: float(p) for cls, p in zip(classes, probs)}
    
    prediction = "spam" if prob_dict.get("spam", 0) > 0.5 else "ham"
    
    return {
        "prediction": prediction,
        "is_spam": prediction == "spam",
        "confidence": prob_dict.get(prediction, 0.0),
        "spam_probability": prob_dict.get("spam", 0.0)
    }
