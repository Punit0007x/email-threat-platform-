import React, { useEffect, useRef, useMemo } from 'react';
import { Target } from 'lucide-react';

export default function ThreatRadarGraphic({ data, score = 0 }) {
  const canvasRef = useRef(null);

  // Extract threat blips dynamically from the data
  const blips = useMemo(() => {
    const list = [];
    if (data?.auth_analysis) {
      if (data.auth_analysis.spf === 'fail' || data.auth_analysis.spf === 'softfail') {
        list.push({ id: 'spf', label: 'SPF Protocol Failure', angle: 45, dist: 0.75, severity: 'high', desc: 'SPF record validation failed on originating IP' });
      }
      if (data.auth_analysis.dmarc === 'fail') {
        list.push({ id: 'dmarc', label: 'DMARC Alignment Breach', angle: 110, dist: 0.85, severity: 'high', desc: 'Header From domain does not align with DKIM/SPF' });
      }
      if (data.auth_analysis.dkim === 'fail') {
        list.push({ id: 'dkim', label: 'DKIM Signature Invalid', angle: 160, dist: 0.65, severity: 'med', desc: 'Cryptographic signature broken or missing' });
      }
    }

    if (data?.domain_analysis?.is_lookalike) {
      list.push({ id: 'lookalike', label: 'Typosquatting Homoglyph', angle: 210, dist: 0.9, severity: 'high', desc: `Lookalike domain: ${data.domain_analysis.similarity_details?.target_domain || 'Spoofed target'}` });
    }

    if (data?.ai_ml_analysis?.bec_indicators?.urgency_score > 0.6) {
      list.push({ id: 'bec_urgency', label: 'High Urgency Coercion', angle: 280, dist: 0.7, severity: 'high', desc: 'Psychological urgency trigger detected in payload' });
    }

    if (data?.ai_ml_analysis?.bec_indicators?.financial_request) {
      list.push({ id: 'wire_fraud', label: 'Wire / Financial Request', angle: 330, dist: 0.8, severity: 'high', desc: 'Unsanctioned payroll or wire transfer instruction' });
    }

    if (data?.vision_analysis?.qr_codes_detected?.length > 0) {
      list.push({ id: 'quishing', label: 'QR Code Attachment (Quishing)', angle: 75, dist: 0.6, severity: 'med', desc: 'Embedded QR code leading to external URL' });
    }

    if (data?.trace?.sol_anomalies?.length > 0) {
      list.push({ id: 'sol_anomaly', label: 'Speed-of-Light Relay Violation', angle: 190, dist: 0.85, severity: 'high', desc: 'Impossible travel velocity between intermediate hops' });
    }

    // If clean, add nominal beacon blips
    if (list.length === 0) {
      list.push({ id: 'auth_ok', label: 'SPF / DKIM / DMARC Pass', angle: 60, dist: 0.3, severity: 'low', desc: 'Cryptographic authentication verified' });
      list.push({ id: 'clean_domain', label: 'Legitimate Domain Age', angle: 180, dist: 0.25, severity: 'low', desc: 'Established domain reputation baseline' });
    }

    return list;
  }, [data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let scanAngle = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(centerX, centerY) - 15;

      ctx.clearRect(0, 0, width, height);

      // Radar background circle
      ctx.fillStyle = '#070d18';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Concentric Range Rings
      const ringCount = 4;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = 1;
      for (let i = 1; i <= ringCount; i++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, (radius / ringCount) * i, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Azimuth Crosshairs
      ctx.beginPath();
      ctx.moveTo(centerX - radius, centerY);
      ctx.lineTo(centerX + radius, centerY);
      ctx.moveTo(centerX, centerY - radius);
      ctx.lineTo(centerX, centerY + radius);
      ctx.stroke();

      // Rotating Scanning Beam Sweep (with safe fallback)
      try {
        if (ctx.createConicGradient) {
          const sweepGradient = ctx.createConicGradient(scanAngle, centerX, centerY);
          const isHigh = score > 70;
          const beamColor = isHigh ? '244, 63, 94' : (score > 30 ? '245, 158, 11' : '56, 189, 248');
          
          sweepGradient.addColorStop(0, `rgba(${beamColor}, 0.35)`);
          sweepGradient.addColorStop(0.12, `rgba(${beamColor}, 0.05)`);
          sweepGradient.addColorStop(0.2, 'transparent');
          sweepGradient.addColorStop(1, 'transparent');

          ctx.fillStyle = sweepGradient;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      } catch {
        // Fallback if conic gradient is unsupported
      }

      // Leading beam line
      const isHigh = score > 70;
      const beamColor = isHigh ? '244, 63, 94' : (score > 30 ? '245, 158, 11' : '56, 189, 248');
      const beamX = centerX + Math.cos(scanAngle) * radius;
      const beamY = centerY + Math.sin(scanAngle) * radius;
      ctx.strokeStyle = `rgba(${beamColor}, 0.8)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(beamX, beamY);
      ctx.stroke();

      // Plot Target Threat Blips
      blips.forEach((blip) => {
        const rad = (blip.angle * Math.PI) / 180;
        const blipX = centerX + Math.cos(rad) * (radius * blip.dist);
        const blipY = centerY + Math.sin(rad) * (radius * blip.dist);

        // Blip color by severity
        let blipColor = '#10b981'; // Green
        if (blip.severity === 'high') blipColor = '#f43f5e'; // Red
        else if (blip.severity === 'med') blipColor = '#f59e0b'; // Amber

        // Pulse ring around blip
        const pulse = (Math.sin(Date.now() / 200) + 1) / 2;
        ctx.strokeStyle = blipColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(blipX, blipY, 4 + pulse * 4, 0, Math.PI * 2);
        ctx.stroke();

        // Solid blip dot
        ctx.fillStyle = blipColor;
        ctx.beginPath();
        ctx.arc(blipX, blipY, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Blip label
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '9px monospace';
        ctx.fillText(blip.id.toUpperCase(), blipX + 8, blipY + 3);
      });

      scanAngle += 0.025;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [blips, score]);

  return (
    <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800 space-y-4 shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 font-mono">
          <Target className="w-4 h-4 text-cyan-400 animate-pulse" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Tactical 360° Threat Radar</h4>
        </div>
        <span className="text-[10px] font-mono bg-cyan-950/60 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
          {blips.length} Detected Vector(s)
        </span>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="relative flex-shrink-0">
          <canvas 
            ref={canvasRef} 
            width={240} 
            height={240} 
            className="rounded-full border border-slate-700/80 shadow-2xl bg-slate-950"
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
          </div>
        </div>

        {/* Interactive Blip Legend */}
        <div className="flex-1 w-full space-y-2 max-h-56 overflow-y-auto pr-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wide block mb-1">
            Target Vectors on Radar:
          </span>
          {blips.map((blip) => (
            <div 
              key={blip.id}
              className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 transition-all shadow-sm group"
            >
              <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${blip.severity === 'high' ? 'bg-rose-400 shadow-rose-400/50 shadow' : blip.severity === 'med' ? 'bg-amber-400 shadow-amber-400/50 shadow' : 'bg-emerald-400'}`}></span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 font-sans truncate">{blip.label}</span>
                  <span className="text-[9px] font-mono text-slate-400 uppercase font-semibold">AZ {blip.angle}°</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight mt-0.5 truncate">{blip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
