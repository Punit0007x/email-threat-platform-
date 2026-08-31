import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Lock, User, AlertCircle, CheckCircle2, Eye, EyeOff, ArrowRight,
  Activity, Terminal, Sparkles, Fingerprint
} from 'lucide-react';

// ============================================================
// ULTRA-REALISTIC CINEMATIC HACKER OVERLAY HOOK
// ============================================================
function useRealHackerOverlay(canvasRef) {
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

    // Matrix Rain setup for Right Monitor
    const FONT_SIZE = 10;
    let drops = Array.from({ length: 30 }, () => Math.floor(Math.random() * -30));
    const MATRIX_CHARS = '010101アイウエオカキクケコサシスセソ';
    const rc = () => MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];

    // Live Terminal lines inside Center Monitor
    const TERM_POOL = [
      '> stealth_scan --range 192.168.1.0/24',
      '> host 192.168.1.105 active (0.4ms)',
      '> mounting encrypted payload...',
      '> cipher: AES-256-GCM cipher active',
      '> TOR relay tunnel established',
      '> [WARN] unexpected SYN-ACK packet',
      '> rerouting connection via node #7',
      '> key exchange verified',
      '> telemetry feed streams live',
      '> dumping hashes from SAM database...',
      '> privilege level: NT AUTHORITY\\SYSTEM',
    ];
    let termLines = [];
    let termTimer = 0;

    // Live Mechanical Typing Key flashes under hands
    let keyPresses = [];

    // Network Map Pulses for Left Monitor
    const mapNodes = [
      { x: 0.12, y: 0.38 }, { x: 0.18, y: 0.42 }, { x: 0.22, y: 0.35 },
      { x: 0.15, y: 0.50 }, { x: 0.25, y: 0.48 }, { x: 0.28, y: 0.40 }
    ];

    // Floating cyber data particles
    const particles = Array.from({ length: 22 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      speedY: -0.15 - Math.random() * 0.35,
      speedX: (Math.random() - 0.5) * 0.2,
      size: 1 + Math.random() * 1.5,
      alpha: 0.2 + Math.random() * 0.5,
      color: Math.random() > 0.5 ? 'rgba(0, 220, 255,' : 'rgba(0, 255, 160,'
    }));

    let frame = 0;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, W, H);

      // 1. LEFT MONITOR (Network Map Pulses & Glow)
      const leftMonX = W * 0.05;
      const leftMonY = H * 0.22;
      const leftMonW = W * 0.26;
      const leftMonH = H * 0.49;

      ctx.save();
      ctx.beginPath();
      ctx.rect(leftMonX, leftMonY, leftMonW, leftMonH);
      ctx.clip();

      mapNodes.forEach((node, idx) => {
        const pulse = (Math.sin(frame * 0.05 + idx) + 1) * 3;
        const nx = leftMonX + node.x * leftMonW * 3;
        const ny = leftMonY + node.y * leftMonH * 1.5;
        if (nx < leftMonX + leftMonW && ny < leftMonY + leftMonH) {
          ctx.beginPath();
          ctx.arc(nx, ny, 2 + pulse, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0, 220, 255, 0.25)';
          ctx.fill();
        }
      });
      ctx.restore();

      // 2. CENTER MONITOR (Live Terminal Code)
      const centerMonX = W * 0.32;
      const centerMonY = H * 0.20;
      const centerMonW = W * 0.27;
      const centerMonH = H * 0.35;

      ctx.save();
      ctx.beginPath();
      ctx.rect(centerMonX, centerMonY, centerMonW, centerMonH);
      ctx.clip();

      ctx.fillStyle = 'rgba(0, 15, 30, 0.2)';
      ctx.fillRect(centerMonX, centerMonY, centerMonW, centerMonH);

      termTimer++;
      if (termTimer >= 35) {
        termTimer = 0;
        if (termLines.length > 10) termLines.shift();
        termLines.push(TERM_POOL[Math.floor(Math.random() * TERM_POOL.length)]);
      }

      ctx.font = '10px "Courier New", monospace';
      termLines.forEach((line, idx) => {
        const isWarn = line.includes('[WARN]');
        const isOk = line.includes('active') || line.includes('verified');
        ctx.fillStyle = isWarn ? '#FF7A45' : isOk ? '#00FF99' : '#64D2FF';
        ctx.fillText(line, centerMonX + 12, centerMonY + 22 + idx * 12);
      });

      if (Math.floor(frame / 22) % 2 === 0) {
        ctx.fillStyle = '#00E5FF';
        ctx.fillRect(centerMonX + 12, centerMonY + 22 + termLines.length * 12 - 3, 5, 9);
      }
      ctx.restore();

      // 3. RIGHT MONITOR (Matrix Rain)
      const rightMonX = W * 0.60;
      const rightMonY = H * 0.20;
      const rightMonW = W * 0.26;
      const rightMonH = H * 0.32;

      ctx.save();
      ctx.beginPath();
      ctx.rect(rightMonX, rightMonY, rightMonW, rightMonH);
      ctx.clip();

      ctx.font = `${FONT_SIZE}px monospace`;
      const numCols = Math.floor(rightMonW / FONT_SIZE);
      for (let i = 0; i < numCols; i++) {
        const cx = rightMonX + i * FONT_SIZE;
        const dropIdx = i % drops.length;
        const cy = rightMonY + (drops[dropIdx] * FONT_SIZE);

        ctx.fillStyle = '#CCFFCC';
        ctx.fillText(rc(), cx, cy);

        for (let t = 1; t < 6; t++) {
          const a = Math.max(0, (1 - t / 6) * 0.55);
          ctx.fillStyle = `rgba(0, 230, 130, ${a})`;
          ctx.fillText(rc(), cx, cy - t * FONT_SIZE);
        }

        if (frame % 3 === 0) {
          drops[dropIdx]++;
          if (rightMonY + drops[dropIdx] * FONT_SIZE > rightMonY + rightMonH + 30) {
            drops[dropIdx] = -Math.floor(Math.random() * 15);
          }
        }
      }
      ctx.restore();

      // 4. HANDS TYPING ANIMATION & KEYBOARD FLASHES
      ctx.save();
      if (frame % 5 === 0) {
        const isRightHand = Math.random() > 0.5;
        const kx = isRightHand
          ? W * (0.52 + Math.random() * 0.08)
          : W * (0.44 + Math.random() * 0.07);
        const ky = H * (0.67 + Math.random() * 0.08);

        keyPresses.push({
          x: kx,
          y: ky,
          radius: 3,
          maxRadius: 10 + Math.random() * 6,
          alpha: 0.85,
          color: isRightHand ? '0, 220, 255' : '0, 255, 160'
        });
      }

      for (let i = keyPresses.length - 1; i >= 0; i--) {
        const kp = keyPresses[i];
        kp.radius += 0.7;
        kp.alpha -= 0.045;

        if (kp.alpha <= 0 || kp.radius >= kp.maxRadius) {
          keyPresses.splice(i, 1);
          continue;
        }

        const radGlow = ctx.createRadialGradient(kp.x, kp.y, 0, kp.x, kp.y, kp.radius);
        radGlow.addColorStop(0, `rgba(${kp.color}, ${kp.alpha})`);
        radGlow.addColorStop(0.5, `rgba(${kp.color}, ${kp.alpha * 0.4})`);
        radGlow.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = radGlow;
        ctx.beginPath();
        ctx.arc(kp.x, kp.y, kp.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 255, 255, ${kp.alpha})`;
        ctx.fillRect(kp.x - 2, kp.y - 1, 4, 2);
      }
      ctx.restore();

      // 5. FLOATING PARTICLES
      ctx.save();
      particles.forEach(p => {
        p.y += p.speedY;
        p.x += p.speedX;
        if (p.y < 0) {
          p.y = H;
          p.x = Math.random() * W;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color} ${p.alpha})`;
        ctx.shadowColor = 'cyan';
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
      ctx.restore();

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
// LOGIN PAGE COMPONENT (WHITE / LIGHT THEME + HACKER SCENE)
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
  useRealHackerOverlay(canvasRef);

  // Official Google Identity Services SDK Handler
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
              theme: "outline",
              size: "large",
              width: 360,
              text: "continue_with",
              shape: "rectangular",
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
    <div className="w-screen h-screen overflow-hidden bg-slate-950 font-sans flex flex-col lg:flex-row select-none">

      {/* ======================================================== */}
      {/* LEFT 50%: REALISTIC HACKER SCENE WITH LIVE OVERLAY       */}
      {/* ======================================================== */}
      <section className="w-full lg:w-1/2 h-[380px] lg:h-full relative overflow-hidden flex-shrink-0 bg-black">
        
        {/* Photorealistic Hacker Image */}
        <img
          src="/hacker_bg.jpg"
          alt="Real Human Hacker"
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.92] contrast-[1.08]"
        />

        {/* Dynamic Canvas Live Overlay */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block pointer-events-none" />

        {/* Top-left HUD badge */}
        <div className="absolute top-6 left-6 z-10 pointer-events-none">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-slate-950/80 border border-cyan-500/30 rounded-full backdrop-blur-md shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,220,255,0.9)] animate-pulse" />
            <span className="text-[11px] font-bold text-cyan-300 tracking-wider font-mono uppercase flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              SOC Live Feeds // Active Monitoring
            </span>
          </div>
        </div>

        {/* Bottom center HUD status bar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none whitespace-nowrap">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-950/85 border border-emerald-500/30 rounded-full backdrop-blur-md shadow-xl">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-[11px] font-semibold text-emerald-400 tracking-wider">
              ▶ REAL-TIME ADVERSARY THREAT SIMULATION // 100% ENCRYPTED
            </span>
          </div>
        </div>

        {/* Subtle gradient vignette at edge */}
        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-r from-transparent to-black/40 pointer-events-none hidden lg:block" />
      </section>

      {/* ======================================================== */}
      {/* RIGHT 50%: CRISP WHITE / LIGHT THEME CARD                */}
      {/* ======================================================== */}
      <section className="w-full lg:w-1/2 min-h-[calc(100vh-380px)] lg:h-full flex items-center justify-center p-6 sm:p-12 overflow-y-auto relative bg-white flex-shrink-0">

        {/* Soft background ambient light blobs */}
        <div className="absolute top-12 right-12 w-80 h-80 rounded-full bg-blue-100/50 blur-[90px] pointer-events-none" />
        <div className="absolute bottom-12 left-12 w-72 h-72 rounded-full bg-emerald-50/70 blur-[80px] pointer-events-none" />

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="w-full max-w-[440px] bg-white border border-slate-200/90 rounded-2xl p-8 sm:p-10 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.09)] relative z-10"
        >
          {/* Header */}
          <div className="flex flex-col items-start mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 shadow-[0_2px_8px_rgba(37,99,235,0.12)]">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-[#1E3A8A] tracking-tight">
              eRakshak Security
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
              Authenticate to access the eRakshak Forensics & Threat Defense Platform.
            </p>
          </div>

          {/* Official Google Identity Services SDK Button */}
          <div className="w-full mb-5 flex flex-col items-center">
            <div id="google-official-btn-slot" className="w-full flex justify-center min-h-[44px]" />
            {isGoogleLoading && (
              <div className="mt-2 text-xs text-blue-600 font-semibold flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>Authenticating with Google...</span>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center mb-5">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
              or credentials
            </span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Username */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#1E3A8A]">
                Username or Email
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-all shadow-sm"
                  placeholder="admin or name@company.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#1E3A8A]">
                  Security Password
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">Quick Fill:</span>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('admin', 'secret')}
                    className="text-[11px] font-medium text-blue-600 hover:text-blue-700 underline cursor-pointer"
                  >
                    Admin
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('shrutha', 'shrutha123')}
                    className="text-[11px] font-medium text-blue-600 hover:text-blue-700 underline cursor-pointer"
                  >
                    Shrutha
                  </button>
                </div>
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 transition-all shadow-sm"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Remember this device</span>
              </label>

              <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                TLS 1.3
              </span>
            </div>

            {/* Error feedback */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 text-red-700 bg-red-50 p-3 rounded-lg border border-red-200 text-xs font-medium"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full mt-2 py-3 px-4 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold tracking-tight shadow-[0_4px_14px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.35)] active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /><span>Verifying Credentials...</span></>
              ) : isSuccess ? (
                <><CheckCircle2 className="w-4 h-4" /><span>Signed In Successfully</span></>
              ) : (
                <><span>Sign In Securely</span><ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Footer */}
          <footer className="mt-8 pt-5 border-t border-slate-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>System Status: <strong className="text-slate-800 font-semibold">Operational</strong></span>
            </div>
            <div className="text-[11px] text-slate-400">Protected by 256-bit TLS Encryption</div>
          </footer>
        </motion.div>
      </section>
    </div>
  );
};

export default LoginPage;
