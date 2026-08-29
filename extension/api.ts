// API client for ShieldMail backend communication

import { ScanResult, ScanErrorPayload, ExtensionSettings } from './types.js';
import { getSettings } from './settings.js';

let settingsCache: ExtensionSettings | null = null;

async function getApiBase(): Promise<string> {
  if (!settingsCache) {
    settingsCache = await getSettings();
  }
  return settingsCache.apiBaseUrl;
}

function createFormData(file: Blob, filename: string): FormData {
  const formData = new FormData();
  formData.append('file', file, filename);
  return formData;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const err = await response.json();
      detail = err.detail || err.message || detail;
    } catch {
      // Ignore JSON parse errors
    }
    throw new Error(detail);
  }
  return response.json();
}

export async function scanEmailFile(file: Blob, filename: string): Promise<ScanResult> {
  const base = await getApiBase();
  const formData = createFormData(file, filename);

  const response = await fetch(`${base}/api/parse`, {
    method: 'POST',
    body: formData,
    signal: AbortSignal.timeout(60000), // 60s timeout
  });

  return handleResponse<ScanResult>(response);
}

export async function scanRawEmail(rawEmail: string, messageId: string): Promise<ScanResult> {
  const base = await getApiBase();
  const blob = new Blob([rawEmail], { type: 'message/rfc822' });
  const formData = createFormData(blob, `gmail_${messageId}.eml`);

  const response = await fetch(`${base}/api/parse`, {
    method: 'POST',
    body: formData,
    signal: AbortSignal.timeout(60000),
  });

  return handleResponse<ScanResult>(response);
}

export async function checkHealth(): Promise<boolean> {
  try {
    const base = await getApiBase();
    const response = await fetch(`${base}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function invalidateSettingsCache(): void {
  settingsCache = null;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly context?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}