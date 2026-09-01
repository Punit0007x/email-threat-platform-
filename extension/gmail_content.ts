// Gmail Content Script - Robust email extraction with multiple fallback strategies

import { ExtractedEmail, GmailSelectors } from './types.js';

// ─── Selector Strategies (Multiple Fallbacks) ───
const SELECTOR_STRATEGIES: GmailSelectors = {
  sender: [
    'span.gD[email]',           // Classic
    'div[role="button"][email]', // Newer
    'span[email]:not([email=""])', // Generic
    'a[href^="mailto:"]',       // Fallback
  ],
  subject: [
    'h2.hP',                    // Classic
    'h2[subject]',              // With attribute
    'div.ha[subject]',          // Thread view
    'table.cf tr td:first-child', // Compact view
  ],
  recipient: [
    'span.g2',                  // Classic
    'div[role="button"][name]', // Newer
    'span[email][name]',        // Generic
  ],
  date: [
    'span.g3',                  // Classic
    'span[title*="202"]',       // By title attribute
    'div.g3 time',              // Time element
  ],
  body: [
    'div.a3s.aiL',              // Classic
    'div.ii.gt div.a3s',        // Thread
    'div[role="region"] div.a3s', // Accessible
    'div.msg-body',             // Generic
  ],
  messageId: [
    '[data-legacy-message-id]',
    '[data-message-id]',
    '[data-thread-id]',
  ],
};

let extractedEmailCache = new Map<string, ExtractedEmail>();
let lastScanTimestamp = 0;
const SCAN_COOLDOWN = 2000; // ms between auto-scans
let lastScannedMessageId = '';
let autoScanEnabled = true;
let currentMessageId: string | null = null;
let threatIndicator: HTMLElement | null = null;

// ─── Utility: Try multiple selectors ───
function queryFirst(selectors: string[]): Element | null {
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) return el;
  }
  return null;
}

function getAttribute(el: Element | null, attr: string): string {
  return el?.getAttribute(attr)?.trim() || '';
}

function getText(el: Element | null): string {
  return el?.textContent?.trim() || '';
}

function getHtml(el: Element | null): string {
  return el?.innerHTML || '';
}

