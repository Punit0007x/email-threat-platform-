// Popup Entry Point - ShieldMail Extension
// Handles: file upload, Gmail scan, history, settings, results display

import { ExtensionMessage, ScanResult, ExtensionSettings, DEFAULT_SETTINGS } from './types.js';
import { getSettings, saveSettings, onSettingsChanged } from './settings.js';
import { getHistory, addToHistory, deleteHistoryItem, clearHistory } from './storage.js';
import { scanEmailFile, checkHealth } from './api.js';

// ─── State ───
let settings: ExtensionSettings = DEFAULT_SETTINGS;
let currentResult: ScanResult | null = null;

// ─── DOM References ───
const uploadZone = document.getElementById('uploadZone')!;
const dropZoneInner = document.getElementById('dropZoneInner')!;
const btnScanGmail = document.getElementById('btnScanGmail')!;
const fileInput = document.getElementById('fileInput') as HTMLInputElement;
const gmailStatusText = document.getElementById('gmailStatusText')!;
const loadingState = document.getElementById('loadingState')!;
const loadingStep = document.getElementById('loadingStep')!;
const resultsPanel = document.getElementById('resultsPanel')!;
const errorState = document.getElementById('errorState')!;
const errorText = document.getElementById('errorText')!;
const statusDot = document.getElementById('statusDot')!;
const btnReset = document.getElementById('btnReset')!;
const btnRetry = document.getElementById('btnRetry')!;
const btnDashboard = document.getElementById('btnDashboard')!;
const btnHistory = document.getElementById('btnHistory')!;
const btnSettings = document.getElementById('btnSettings')!;
const historyPanel = document.getElementById('historyPanel')!;
const historyList = document.getElementById('historyList')!;
const settingsPanel = document.getElementById('settingsPanel')!;
const closeHistory = document.getElementById('closeHistory')!;
const closeSettings = document.getElementById('closeSettings')!;

const STEPS = [
  'Parsing headers & authentication',
  'Tracing origin relay path',
  'Geolocating sender IP',
  'Running AI/ML threat classifier',
  'Calculating fraud score',
  'Building attribution graph',
];

// ─── Init ───
document.addEventListener('DOMContentLoaded', async () => {
  await initialize();
  setupEventListeners();
  startHealthCheck();
});

async function initialize(): Promise<void> {
  settings = await getSettings();
  onSettingsChanged((s) => { settings = s; renderSettings(); });
  
  // Check if on Gmail
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.url?.includes('mail.google.com')) {
    btnScanGmail.classList.remove('option-card--disabled');
    gmailStatusText.textContent = 'Ready to scan current email.';
  } else {
    btnScanGmail.classList.add('option-card--disabled');
    gmailStatusText.textContent = 'Open Gmail to scan emails.';
  }

  // Health check
  const healthy = await checkHealth();
  updateHealthStatus(healthy);

  // Listen for background scan results
  chrome.runtime.onMessage.addListener((msg: ExtensionMessage) => {
    if (msg.type === 'SCAN_COMPLETE') {
      stopLoading();
      showResults(msg.payload);
    } else if (msg.type === 'SCAN_ERROR') {
      stopLoading();
      showError(msg.payload.error);
    } else if (msg.type === 'AUTO_SCAN_RESULT') {
      if (msg.payload.isThreat) {
        showResults(msg.payload.result);
      }
    }
  });
}

function setupEventListeners(): void {
  // Upload zone
  dropZoneInner.addEventListener('click', () => fileInput.click());
  dropZoneInner.addEventListener('dragover', (e) => { e.preventDefault(); dropZoneInner.classList.add('drag-over'); });
  dropZoneInner.addEventListener('dragleave', () => dropZoneInner.classList.remove('drag-over'));
  dropZoneInner.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZoneInner.classList.remove('drag-over');
    if (e.dataTransfer?.files[0]) handleFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) handleFile(fileInput.files[0]); fileInput.value = ''; });

  // Buttons
  btnScanGmail.addEventListener('click', scanGmail);
  btnReset.addEventListener('click', resetToUpload);
  btnRetry.addEventListener('click', resetToUpload);
  btnDashboard.addEventListener('click', openDashboard);
  btnHistory.addEventListener('click', toggleHistory);
  btnSettings.addEventListener('click', toggleSettings);
  closeHistory?.addEventListener('click', () => historyPanel?.classList.add('hidden'));
  closeSettings?.addEventListener('click', () => settingsPanel?.classList.add('hidden'));

  // Settings form
  document.getElementById('settingsForm')?.addEventListener('submit', saveSettingsHandler);
  document.getElementById('clearHistoryBtn')?.addEventListener('click', async () => {
    await clearHistory();
    renderHistory();
  });
}

