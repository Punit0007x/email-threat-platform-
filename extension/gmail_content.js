/* ═══════════════════════════════════════════════════════════
   ShieldMail Extension — gmail_content.js
   Injects into mail.google.com to detect opened emails,
   extract visible email data, and send it to the backend.
   ═══════════════════════════════════════════════════════════ */

const scannedMessages = new Set();

// ─── EXTRACT EMAIL DATA DIRECTLY FROM THE DOM ───
// This approach does NOT need the `ik` token at all.
// Instead of fetching raw source via Gmail's internal API,
// we extract sender, subject, and visible headers from the DOM.


function getVisibleElement(selector) {
  const elements = document.querySelectorAll(selector);
  for (const el of elements) {
    if (el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0) {
      return el;
    }
  }
  return null;
}

function extractEmailFromDOM() {
  // Get sender info
  const senderEl = getVisibleElement('span.gD[email]');
  const senderEmail = senderEl ? senderEl.getAttribute('email') : '';
  const senderName = senderEl ? senderEl.getAttribute('name') || senderEl.textContent.trim() : '';

  // Get subject from page title or subject element
  const subjectEl = getVisibleElement('h2.hP');
  const subject = subjectEl ? subjectEl.textContent.trim() : document.title.replace(/ - .+$/, '').trim();

  // Get recipient (To:)
  const toEl = getVisibleElement('span.g2');
  const to = toEl ? toEl.textContent.trim() : '';

  // Get date
  const dateEl = getVisibleElement('span.g3');
  const date = dateEl ? dateEl.getAttribute('title') || dateEl.textContent.trim() : '';

  // Get email body
  const bodyEl = getVisibleElement('div.a3s.aiL');
  const bodyText = bodyEl ? bodyEl.innerText : '';
  const bodyHtml = bodyEl ? bodyEl.innerHTML : '';

  // Try to reliably extract the message ID
  let rawMsgId = '';
  const msgContainer = document.querySelector('[data-legacy-message-id]');
  if (msgContainer) {
    rawMsgId = msgContainer.getAttribute('data-legacy-message-id');
  } 
  
  if (!rawMsgId) {
    const showOrigLink = document.querySelector('a[href*="view=om"]');
    if (showOrigLink) {
      const href = showOrigLink.getAttribute('href');
      const thMatch = href.match(/th=([a-zA-Z0-9]+)/);
      if (thMatch) rawMsgId = thMatch[1];
    }
  }
  
  if (!rawMsgId) {
    const match = window.location.hash.match(/[#\/]([0-9a-fA-F]{15,})/);
    if (match) rawMsgId = match[1];
  }

  // Build a minimal RFC-822 style header string for the backend parser
  const headers = [
    `From: ${senderName} <${senderEmail}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `Date: ${date}`,
    `Message-ID: <${rawMsgId || 'unknown'}@gmail.com>`,
    `Content-Type: text/html; charset="UTF-8"`,
    '',
    bodyText
  ].join('\r\n');

  return {
    headers,
    from: senderEmail,
    subject,
    bodyText,
    bodyHtml,
    messageId: rawMsgId || null
  };
}

let globalIkToken = null;

// Listen for the ik token from the injected script
window.addEventListener('message', (event) => {
  if (event.source !== window || !event.data) return;
  if (event.data.type === 'SHIELDMAIL_IK' && event.data.ik) {
    globalIkToken = event.data.ik;
  }
});

// Inject extract_ik.js to bypass isolated world restrictions
const ikScript = document.createElement('script');
ikScript.src = chrome.runtime.getURL('extract_ik.js');
ikScript.onload = function() { this.remove(); };
(document.head || document.documentElement).appendChild(ikScript);

// ─── TRY FETCHING RAW EMAIL (if ik is available) ───
function tryFetchRawEmail(messageId) {
  return new Promise((resolve) => {
    let ik = globalIkToken;
    
    // Fallback: Try to find ik from any link on the page
    if (!ik) {
      const links = document.querySelectorAll('a[href*="ik="]');
      for (const link of links) {
        const match = link.href.match(/[?&]ik=([a-zA-Z0-9]+)/);
        if (match) { ik = match[1]; break; }
      }
    }

    // Also try from the page source view link
    if (!ik) {
      const srcLink = document.querySelector('a[href*="view=om"]');
      if (srcLink) {
        const match = srcLink.href.match(/[?&]ik=([a-zA-Z0-9]+)/);
        if (match) ik = match[1];
      }
    }

    if (!ik || !messageId) {
      resolve(null);
      return;
    }

    const basePathMatch = location.pathname.match(/\/mail\/u\/\d+\//);
    const basePath = basePathMatch ? basePathMatch[0] : '/mail/u/0/';
    const url = `https://mail.google.com${basePath}?ui=2&ik=${ik}&view=om&th=${messageId}`;

    fetch(url).then(res => {
      if (!res.ok) throw new Error('fetch failed');
      return res.text();
    }).then(htmlText => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');
      const pre = doc.getElementById('raw_message_text');
      if (pre && pre.textContent) {
        resolve(pre.textContent);
      } else {
        resolve(htmlText);
      }
    }).catch(() => {
      resolve(null);
    });
  });
}

