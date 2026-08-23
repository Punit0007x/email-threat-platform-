import React, { useEffect, useRef } from 'react';

export default function ThreatWaveform({ score = 0, isHighRisk = false }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Color scheme based on threat score
      let strokeColor = '#10b981'; // Emerald
      if (score > 70) {
        strokeColor = '#f43f5e'; // Crimson Rose
      } else if (score > 30) {
        strokeColor = '#f59e0b'; // Amber
      }

      ctx.lineWidth = 2;
      ctx.strokeStyle = strokeColor;
      ctx.beginPath();

      const centerY = height / 2;
      const amplitude = Math.min(height * 0.4, 6 + (score / 100) * (height * 0.35));
      const frequency = 0.04 + (score / 100) * 0.08;

      for (let x = 0; x < width; x++) {
        // Multi-frequency wave for realistic signal telemetry
        const noise = score > 50 ? (Math.random() - 0.5) * (score / 25) : 0;
        const y = centerY + 
          Math.sin(x * frequency + phase) * amplitude + 
          Math.sin(x * frequency * 2.5 - phase * 1.5) * (amplitude * 0.35) + 
          noise;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();

      // Subtle glow under the wave
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, strokeColor + '33');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fill();

      phase += 0.06 + (score / 100) * 0.06;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [score, isHighRisk]);

  return (
    <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
      <div className="flex flex-col">
        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">Signal Telemetry</span>
        <span className="text-[10px] font-mono font-bold text-slate-300">
          {score > 70 ? 'ANOMALOUS FLUX' : score > 30 ? 'MODERATE ACTIVITY' : 'NOMINAL BASELINE'}
        </span>
      </div>
      <canvas 
        ref={canvasRef} 
        width={140} 
        height={32} 
        className="rounded border border-slate-800/80 bg-slate-900/50"
      />
    </div>
  );
}
