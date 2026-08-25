import re
import os

with open("app/api/analyze.py", "r") as f:
    content = f.read()

# Replace tempfile.NamedTemporaryFile(delete=False, suffix=".eml")
# with tempfile.NamedTemporaryFile(dir="data", delete=False, suffix=".eml")
# Wait, make sure we import os if not already imported, and ensure data dir exists.
# We'll just put dir="data"

content = re.sub(
    r'tempfile\.NamedTemporaryFile\(delete=False, suffix="\.eml"\)',
    'tempfile.NamedTemporaryFile(dir="data", delete=False, suffix=".eml")',
    content
)

# Ensure "data" dir exists in analyze.py
content = re.sub(
    r'def parse_email\(file: UploadFile = File\(\.\.\.\)\):',
    'def parse_email(file: UploadFile = File(...)):\n    os.makedirs("data", exist_ok=True)',
    content
)

with open("app/api/analyze.py", "w") as f:
    f.write(content)

print("Patch applied")