// ─── File Handling ───
async function handleFile(file: File): Promise<void> {
  if (!file.name.toLowerCase().endsWith('.eml')) {
    showError('Please upload a valid .eml file.');
    return;
  }

  showLoading();
  startLoadingSteps();

  try {
    const result = await scanEmailFile(file, file.name);
    await addToHistory(file.name, result, 'upload');
    stopLoading();
    showResults(result);
  } catch (err) {
    stopLoading();
    showError(err instanceof Error ? err.message : 'Failed to analyze email. Is the backend running?');
  }
}

// ─── Gmail Scan ───
async function scanGmail(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true, url: 'https://mail.google.com/*' });
  if (!tab?.id) return;

  showLoading();
  startLoadingSteps();

  chrome.tabs.sendMessage(tab.id, { type: 'TRIGGER_GMAIL_SCAN' }, (response) => {
    if (chrome.runtime.lastError) {
      stopLoading();
      showError('Could not connect to Gmail. Refresh the page and try again.');
    } else if (response?.error) {
      stopLoading();
      showError(response.error);
    } else if (response?.data) {
      stopLoading();
      showResults(response.data);
    }
  });
}

// ─── UI State ───
function showView(view: 'upload' | 'loading' | 'results' | 'error' | 'history' | 'settings'): void {
  uploadZone.style.display = view === 'upload' ? '' : 'none';
  loadingState.style.display = view === 'loading' ? '' : 'none';
  resultsPanel.style.display = view === 'results' ? '' : 'none';
  errorState.style.display = view === 'error' ? '' : 'none';
  historyPanel?.classList.toggle('hidden', view !== 'history');
  settingsPanel?.classList.toggle('hidden', view !== 'settings');
}

function resetToUpload(): void {
  fileInput.value = '';
  currentResult = null;
  showView('upload');
}

let stepInterval: number;
let stepIdx = 0;

function startLoadingSteps(): void {
  stepIdx = 0;
  loadingStep.textContent = STEPS[0];
  stepInterval = window.setInterval(() => {
    stepIdx = (stepIdx + 1) % STEPS.length;
    loadingStep.textContent = STEPS[stepIdx];
  }, 1800);
}

function stopLoading(): void {
  if (stepInterval) clearInterval(stepInterval);
}

function showLoading(): void { showView('loading'); }
function showError(msg: string): void { errorText.textContent = msg; showView('error'); }

// ─── Results Rendering ───
function showResults(data: ScanResult): void {
  currentResult = data;
  renderResults(data);
  showView('results');
}

function renderResults(data: ScanResult): void {
  // Score & Risk
  const fraud = data.fraud_assessment || {};
  const score = fraud.score ?? 0;
  const riskLevel = fraud.risk_level || 'Low';
  const reasons = fraud.reasons || [];

  animateScore(score);
  setRiskBadge(riskLevel);

  const verdictEl = document.getElementById('verdictText')!;
  if (reasons.length > 0) {
    verdictEl.innerHTML = reasons.map(r => `• ${escapeHtml(r)}`).join('<br/>');
  } else {
    verdictEl.textContent = 'No obvious threat indicators detected.';
  }

  // Detection
  const cls = (data.ai_ml_analysis || {}).classification || {};
  const primaryThreat = cls.primary_threat || 'clean';
  const confidence = cls.confidence ?? 0;
  const isThreat = cls.is_threat ?? false;

  document.getElementById('threatType')!.textContent = formatThreat(primaryThreat);
  document.getElementById('threatType')!.className = `result-card__value ${isThreat ? 'text-threat' : 'text-safe'}`;
  document.getElementById('threatConfidence')!.textContent = `${Math.round(confidence * 100)}%`;
  
  const isThreatEl = document.getElementById('isThreat')!;
  isThreatEl.textContent = isThreat ? '⛔ Yes' : '✅ No';
  isThreatEl.className = `result-card__value ${isThreat ? 'text-threat' : 'text-safe'}`;

  // Geolocation
  const trace = data.trace || {};
  const geo = trace.best_guess_geolocation || {};
  const ip = trace.best_guess_ip || (trace.hops?.[0]?.ip || '—');

  document.getElementById('originIP')!.textContent = ip;
  document.getElementById('geoCountry')!.textContent = geo.country || 'Global / Cloud Origin';
  document.getElementById('geoCity')!.textContent = [geo.city, geo.region].filter(Boolean).join(', ') || geo.city || geo.country || 'Resolved Origin';
  document.getElementById('geoISP')!.textContent = geo.isp_org || 'Mail Infrastructure Host';
  document.getElementById('geoCoords')!.textContent = (geo.lat != null && geo.long != null) ? `${Number(geo.lat).toFixed(4)}, ${Number(geo.long).toFixed(4)}` : '—';

  // Relay Hops
  renderRelayHops(trace.hops || [], ip);

  // Auth
  const auth = data.auth_analysis || {};
  setBadge('badgeSPF', 'SPF', auth.spf);
  setBadge('badgeDKIM', 'DKIM', auth.dkim);
  setBadge('badgeDMARC', 'DMARC', auth.dmarc);

  const aligned = auth.domain_alignment_pass;
  const alignedEl = document.getElementById('domainAligned')!;
  alignedEl.textContent = aligned === true ? '✅ Yes' : aligned === false ? '⛔ No' : '—';
  alignedEl.className = `result-card__value ${aligned === true ? 'text-safe' : aligned === false ? 'text-threat' : ''}`;
}

