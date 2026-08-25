import re
from typing import Dict, Any, List
import hashlib

# High-frequency function words and punctuation patterns are subconscious habits
# that are extremely difficult for human actors to change across campaigns.
FUNCTION_WORDS = [
    "the", "and", "to", "of", "a", "in", "that", "is", "for", "it",
    "with", "as", "you", "this", "but", "on", "be", "at", "by", "not",
    "have", "from", "are", "or", "an", "they", "we", "will", "can", "if"
]

def _calculate_function_word_frequencies(text: str) -> Dict[str, float]:
    if not text:
        return {}
    words = re.findall(r'\b[a-z]+\b', text.lower())
    if not words:
        return {}
        
    total_words = len(words)
    freqs = {}
    for fw in FUNCTION_WORDS:
        count = sum(1 for w in words if w == fw)
        freqs[fw] = round(count / total_words, 4)
    return freqs

def _calculate_punctuation_habits(text: str) -> Dict[str, float]:
    if not text:
        return {}
    total_chars = len(text)
    if total_chars == 0:
        return {}
        
    habits = {
        "comma_ratio": text.count(",") / total_chars,
        "exclamation_ratio": text.count("!") / total_chars,
        "question_ratio": text.count("?") / total_chars,
        "dash_ratio": (text.count("-") + text.count("—")) / total_chars,
        "ellipsis_ratio": text.count("...") / total_chars
    }
    return {k: round(v, 4) for k, v in habits.items()}

def extract_stylometric_fingerprint(text: str) -> str:
    """
    Calculates the author's subconscious writing habits and returns
    a normalized stylistic hash. Emails with the same hash indicate
    the same human author, regardless of domain or IP used.
    """
    if not text or len(text.split()) < 20:
        return "too_short_to_fingerprint"
        
    # 1. Measure syntax habits
    fw_freq = _calculate_function_word_frequencies(text)
    punct = _calculate_punctuation_habits(text)
    
    # 2. Normalize and quantize the frequencies to allow slight variations
    # We round to the nearest 0.05 so similar styles fall into the same bucket
    fingerprint_vector = []
    
    # Take the top 5 most used function words
    sorted_fw = sorted(fw_freq.items(), key=lambda x: x[1], reverse=True)[:5]
    for fw, freq in sorted_fw:
        quantized_freq = round(freq * 20) / 20 # Round to nearest 0.05
        fingerprint_vector.append(f"{fw}:{quantized_freq}")
        
    # Append punctuation habits
    for p, val in punct.items():
        if val > 0:
            quantized_val = round(val * 50) / 50 # Round to nearest 0.02
            fingerprint_vector.append(f"{p}:{quantized_val}")
            
    # 3. Generate SHA256 of the normalized vector
    raw_fingerprint = "|".join(fingerprint_vector)
    return hashlib.sha256(raw_fingerprint.encode()).hexdigest()[:16]
