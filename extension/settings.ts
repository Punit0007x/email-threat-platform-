// Settings management for ShieldMail Extension

import { ExtensionSettings, DEFAULT_SETTINGS } from './types.js';

const SETTINGS_KEY = 'shieldmail_settings';
const SETTINGS_VERSION = 1;

export async function getSettings(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get([SETTINGS_KEY], (result) => {
      const stored = result[SETTINGS_KEY];
      if (stored && stored.version === SETTINGS_VERSION) {
        resolve({ ...DEFAULT_SETTINGS, ...stored.data });
      } else {
        // Migration from old local storage
        chrome.storage.local.get(['apiBaseUrl', 'autoScanEnabled'], (local) => {
          const migrated: ExtensionSettings = {
            ...DEFAULT_SETTINGS,
            apiBaseUrl: local.apiBaseUrl || DEFAULT_SETTINGS.apiBaseUrl,
            autoScanEnabled: local.autoScanEnabled ?? DEFAULT_SETTINGS.autoScanEnabled,
          };
          saveSettings(migrated).then(() => resolve(migrated));
        });
      }
    });
  });
}

export async function saveSettings(settings: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  return new Promise((resolve) => {
    chrome.storage.sync.set({
      [SETTINGS_KEY]: { version: SETTINGS_VERSION, data: updated },
    }, () => resolve(updated));
  });
}

export async function resetSettings(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    chrome.storage.sync.remove([SETTINGS_KEY], () => {
      chrome.storage.local.remove(['apiBaseUrl', 'autoScanEnabled'], () => {
        resolve(DEFAULT_SETTINGS);
      });
    });
  });
}

export function onSettingsChanged(callback: (settings: ExtensionSettings) => void): () => void {
  const listener = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
    if (area === 'sync' && changes[SETTINGS_KEY]) {
      getSettings().then(callback);
    }
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}