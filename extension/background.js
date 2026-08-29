/* ═══════════════════════════════════════════════════════════
   ShieldMail Extension — background.js
   Handles background uploads, notifications, and auto-detection.
   ═══════════════════════════════════════════════════════════ */

const API_BASE = 'http://localhost:8000';

// Convert Data URL back to a Blob safely (avoids fetch CSP issues in MV3)
function dataUrlToBlob(dataUrl) {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while(n--){
      u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], {type:mime});
}

function injectDataIntoTab(tabId, dataPayload) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: (data) => {
      try {
        localStorage.setItem('shieldmail_shared_result', JSON.stringify(data));
        window.dispatchEvent(new CustomEvent('shieldmail_inject', { detail: { data: data } }));
      } catch (e) {
        console.error("ShieldMail injection error:", e);
      }
    },
    args: [dataPayload]
  }).catch((err) => {
    console.warn("Failed to inject script into tab:", err);
  });
}

function openDashboard(data) {
  const targetUrls = [
    'http://localhost:5173/*',
    'http://localhost:5174/*',
    'http://127.0.0.1:5173/*',
    'http://127.0.0.1:5174/*'
  ];

  chrome.tabs.query({ url: targetUrls }, (tabs) => {
    if (tabs && tabs.length > 0) {
      const tab = tabs[0];
      chrome.tabs.update(tab.id, { active: true }, () => {
        injectDataIntoTab(tab.id, data);
        setTimeout(() => injectDataIntoTab(tab.id, data), 300);
      });
    } else {
      chrome.tabs.create({ url: 'http://localhost:5173/' }, (tab) => {
        const listener = (tabId, changeInfo) => {
          if (tabId === tab.id && changeInfo.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            injectDataIntoTab(tab.id, data);
            setTimeout(() => injectDataIntoTab(tab.id, data), 500);
            setTimeout(() => injectDataIntoTab(tab.id, data), 1200);
          }
        };
        chrome.tabs.onUpdated.addListener(listener);
        // Safety timeout
        setTimeout(() => injectDataIntoTab(tab.id, data), 1500);
      });
    }
  });
}

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'SCAN_EMAIL') {
    processEmailScan(message.filename, message.fileDataUrl);
  } else if (message.action === 'SCAN_GMAIL_RAW') {
    processGmailRaw(message.messageId, message.rawEmail, sendResponse);
    return true; // Keep the message channel open for async sendResponse
  } else if (message.action === 'OPEN_DASHBOARD') {
    openDashboard(message.data);
  }
});
async function processGmailRaw(messageId, rawEmail, sendResponse) {
  try {
    const blob = new Blob([rawEmail], { type: 'message/rfc822' });
    const formData = new FormData();
    formData.append('file', blob, `gmail_${messageId}.eml`);

    const res = await fetch(`${API_BASE}/api/parse`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) throw new Error(`Server error ${res.status}`);
    const data = await res.json();
    
    // Send response back so the content script/popup can display it inline.
    sendResponse({ data });
  } catch (err) {
    console.error("ShieldMail Gmail Scan Error:", err);
    sendResponse({ error: err.message });
  }
}

async function processEmailScan(filename, fileDataUrl) {
  try {
    const blob = await dataUrlToBlob(fileDataUrl);
    const formData = new FormData();
    formData.append('file', blob, filename);

    // Run the scan in the background
    const res = await fetch(`${API_BASE}/api/parse`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      throw new Error(`Server error ${res.status}`);
    }

    const data = await res.json();
    
    // Save to local storage so popup can load it instantly
    chrome.storage.local.set({ lastScanResult: data });

    // Notify the popup if it's currently open
    chrome.runtime.sendMessage({ action: 'SCAN_COMPLETE', data: data }).catch(() => {});

    // Show a desktop notification
    const threatType = data.ai_ml_analysis?.classification?.primary_threat || 'clean';
    const isThreat = data.ai_ml_analysis?.classification?.is_threat || false;
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: isThreat ? '⚠️ Threat Detected!' : '✅ Email is Safe',
      message: `Finished scanning ${filename}. Threat type: ${threatType.replace(/_/g, ' ')}.`,
      priority: 2
    });

    // (Removed auto-open dashboard to let popup show results instead)

  } catch (err) {
    console.error("ShieldMail Background Scan Error:", err);
    chrome.runtime.sendMessage({ action: 'SCAN_ERROR', error: err.message }).catch(() => {});
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'ShieldMail Error',
      message: 'Failed to analyze email. Is the backend running?',
      priority: 2
    });
  }
}

// Auto-detect downloaded .eml files
chrome.downloads.onChanged.addListener(async (delta) => {
  if (!delta.state || delta.state.current !== 'complete') return;

  chrome.downloads.search({ id: delta.id }, (results) => {
    if (!results || !results.length) return;
    const downloadItem = results[0];

    if (!downloadItem.filename.toLowerCase().endsWith('.eml')) return;

    // We detect the download, and notify the user to click to scan
    chrome.notifications.create(`dl-${delta.id}`, {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: '🛡️ ShieldMail Auto-Detect',
      message: 'An .eml file was downloaded. Click the extension icon to upload and scan it.',
      priority: 1
    });
  });
});
