"""
auth_analysis.py
------------------
Parses SPF / DKIM / DMARC results from an email's headers. These are
"hard" protocol-level signals — much stronger, more reliable evidence than
NLP/content signals, which is why fraud_score.py weights them separately
and more heavily rather than blending everything into one number.
"""
import re


def parse_authentication_results(headers: dict) -> dict:
    auth_header = headers.get("Authentication-Results", "") or ""
    received_spf = headers.get("Received-SPF", "") or ""

    def _extract(pattern, text):
        m = re.search(pattern, text, re.IGNORECASE)
        return m.group(1).lower() if m else "none"

    spf = _extract(r"spf=(\w+)", auth_header) if "spf=" in auth_header.lower() else \
        _extract(r"^(\w+)", received_spf)
    dkim = _extract(r"dkim=(\w+)", auth_header)
    dmarc = _extract(r"dmarc=(\w+)", auth_header)

    results = {"spf": spf, "dkim": dkim, "dmarc": dmarc}
    failures = [k for k, v in results.items() if v in ("fail", "softfail", "temperror", "permerror")]
    passed = [k for k, v in results.items() if v == "pass"]

    return {
        **results,
        "failed_checks": failures,
        "passed_checks": passed,
        "all_pass": len(passed) == 3,
        "any_hard_fail": "fail" in results.values(),
    }


def check_from_reply_to_mismatch(headers: dict) -> dict:
    """A classic BEC/phishing tell: Reply-To silently redirects replies to a
    different domain than the visible From address."""
    from_addr = (headers.get("From", "") or "").lower()
    reply_to = (headers.get("Reply-To", "") or "").lower()

    def _domain(addr):
        m = re.search(r"@([\w\.-]+)", addr)
        return m.group(1) if m else ""

    from_domain = _domain(from_addr)
    reply_domain = _domain(reply_to)
    mismatch = bool(reply_domain and from_domain and reply_domain != from_domain)
    return {
        "from_domain": from_domain,
        "reply_to_domain": reply_domain,
        "reply_to_mismatch": mismatch,
    }
