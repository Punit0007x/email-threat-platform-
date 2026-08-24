import React, { useState } from 'react';
import { Sparkles, Image as ImageIcon, Paintbrush, Wind, Sun, Moon, Cloud, Leaf, Download, RefreshCw, Wand2 } from 'lucide-react';

export default function GhibliGenerator() {
  const [prompt, setPrompt] = useState('A cozy cottage in a mystical, bioluminescent forest at night, full of spirits...');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#e8f1e9] font-sans selection:bg-[#9cb390] text-[#4a5342] p-4 sm:p-8 relative overflow-hidden" 
         style={{ backgroundImage: 'radial-gradient(#c5d9c2 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
      
      {/* Decorative floating elements */}
      <div className="absolute top-10 left-10 text-[#8ba380] animate-bounce"><Leaf className="w-8 h-8 opacity-50" /></div>
      <div className="absolute top-40 right-20 text-[#8ba380] animate-pulse"><Sparkles className="w-6 h-6 opacity-60" /></div>
      <div className="absolute bottom-20 left-1/4 text-[#8ba380] animate-bounce" style={{ animationDelay: '1s' }}><Wind className="w-10 h-10 opacity-40" /></div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-[#3d5a40] tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
            Studio AI: Enchanted Creator
          </h1>
          <p className="text-[#647c61] text-lg font-medium italic">Breathe life into your imagination...</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Dream Canvas */}
          <div className="lg:col-span-7">
            <div className="bg-[#fcfbf7] p-6 rounded-[2rem] shadow-xl border-4 border-[#e3dac9] relative" style={{ borderRadius: '255px 15px 225px 15px/15px 225px 15px 255px' }}>
              <div className="absolute -top-4 -left-4 bg-[#8ba380] text-white px-4 py-1 rounded-full text-sm font-bold shadow-sm transform -rotate-6 border-2 border-white">
                DREAM CANVAS
              </div>
              
              <div className="w-full aspect-video bg-[#d9e6d4] rounded-2xl border-2 border-[#b5c7ad] border-dashed flex items-center justify-center overflow-hidden relative">
                {isGenerating ? (
                  <div className="flex flex-col items-center gap-4 animate-pulse">
                    <Wand2 className="w-12 h-12 text-[#647c61] animate-spin" />
                    <span className="text-[#647c61] font-medium text-lg">Soot sprites are painting...</span>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-cover bg-center transition-all duration-700 hover:scale-105" 
                       style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=80)' }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                <div className="flex gap-2">
                  <button className="p-2 bg-[#f4eee1] rounded-full hover:bg-[#e3dac9] transition-colors text-[#5a6b52]"><Download className="w-5 h-5" /></button>
                  <button className="p-2 bg-[#f4eee1] rounded-full hover:bg-[#e3dac9] transition-colors text-[#5a6b52]"><RefreshCw className="w-5 h-5" /></button>
                </div>
                <div className="text-sm font-medium text-[#8ba380]">Masterpiece #402</div>
              </div>
            </div>
          </div>

          {/* Right Column: Controls */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Prompt Sketchbook */}
            <div className="bg-[#f4eee1] p-6 rounded-[2rem] shadow-md border-2 border-[#d9cbb2]" style={{ borderRadius: '15px 225px 15px 255px/255px 15px 225px 15px' }}>
              <h3 className="text-xl font-bold text-[#5c4d3c] mb-3 flex items-center gap-2" style={{ fontFamily: 'Georgia, serif' }}>
                <Paintbrush className="w-5 h-5" /> Prompt Sketchbook
              </h3>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-32 bg-transparent border-none focus:ring-0 resize-none text-[#4a3f35] font-medium placeholder-[#a89f91] text-lg leading-relaxed"
                placeholder="What world shall we paint today?"
              />
            </div>

            {/* Generator Controls */}
            <div className="flex gap-4">
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex-1 bg-[#d78a76] hover:bg-[#c97965] text-white py-4 rounded-full shadow-lg font-bold text-xl tracking-wide transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed border-b-4 border-[#b56b5a]"
              >
                {isGenerating ? 'Enchanting...' : 'Create Magic'}
              </button>
            </div>

            {/* Style Charms */}
            <div className="bg-[#eaf2e3] p-5 rounded-3xl shadow-sm border border-[#c5d9c2]">
              <h3 className="text-center font-bold text-[#647c61] mb-4 text-sm tracking-widest uppercase">Style Charms</h3>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { name: 'Watercolor', icon: Paintbrush },
                  { name: 'Forest', icon: Leaf },
                  { name: 'Cloud', icon: Cloud },
                  { name: 'Night', icon: Moon },
                ].map((charm) => (
                  <button key={charm.name} className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl hover:bg-[#fcfbf7] border-2 border-transparent hover:border-[#b5c7ad] transition-all group">
                    <div className="w-10 h-10 rounded-full bg-[#f0f4ec] flex items-center justify-center text-[#8ba380] group-hover:scale-110 transition-transform">
                      <charm.icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-[#647c61]">{charm.name}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Harvest Gallery */}
        <div className="bg-[#fcfbf7] p-6 rounded-3xl shadow-md border-2 border-[#e3dac9] mt-12">
           <h3 className="text-2xl font-bold text-[#5c4d3c] mb-6 text-center" style={{ fontFamily: 'Georgia, serif' }}>
             My Harvest Gallery
           </h3>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {[1, 2, 3, 4].map((i) => (
               <div key={i} className="aspect-square bg-[#d9e6d4] rounded-2xl overflow-hidden border-4 border-white shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group">
                 <img 
                   src={`https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=400&q=80`} 
                   alt="Gallery item"
                   className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                 />
                 <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
               </div>
             ))}
           </div>
        </div>

      </div>
    </div>
  );
}
