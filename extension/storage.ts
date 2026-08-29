// Storage utilities for scan history, queue, and cache

import { StoredScanResult, ScanQueueItem, ScanResult } from './types.js';

const HISTORY_KEY = 'shieldmail_history';
const QUEUE_KEY = 'shieldmail_queue';
const CACHE_KEY = 'shieldmail_cache';
const MAX_HISTORY = 100;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// ─── Scan History ───
export async function addToHistory(
  filename: string,
  result: ScanResult,
  source: 'upload' | 'gmail' | 'auto' = 'upload'
): Promise<void> {
  const item: StoredScanResult = {
    id: result.scan_id || crypto.randomUUID(),
    timestamp: Date.now(),
    filename,
    result,
    source,
  };

  return new Promise((resolve) => {
    chrome.storage.local.get([HISTORY_KEY], (data) => {
      const history: StoredScanResult[] = data[HISTORY_KEY] || [];
      history.unshift(item);
      // Trim to max
      if (history.length > MAX_HISTORY) history.splice(MAX_HISTORY);
      chrome.storage.local.set({ [HISTORY_KEY]: history }, resolve);
    });
  });
}

export async function getHistory(limit = 50): Promise<StoredScanResult[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get([HISTORY_KEY], (data) => {
      const history: StoredScanResult[] = data[HISTORY_KEY] || [];
      resolve(history.slice(0, limit));
    });
  });
}

export async function clearHistory(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove([HISTORY_KEY], resolve);
  });
}

export async function deleteHistoryItem(id: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get([HISTORY_KEY], (data) => {
      const history: StoredScanResult[] = (data[HISTORY_KEY] || []).filter((h) => h.id !== id);
      chrome.storage.local.set({ [HISTORY_KEY]: history }, resolve);
    });
  });
}

// ─── Scan Queue (Offline Support) ───
export async function enqueueScan(item: Omit<ScanQueueItem, 'id' | 'retries' | 'createdAt'>): Promise<string> {
  const id = crypto.randomUUID();
  const queueItem: ScanQueueItem = {
    ...item,
    id,
    retries: 0,
    createdAt: Date.now(),
  };

  return new Promise((resolve) => {
    chrome.storage.local.get([QUEUE_KEY], (data) => {
      const queue: ScanQueueItem[] = data[QUEUE_KEY] || [];
      queue.push(queueItem);
      chrome.storage.local.set({ [QUEUE_KEY]: queue }, () => resolve(id));
    });
  });
}

export async function getQueue(): Promise<ScanQueueItem[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get([QUEUE_KEY], (data) => {
      resolve(data[QUEUE_KEY] || []);
    });
  });
}

export async function updateQueueItem(id: string, updates: Partial<ScanQueueItem>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get([QUEUE_KEY], (data) => {
      const queue: ScanQueueItem[] = (data[QUEUE_KEY] || []).map((item) =>
        item.id === id ? { ...item, ...updates } : item
      );
      chrome.storage.local.set({ [QUEUE_KEY]: queue }, resolve);
    });
  });
}

export async function removeFromQueue(id: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get([QUEUE_KEY], (data) => {
      const queue: ScanQueueItem[] = (data[QUEUE_KEY] || []).filter((item) => item.id !== id);
      chrome.storage.local.set({ [QUEUE_KEY]: queue }, resolve);
    });
  });
}

export async function clearQueue(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove([QUEUE_KEY], resolve);
  });
}

// ─── Result Cache (for instant popup loads) ───
export interface CachedResult {
  scanId: string;
  result: ScanResult;
  cachedAt: number;
}

export async function cacheResult(scanId: string, result: ScanResult): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get([CACHE_KEY], (data) => {
      const cache: Record<string, CachedResult> = data[CACHE_KEY] || {};
      cache[scanId] = { scanId, result, cachedAt: Date.now() };
      chrome.storage.local.set({ [CACHE_KEY]: cache }, resolve);
    });
  });
}

export async function getCachedResult(scanId: string): Promise<ScanResult | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get([CACHE_KEY], (data) => {
      const cache: Record<string, CachedResult> = data[CACHE_KEY] || {};
      const cached = cache[scanId];
      if (cached && Date.now() - cached.cachedAt < CACHE_TTL) {
        resolve(cached.result);
      } else {
        resolve(null);
      }
    });
  });
}

export async function clearExpiredCache(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get([CACHE_KEY], (data) => {
      const cache: Record<string, CachedResult> = data[CACHE_KEY] || {};
      const now = Date.now();
      Object.keys(cache).forEach((key) => {
        if (now - cache[key].cachedAt >= CACHE_TTL) delete cache[key];
      });
      chrome.storage.local.set({ [CACHE_KEY]: cache }, resolve);
    });
  });
}