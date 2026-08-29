// Background Service Worker - ShieldMail Extension
// Handles: email scanning, auto-scan, notifications, badge, queue, settings

import { ExtensionMessage, ScanResult, ExtensionSettings, DEFAULT_SETTINGS } from './types.js';
import { getSettings, saveSettings, onSettingsChanged } from './settings.js';
import { 
  addToHistory, 
  getQueue, 
  enqueueScan, 
  updateQueueItem, 
  removeFromQueue,
  cacheResult 
} from './storage.js';
import { scanEmailFile, scanRawEmail, checkHealth, invalidateSettingsCache } from './api.js';

// ─── State ───
let settings: ExtensionSettings = DEFAULT_SETTINGS;
let activeScans = 0;
let threatBadgeCount = 0;
const scannedMessageIds = new Set<string>();
const MAX_CONCURRENT = 2;
let lastScanTimestamp = 0;
const SCAN_COOLDOWN = 2000;

// ─── Helpers ───
function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const bstr = atob(arr[1]);
  const n = bstr.length;
  const u8arr = new Uint8Array(n);
  for (let i = 0; i < n; i++) u8arr[i] = bstr.charCodeAt(i);
  return new Blob([u8arr], { type: mime });
}

async function updateBadge(): Promise<void> {
  const text = threatBadgeCount > 0 ? threatBadgeCount.toString() : '';
  await chrome.action.setBadgeText({ text });
  await chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
}

function isThreatResult(result: ScanResult): boolean {
  return result.ai_ml_analysis?.classification?.is_threat === true &&
         (result.fraud_assessment?.score ?? 0) >= (settings.threatThreshold ?? 30);
}

function getThreatType(result: ScanResult): string {
  return result.ai_ml_analysis?.classification?.primary_threat || 'unknown';
}

// ─── Scan Processing ───
async function processScan(
  scanFn: () => Promise<ScanResult>,
  context: { filename: string; source: 'upload' | 'gmail' | 'auto'; messageId?: string }
): Promise<ScanResult | null> {
  if (activeScans >= MAX_CONCURRENT) {
    throw new Error('Max concurrent scans reached');
  }

  activeScans++;
  try {
    const result = await scanFn();
    
    // Cache for instant popup
    await cacheResult(result.scan_id, result);
    
    // Add to history
    await addToHistory(context.filename, result, context.source);
    
    // Check for threat
    const isThreat = isThreatResult(result);
    
    if (isThreat) {
      threatBadgeCount++;
      await updateBadge();
      
      // Notify
      if (settings.notifyOnThreat) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: '⚠️ Threat Detected!',
          message: `${context.filename}: ${getThreatType(result).replace(/_/g, ' ')} (Score: ${result.fraud_assessment?.score})`,
          priority: 2,
        });
      }
      
      // Auto-open side panel if on Gmail
      if (context.source === 'auto') {
        openSidePanelWithResult(result);
      }
    }
    
    // Notify popup if open
    chrome.runtime.sendMessage({ 
      type: 'SCAN_COMPLETE', 
      payload: result 
    }).catch(() => {});
    
    return result;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    chrome.runtime.sendMessage({ 
      type: 'SCAN_ERROR', 
      payload: { error: msg, context: context.filename } 
    }).catch(() => {});
    throw error;
  } finally {
    activeScans--;
  }
}

// ─── Handlers ───
async function handleScanEmail(message: ExtensionMessage): Promise<void> {
  if (message.type !== 'SCAN_EMAIL') return;
  const { filename, dataUrl } = message.payload;
  
  await processScan(
    () => scanEmailFile(dataUrlToBlob(dataUrl), filename),
    { filename, source: 'upload' }
  );
}

