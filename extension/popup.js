/* ═══════════════════════════════════════════════════════════
   ShieldMail Extension — popup.js
   Handles file upload, API communication, and result rendering.
   ═══════════════════════════════════════════════════════════ */

const API_BASE = 'http://localhost:8000';

// ─── DOM references ───
const uploadZone   = document.getElementById('uploadZone');
const dropZoneInner= document.getElementById('dropZoneInner');
const btnScanGmail = document.getElementById('btnScanGmail');
const fileInput    = document.getElementById('fileInput');
const gmailStatusText = document.getElementById('gmailStatusText');

const loadingState = document.getElementById('loadingState');
const loadingStep  = document.getElementById('loadingStep');
const resultsPanel = document.getElementById('resultsPanel');
const errorState   = document.getElementById('errorState');
const errorText    = document.getElementById('errorText');
const statusDot    = document.getElementById('statusDot');
const btnReset = document.getElementById('btnReset');
const btnRetry = document.getElementById('btnRetry');
const btnDashboard = document.getElementById('btnDashboard');

let activeGmailTabId = null;

// ─── Boot: health check ───
(async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error();
  } catch {
    statusDot.querySelector('.status-dot').classList.remove('status-dot--online');
    statusDot.querySelector('.status-dot').classList.add('status-dot--offline');
    statusDot.querySelector('.status-label').textContent = 'Offline';
  }
})();

// Check if we are on a Gmail tab
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const currentTab = tabs[0];
  if (currentTab && currentTab.url && currentTab.url.includes('mail.google.com')) {
    activeGmailTabId = currentTab.id;
    gmailStatusText.textContent = "Ready to scan current email.";
    btnScanGmail.classList.remove('option-card--disabled');
  } else {
    btnScanGmail.classList.add('option-card--disabled');
    gmailStatusText.textContent = "Open Gmail to scan emails.";
  }
});

// ─── Interactions ───
dropZoneInner.addEventListener('click', () => {
  // On Linux/Windows, opening a file picker closes the extension popup.
  if (window.innerWidth <= 400 && window.location.protocol === 'chrome-extension:') {
    chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
  } else {
    fileInput.click();
  }
});

btnScanGmail.addEventListener('click', () => {
  if (!activeGmailTabId) return;
  showView('loading'); // Instantly show the loading UI
  startLoadingSteps();
  chrome.tabs.sendMessage(activeGmailTabId, { action: 'TRIGGER_GMAIL_SCAN' }, (response) => {
    if (chrome.runtime.lastError) {
      stopLoadingSteps();
      showError("Could not connect to Gmail. Make sure you are viewing an email and refresh the page.");
    } else if (response && response.error) {
      stopLoadingSteps();
      showError(response.error);
    } else if (response && response.data) {
      // The content script handled the scan and returned the result
      stopLoadingSteps();
      chrome.storage.local.set({ lastScanResult: response.data });
      renderResults(response.data);
      showView('results');
    }
  });
});

['dragenter', 'dragover'].forEach(evt => {
  dropZoneInner.addEventListener(evt, (e) => {
    e.preventDefault();
    dropZoneInner.classList.add('drag-over');
  });
});

['dragleave', 'drop'].forEach(evt => {
  dropZoneInner.addEventListener(evt, (e) => {
    e.preventDefault();
    dropZoneInner.classList.remove('drag-over');
  });
});

dropZoneInner.addEventListener('drop', (e) => {
  if (e.dataTransfer.files.length) {
    handleFile(e.dataTransfer.files[0]);
  }
});

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) handleFile(fileInput.files[0]);
  // Reset input so the same file can be selected again if needed
  fileInput.value = '';
});

// ─── Reset & Dashboard buttons ───
document.getElementById('btnReset').addEventListener('click', resetToUpload);
document.getElementById('btnRetry').addEventListener('click', resetToUpload);
document.getElementById('btnDashboard').addEventListener('click', () => {
  chrome.storage.local.get(['lastScanResult'], (res) => {
    if (res.lastScanResult) {
      chrome.tabs.create({ url: 'http://localhost:5173/' }, (tab) => {
        // Wait briefly for the tab to initialize
        setTimeout(() => {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (data) => {
              // 1. Set localStorage for immediate or next-reload pickup
              localStorage.setItem('shieldmail_shared_result', JSON.stringify(data));
              // 2. Dispatch event in case the app is already listening
              window.dispatchEvent(new CustomEvent('shieldmail_inject', { detail: { data } }));
            },
            args: [res.lastScanResult]
          });
        }, 800); // 800ms delay to ensure DOM is ready
      });
    } else {
      window.open('http://localhost:5173', '_blank');
    }
  });
});

