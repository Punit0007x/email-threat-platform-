import json
from app.parsers.auth_analysis import analyze_auth

def test_auth():
    # Test case 1: Clean email
    auth_header = "spf=pass smtp.mailfrom=example.com; dkim=pass header.i=@example.com; dmarc=pass"
    from_header = "Sender <sender@example.com>"
    return_path = "<bounce@example.com>"
    
    print("Test 1 (Clean):")
    print(json.dumps(analyze_auth(auth_header, from_header, return_path), indent=2))
    
    # Test case 2: Spoofed / Missing auth
    print("\nTest 2 (Spoofed / Missing Auth):")
    print(json.dumps(analyze_auth(None, "CEO <ceo@company.com>", "<hacker@evil.com>"), indent=2))

if __name__ == "__main__":
    test_auth()
