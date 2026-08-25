import random
import re
from typing import List, Dict, Any

from app.parsers.unicode_evasion import EVASION_CHARS

def mutate_text_homoglyphs(text: str) -> str:
    """Randomly swaps characters with visually similar Cyrillic/Greek homoglyphs."""
    homoglyphs = {
        'a': 'а', # Cyrillic a
        'e': 'е', # Cyrillic e
        'o': 'о', # Cyrillic o
        'p': 'р', # Cyrillic p
        'c': 'с', # Cyrillic c
        'x': 'х', # Cyrillic x
        'y': 'у', # Cyrillic y
    }
    mutated = []
    for char in text:
        if char in homoglyphs and random.random() < 0.3:
            mutated.append(homoglyphs[char])
        else:
            mutated.append(char)
    return "".join(mutated)

def mutate_text_invisible_chars(text: str) -> str:
    """Injects zero-width spaces and non-joiners to break tokenization."""
    invisible = [EVASION_CHARS["ZERO_WIDTH_SPACE"], EVASION_CHARS["ZERO_WIDTH_NON_JOINER"]]
    mutated = []
    for char in text:
        mutated.append(char)
        if random.random() < 0.15:
            mutated.append(random.choice(invisible))
    return "".join(mutated)

def mutate_text_html_obfuscation(text: str) -> str:
    """Injects invisible HTML tags inside words (e.g., P<span style='display:none'>x</span>AYPAL)."""
    words = text.split()
    mutated_words = []
    for word in words:
        if len(word) > 4 and random.random() < 0.4:
            split_idx = len(word) // 2
            obfuscator = f"<span style='display:none; opacity:0; font-size:0px;'>{random.choice('abcdefghijklmnopqrstuvwxyz')}</span>"
            mutated_word = word[:split_idx] + obfuscator + word[split_idx:]
            mutated_words.append(mutated_word)
        else:
            mutated_words.append(word)
    return " ".join(mutated_words)

def generate_adversarial_examples(original_text: str, num_mutations: int = 3) -> List[Dict[str, str]]:
    """
    Simulates an active Red-Team loop by generating mutated variants of known 
    threats to test the classifier's robustness against evasion.
    """
    examples = []
    
    # 1. Homoglyph Attack
    examples.append({
        "mutation_type": "Homoglyph Substitution",
        "text": mutate_text_homoglyphs(original_text)
    })
    
    # 2. Invisible Character Injection
    examples.append({
        "mutation_type": "Zero-Width Evasion",
        "text": mutate_text_invisible_chars(original_text)
    })
    
    # 3. HTML Obfuscation (CSS hidden text)
    examples.append({
        "mutation_type": "HTML/CSS Obfuscation",
        "text": mutate_text_html_obfuscation(original_text)
    })
    
    return examples

if __name__ == "__main__":
    sample = "Please update your PayPal account immediately to avoid suspension."
    print(f"ORIGINAL: {sample}\n")
    for ex in generate_adversarial_examples(sample):
        print(f"[{ex['mutation_type']}]")
        print(f"{ex['text']}\n")
