import os
import joblib
import pandas as pd
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

MODEL_SAVE_PATH = "app/ml/models/spam_model.joblib"
SPAM_CSV_PATH = "email_fraud/spam.csv"

def train_and_evaluate_spam_model():
    print("=" * 70)
    print("TRAINING MULTINOMIAL NAIVE BAYES SPAM MODEL")
    print("=" * 70)
    
    # Load dataset
    df = pd.read_csv(SPAM_CSV_PATH, encoding='latin-1')
    # Use only 'v1' and 'v2'
    df = df[['v1', 'v2']].dropna()
    df.columns = ['label', 'text']
    
    # Check if empty
    if df.empty:
        print("Dataset is empty.")
        return None
        
    X = df['text']
    y = df['label'] # 'spam' or 'ham'
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42)
    
    pipeline = Pipeline([
        ('vectorizer', CountVectorizer()),
        ('classifier', MultinomialNB())
    ])
    
    pipeline.fit(X_train, y_train)
    
    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"Accuracy: {acc * 100:.2f}%")
    print(classification_report(y_test, y_pred))
    
    os.makedirs(os.path.dirname(MODEL_SAVE_PATH), exist_ok=True)
    joblib.dump(pipeline, MODEL_SAVE_PATH)
    print(f"Spam Model successfully saved to: {MODEL_SAVE_PATH}")
    
    return pipeline

if __name__ == "__main__":
    train_and_evaluate_spam_model()