async function handleScanGmailRaw(message: ExtensionMessage, sendResponse: (response: any) => void): Promise<void> {
  if (message.type !== 'SCAN_GMAIL_RAW') return;
  const { messageId, rawEmail } = message.payload;
  
  try {
    const result = await processScan(
      () => scanRawEmail(rawEmail, messageId),
      { filename: `gmail_${messageId}.eml`, source: 'gmail', messageId }
    );
    sendResponse({ data: result });
  } catch (error) {
    sendResponse({ error: error instanceof Error ? error.message : 'Scan failed' });
  }
}

async function handleAutoScan(message: ExtensionMessage): Promise<void> {
  // Triggered when Gmail email opens (legacy - content script now handles directly)
  if (message.type !== 'GMAIL_EMAIL_OPENED') return;
  
  if (!settings.autoScanEnabled || !settings.scanAllEmails) return;
  
  const now = Date.now();
  if (now - lastScanTimestamp < SCAN_COOLDOWN) return;
  lastScanTimestamp = now;
  
  // Query active Gmail tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true, url: 'https://mail.google.com/*' });
  if (!tab?.id) return;
  
  // Trigger scan in content script
  chrome.tabs.sendMessage(tab.id, { type: 'TRIGGER_GMAIL_SCAN' }, async (response) => {
    if (chrome.runtime.lastError || !response?.data) return;
    
    const result = response.data as ScanResult;
    const msgId = result.scan_id;
    
    if (scannedMessageIds.has(msgId)) return;
    scannedMessageIds.add(msgId);
    
    const isThreat = isThreatResult(result);
    
    if (isThreat) {
      threatBadgeCount++;
      await updateBadge();
      
      if (settings.notifyOnThreat) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: '⚠️ Threat Detected in Opened Email!',
          message: `${getThreatType(result).replace(/_/g, ' ')} — Score: ${result.fraud_assessment?.score}`,
          priority: 2,
        });
      }
      
      // Store for side panel
      await cacheResult(msgId, result);
      openSidePanelWithResult(result);
    }
    
    // Broadcast to any open popups
    chrome.runtime.sendMessage({ 
      type: 'AUTO_SCAN_RESULT', 
      payload: { messageId: msgId, result, isThreat } 
    }).catch(() => {});
  });
}

async function handleAutoScanResult(message: ExtensionMessage): Promise<void> {
  // New: content script directly scanned and sent result
  if (message.type !== 'AUTO_SCAN_RESULT') return;
  
  const { result, isThreat, messageId } = message.payload;
  
  if (scannedMessageIds.has(messageId)) return;
  scannedMessageIds.add(messageId);
  
  // Cache for side panel
  await cacheResult(messageId, result);
  
  if (isThreat) {
    threatBadgeCount++;
    await updateBadge();
    
    if (settings.notifyOnThreat) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: '⚠️ Threat Detected in Opened Email!',
        message: `${getThreatType(result).replace(/_/g, ' ')} — Score: ${result.fraud_assessment?.score}`,
        priority: 2,
      });
    }
    
    // Auto-open side panel
    await openSidePanelWithResult(result);
  }
  
  // Broadcast to any open popups
  chrome.runtime.sendMessage({ 
    type: 'AUTO_SCAN_RESULT', 
    payload: { messageId, result, isThreat } 
  }).catch(() => {});
}

