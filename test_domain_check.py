import json
from app.scoring.domain_check import check_domain_lookalike

def test_domains():
    test_cases = [
        "paypal.com",                     # Exact match (clean)
        "paypa1.com",                     # Typo (distance 1)
        "rnicrosoft.com",                 # Typo (m->rn is distance 2)
        "paypal.com.verify-account.net",  # Subdomain trick
        "random-domain.xyz"               # Clean unrelated domain
    ]
    
    for domain in test_cases:
        print(f"\nTesting: {domain}")
        print(json.dumps(check_domain_lookalike(domain), indent=2))

if __name__ == "__main__":
    test_domains()
