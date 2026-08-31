import re

with open('app/api/analyze.py', 'r') as f:
    content = f.read()

patch = """
        print("====== DEBUG PARSED EMAIL ======")
        print("Subject:", parsed_email.subject)
        print("URLs detected:", parsed_email.urls)
        print("Body preview:", full_text[:500])
        print("================================")
"""

content = content.replace("full_text = f\"{parsed_email.subject}\\n{parsed_email.body_plain}\\n{parsed_email.ocr_text}\"", "full_text = f\"{parsed_email.subject}\\n{parsed_email.body_plain}\\n{parsed_email.ocr_text}\"" + patch)

with open('app/api/analyze.py', 'w') as f:
    f.write(content)
