import re
import numpy as np
from typing import Dict, Any, List

LLM_TEMPLATE_PHRASES = [
    r"\bi hope this email finds you well\b",
    r"\bwe appreciate your prompt attention to this matter\b",
    r"\bin order to ensure uninterrupted access\b",
    r"\bas part of our (ongoing|continuous) commitment to (security|excellence)\b",
    r"\bplease do not hesitate to (reach out|contact us)\b",
    r"\brest assured that (your security|our team)\b",
    r"\bwe value your partnership and understanding\b",
    r"\bkindly find the attached\b",
    r"\btake the necessary steps to rectify\b",
    r"\bthank you for your cooperation and understanding\b"
]

def calculate_burstiness(sentences: List[str]) -> float:
    """Calculates variation in sentence length (burstiness). LLMs often have low burstiness."""
    if len(sentences) <= 1:
        return 0.5
    lengths = [len(s.split()) for s in sentences if s.strip()]
    if not lengths:
        return 0.5
    std_dev = float(np.std(lengths))
    mean = float(np.mean(lengths)) if np.mean(lengths) > 0 else 1.0
    # Coefficient of variation (lower value = more uniform/synthetic)
    cv = std_dev / mean
    return round(cv, 3)

def detect_synthetic_content(text: str) -> Dict[str, Any]:
    """
    Evaluates whether email text exhibits statistical and phrasing hallmarks of AI/LLM-generated phishing.
    """
    if not text or len(text.strip()) < 50:
        return {
            "synthetic_score": 0,
            "is_likely_synthetic": False,
            "confidence": "Low",
            "detected_llm_phrases": [],
            "burstiness_index": 0.0,
            "details": "Text too short for reliable synthetic text analysis."
        }
        
    text_lower = text.lower()
    
    # 1. Match formulaic LLM phrases
    matched_phrases = []
    for pat in LLM_TEMPLATE_PHRASES:
        if re.search(pat, text_lower):
            matched_phrases.append(pat.replace(r"\b", ""))
            
    # 2. Sentence burstiness analysis
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 3]
    burstiness = calculate_burstiness(sentences)
    
    # 3. Calculate synthetic probability score
    score = 0
    # Formulaic phrases contribution
    score += min(len(matched_phrases) * 20, 50)
    
    # Low sentence variance (uniform sentence structure typical of synthetic text)
    if burstiness < 0.35 and len(sentences) >= 3:
        score += 25
    elif burstiness < 0.50 and len(sentences) >= 3:
        score += 15
        
    # Vocabulary repetition check (Type-Token Ratio)
    words = [w.lower() for w in re.findall(r'\b\w+\b', text)]
    if words:
        ttr = len(set(words)) / len(words)
        # Moderate TTR with high formulaic count indicates templated generation
        if 0.45 <= ttr <= 0.70 and matched_phrases:
            score += 15
            
    score = min(score, 100)
    is_likely_synthetic = score >= 55
    
    if score >= 70:
        confidence = "High"
    elif score >= 40:
        confidence = "Medium"
    else:
        confidence = "Low"
        
    return {
        "synthetic_score": score,
        "is_likely_synthetic": is_likely_synthetic,
        "confidence": confidence,
        "detected_llm_phrases": matched_phrases,
        "burstiness_index": burstiness,
        "details": f"Content displays {len(matched_phrases)} synthetic language marker(s) with burstiness index {burstiness}."
    }
