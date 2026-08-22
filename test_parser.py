import json
from app.parsers.email_parser import parse_eml_file

def main():
    parsed = parse_eml_file('test_emails/sample.eml')
    print(parsed.model_dump_json(indent=2))

if __name__ == "__main__":
    main()