async function handleOpenDashboard(message: ExtensionMessage): Promise<void> {
  if (message.type !== 'OPEN_DASHBOARD') return;
  
  const urls = [
    'http://localhost:5173/*',
    'http://localhost:5174/*',
    'http://127.0.0.1:5173/*',
    'http://127.0.0.1:5174/*',
  ];
  
  const tabs = await chrome.tabs.query({ url: urls });
  if (tabs.length > 0) {
    const tab = tabs[0];
    await chrome.tabs.update(tab.id, { active: true });
    injectDataIntoTab(tab.id, message.payload.data);
  } else {
    const tab = await chrome.tabs.create({ url: 'http://localhost:5173/' });
    const listener = async (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
      if (tabId === tab.id && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        injectDataIntoTab(tab.id, message.payload.data);
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  }
}

function injectDataIntoTab(tabId: number, data: ScanResult): void {
  chrome.scripting.executeScript({
    target: { tabId },
    func: (d) => {
      try {
        localStorage.setItem('shieldmail_shared_result', JSON.stringify(d));
        window.dispatchEvent(new CustomEvent('shieldmail_inject', { detail: { data: d } }));
      } catch (e) {
        console.error('Injection error:', e);
      }
    },
    args: [data],
  }).catch(console.warn);
}

async function openSidePanelWithResult(result: ScanResult): Promise<void> {
  // Open side panel on current Gmail tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true, url: 'https://mail.google.com/*' });
  if (tab?.id) {
    await chrome.sidePanel.setOptions({
      tabId: tab.id,
      path: 'sidepanel.html',
      enabled: true,
    });
    await chrome.sidePanel.open({ tabId: tab.id });
    // Data will be picked up by sidepanel via storage
    await cacheResult(result.scan_id, result);
  }
}

// ─── Message Router ───
chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  switch (message.type) {
    case 'SCAN_EMAIL':
      handleScanEmail(message);
      break;
    case 'SCAN_GMAIL_RAW':
      handleScanGmailRaw(message, sendResponse);
      return true; // Async
    case 'OPEN_DASHBOARD':
      handleOpenDashboard(message);
      break;
    case 'GMAIL_EMAIL_OPENED':
      handleAutoScan(message);
      break;
    case 'AUTO_SCAN_RESULT':
      handleAutoScanResult(message);
      break;
    case 'GET_SETTINGS':
      sendResponse({ settings });
      break;
    case 'UPDATE_SETTINGS':
      saveSettings(message.payload).then((s) => {
        settings = s;
        invalidateSettingsCache();
        sendResponse({ settings: s });
      });
      return true;
  }
});

// ─── Download Auto-Detect ───
chrome.downloads.onChanged.addListener(async (delta) => {
  if (!delta.state || delta.state.current !== 'complete') return;
  
  const results = await chrome.downloads.search({ id: delta.id });
  if (!results.length) return;
  
  const item = results[0];
  if (!item.filename?.toLowerCase().endsWith('.eml')) return;
  
  chrome.notifications.create(`dl-${delta.id}`, {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: '🛡️ ShieldMail Auto-Detect',
    message: 'An .eml file was downloaded. Click the extension icon to scan it.',
    priority: 1,
  });
});

// ─── Settings Sync ───
onSettingsChanged((newSettings) => {
  settings = newSettings;
  invalidateSettingsCache();
});

// ─── Initialize ───
async function initialize(): Promise<void> {
  settings = await getSettings();
  invalidateSettingsCache();
  
  // Check health on startup
  const healthy = await checkHealth();
  console.log('[ShieldMail] Backend health:', healthy ? 'OK' : 'UNREACHABLE');
  
  // Process pending queue
  const queue = await getQueue();
  for (const item of queue) {
    if (item.retries >= 3) continue;
    try {
      if (item.type === 'upload') {
        await processScan(
          () => scanEmailFile(new Blob([item.payload.fileDataUrl]), item.payload.filename),
          { filename: item.payload.filename, source: 'upload' }
        );
      }
      await removeFromQueue(item.id);
    } catch {
      await updateQueueItem(item.id, { retries: item.retries + 1 });
    }
  }
  
  // Periodic health check
  setInterval(async () => {
    const healthy = await checkHealth();
    if (!healthy) console.warn('[ShieldMail] Backend unreachable');
  }, 60000);
  
  // Cleanup old cache
  setInterval(() => {
    // Handled by storage.ts TTL
  }, 3600000);
}

initialize();

// ─── Keyboard Shortcut Handler ───
chrome.commands.onCommand.addListener((command) => {
  if (command === 'scan-gmail') {
    chrome.tabs.query({ active: true, currentWindow: true, url: 'https://mail.google.com/*' }, ([tab]) => {
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'TRIGGER_GMAIL_SCAN' });
      }
    });
  }
});