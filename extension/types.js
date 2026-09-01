// Shared types for ShieldMail Extension
// Compiled to JS via esbuild for MV3 compatibility
export const DEFAULT_SETTINGS = {
    apiBaseUrl: 'https://erakshak.duckdns.org',
    autoScanEnabled: true,
    notifyOnThreat: true,
    scanAllEmails: true,
    threatThreshold: 30,
    maxConcurrentScans: 2,
    retentionDays: 30,
};
export function isThreatLevel(level) {
    return ['clean', 'suspicious', 'malicious', 'phishing', 'bec', 'malware', 'spam'].includes(level);
}
export function formatThreatType(raw) {
    if (!raw || raw === 'clean')
        return 'Clean / Legitimate';
    return raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
export function getRiskColor(score) {
    if (score > 70)
        return '#ef4444';
    if (score > 30)
        return '#f59e0b';
    return '#10b981';
}