// ─── Core Extraction ───
export function extractEmailFromDOM(): ExtractedEmail {
  // Sender
  const senderEl = queryFirst(SELECTOR_STRATEGIES.sender);
  const senderEmail = getAttribute(senderEl, 'email') || extractEmailFromText(getText(senderEl));
  const senderName = getAttribute(senderEl, 'name') || getText(senderEl);

  // Subject
  const subjectEl = queryFirst(SELECTOR_STRATEGIES.subject);
  const subject = getAttribute(subjectEl, 'subject') || getText(subjectEl);

  // Recipient
  const toEl = queryFirst(SELECTOR_STRATEGIES.recipient);
  const recipient = getText(toEl);

  // Date
  const dateEl = queryFirst(SELECTOR_STRATEGIES.date);
  const date = getAttribute(dateEl, 'title') || getText(dateEl);

  // Body
  const bodyEl = queryFirst(SELECTOR_STRATEGIES.body);
  const bodyText = getText(bodyEl);
  const bodyHtml = getHtml(bodyEl);

  // Message ID - multiple strategies
  let messageId = '';
  const msgIdEl = queryFirst(SELECTOR_STRATEGIES.messageId);
  if (msgIdEl) {
    messageId = getAttribute(msgIdEl, 'data-legacy-message-id') ||
                getAttribute(msgIdEl, 'data-message-id') ||
                getAttribute(msgIdEl, 'data-thread-id') || '';
  }

  // Fallback: Extract from URL hash
  if (!messageId) {
    const hashMatch = window.location.hash.match(/[#\/]([0-9a-fA-F]{15,})/);
    if (hashMatch) messageId = hashMatch[1];
  }

  // Fallback: Extract from "Show original" link
  if (!messageId) {
    const origLink = document.querySelector('a[href*="view=om"]');
    if (origLink) {
      const href = getAttribute(origLink, 'href');
      const thMatch = href.match(/[?&]th=([a-zA-Z0-9]+)/);
      if (thMatch) messageId = thMatch[1];
    }
  }

  // Build RFC822-style headers
  const headers = [
    `From: ${senderName} <${senderEmail}>`,
    `To: ${recipient}`,
    `Subject: ${subject}`,
    `Date: ${date}`,
    `Message-ID: <${messageId || 'unknown'}@gmail.com>`,
    'Content-Type: text/html; charset="UTF-8"',
    '',
    bodyText,
  ].join('\r\n');

  return {
    headers,
    from: senderEmail,
    subject,
    bodyText,
    bodyHtml,
    messageId: messageId || null,
    senderName,
    recipient,
    date,
  };
}

// ─── Email validation ───
function extractEmailFromText(text: string): string {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : '';
}

function isValidEmail(email: string): boolean {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

// ─── Cache with TTL ───
function getCacheKey(email: ExtractedEmail): string {
  return `${email.messageId || email.from}_${email.subject}_${email.date}`.slice(0, 200);
}

export function getCachedExtraction(): ExtractedEmail | null {
  const current = extractEmailFromDOM();
  const key = getCacheKey(current);
  const cached = extractedEmailCache.get(key);
  if (cached && Date.now() - (cached as any)._cachedAt < 30000) {
    return cached;
  }
  return null;
}

export function cacheExtraction(email: ExtractedEmail): void {
  const key = getCacheKey(email);
  (email as any)._cachedAt = Date.now();
  extractedEmailCache.set(key, email);
  // Cleanup old entries
  if (extractedEmailCache.size > 50) {
    const firstKey = extractedEmailCache.keys().next().value;
    if (firstKey) extractedEmailCache.delete(firstKey);
  }
}

// ─── Raw Email Fetch (with ik token) ───
let ikTokenCache: string | null = null;
let ikTokenExpiry = 0;

export function setIkToken(token: string): void {
  ikTokenCache = token;
  ikTokenExpiry = Date.now() + 10 * 60 * 1000; // 10 min TTL
}

export function getIkToken(): string | null {
  if (ikTokenCache && Date.now() < ikTokenExpiry) return ikTokenCache;
  return null;
}

export async function tryFetchRawEmail(messageId: string): Promise<string | null> {
  if (!messageId) return null;

  let ik = getIkToken();

  // Fallback: Extract from page links
  if (!ik) {
    const links = document.querySelectorAll('a[href*="ik="]');
    for (const link of links) {
      const match = (link as HTMLAnchorElement).href.match(/[?&]ik=([a-zA-Z0-9]+)/);
      if (match) { ik = match[1]; setIkToken(ik); break; }
    }
  }

  // Fallback: From "Show original" link
  if (!ik) {
    const origLink = document.querySelector('a[href*="view=om"]');
    if (origLink) {
      const href = getAttribute(origLink, 'href');
      const match = href.match(/[?&]ik=([a-zA-Z0-9]+)/);
      if (match) { ik = match[1]; setIkToken(ik); }
    }
  }

  if (!ik) return null;

  const basePathMatch = location.pathname.match(/\/mail\/u\/\d+\//);
  const basePath = basePathMatch ? basePathMatch[0] : '/mail/u/0/';
  const url = `https://mail.google.com${basePath}?ui=2&ik=${ik}&view=om&th=${messageId}`;

  try {
    const response = await fetch(url, {
      credentials: 'include',
      headers: { 'Accept': 'text/plain' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const htmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const pre = doc.getElementById('raw_message_text');
    if (pre && pre.textContent) {
      return pre.textContent;
    }
    return htmlText;
  } catch (err) {
    console.warn('[ShieldMail] Raw fetch failed:', err);
    return null;
  }
}

// ─── Visual Indicator on Gmail Page ───
function createThreatIndicator(): HTMLElement {
  const indicator = document.createElement('div');
  indicator.id = 'shieldmail-threat-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    z-index: 10000;
    padding: 12px 16px;
    border-radius: 8px;
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 13px;
    font-weight: 600;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 200px;
  `;
  indicator.innerHTML = `
    <span id="shieldmail-indicator-icon" style="font-size: 16px;">🔍</span>
    <span id="shieldmail-indicator-text">Analyzing...</span>
    <button id="shieldmail-indicator-close" style="background:none;border:none;font-size:18px;cursor:pointer;padding:0 0 0 8px;color:inherit;opacity:0.7;">×</button>
  `;
  
  // Close button
  indicator.querySelector('#shieldmail-indicator-close')?.addEventListener('click', () => {
    indicator.remove();
    threatIndicator = null;
  });
  
  document.body.appendChild(indicator);
  return indicator;
}

function updateThreatIndicator(isThreat: boolean | null, threatType?: string, score?: number): void {
  if (!threatIndicator) {
    threatIndicator = createThreatIndicator();
  }
  
  const iconEl = threatIndicator.querySelector('#shieldmail-indicator-icon')!;
  const textEl = threatIndicator.querySelector('#shieldmail-indicator-text')!;
  
  if (isThreat === null) {
    // Scanning
    threatIndicator.style.background = '#fff3cd';
    threatIndicator.style.color = '#856404';
    threatIndicator.style.border = '1px solid #ffeaa7';
    iconEl.textContent = '🔍';
    textEl.textContent = 'Analyzing email...';
  } else if (isThreat) {
    // Threat detected
    threatIndicator.style.background = '#f8d7da';
    threatIndicator.style.color = '#721c24';
    threatIndicator.style.border = '1px solid #f5c6cb';
    iconEl.textContent = '⚠️';
    textEl.textContent = `THREAT: ${threatType || 'Suspicious'} (Score: ${score || '—'})`;
  } else {
    // Safe
    threatIndicator.style.background = '#d4edda';
    threatIndicator.style.color = '#155724';
    threatIndicator.style.border = '1px solid #c3e6cb';
    iconEl.textContent = '✅';
    textEl.textContent = 'SAFE: No threats detected';
  }
  
  // Auto-hide safe indicator after 5 seconds
  if (isThreat === false) {
    setTimeout(() => {
      if (threatIndicator && threatIndicator.parentNode) {
        threatIndicator.style.opacity = '0';
        threatIndicator.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (threatIndicator?.parentNode) {
            threatIndicator.remove();
            threatIndicator = null;
          }
        }, 300);
      }
    }, 5000);
  }
}

function removeThreatIndicator(): void {
  if (threatIndicator?.parentNode) {
    threatIndicator.remove();
    threatIndicator = null;
  }
}

// ─── MutationObserver for SPA Navigation ───
let observer: MutationObserver | null = null;
let lastUrl = location.href;
let lastHash = location.hash;
let emailCheckInterval: number | null = null;

export function startEmailObserver(onEmailOpen: () => void): void {
  if (observer) observer.disconnect();

  observer = new MutationObserver(() => {
    // Check URL change (Gmail SPA navigation)
    if (location.href !== lastUrl || location.hash !== lastHash) {
      lastUrl = location.href;
      lastHash = location.hash;
      // Wait for email to render
      setTimeout(() => {
        checkForEmailOpen(onEmailOpen);
      }, 800);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['href', 'data-legacy-message-id', 'data-message-id', 'data-thread-id'],
  });

  // Also listen for hash changes directly
  window.addEventListener('hashchange', () => {
    lastHash = location.hash;
    setTimeout(() => checkForEmailOpen(onEmailOpen), 800);
  });

  // Periodic check as fallback (Gmail sometimes doesn't trigger hashchange)
  emailCheckInterval = window.setInterval(() => {
    checkForEmailOpen(onEmailOpen);
  }, 3000);
}

function checkForEmailOpen(onEmailOpen: () => void): void {
  const senderEl = queryFirst(SELECTOR_STRATEGIES.sender);
  if (senderEl) {
    const email = getAttribute(senderEl, 'email') || extractEmailFromText(getText(senderEl));
    if (isValidEmail(email)) {
      // Additional check: make sure we're actually viewing an email (not just inbox)
      const bodyEl = queryFirst(SELECTOR_STRATEGIES.body);
      if (bodyEl && bodyEl.textContent && bodyEl.textContent.length > 50) {
        onEmailOpen();
      }
    }
  } else {
    // No sender element = likely back in inbox, remove indicator
    if (currentMessageId) {
      currentMessageId = null;
      lastScannedMessageId = '';
      removeThreatIndicator();
    }
  }
}

export function stopEmailObserver(): void {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (emailCheckInterval) {
    clearInterval(emailCheckInterval);
    emailCheckInterval = null;
  }
}

// ─── Message Listener ───
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TRIGGER_GMAIL_SCAN') {
    scanCurrentEmail(sendResponse);
    return true; // Async response
  }
  
  // Update indicator when scan completes from any source (popup, shortcut, etc.)
  if (message.type === 'SCAN_COMPLETE' && message.payload) {
    const result = message.payload;
    const isThreat = result.ai_ml_analysis?.classification?.is_threat === true &&
                     (result.fraud_assessment?.score ?? 0) >= 30;
    const threatType = result.ai_ml_analysis?.classification?.primary_threat;
    const score = result.fraud_assessment?.score;
    updateThreatIndicator(isThreat, threatType, score);
  }
  
  if (message.type === 'SCAN_ERROR') {
    updateThreatIndicator(false, 'Error', 0);
  }
});

function getCurrentMessageId(): string {
  const extracted = extractEmailFromDOM();
  return extracted.messageId || `msg_${Date.now()}`;
}

async function handleEmailOpened(): Promise<void> {
  console.log('[ShieldMail] Email opened detected');
  
  if (!autoScanEnabled) {
    console.log('[ShieldMail] Auto-scan disabled, skipping');
    return;
  }

  const now = Date.now();
  if (now - lastScanTimestamp < SCAN_COOLDOWN) {
    console.log('[ShieldMail] Cooldown active, skipping');
    return;
  }

  const extracted = extractEmailFromDOM();
  
  if (!extracted.from || !isValidEmail(extracted.from)) {
    console.log('[ShieldMail] No valid email content found');
    return;
  }

  const messageId = extracted.messageId || `msg_${Date.now()}`;
  currentMessageId = messageId;
  
  // Avoid re-scanning same message
  if (messageId === lastScannedMessageId) {
    console.log('[ShieldMail] Already scanned this message');
    return;
  }
  lastScannedMessageId = messageId;
  lastScanTimestamp = now;

  // Show scanning indicator
  updateThreatIndicator(null);
  
  cacheExtraction(extracted);

  // Try raw fetch first (best quality)
  let rawEmail: string | null = null;
  if (extracted.messageId) {
    rawEmail = await tryFetchRawEmail(extracted.messageId);
  }

  try {
    let result: any;
    
    if (rawEmail) {
      // Send to background for full forensic analysis
      result = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { type: 'SCAN_GMAIL_RAW', payload: { messageId, rawEmail } },
          (response) => {
            if (chrome.runtime.lastError || !response || response.error) {
              const err = chrome.runtime.lastError?.message || response?.error || 'Analysis failed';
              resolve({ error: err });
            } else {
              resolve(response.data);
            }
          }
        );
      });
    } else {
      // Fallback: DOM-extracted headers directly to API
      const formData = new FormData();
      const blob = new Blob([extracted.headers], { type: 'message/rfc822' });
      formData.append('file', blob, 'gmail_email.eml');

      const res = await fetch('https://erakshak.duckdns.org/api/parse', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error ${res.status}`);
      }

      result = await res.json();
    }

    if (result.error) {
      console.error('[ShieldMail] Auto-scan error:', result.error);
      updateThreatIndicator(false, 'Error', 0);
      return;
    }

    console.log('[ShieldMail] Auto-scan complete:', result.scan_id, 'threat:', result.ai_ml_analysis?.classification?.is_threat);

    const isThreat = result.ai_ml_analysis?.classification?.is_threat === true &&
                     (result.fraud_assessment?.score ?? 0) >= 30;
    const threatType = result.ai_ml_analysis?.classification?.primary_threat;
    const score = result.fraud_assessment?.score;

    // Update visual indicator on Gmail page
    updateThreatIndicator(isThreat, threatType, score);

    // Notify background for badge/notification/sidepanel
    chrome.runtime.sendMessage({
      type: 'AUTO_SCAN_RESULT',
      payload: { 
        messageId: result.scan_id, 
        result, 
        isThreat
      }
    }).catch(() => {});

  } catch (err) {
    console.error('[ShieldMail] Auto-scan failed:', err);
    updateThreatIndicator(false, 'Error', 0);
  }
}

async function scanCurrentEmail(sendResponse: (response: any) => void): Promise<void> {
  try {
    const extracted = extractEmailFromDOM();

    if (!extracted.from || !isValidEmail(extracted.from)) {
      sendResponse({ error: 'No email content found. Open an email and try again.' });
      return;
    }

    cacheExtraction(extracted);
    const msgId = extracted.messageId || `msg_${Date.now()}`;

    // Try raw fetch first (best quality)
    let rawEmail: string | null = null;
    if (extracted.messageId) {
      rawEmail = await tryFetchRawEmail(extracted.messageId);
    }

    if (rawEmail) {
      chrome.runtime.sendMessage(
        { type: 'SCAN_GMAIL_RAW', payload: { messageId: msgId, rawEmail } },
        (response) => {
          if (chrome.runtime.lastError || !response || (response as any).error) {
            const err = chrome.runtime.lastError?.message || (response as any)?.error || 'Analysis failed';
            sendResponse({ error: err });
          } else {
            sendResponse({ data: (response as any).data });
          }
        }
      );
    } else {
      // Fallback: DOM-extracted headers
      const formData = new FormData();
      const blob = new Blob([extracted.headers], { type: 'message/rfc822' });
      formData.append('file', blob, 'gmail_email.eml');

      const res = await fetch('https://erakshak.duckdns.org/api/parse', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error ${res.status}`);
      }

      const data = await res.json();
      sendResponse({ data });
    }
  } catch (err) {
    console.error('[ShieldMail] Scan error:', err);
    sendResponse({ error: err instanceof Error ? err.message : 'Failed to analyze email' });
  }
}

// ─── Boot ───
console.log('[ShieldMail] Content script loaded on Gmail');

// Load auto-scan setting from storage
chrome.storage.sync.get(['shieldmail_settings'], (result) => {
  const stored = result.shieldmail_settings?.data;
  if (stored) {
    autoScanEnabled = stored.autoScanEnabled ?? true;
  }
  startEmailObserver(handleEmailOpened);
});

// Listen for settings changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.shieldmail_settings) {
    const newSettings = changes.shieldmail_settings.newValue?.data;
    if (newSettings) {
      autoScanEnabled = newSettings.autoScanEnabled ?? true;
      console.log('[ShieldMail] Auto-scan setting updated:', autoScanEnabled);
    }
  }
});

// Listen for ik token from injected script
window.addEventListener('message', (event) => {
  if (event.source !== window || !event.data) return;
  if (event.data.type === 'SHIELDMAIL_IK' && event.data.ik) {
    setIkToken(event.data.ik);
  }
});

// Inject extract_ik.js into main world
const ikScript = document.createElement('script');
ikScript.src = chrome.runtime.getURL('extract_ik.js');
ikScript.onload = () => ikScript.remove();
(document.head || document.documentElement).appendChild(ikScript);