// ─── History ───
async function toggleHistory(): Promise<void> {
  if (historyPanel?.classList.contains('hidden')) {
    await renderHistory();
    showView('history');
  } else {
    showView('upload');
  }
}

async function renderHistory(): Promise<void> {
  const history = await getHistory(20);
  if (!historyList) return;

  if (history.length === 0) {
    historyList.innerHTML = '<p class="result-card__empty">No scan history yet</p>';
    return;
  }

  historyList.innerHTML = history.map(item => {
    const score = item.result.fraud_assessment?.score ?? 0;
    const threat = item.result.ai_ml_analysis?.classification?.primary_threat || 'clean';
    const isThreat = item.result.ai_ml_analysis?.classification?.is_threat;
    const date = new Date(item.timestamp).toLocaleString();

    return `
      <div class="history-item" data-id="${item.id}">
        <div class="history-item__main">
          <span class="history-item__filename">${escapeHtml(item.filename)}</span>
          <span class="history-item__source">${item.source}</span>
        </div>
        <div class="history-item__meta">
          <span class="history-item__score ${score > 70 ? 'high' : score > 30 ? 'medium' : 'low'}">${score}</span>
          <span class="history-item__threat ${isThreat ? 'threat' : ''}">${formatThreat(threat)}</span>
          <span class="history-item__date">${date}</span>
          <button class="history-item__delete" data-id="${item.id}" title="Delete">×</button>
        </div>
      </div>
    `;
  }).join('');

  // Add delete handlers
  historyList.querySelectorAll('.history-item__delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = (e.target as HTMLElement).dataset.id!;
      await deleteHistoryItem(id);
      renderHistory();
    });
  });

  // Click to view
  historyList.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.id!;
    const entry = history.find(h => h.id === id);
    if (entry) showResults(entry.result);
    });
  });
}

// ─── Settings ───
function toggleSettings(): void {
  if (settingsPanel?.classList.contains('hidden')) {
    renderSettings();
    showView('settings');
  } else {
    showView('upload');
  }
}

function renderSettings(): void {
  if (!settingsPanel) return;
  
  const apiUrlInput = document.getElementById('apiUrl') as HTMLInputElement;
  const autoScanInput = document.getElementById('autoScan') as HTMLInputElement;
  const notifyInput = document.getElementById('notifyThreat') as HTMLInputElement;
  const scanAllInput = document.getElementById('scanAll') as HTMLInputElement;
  const thresholdInput = document.getElementById('threatThreshold') as HTMLInputElement;

  if (apiUrlInput) apiUrlInput.value = settings.apiBaseUrl;
  if (autoScanInput) autoScanInput.checked = settings.autoScanEnabled;
  if (notifyInput) notifyInput.checked = settings.notifyOnThreat;
  if (scanAllInput) scanAllInput.checked = settings.scanAllEmails;
  if (thresholdInput) thresholdInput.value = String(settings.threatThreshold);
}

