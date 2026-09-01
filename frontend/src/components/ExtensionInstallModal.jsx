import React, { useEffect, useState } from 'react';
import { X, Download, FolderOpen, Copy, Check, Box, Zap } from 'lucide-react';

const ZIP_URL = '/erakshak-extension.zip';
const EXTENSION_NAME = 'eRakshak — AI Email Threat Detector';

function Step({ n, title, children }) {
  return (
    <li className="flex gap-3">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-sm flex items-center justify-center">
        {n}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-slate-700">{title}</p>
        <div className="text-sm text-slate-500 mt-1">{children}</div>
      </div>
    </li>
  );
}

export default function ExtensionInstallModal({ isOpen, onClose }) {
  const [downloaded, setDownloaded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDownloaded(false);
      setCopied(false);
      const ext = chromeExtensionDownloadLink();
      if (ext) {
        ext.click();
        setDownloaded(true);
      }
    }
  }, [isOpen]);

  const chromeExtensionDownloadLink = () => {
    return document.getElementById('erakshak-ext-download');
  };

  const handleManualDownload = () => {
    const a = document.createElement('a');
    a.href = ZIP_URL;
    a.download = 'erakshak-extension.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setDownloaded(true);
  };

  const copyUnpackCmd = async () => {
    const text = `cd ~/Downloads && rm -rf erakshak-extension && mkdir -p erakshak-extension && unzip erakshak-extension.zip -d erakshak-extension && open -R erakshak-extension/extension`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-cyan-600 to-emerald-600 text-white px-6 py-5 flex items-start justify-between rounded-t-2xl">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
              <Box className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">{EXTENSION_NAME}</h2>
              <p className="text-sm text-cyan-100 mt-0.5">Chrome browser extension · connected to the live eRakshak backend</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <a
            id="erakshak-ext-download"
            href={ZIP_URL}
            download="erakshak-extension.zip"
            className="hidden"
            aria-hidden="true"
          />

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 font-semibold text-emerald-700">
                <Zap className="w-4 h-4" />
                Extension Automation Active
              </div>
              <p className="text-sm text-emerald-600 mt-0.5">
                Auto-scans Gmail and .eml files for phishing, BEC &amp; malware using the live{' '}
                <code className="px-1 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs">erakshak.duckdns.org</code> API.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button
              onClick={handleManualDownload}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-colors"
            >
              <Download className="w-4 h-4" />
              {downloaded ? 'Downloaded Again' : 'Download Extension (.zip)'}
            </button>
            <button
              onClick={copyUnpackCmd}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy setup command'}
            </button>
          </div>

          {downloaded && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 mb-4 flex items-center gap-2 text-sm text-emerald-700">
              <Check className="w-4 h-4" />
              Download started — your .zip should be in your Downloads folder. Follow the steps below to install.
            </div>
          )}

          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-slate-400" />
            How to install in Chrome (1-time)
          </h3>

          <ol className="space-y-4">
            <Step n={1} title="Unzip the downloaded file">
              Extract <code className="px-1 py-0.5 rounded bg-slate-100 text-slate-700 text-xs">erakshak-extension.zip</code>.
              You should see an <code className="px-1 py-0.5 rounded bg-slate-100 text-slate-700 text-xs">extension</code> folder.
              Use the <em>Copy setup command</em> button above for a one-liner on macOS.
            </Step>
            <Step n={2} title="Open the Extensions page">
              Open a new tab and go to{' '}
              <code className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-xs">chrome://extensions</code>.
            </Step>
            <Step n={3} title="Turn on Developer mode">
              Toggle <strong>Developer mode</strong> (top-right corner of the Extensions page).
            </Step>
            <Step n={4} title="Load the extension">
              Click <strong>Load unpacked</strong> and select the <code className="px-1 py-0.5 rounded bg-slate-100 text-slate-700 text-xs">extension</code> folder.
            </Step>
            <Step n={5} title="Done — pin it and scan">
              The <strong>eRakshak</strong> icon appears in your toolbar. Pin it, open any email or Gmail, and it will auto-analyze threats.
            </Step>
          </ol>

          <div className="mt-6 rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-500">
            <p className="flex items-center gap-2 font-medium text-slate-600 mb-1">
              <Box className="w-3.5 h-3.5" />
              About auto-install
            </p>
            <p>
              Chrome only allows a website to install an extension instantly from the Chrome Web Store. For self-hosted
              extensions, the manual 1-time <em>Load unpacked</em> step above is the only supported path — after that the
              extension updates automatically when you re-download. It is already wired to the live backend, so no API setup is needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
