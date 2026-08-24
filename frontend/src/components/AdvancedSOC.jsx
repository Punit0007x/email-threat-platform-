import React, { useState, useEffect } from 'react';
import { Terminal, Camera, Shield, MessageSquare, Send, Globe, Database } from 'lucide-react';
import GlobeMap from 'react-globe.gl';
import ForceGraph2D from 'react-force-graph-2d';
import { API_BASE_URL } from '../config';

const AdvancedSOC = ({ data }) => {
  const [takedown, setTakedown] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatAnswer, setChatAnswer] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [windowWidth, setWindowWidth] = useState(600);

  useEffect(() => {
      setWindowWidth(window.innerWidth > 1200 ? 500 : 800);
  }, []);

  if (!data) return null;

  const handleGenerateTakedown = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/takedown/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ case_data: data })
      });
      const resData = await res.json();
      setTakedown(resData.takedown_text);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDetonate = async (url) => {
    setScreenshotLoading(true);
    setScreenshotUrl("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/sandbox/screenshot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      const resData = await res.json();
      setScreenshotUrl(resData.image_url);
    } catch (e) {
      console.error(e);
    }
    setScreenshotLoading(false);
  };

  const handleChat = async () => {
    if (!chatQuestion.trim()) return;
    setChatLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ case_data: data, question: chatQuestion })
      });
      const resData = await res.json();
      setChatAnswer(resData.answer);
    } catch (e) {
      console.error(e);
    }
    setChatLoading(false);
  };

  // Prepare graph data
  const graphData = {
    nodes: data.attribution_graph?.nodes || [{ id: 'email', name: 'Malicious Email' }],
    links: data.attribution_graph?.links || []
  };
  
  // Prepare map data
  let arcData = [];
  if (data.trace?.best_guess_geolocation?.lat && data.trace?.best_guess_geolocation?.long) {
      // Draw an arc from attacker to victim (e.g. assuming victim is in India or USA)
      arcData = [{
          startLat: data.trace.best_guess_geolocation.lat,
          startLng: data.trace.best_guess_geolocation.long,
          endLat: 38.9072, // Target: Washington DC (Simulation)
          endLng: -77.0369,
          color: ['#ff0000', '#ff8800']
      }];
  }

  return (
    <div className="space-y-6 mt-8 border-t border-gray-800 pt-8">
      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
        <Database className="text-purple-400" />
        Advanced SOC Capabilities (Hackathon Features)
      </h2>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Threat Map */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 h-96 relative overflow-hidden xl:col-span-1 flex justify-center items-center">
          <h3 className="text-xl font-bold text-white flex items-center gap-2 absolute top-6 left-6 z-10 bg-gray-900/80 p-2 rounded">
            <Globe className="text-cyan-400" /> 3D Global Threat Map
          </h3>
          <div className="absolute inset-0 flex justify-center items-center mt-10">
            <GlobeMap
              globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
              arcsData={arcData}
              arcColor="color"
              arcDashLength={0.4}
              arcDashGap={0.2}
              arcDashAnimateTime={1500}
              width={windowWidth}
              height={350}
              backgroundColor="#111827"
            />
          </div>
        </div>

        {/* Threat Graph */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 h-96 relative overflow-hidden xl:col-span-1 flex justify-center items-center">
          <h3 className="text-xl font-bold text-white flex items-center gap-2 absolute top-6 left-6 z-10 bg-gray-900/80 p-2 rounded">
            <Globe className="text-blue-400" /> Attribution Graph
          </h3>
          <div className="absolute inset-0 flex justify-center items-center">
            <ForceGraph2D
              graphData={graphData}
              width={windowWidth}
              height={400}
              nodeLabel="id"
              nodeAutoColorBy="group"
              linkDirectionalArrowLength={3.5}
              linkDirectionalArrowRelPos={1}
              backgroundColor="#111827"
            />
          </div>
        </div>

        {/* Sandbox Detonation */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 xl:col-span-1">
          <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
            <Camera className="text-pink-400" /> Sandbox Detonation
          </h3>
          <div className="space-y-4">
            {data.urls && data.urls.length > 0 ? (
              <div className="flex gap-2 flex-wrap">
                {data.urls.map((url, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleDetonate(url)}
                    className="px-4 py-2 bg-pink-500/20 text-pink-400 border border-pink-500/50 rounded hover:bg-pink-500/40 transition truncate max-w-full"
                  >
                    Detonate: {url}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No URLs extracted for detonation.</p>
            )}
            
            {screenshotLoading && <div className="text-cyan-400 animate-pulse">Running Headless Browser Sandbox...</div>}
            
            {screenshotUrl && (
              <div className="mt-4 border border-gray-700 rounded overflow-hidden shadow-2xl">
                <div className="bg-gray-800 p-2 text-xs text-gray-400 font-mono">SANDBOX_VIEW: ISOLATED DOMAIN EXECUTED</div>
                <img src={screenshotUrl} alt="Sandbox Detonation" className="w-full object-cover" />
              </div>
            )}
          </div>
        </div>

        {/* GenAI Chat & Takedown */}
        <div className="space-y-6 xl:col-span-1">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                <Shield className="text-green-400" /> 1-Click Takedown Generator
            </h3>
            <p className="text-sm text-gray-400 mb-4">Dynamically generates a legal Abuse notice.</p>
            <button 
                onClick={handleGenerateTakedown}
                className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded hover:bg-green-500/40 transition w-full"
            >
                Generate Takedown Notice
            </button>
            
            {takedown && (
                <div className="mt-4 p-4 bg-black border border-gray-800 rounded font-mono text-xs text-gray-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                {takedown}
                </div>
            )}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col">
            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                <MessageSquare className="text-yellow-400" /> GenAI SOC Assistant
            </h3>
            <div className="flex-1 bg-black border border-gray-800 rounded p-4 mb-4 overflow-y-auto max-h-48 font-mono text-sm text-yellow-400">
                {chatAnswer ? (
                <div>{chatAnswer}</div>
                ) : (
                <div className="text-gray-500">Ask the AI assistant a question about this incident...</div>
                )}
            </div>
            
            <div className="flex gap-2">
                <input 
                type="text" 
                value={chatQuestion}
                onChange={(e) => setChatQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                placeholder="e.g., Why did the SPF check fail?"
                className="flex-1 bg-gray-800 border border-gray-700 text-white rounded px-4 py-2 focus:outline-none focus:border-yellow-500"
                />
                <button 
                onClick={handleChat}
                disabled={chatLoading}
                className="bg-yellow-500 text-gray-900 px-4 py-2 rounded font-bold hover:bg-yellow-400 flex items-center gap-2 min-w-24 justify-center"
                >
                {chatLoading ? '...' : <><Send size={16} /> Ask</>}
                </button>
            </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSOC;
