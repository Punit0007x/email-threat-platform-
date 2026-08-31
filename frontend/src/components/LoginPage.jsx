import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Lock, User, AlertCircle, CheckCircle2, Eye, EyeOff, ArrowRight,
  Activity, Terminal, Cpu, Radio, Sparkles, KeyRound, Globe2, Fingerprint
} from 'lucide-react';

// ============================================================
// DYNAMIC CYBER COMMAND CANVAS HOOK
// ============================================================
function useCyberCommandCanvas(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let W = 0, H = 0;

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // Particle Constellation Network
    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 1.8 + 1,
      color: Math.random() > 0.4 ? '#00E5FF' : '#6366F1'
    }));

    // Scanning Laser Beam
    let scanY = 0;
    let scanSpeed = 1.2;

    // Terminal Threat Feeds for Floating HUD
    const terminalLogs = [
      '>> [SOC] Ingestion engine listening on port 8000',
      '>> [ML] 7-Class Calibrated Classifier holdout: 99.43% F1',
      '>> [AI-AUDIT] Cognitive coercion & Zero-width heuristics: ONLINE',
      '>> [OSINT] WHOIS, SPF/DKIM/DMARC, MX verification: ACTIVE',
      '>> [GRAPH] Attacker Infrastructure Correlation: 26 clusters indexed'
    ];
    let logIndex = 0;
    let logCharIndex = 0;
    let currentLogText = '';
    let logTimer = 0;

    let frame = 0;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, W, H);

      // 1. Subtle Cyber Grid
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < W; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // 2. Animated Particle Constellation
      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Connect nearby nodes
        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 90) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(0, 229, 255, ${0.15 * (1 - dist / 90)})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      });

      // 3. Ambient Laser Scan Line
      scanY += scanSpeed;
      if (scanY > H || scanY < 0) scanSpeed *= -1;
      const scanGlow = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
      scanGlow.addColorStop(0, 'rgba(0, 229, 255, 0)');
      scanGlow.addColorStop(0.5, 'rgba(0, 229, 255, 0.12)');
      scanGlow.addColorStop(1, 'rgba(0, 229, 255, 0)');
      ctx.fillStyle = scanGlow;
      ctx.fillRect(0, scanY - 30, W, 60);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);
}