// ─── SCAN EMAIL (called by popup or auto-observer) ───
async function scanCurrentEmail(sendResponse) {
  try {
    const extracted = extractEmailFromDOM();

    if (!extracted.from) {
      if (sendResponse) sendResponse({ error: "No email content found. Make sure an email is fully expanded." });
      return;
    }

    const msgId = extracted.messageId || Date.now().toString(16);

    // Try fetching raw email first (best quality)
    let rawEmail = null;
    if (extracted.messageId) {
      rawEmail = await tryFetchRawEmail(extracted.messageId);
    }

    // If we got raw email, send it to background for full forensic analysis
    if (rawEmail) {
      chrome.runtime.sendMessage({
        action: 'SCAN_GMAIL_RAW',
        messageId: msgId,
        rawEmail: rawEmail
      }, (response) => {
        if (chrome.runtime.lastError || !response || response.error) {
          const err = chrome.runtime.lastError?.message || response?.error || 'Analysis failed';
          if (sendResponse) sendResponse({ error: err });
        } else {
          if (sendResponse) sendResponse({ data: response.data });
        }
      });
    } else {
      // Fallback: send the DOM-extracted text directly to the API
      const formData = new FormData();
      const blob = new Blob([extracted.headers], { type: 'message/rfc822' });
      formData.append('file', blob, 'gmail_email.eml');

      const res = await fetch('http://localhost:8000/api/parse', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error ${res.status}`);
      }

      const data = await res.json();
      
      // Just return the response to the popup so it can render the results
      if (sendResponse) sendResponse({ data: data });
    }
  } catch (err) {
    console.error("ShieldMail scan error:", err);
    if (sendResponse) sendResponse({ error: err.message || 'Failed to analyze email' });
  }
}

// ─── COMMUNICATION WITH POPUP ───
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'TRIGGER_GMAIL_SCAN') {
    console.log("ShieldMail: Received TRIGGER_GMAIL_SCAN from popup");
    scanCurrentEmail(sendResponse);
    return true; // Keep message channel open for async response
  }
});

// ─── AUTO-OBSERVER (watches for email opens) ───
let lastObservedUrl = '';

function observeEmails() {
  setInterval(() => {
    const currentUrl = location.href;
    if (currentUrl === lastObservedUrl) return;

    // Check if we navigated to a specific email thread
    if (location.hash.match(/\/[a-zA-Z0-9]{15,}$/)) {
      lastObservedUrl = currentUrl;
      // Wait for the email to fully render
      setTimeout(() => {
        const senderEl = getVisibleElement('span.gD[email]');
        if (senderEl) {
          console.log("ShieldMail: Auto-detected email open");
          // We just log it. The user can click "Scan Gmail" in the popup.
          // Auto-scanning is intentionally disabled to avoid spamming the API.
        }
      }, 1500);
    }
  }, 1000);
}

// ─── BOOT ───
console.log("ShieldMail: Content script loaded on Gmail");
observeEmails();