// ─── State transitions ───
function showView(view) {
  uploadZone.style.display   = view === 'upload'  ? '' : 'none';
  loadingState.style.display  = view === 'loading' ? '' : 'none';
  resultsPanel.style.display  = view === 'results' ? '' : 'none';
  errorState.style.display    = view === 'error'   ? '' : 'none';
}

function resetToUpload() {
  fileInput.value = '';
  chrome.storage.local.remove(['lastScanResult']);
  showView('upload');
}

// ─── Loading step text rotation ───
const STEPS = [
  'Parsing headers & authentication',
  'Tracing origin relay path',
  'Geolocating sender IP',
  'Running AI/ML threat classifier',
  'Calculating fraud score',
  'Building attribution graph'
];
let stepIdx = 0;
let stepInterval = null;

function startLoadingSteps() {
  stepIdx = 0;
  loadingStep.textContent = STEPS[0];
  stepInterval = setInterval(() => {
    stepIdx = (stepIdx + 1) % STEPS.length;
    loadingStep.textContent = STEPS[stepIdx];
  }, 1800);
}
function stopLoadingSteps() {
  if (stepInterval) clearInterval(stepInterval);
}

// ─── File handler (Background Handoff) ───
async function handleFile(file) {
  if (!file.name.toLowerCase().endsWith('.eml')) {
    showError('Please upload a valid .eml file.');
    return;
  }

  showView('loading');
  startLoadingSteps();

  // Read file as Data URL to pass to background script
  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    
    // Hand off to background worker, but if it fails (due to Chrome MV3 wake-up bugs), do it directly.
    chrome.runtime.sendMessage({
      action: 'SCAN_EMAIL',
      filename: file.name,
      fileDataUrl: dataUrl
    }).catch(async (err) => {
      console.warn("Background worker unreachable. Falling back to direct scan.", err);
      // Fallback: Do the scan directly in the popup
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(`${API_BASE}/api/parse`, {
          method: 'POST',
          body: formData
        });

        stopLoadingSteps();
        if (!res.ok) {
          const apiErr = await res.json().catch(() => ({}));
          throw new Error(apiErr.detail || `Server error ${res.status}`);
        }

        const data = await res.json();
        renderResults(data);
        showView('results');
      } catch (fallbackErr) {
        stopLoadingSteps();
        showError(fallbackErr.message || 'Failed to analyze email. Is the backend running?');
      }
    });
  };
  reader.readAsDataURL(file);
}

// Listen for updates from background script
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'SCAN_COMPLETE') {
    stopLoadingSteps();
    renderResults(msg.data);
    showView('results');
  } else if (msg.action === 'SCAN_ERROR') {
    stopLoadingSteps();
    showError(msg.error || 'Failed to analyze email. Is the backend running?');
  }
});

// Check if there is already a saved result when popup opens
chrome.storage.local.get(['lastScanResult'], (result) => {
  if (result.lastScanResult) {
    renderResults(result.lastScanResult);
    showView('results');
  }
});

function showError(msg) {
  errorText.textContent = msg;
  showView('error');
}

