import re

with open('extension/gmail_content.js', 'r') as f:
    content = f.read()

helper = """
function getVisibleElement(selector) {
  const elements = document.querySelectorAll(selector);
  for (const el of elements) {
    if (el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0) {
      return el;
    }
  }
  return null;
}
"""

content = content.replace("function extractEmailFromDOM() {", helper + "\nfunction extractEmailFromDOM() {")
content = content.replace("document.querySelector('span.gD[email]')", "getVisibleElement('span.gD[email]')")
content = content.replace("document.querySelector('h2.hP')", "getVisibleElement('h2.hP')")
content = content.replace("document.querySelector('span.g2')", "getVisibleElement('span.g2')")
content = content.replace("document.querySelector('span.g3')", "getVisibleElement('span.g3')")
content = content.replace("document.querySelector('div.a3s.aiL')", "getVisibleElement('div.a3s.aiL')")
content = content.replace("document.querySelector('div[data-message-id]')", "getVisibleElement('div[data-message-id]')")

with open('extension/gmail_content.js', 'w') as f:
    f.write(content)
