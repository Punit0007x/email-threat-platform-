import { useState } from 'react';
import { Upload, AlertCircle, FileText } from 'lucide-react';
import { analyzeEmail } from './services/analysisService';

import HeaderPanel from './components/HeaderPanel';
import AuthPanel from './components/AuthPanel';
import FraudScorePanel from './components/FraudScorePanel';
import AIMLThreatPanel from './components/AIMLThreatPanel';
import MapPanel from './components/MapPanel';
import CustodyReportPanel from './components/CustodyReportPanel';
import GraphAttributionPanel from './components/GraphAttributionPanel';
import CaseHistoryPanel from './components/CaseHistoryPanel';

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.eml')) {
      setFile(selectedFile);
      setError(null);
    } else {
      setFile(null);
      setError("Please select a valid .eml file.");
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await analyzeEmail(file);
      setResults(data);
    } catch (err) {
      setError(err.message || "Failed to analyze email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-slate-200 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white tracking-tight">Email Threat Intelligence Platform</h1>
          <p className="text-slate-400">Deep forensic analysis, AI neural classification, relay origin tracing, and attribution intelligence.</p>
        </div>

        {/* Upload Section */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-lg">
          <div className="flex flex-col items-center justify-center space-y-6">
            
            <label className="flex flex-col items-center justify-center w-full max-w-2xl h-48 border-2 border-slate-600 border-dashed rounded-xl cursor-pointer bg-slate-800 hover:bg-slate-750 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-12 h-12 text-slate-400 mb-4" />
                <p className="mb-2 text-sm text-slate-300">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-slate-500">.EML files only (Forensically Preserved & Sealed)</p>
              </div>
              <input type="file" className="hidden" accept=".eml" onChange={handleFileChange} />
            </label>

            {file && (
              <div className="flex items-center space-x-3 bg-slate-700 px-4 py-3 rounded-lg w-full max-w-2xl">
                <FileText className="w-6 h-6 text-blue-400" />
                <span className="text-sm font-medium text-slate-200 truncate flex-1">{file.name}</span>
                <button 
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? "Analyzing..." : "Analyze"}
                </button>
              </div>
            )}

            {error && (
              <div className="flex items-center space-x-2 text-red-400 bg-red-400/10 px-4 py-3 rounded-lg w-full max-w-2xl">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            
          </div>
        </div>

        {/* Results Section */}
        {results && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 1. Main Risk Scoring Panel */}
            <FraudScorePanel data={results} />
            
            {/* 2. Chain of Custody & Report Generator */}
            <CustodyReportPanel data={results} />

            {/* 3. AI / ML Threat Intelligence & MITRE ATT&CK */}
            <AIMLThreatPanel data={results} />

            {/* 4. Graph-Based Infrastructure Attribution */}
            <GraphAttributionPanel data={results} />

            {/* 5. Forensic Network Geolocation Mapping */}
            <MapPanel data={results} />

            {/* 6. Technical Header & Protocol Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6 h-full flex flex-col">
                <div className="flex-1"><HeaderPanel data={results} /></div>
              </div>
              <div className="space-y-6 h-full flex flex-col">
                <div className="flex-1"><AuthPanel data={results} /></div>
              </div>
            </div>
          </div>
        )}

        {/* Case Management & Campaign Cluster Explorer */}
        <CaseHistoryPanel />
        
      </div>
    </div>
  );
}

export default App;

