import React, { useState, useEffect, useRef } from 'react';
import { Camera, Shield, MessageSquare, Send, Globe, Database, Network, Crosshair } from 'lucide-react';
import GlobeMap from 'react-globe.gl';
import ForceGraph2D from 'react-force-graph-2d';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../config';

const AdvancedSOC = ({ data }) => {
  const [takedown, setTakedown] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatAnswer, setChatAnswer] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  
  const mapRef = useRef(null);
  const graphRef = useRef(null);
  const [mapDim, setMapDim] = useState({ w: 500, h: 350 });
  const [graphDim, setGraphDim] = useState({ w: 500, h: 350 });

  useEffect(() => {
    const updateDims = () => {
      if (mapRef.current) setMapDim({ w: mapRef.current.offsetWidth, h: mapRef.current.offsetHeight });
      if (graphRef.current) setGraphDim({ w: graphRef.current.offsetWidth, h: graphRef.current.offsetHeight });
    };
    
    setTimeout(updateDims, 100);
    window.addEventListener('resize', updateDims);
    return () => window.removeEventListener('resize', updateDims);
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

  const graphData = {
    nodes: data.attribution_graph?.nodes || [],
    links: data.attribution_graph?.links || []
  };
  
  let arcData = [];
  let ringData = [];

  if (data.trace?.hops && data.trace.hops.length > 0) {
    const validHops = data.trace.hops.filter(h => h.geolocation && h.geolocation.lat && h.geolocation.long);
    
    for (let i = 0; i < validHops.length - 1; i++) {
       arcData.push({
           startLat: validHops[i].geolocation.lat,
           startLng: validHops[i].geolocation.long,
           endLat: validHops[i+1].geolocation.lat,
           endLng: validHops[i+1].geolocation.long,
           color: ['#0f172a', '#38bdf8']
       });
    }

    ringData = validHops.map(h => ({
       lat: h.geolocation.lat,
       lng: h.geolocation.long,
       color: '#ec4899',
       maxR: 3,
       propagationSpeed: 1,
       repeatPeriod: 1000
    }));

    if (data.trace.best_guess_geolocation?.lat) {
       ringData.push({
           lat: data.trace.best_guess_geolocation.lat,
           lng: data.trace.best_guess_geolocation.long,
           color: '#ef4444',
           maxR: 6,
           propagationSpeed: 2,
           repeatPeriod: 800
       });
    }
  } else if (data.trace?.best_guess_geolocation?.lat && data.trace?.best_guess_geolocation?.long) {
     ringData.push({
         lat: data.trace.best_guess_geolocation.lat,
         lng: data.trace.best_guess_geolocation.long,
         color: '#ef4444',
         maxR: 6,
         propagationSpeed: 2,
         repeatPeriod: 800
     });
  }

  const nodeCanvasObject = (node, ctx, globalScale) => {
    const label = node.label || node.id;
    const fontSize = Math.max(10 / globalScale, 4);
    ctx.font = `600 ${fontSize}px Inter, sans-serif`;
    const textWidth = ctx.measureText(label).width;
    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.4); 
    
    ctx.beginPath();
    ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI, false);
    ctx.fillStyle = node.risk === 'critical' ? '#991b1b' : 
                    node.risk === 'high' ? '#ef4444' : 
                    node.risk === 'medium' ? '#f59e0b' : '#3b82f6';
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.roundRect(node.x - bckgDimensions[0] / 2, node.y + 6, bckgDimensions[0], bckgDimensions[1], 4);
    ctx.fill();
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1e293b';
    ctx.fillText(label, node.x, node.y + 6 + (bckgDimensions[1]/2));
  };

  return (
    <div className="space-y-6">
      
      <div className="flex items-center gap-3 pb-2 border-b border-gray-200/60">
        <div className="p-2 bg-slate-800/10 rounded-xl border border-slate-800/20">
          <Database className="w-6 h-6 text-slate-900" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">God-Level SOC</h2>
          <p className="text-sm text-slate-500 font-medium">Advanced interactive capabilities & visualization</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Threat Map */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6 flex flex-col h-[450px]"
        >
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-slate-800" />
            <h3 className="text-lg font-bold text-slate-800">Global Threat Topography</h3>
          </div>
          <div ref={mapRef} className="flex-1 w-full bg-[#f8fafc] rounded-xl overflow-hidden border border-slate-200/60 relative flex justify-center items-center shadow-inner">
            {mapDim.w > 0 && (
              <GlobeMap
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-day.jpg"
                arcsData={arcData}
                arcColor="color"
                arcDashLength={0.4}
                arcDashGap={0.2}
                arcDashAnimateTime={1500}
                ringsData={ringData}
                ringColor="color"
                ringMaxRadius="maxR"
                ringPropagationSpeed="propagationSpeed"
                ringRepeatPeriod="repeatPeriod"
                width={mapDim.w}
                height={mapDim.h}
                backgroundColor="rgba(255,255,255,0)"
              />
            )}
          </div>
        </motion.div>

        {/* Threat Graph */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6 flex flex-col h-[450px]"
        >
          <div className="flex items-center gap-2 mb-4">
            <Network className="w-5 h-5 text-slate-800" />
            <h3 className="text-lg font-bold text-slate-800">Attribution Graph</h3>
          </div>
          <div ref={graphRef} className="flex-1 w-full bg-[#f8fafc] rounded-xl overflow-hidden border border-slate-200/60 relative flex justify-center items-center shadow-inner">
            {graphDim.w > 0 && graphData.nodes.length > 0 ? (
              <ForceGraph2D
                graphData={graphData}
                width={graphDim.w}
                height={graphDim.h}
                nodeAutoColorBy="type"
                linkColor={() => '#94a3b8'}
                linkDirectionalArrowLength={3.5}
                linkDirectionalArrowRelPos={1}
                backgroundColor="rgba(255,255,255,0)"
                nodeCanvasObject={nodeCanvasObject}
              />
            ) : (
              <div className="text-slate-400 font-medium">Insufficient graph data to render attribution.</div>
            )}
          </div>
        </motion.div>

        {/* Sandbox Detonation */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6 xl:col-span-1"
        >
          <div className="flex items-center gap-2 mb-4">
            <Crosshair className="w-5 h-5 text-pink-500" />
            <h3 className="text-lg font-bold text-slate-800">Sandbox Detonation</h3>
          </div>
          <div className="space-y-4">
            {data.urls && data.urls.length > 0 ? (
              <div className="flex gap-2 flex-wrap">
                {data.urls.map((url, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleDetonate(url)}
                    className="px-4 py-2 bg-pink-50 text-pink-600 border border-pink-200 rounded-xl hover:bg-pink-100 transition-all font-bold text-sm flex items-center gap-2 shadow-sm"
                  >
                    <Camera className="w-4 h-4"/> Detonate: {url}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-sm font-medium">
                No URLs extracted for detonation.
              </div>
            )}
            
            {screenshotLoading && (
              <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold flex items-center gap-3 animate-pulse">
                <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"/>
                Running Headless Browser Sandbox...
              </div>
            )}
            
            {screenshotUrl && (
              <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden shadow-xl">
                <div className="bg-slate-100 p-2 text-xs text-slate-500 font-mono font-bold flex items-center gap-2 border-b border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-green-500"/> SANDBOX DETONATION RENDERED
                </div>
                <img src={screenshotUrl} alt="Sandbox Detonation" className="w-full object-cover" />
              </div>
            )}
          </div>
        </motion.div>

        {/* GenAI Chat & Takedown */}
        <div className="space-y-6 xl:col-span-1">
          <motion.div 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-emerald-500" />
              <h3 className="text-lg font-bold text-slate-800">1-Click Legal Takedown</h3>
            </div>
            <p className="text-sm text-slate-500 mb-4 font-medium">Dynamically generates a legal Abuse notice.</p>
            <button 
                onClick={handleGenerateTakedown}
                className="w-full px-4 py-3 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-all font-bold text-sm flex justify-center items-center gap-2 shadow-sm"
            >
                Generate Takedown Notice
            </button>
            
            {takedown && (
                <div className="mt-4 p-4 bg-slate-800 rounded-xl shadow-inner font-mono text-xs text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto border border-slate-700">
                {takedown}
                </div>
            )}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6 flex flex-col"
          >
            <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-slate-800" />
                <h3 className="text-lg font-bold text-slate-800">GenAI SOC Assistant</h3>
            </div>
            
            <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 mb-4 overflow-y-auto h-32 text-sm text-slate-700 shadow-inner">
                {chatAnswer ? (
                  <div className="prose prose-sm prose-slate max-w-none">{chatAnswer}</div>
                ) : (
                  <div className="text-slate-400 italic flex items-center h-full justify-center">Ask the AI assistant a question about this incident...</div>
                )}
            </div>
            
            <div className="flex gap-2">
                <input 
                  type="text" 
                  value={chatQuestion}
                  onChange={(e) => setChatQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                  placeholder="e.g., Why did the SPF check fail?"
                  className="flex-1 bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all shadow-sm"
                />
                <button 
                  onClick={handleChat}
                  disabled={chatLoading}
                  className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-950 focus:ring-2 focus:ring-slate-800 focus:ring-offset-1 flex items-center gap-2 min-w-[100px] justify-center transition-all shadow-md disabled:opacity-70"
                >
                  {chatLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <><Send size={16} /> Ask</>}
                </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSOC;