// ─── Render results ───
function renderResults(data) {
  // 1. Score & Risk
  const fraud = data.fraud_assessment || {};
  const score = fraud.score ?? 0;
  const riskLevel = fraud.risk_level || 'Low';
  const reasons = fraud.reasons || [];

  animateScore(score);
  setRiskBadge(riskLevel);
  document.getElementById('verdictText').textContent =
    reasons[0] || 'No obvious threat indicators detected.';

  // 2. Detection Type
  const classification = (data.ai_ml_analysis || {}).classification || {};
  const primaryThreat  = classification.primary_threat || 'clean';
  const confidence     = classification.confidence ?? 0;
  const isThreat       = classification.is_threat ?? false;

  document.getElementById('threatType').textContent = formatThreat(primaryThreat);
  document.getElementById('threatType').className =
    `result-card__value ${isThreat ? 'text-threat' : 'text-safe'}`;

  document.getElementById('threatConfidence').textContent = `${Math.round(confidence * 100)}%`;
  
  const isThreatEl = document.getElementById('isThreat');
  isThreatEl.textContent = isThreat ? '⛔ Yes' : '✅ No';
  isThreatEl.className = `result-card__value ${isThreat ? 'text-threat' : 'text-safe'}`;

  // 3. Geolocation
  const trace = data.trace || {};
  const geo   = trace.best_guess_geolocation || {};
  const ip    = trace.best_guess_ip || '—';

  document.getElementById('originIP').textContent   = ip;
  document.getElementById('geoCountry').textContent = geo.country || 'Unknown';
  document.getElementById('geoCity').textContent     = [geo.city, geo.region].filter(Boolean).join(', ') || '—';
  document.getElementById('geoISP').textContent      = geo.isp_org || '—';
  document.getElementById('geoCoords').textContent   =
    (geo.lat != null && geo.long != null) ? `${geo.lat.toFixed(4)}, ${geo.long.toFixed(4)}` : '—';

  // 4. Relay Hops
  renderRelayHops(trace.hops || [], ip);

  // 5. Auth
  const auth = data.auth_analysis || {};
  setBadge('badgeSPF',   'SPF',   auth.spf);
  setBadge('badgeDKIM',  'DKIM',  auth.dkim);
  setBadge('badgeDMARC', 'DMARC', auth.dmarc);

  const aligned = auth.domain_alignment_pass;
  const alignedEl = document.getElementById('domainAligned');
  alignedEl.textContent = aligned === true ? '✅ Yes' : aligned === false ? '⛔ No' : '—';
  alignedEl.className = `result-card__value ${aligned === true ? 'text-safe' : aligned === false ? 'text-threat' : ''}`;
}

// ─── Helpers ───
function animateScore(target) {
  const numberEl = document.getElementById('scoreValue');
  const arcEl    = document.getElementById('scoreArc');
  const circumference = 2 * Math.PI * 52; // r=52

  // Color the arc based on score
  let strokeColor = '#10b981'; // green
  if (target > 70)      strokeColor = '#ef4444';
  else if (target > 30) strokeColor = '#f59e0b';
  arcEl.style.stroke = strokeColor;

  // Animate number
  let current = 0;
  const duration = 1000;
  const start = performance.now();

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    current = Math.round(eased * target);
    numberEl.textContent = current;

    // Animate arc
    const offset = circumference - (eased * target / 100) * circumference;
    arcEl.style.strokeDashoffset = offset;

    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function setRiskBadge(level) {
  const badge = document.getElementById('riskBadge');
  badge.textContent = `${level} Risk`;
  badge.className = 'score-card__risk';
  if (level === 'Low')         badge.classList.add('score-card__risk--low');
  else if (level === 'Medium') badge.classList.add('score-card__risk--medium');
  else                         badge.classList.add('score-card__risk--high');
}

function formatThreat(raw) {
  if (!raw || raw === 'clean') return 'Clean / Legitimate';
  return raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function setBadge(elId, label, status) {
  const el = document.getElementById(elId);
  const st = (status || 'none').toLowerCase();
  el.textContent = `${label} ${st.toUpperCase()}`;
  el.className = 'auth-badge';
  if (st === 'pass')                               el.classList.add('auth-badge--pass');
  else if (['fail', 'softfail'].includes(st))      el.classList.add('auth-badge--fail');
  else                                              el.classList.add('auth-badge--none');
}

function renderRelayHops(hops, originIP) {
  const container = document.getElementById('relayHops');

  if (!hops.length) {
    container.innerHTML = '<p class="result-card__empty">No relay hops detected</p>';
    return;
  }

  container.innerHTML = hops.map((hop, i) => {
    const ip     = hop.ip || 'private';
    const server = hop.server || '';
    const geo    = hop.geolocation || {};
    const isOrigin = ip === originIP;
    const isFinal  = i === hops.length - 1;

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

function truncate(str, len) {
  return str.length > len ? str.slice(0, len) + '…' : str;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
