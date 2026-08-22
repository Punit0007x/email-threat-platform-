import json
from app.parsers.email_parser import parse_eml_file
from app.scoring.text_signals import analyze_text_signals

def test_signals():
    # Test on the sample.eml which has urgency ("Invoice Overdue", "Pay immediately")
    parsed = parse_eml_file('test_emails/sample.eml')
    
    signals = analyze_text_signals(
        subject=parsed.subject,
        body_plain=parsed.body_plain,
        body_html=parsed.body_html,
        extracted_urls=parsed.urls
    )
    
    print("Signals for sample.eml:")
    print(json.dumps(signals, indent=2))

if __name__ == "__main__":
    test_signals()
