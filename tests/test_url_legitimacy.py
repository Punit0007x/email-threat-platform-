import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.parsers.url_analyzer import (
    is_domain_trusted,
    is_sender_aligned,
    analyze_single_url,
    analyze_urls_in_email
)
from app.scoring.fraud_score import calculate_fraud_score
from app.scoring.text_signals import analyze_text_signals


class TestURLLegitimacy(unittest.TestCase):

    def test_trusted_domains(self):
        self.assertTrue(is_domain_trusted("docs.google.com"))
        self.assertTrue(is_domain_trusted("accounts.google.com"))
        self.assertTrue(is_domain_trusted("github.com"))
        self.assertTrue(is_domain_trusted("login.microsoftonline.com"))
        self.assertTrue(is_domain_trusted("aws.amazon.com"))
        self.assertFalse(is_domain_trusted("evil-phishing-site.xyz"))
        self.assertFalse(is_domain_trusted("paypa1.com"))

    def test_sender_aligned_domains(self):
        self.assertTrue(is_sender_aligned("portal.acme-corp.com", "acme-corp.com"))
        self.assertTrue(is_sender_aligned("acme-corp.com", "acme-corp.com"))
        self.assertTrue(is_sender_aligned("mail.corp.company.co.in", "company.co.in"))
        self.assertFalse(is_sender_aligned("evil.com", "acme-corp.com"))

    def test_legitimate_url_analysis(self):
        # Trusted Google Doc link
        res1 = analyze_single_url("https://docs.google.com/document/d/12345/edit", sender_domain="gmail.com")
        self.assertTrue(res1["is_trusted"])
        self.assertTrue(res1["is_legitimate"])
        self.assertFalse(res1["is_malicious"])
        self.assertEqual(res1["risk_score"], 0)

        # Trusted GitHub settings security link (should not flag 'security' as credential harvesting)
        res2 = analyze_single_url("https://github.com/settings/security", sender_domain="github.com")
        self.assertTrue(res2["is_trusted"])
        self.assertFalse(res2["is_suspicious_path"])
        self.assertFalse(res2["is_malicious"])

        # Sender-aligned corporate login portal
        res3 = analyze_single_url("https://sso.mycompany.com/login", sender_domain="mycompany.com")
        self.assertTrue(res3["is_sender_aligned"])
        self.assertFalse(res3["is_suspicious_path"])
        self.assertFalse(res3["is_malicious"])

    def test_malicious_urls(self):
        # Typosquat
        res1 = analyze_single_url("https://paypa1.com/login", sender_domain="gmail.com")
        self.assertTrue(res1["is_malicious"])
        self.assertIsNotNone(res1["typosquat"])
        self.assertGreater(res1["risk_score"], 30)

        # Raw IP address with login
        res2 = analyze_single_url("http://192.168.1.100/account/login", sender_domain="gmail.com")
        self.assertTrue(res2["is_malicious"])
        self.assertGreater(res2["risk_score"], 30)

        # Tunneling phishing host
        res3 = analyze_single_url("https://secure-login.ngrok.io/auth", sender_domain="gmail.com")
        self.assertTrue(res3["is_suspicious_hosting"])
        self.assertTrue(res3["is_malicious"])

    def test_fraud_score_with_legitimate_links(self):
        auth_pass = {
            "spf": "pass",
            "dkim": "pass",
            "dmarc": "pass",
            "domain_alignment_pass": True,
            "from_domain": "google.com"
        }
        text_sig = {
            "urgency_count": 0,
            "authority_count": 0,
            "link_mismatch_count": 0,
            "has_shortener": False
        }
        domain_chk = {"is_lookalike": False}
        trace = {"best_guess_ip": "8.8.8.8", "reason": "clean"}
        urls = ["https://docs.google.com/document/d/123", "https://accounts.google.com/ManageAccount"]

        score_res = calculate_fraud_score(
            auth_analysis=auth_pass,
            text_signals=text_sig,
            domain_check=domain_chk,
            trace_results=trace,
            extracted_urls=urls
        )

        self.assertEqual(score_res["score"], 0)
        self.assertEqual(score_res["risk_level"], "Low")

    def test_fraud_score_with_malicious_link(self):
        auth_pass = {
            "spf": "pass",
            "dkim": "pass",
            "dmarc": "pass",
            "domain_alignment_pass": True,
            "from_domain": "google.com"
        }
        text_sig = {
            "urgency_count": 0,
            "authority_count": 0,
            "link_mismatch_count": 0,
            "has_shortener": False
        }
        domain_chk = {"is_lookalike": False}
        trace = {"best_guess_ip": "8.8.8.8", "reason": "clean"}
        urls = ["https://paypa1-update.com/verify-account"]

        score_res = calculate_fraud_score(
            auth_analysis=auth_pass,
            text_signals=text_sig,
            domain_check=domain_chk,
            trace_results=trace,
            extracted_urls=urls
        )

        self.assertGreater(score_res["score"], 30)
        self.assertIn("Suspicious URL path", " ".join(score_res["reasons"]))


if __name__ == "__main__":
    unittest.main()
