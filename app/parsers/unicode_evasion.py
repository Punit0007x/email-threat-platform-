import re
import unicodedata
from typing import Dict, Any, List

# Common invisible or formatting characters used to evade NLP
EVASION_CHARS = {
    "ZERO_WIDTH_SPACE": r"\u200B",
    "ZERO_WIDTH_NON_JOINER": r"\u200C",
    "ZERO_WIDTH_JOINER": r"\u200D",
    "LEFT_TO_RIGHT_MARK": r"\u200E",
    "RIGHT_TO_LEFT_MARK": r"\u200F",
    "RIGHT_TO_LEFT_OVERRIDE": r"\u202E",
    "POP_DIRECTIONAL_FORMATTING": r"\u202C",
    "WORD_JOINER": r"\u2060",
    "SOFT_HYPHEN": r"\u00AD"
}

def detect_unicode_evasion(text: str) -> Dict[str, Any]:
    """
    Detects invisible characters, RTL overrides, and homoglyph abuse
    designed to break TF-IDF tokenization and bypass spam filters.
    """
    if not text:
        return {"evasion_detected": False, "anomalies": [], "cleaned_text": "", "evasion_score": 0}

    anomalies = []
    score = 0
    
    # 1. Detect invisible character injection
    invisible_count = 0
    for name, pattern in EVASION_CHARS.items():
        matches = re.findall(pattern, text)
        if matches:
            invisible_count += len(matches)
            anomalies.append(f"Contains {len(matches)}x {name}")
            
    if invisible_count > 0:
        score += min(invisible_count * 5, 40)
        
    # 2. Detect mixed-script confusables (Homoglyphs)
    # E.g., mixing Cyrillic 'а' with Latin 'a' in the same word
    words = text.split()
    mixed_script_words = 0
    
    for word in words:
        if len(word) < 4: continue
        scripts = set()
        for char in word:
            if char.isalpha():
                try:
                    # Get script block, e.g., 'LATIN', 'CYRILLIC', 'GREEK'
                    script = unicodedata.name(char).split()[0]
                    scripts.add(script)
                except ValueError:
                    pass
        if len(scripts) > 1:
            mixed_script_words += 1
            
    if mixed_script_words > 0:
        anomalies.append(f"Contains {mixed_script_words} mixed-script confusable words (Homoglyph Attack)")
        score += min(mixed_script_words * 15, 60)
        
    # Clean the text for downstream NLP so it isn't blinded
    cleaned_text = text
    for pattern in EVASION_CHARS.values():
        cleaned_text = re.sub(pattern, "", cleaned_text)
        
    return {
        "evasion_detected": score > 0,
        "anomalies": anomalies,
        "evasion_score": score,
        "cleaned_text": cleaned_text
    }