// ============================================================
// ENHANCED PROFESSIONAL LOGIN COMPONENT
// ============================================================
const LoginPage = ({ onLogin, onGoogleLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const canvasRef = useRef(null);
  useCyberCommandCanvas(canvasRef);

  // Official Google Identity Services SDK Initialization
  const handleGoogleCredentialResponse = async (response) => {
    if (!response || !response.credential) return;
    setIsGoogleLoading(true);
    setError(null);
    try {
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const googleUser = JSON.parse(jsonPayload);

      if (onGoogleLogin) {
        await onGoogleLogin({
          credential: response.credential,
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture
        }, rememberMe);
      }
    } catch (err) {
      setError(err.message || 'Google authentication failed.');
      setIsGoogleLoading(false);
    }
  };

  useEffect(() => {
    const initGoogleGSI = () => {
      if (window.google?.accounts?.id) {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "1043819890989-u3g3k3l2d1j1h4k4j5l.apps.googleusercontent.com";
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          const btnEl = document.getElementById("google-official-btn-slot");
          if (btnEl) {
            btnEl.innerHTML = "";
            window.google.accounts.id.renderButton(btnEl, {
              theme: "filled_blue",
              size: "large",
              width: 360,
              text: "continue_with",
              shape: "pill",
              logo_alignment: "left"
            });
          }
        } catch (e) {
          console.warn("Google GSI notice:", e);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGoogleGSI();
    } else {
      const timer = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(timer);
          initGoogleGSI();
        }
      }, 250);
      return () => clearInterval(timer);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setIsSuccess(false);
    try {
      await onLogin(username, password, rememberMe);
      setIsSuccess(true);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
      setIsLoading(false);
    }
  };

  const handleQuickFill = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#030712] font-sans flex flex-col lg:flex-row select-none text-slate-100">

      {/* ======================================================== */}
      {/* LEFT 55%: TACTICAL CYBER COMMAND SCENE                   */}
      {/* ======================================================== */}
      <section className="w-full lg:w-[55%] h-[340px] lg:h-full relative overflow-hidden flex flex-col justify-between p-8 sm:p-12 bg-gradient-to-br from-[#050C1A] via-[#09152B] to-[#020617] border-b lg:border-b-0 lg:border-r border-cyan-500/20">

        {/* Ambient Glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-500/15 blur-[120px] pointer-events-none" />

        {/* Dynamic Canvas Particles & Tactical Grid */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block pointer-events-none" />

        {/* Top Header & Live Telemetry Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/30 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.25)]">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="font-mono text-sm font-bold tracking-widest text-white flex items-center gap-2">
                SHIELDMAIL <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300">v2.4 SEC-OPS</span>
              </div>
              <div className="text-[11px] text-slate-400">Autonomous Email Threat Defense Platform</div>
            </div>
          </div>

          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 backdrop-blur-md text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse" />
            <span className="text-slate-300">SYSTEM HEALTH: 100%</span>
          </div>
        </div>

        {/* Center Forensic Hero Callout */}
        <div className="relative z-10 my-auto py-6 max-w-xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-400/25 text-blue-300 text-xs font-mono font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin" />
            <span>DEEP FORENSICS & BAYESIAN CALIBRATION ENGINE</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Stop Email Threats with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300">
              Deterministic Intelligence.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Multi-pillar AI forensic inspection, zero-width obfuscation detection, and cryptographic chain-of-custody for enterprise SOC operations.
          </p>

          {/* Tactical Telemetry Metrics */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-md">
              <div className="text-lg sm:text-xl font-bold font-mono text-cyan-400">99.43%</div>
              <div className="text-[10px] sm:text-xs text-slate-400 font-medium">ML Precision Rate</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-md">
              <div className="text-lg sm:text-xl font-bold font-mono text-emerald-400">&lt; 150ms</div>
              <div className="text-[10px] sm:text-xs text-slate-400 font-medium">Inference Latency</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-md">
              <div className="text-lg sm:text-xl font-bold font-mono text-indigo-400">SHA-256</div>
              <div className="text-[10px] sm:text-xs text-slate-400 font-medium">Custody Ledger</div>
            </div>
          </div>
        </div>

        {/* Bottom SOC Terminal Status */}
        <div className="relative z-10 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400 font-mono border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300">ENCRYPTION: AES-256-GCM / TLS 1.3</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe2 className="w-3.5 h-3.5 text-slate-500" />
            <span>GLOBAL ATTRIBUTION MATRIX ACTIVE</span>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* RIGHT 45%: SLEEK HIGH-TECH AUTHENTICATION CARD           */}
      {/* ======================================================== */}
      <section className="w-full lg:w-[45%] h-full flex items-center justify-center p-6 sm:p-12 overflow-y-auto relative bg-[#090D1A] flex-shrink-0">

        {/* Ambient Core Lighting */}
        <div className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-72 h-72 rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="w-full max-w-[430px] bg-slate-900/90 border border-slate-800/90 rounded-3xl p-8 sm:p-10 shadow-[0_25px_70px_rgba(0,0,0,0.65)] backdrop-blur-2xl relative z-10"
        >
          {/* Card Header */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold tracking-wider uppercase mb-3">
              <Fingerprint className="w-3.5 h-3.5" />
              <span>SOC Gatekeeper Access</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight font-sans">
              Sign In to Command
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Verify security credentials to access the live threat radar.
            </p>
          </div>

          {/* Official Google Sign-In SDK Slot */}
          <div className="w-full mb-5 flex flex-col items-center">
            <div id="google-official-btn-slot" className="w-full flex justify-center min-h-[44px]" />
            {isGoogleLoading && (
              <div className="mt-2 text-xs text-cyan-400 font-semibold flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span>Authenticating with Google SSO...</span>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center mb-5">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 font-mono">
              or operator credentials
            </span>
            <div className="border-t border-slate-800 w-full" />
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Username / Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Operator ID or Corporate Email
              </label>
              <div className="relative flex items-center rounded-xl bg-slate-950/70 border border-slate-800 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all">
                <User className="absolute left-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-transparent text-white text-sm placeholder-slate-500 focus:outline-none"
                  placeholder="admin or analyst@security.corp"
                />
              </div>
            </div>

            {/* Security Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Access Key / Password
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">Quick Fill:</span>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('admin', 'secret')}
                    className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                  >
                    Admin
                  </button>
                  <span className="text-slate-600">|</span>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('shrutha', 'shrutha123')}
                    className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                  >
                    Shrutha
                  </button>
                </div>
              </div>
              <div className="relative flex items-center rounded-xl bg-slate-950/70 border border-slate-800 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all">
                <Lock className="absolute left-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-transparent text-white text-sm placeholder-slate-500 focus:outline-none"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
                />
                <span>Persist session across reload</span>
              </label>

              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                TLS 1.3
              </span>
            </div>

            {/* Error Banner */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 text-rose-300 bg-rose-950/60 p-3 rounded-xl border border-rose-800 text-xs font-medium"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-semibold tracking-tight shadow-[0_4px_20px_rgba(0,229,255,0.25)] hover:shadow-[0_6px_25px_rgba(0,229,255,0.4)] active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /><span>Authorizing Session...</span></>
              ) : isSuccess ? (
                <><CheckCircle2 className="w-4 h-4" /><span>Authorization Granted</span></>
              ) : (
                <><span>Authenticate Access</span><ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Footer Security Seal */}
          <footer className="mt-8 pt-5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>SOC2 TYPE II COMPLIANT</span>
            </div>
            <div>CHAIN-OF-CUSTODY V2</div>
          </footer>
        </motion.div>
      </section>
    </div>
  );
};

export default LoginPage;
