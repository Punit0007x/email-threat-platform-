// Shared types for ShieldMail Extension
// Compiled to JS via esbuild for MV3 compatibility

// ─── Settings ───
export interface ExtensionSettings {
  apiBaseUrl: string;
  autoScanEnabled: boolean;
  notifyOnThreat: boolean;
  scanAllEmails: boolean;
  threatThreshold: number; // 0-100, minimum score to trigger notification
  maxConcurrentScans: number;
  retentionDays: number;
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  apiBaseUrl: 'http://localhost:8000',
  autoScanEnabled: true,
  notifyOnThreat: true,
  scanAllEmails: true,
  threatThreshold: 30,
  maxConcurrentScans: 2,
  retentionDays: 30,
};

// ─── Message Passing ───
export type ExtensionMessage =
  | { type: 'SCAN_EMAIL'; payload: ScanEmailPayload }
  | { type: 'SCAN_GMAIL_RAW'; payload: ScanGmailRawPayload }
  | { type: 'TRIGGER_GMAIL_SCAN' }
  | { type: 'OPEN_DASHBOARD'; payload: OpenDashboardPayload }
  | { type: 'GET_SETTINGS' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<ExtensionSettings> }
  | { type: 'SCAN_COMPLETE'; payload: ScanResult }
  | { type: 'SCAN_ERROR'; payload: ScanErrorPayload }
  | { type: 'AUTO_SCAN_RESULT'; payload: AutoScanResultPayload }
  | { type: 'BADGE_UPDATE'; payload: BadgeUpdatePayload };

export interface ScanEmailPayload {
  filename: string;
  dataUrl: string;
}

export interface ScanGmailRawPayload {
  messageId: string;
  rawEmail: string;
}

export interface OpenDashboardPayload {
  scanId: string;
  data: ScanResult;
}

export interface ScanErrorPayload {
  error: string;
  context?: string;
}

export interface AutoScanResultPayload {
  messageId: string;
  result: ScanResult;
  isThreat: boolean;
}

export interface BadgeUpdatePayload {
  count: number;
  text?: string;
}

// ─── API Responses ───
export interface ScanResult {
  scan_id: string;
  timestamp: string;
  fraud_assessment: FraudAssessment;
  ai_ml_analysis: AIMLAnalysis;
  trace: TraceResult;
  auth_analysis: AuthAnalysis;
  header_analysis: HeaderAnalysis;
  raw_headers?: Record<string, string>;
}

export interface FraudAssessment {
  score: number;
  risk_level: 'Low' | 'Medium' | 'High' | 'Critical';
  reasons: string[];
  indicators: FraudIndicator[];
}

export interface FraudIndicator {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  evidence?: string;
}

export interface AIMLAnalysis {
  classification: Classification;
  embeddings?: number[];
  model_version: string;
}

export interface Classification {
  primary_threat: string;
  confidence: number;
  is_threat: boolean;
  all_scores: Record<string, number>;
}

export interface TraceResult {
  hops: RelayHop[];
  best_guess_ip: string;
  best_guess_geolocation: Geolocation;
  trace_confidence: number;
}

export interface RelayHop {
  ip: string;
  server?: string;
  helo?: string;
  delay_ms?: number;
  geolocation?: Geolocation;
  asn?: ASNInfo;
  auth_results?: AuthResults;
}

export interface Geolocation {
  country?: string;
  country_code?: string;
  region?: string;
  city?: string;
  lat?: number;
  long?: number;
  isp_org?: string;
  timezone?: string;
}

export interface ASNInfo {
  asn: number;
  name: string;
  route?: string;
  type: 'isp' | 'hosting' | 'education' | 'government' | 'business';
}

export interface AuthResults {
  spf?: 'pass' | 'fail' | 'softfail' | 'neutral' | 'none';
  dkim?: 'pass' | 'fail' | 'none';
  dmarc?: 'pass' | 'fail' | 'none';
  arc?: 'pass' | 'fail' | 'none';
  domain_alignment_pass?: boolean;
}

export interface AuthAnalysis {
  spf: 'pass' | 'fail' | 'softfail' | 'neutral' | 'none';
  dkim: 'pass' | 'fail' | 'none';
  dmarc: 'pass' | 'fail' | 'none';
  arc: 'pass' | 'fail' | 'none';
  domain_alignment_pass: boolean | null;
  details: Record<string, unknown>;
}

export interface HeaderAnalysis {
  anomalies: HeaderAnomaly[];
  routing_consistency: number;
  timing_anomalies: TimingAnomaly[];
}

export interface HeaderAnomaly {
  header: string;
  issue: string;
  severity: 'low' | 'medium' | 'high';
  expected?: string;
  actual?: string;
}

export interface TimingAnomaly {
  hop_index: number;
  expected_range_ms: [number, number];
  actual_ms: number;
  deviation_factor: number;
}

// ─── Gmail Content Script ───
export interface ExtractedEmail {
  headers: string;
  from: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  messageId: string | null;
  senderName: string;
  recipient: string;
  date: string;
}

export interface GmailSelectors {
  sender: string[];
  subject: string[];
  recipient: string[];
  date: string[];
  body: string[];
  messageId: string[];
}

// ─── Storage ───
export interface StoredScanResult {
  id: string;
  timestamp: number;
  filename: string;
  result: ScanResult;
  source: 'upload' | 'gmail' | 'auto';
}

export interface ScanQueueItem {
  id: string;
  type: 'upload' | 'gmail';
  payload: ScanEmailPayload | ScanGmailRawPayload;
  retries: number;
  createdAt: number;
}

// ─── Utilities ───
export type ThreatLevel = 'clean' | 'suspicious' | 'malicious' | 'phishing' | 'bec' | 'malware' | 'spam';

export function isThreatLevel(level: string): level is ThreatLevel {
  return ['clean', 'suspicious', 'malicious', 'phishing', 'bec', 'malware', 'spam'].includes(level);
}

export function formatThreatType(raw: string): string {
  if (!raw || raw === 'clean') return 'Clean / Legitimate';
  return raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getRiskColor(score: number): string {
  if (score > 70) return '#ef4444';
  if (score > 30) return '#f59e0b';
  return '#10b981';
}