// Side Panel - Auto-threat detection results

import { ScanResult } from './types.js';
import { getCachedResult } from './storage.js';

let currentScanId: string | null = null;

// ─── Init ───
document.addEventListener('DOMContentLoaded', async () => {
  // Get scan ID from URL or storage
  const urlParams = new URLSearchParams(window.location.search);
  currentScanId = urlParams.get('scanId');
  
  if (!currentScanId) {
    // Try to get latest threat from storage
    chrome.storage.local.get(['lastThreatScanId'], (result) => {
      if (result.lastThreatScanId) {
        currentScanId = result.lastThreatScanId;
        loadResult();
      } else {
        showNoThreat();
      }
    });
  } else {
    loadResult();
  }

  // Listen for new results
  chrome.runtime.onMessage.addListener((msg: any) => {
    if (msg.type === 'AUTO_SCAN_RESULT' && msg.payload.isThreat) {
      currentScanId = msg.payload.messageId;
      loadResult();
    }
  });
});

async function loadResult(): Promise<void> {
  if (!currentScanId) { showNoThreat(); return; }
  
  const result = await getCachedResult(currentScanId);
  if (result) {
    renderResult(result);
  } else {
    showNoThreat();
  }
}

function showNoThreat(): void {
  document.getElementById('loading')!.style.display = 'none';
  document.getElementById('no-threat')!.style.display = 'block';
  document.getElementById('threat-content')!.style.display = 'none';
}

function renderResult(data: ScanResult): void {
  document.getElementById('loading')!.style.display = 'none';
  document.getElementById('no-threat')!.style.display = 'none';
  document.getElementById('threat-content')!.style.display = 'block';

  const fraud = data.fraud_assessment || {};
  const score = fraud.score ?? 0;
  const cls = (data.ai_ml_analysis || {}).classification || {};
  const threatType = cls.primary_threat || 'unknown';
  const confidence = cls.confidence ?? 0;

  // Score ring
  animateScore(score);
  document.getElementById('side-score')!.textContent = String(score);
  document.getElementById('side-risk')!.textContent = `${fraud.risk_level || 'Low'} Risk`;
  document.getElementById('side-risk')!.className = `side-risk ${(fraud.risk_level || 'Low').toLowerCase()}`;

  // Threat info
  document.getElementById('side-threat')!.textContent = formatThreat(threatType);
  document.getElementById('side-confidence')!.textContent = `${Math.round(confidence * 100)}%`;

  // Key indicators
  const reasons = fraud.reasons || [];
  const indicatorsEl = document.getElementById('side-indicators')!;
  if (reasons.length > 0) {
    indicatorsEl.innerHTML = reasons.map(r => `<li>${escapeHtml(r)}</li>`).join('');
  } else {
    indicatorsEl.innerHTML = '<li>No specific indicators</li>';
  }

  // Origin
  const trace = data.trace || {};
  const geo = trace.best_guess_geolocation || {};
  const ip = trace.best_guess_ip || '—';
  document.getElementById('side-ip')!.textContent = ip;
  document.getElementById('side-location')!.textContent = [geo.country, geo.city, geo.region].filter(Boolean).join(', ') || 'Unknown';
  document.getElementById('side-isp')!.textContent = geo.isp_org || '—';

  // Actions
  document.getElementById('side-open-dashboard')!.addEventListener('click', () => {
    chrome.runtime.sendMessage({ 
      type: 'OPEN_DASHBOARD', 
      payload: { scanId: currentScanId, data } 
    });
    window.close();
  });

  document.getElementById('side-dismiss')!.addEventListener('click', () => {
    window.close();
  });
}

function animateScore(target: number): void {
  const arcEl = document.getElementById('side-arc')!;
  const circumference = 2 * Math.PI * 40;

  let strokeColor = '#10b981';
  if (target > 70) strokeColor = '#ef4444';
  else if (target > 30) strokeColor = '#f59e0b';
  arcEl.style.stroke = strokeColor;

  let current = 0;
  const duration = 800;
  const start = performance.now();

  function step(now: number): void {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    current = Math.round(eased * target);
    document.getElementById('side-score')!.textContent = String(current);

    const offset = circumference - (eased * target / 100) * circumference;
    arcEl.style.strokeDashoffset = String(offset);

    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function formatThreat(raw: string): string {
  if (!raw || raw === 'clean') return 'Clean / Legitimate';
  return raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}