async function saveSettingsHandler(e: Event): Promise<void> {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  const formData = new FormData(form);

  const newSettings: Partial<ExtensionSettings> = {
    apiBaseUrl: formData.get('apiUrl') as string || settings.apiBaseUrl,
    autoScanEnabled: formData.has('autoScan'),
    notifyOnThreat: formData.has('notifyThreat'),
    scanAllEmails: formData.has('scanAll'),
    threatThreshold: parseInt(formData.get('threatThreshold') as string, 10) || settings.threatThreshold,
  };

  await saveSettings(newSettings);
  settings = { ...settings, ...newSettings };
  showView('upload');
}

// ─── Dashboard ───
function openDashboard(): void {
  if (currentResult) {
    chrome.runtime.sendMessage({ type: 'OPEN_DASHBOARD', payload: { scanId: currentResult.scan_id, data: currentResult } });
  } else {
    chrome.tabs.create({ url: 'http://localhost:5173/' });
  }
}

// ─── Health Check ───
async function startHealthCheck(): Promise<void> {
  const healthy = await checkHealth();
  updateHealthStatus(healthy);
  setInterval(async () => {
    const h = await checkHealth();
    updateHealthStatus(h);
  }, 60000);
}

function updateHealthStatus(healthy: boolean): void {
  const dot = statusDot.querySelector('.status-dot')!;
  const label = statusDot.querySelector('.status-label')!;
  if (healthy) {
    dot.classList.remove('status-dot--offline');
    dot.classList.add('status-dot--online');
    label.textContent = 'Online';
  } else {
    dot.classList.remove('status-dot--online');
    dot.classList.add('status-dot--offline');
    label.textContent = 'Offline';
  }
}

// ─── Helpers ───
function animateScore(target: number): void {
  const numberEl = document.getElementById('scoreValue')!;
  const arcEl = document.getElementById('scoreArc')!;
  const circumference = 2 * Math.PI * 52;

  let strokeColor = '#10b981';
  if (target > 70) strokeColor = '#ef4444';
  else if (target > 30) strokeColor = '#f59e0b';
  arcEl.style.stroke = strokeColor;

  let current = 0;
  const duration = 1000;
  const start = performance.now();

  function step(now: number): void {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    current = Math.round(eased * target);
    numberEl.textContent = String(current);

    const offset = circumference - (eased * target / 100) * circumference;
    arcEl.style.strokeDashoffset = String(offset);

    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function setRiskBadge(level: string): void {
  const badge = document.getElementById('riskBadge')!;
  badge.textContent = `${level} Risk`;
  badge.className = 'score-card__risk';
  if (level === 'Low') badge.classList.add('score-card__risk--low');
  else if (level === 'Medium') badge.classList.add('score-card__risk--medium');
  else badge.classList.add('score-card__risk--high');
}

function formatThreat(raw: string): string {
  if (!raw || raw === 'clean') return 'Clean / Legitimate';
  return raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function setBadge(elId: string, label: string, status: string): void {
  const el = document.getElementById(elId)!;
  const st = (status || 'none').toLowerCase();
  el.textContent = `${label} ${st.toUpperCase()}`;
  el.className = 'auth-badge';
  if (st === 'pass') el.classList.add('auth-badge--pass');
  else if (['fail', 'softfail'].includes(st)) el.classList.add('auth-badge--fail');
  else el.classList.add('auth-badge--none');
}

function renderRelayHops(hops: any[], originIP: string): void {
  const container = document.getElementById('relayHops')!;

  if (!hops.length) {
    container.innerHTML = '<p class="result-card__empty">No relay hops detected</p>';
    return;
  }

  container.innerHTML = hops.map((hop, i) => {
    const ip = hop.ip || 'private';
    const server = hop.server || '';
    const geo = hop.geolocation || {};
    const isOrigin = ip === originIP;
    const isFinal = i === hops.length - 1;

    let dotClass = 'relay-hop__dot';
    if (isOrigin) dotClass += ' relay-hop__dot--origin';
    else if (isFinal) dotClass += ' relay-hop__dot--final';

    const geoStr = [geo.city, geo.country].filter(Boolean).join(', ');

    return `
      <div class="relay-hop">
        <div class="${dotClass}"></div>
        <div class="relay-hop__info">
          <div class="relay-hop__ip">${escapeHtml(ip)}</div>
          ${server ? `<div class="relay-hop__server" title="${escapeHtml(server)}">${escapeHtml(truncate(server, 42))}</div>` : ''}
          ${geoStr ? `<div class="relay-hop__geo">📍 ${escapeHtml(geoStr)}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + '…' : str;
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}