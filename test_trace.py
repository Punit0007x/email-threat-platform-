import json
from app.parsers.origin_trace import trace_origin

def test_trace():
    # Simulated received chain:
    # Hop 0: Our MX receives from Gmail
    # Hop 1: Gmail receives from a suspicious VPS (the true origin)
    # Hop 2: Suspicious VPS claims it received from localhost (forged)
    
    chain = [
        "from mail-wr1-f49.google.com (mail-wr1-f49.google.com [209.85.221.49]) by mx.company.com with ESMTP id 123; Wed, 22 Aug 2026 09:05:00 +0000",
        "from attacker-vps.xyz (attacker-vps.xyz [89.123.45.67]) by mail.google.com with ESMTP id 456; Wed, 22 Aug 2026 09:04:55 +0000",
        "from localhost (localhost [127.0.0.1]) by attacker-vps.xyz; Wed, 22 Aug 2026 09:04:00 +0000"
    ]
    
    result = trace_origin(chain)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    test_trace()
