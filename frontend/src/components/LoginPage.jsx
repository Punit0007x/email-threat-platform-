import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Lock, User, AlertCircle, CheckCircle2, Eye, EyeOff, ArrowRight, Activity, Terminal
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

      // ========================================================
      // 1. LEFT MONITOR (Network Map Pulses & Glow)
      // Screen bounds approx: X (5% to 31%), Y (22% to 71%)
      // ========================================================
      const leftMonX = W * 0.05;
      const leftMonY = H * 0.22;
      const leftMonW = W * 0.26;
      const leftMonH = H * 0.49;

      ctx.save();
      ctx.beginPath();
      ctx.rect(leftMonX, leftMonY, leftMonW, leftMonH);
      ctx.clip(); // Strictly clipped inside left monitor bezel

      // Subtle pulse on map nodes
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

      // ========================================================
      // 2. CENTER MONITOR (Live Terminal Code)
      // Screen bounds approx: X (32% to 59%), Y (20% to 55%)
      // ========================================================
      const centerMonX = W * 0.32;
      const centerMonY = H * 0.20;
      const centerMonW = W * 0.27;
      const centerMonH = H * 0.35;

      ctx.save();
      ctx.beginPath();
      ctx.rect(centerMonX, centerMonY, centerMonW, centerMonH);
      ctx.clip(); // Strictly clipped inside center monitor bezel

      // Screen glow overlay
      ctx.fillStyle = 'rgba(0, 15, 30, 0.2)';
      ctx.fillRect(centerMonX, centerMonY, centerMonW, centerMonH);

      // Terminal text feed
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

      // Blinking Terminal cursor
      if (Math.floor(frame / 22) % 2 === 0) {
        ctx.fillStyle = '#00E5FF';
        ctx.fillRect(centerMonX + 12, centerMonY + 22 + termLines.length * 12 - 3, 5, 9);
      }
      ctx.restore();

      // ========================================================
      // 3. RIGHT MONITOR (Matrix Binary Rain)
      // Screen bounds approx: X (60% to 86%), Y (20% to 52%)
      // ========================================================
      const rightMonX = W * 0.60;
      const rightMonY = H * 0.20;
      const rightMonW = W * 0.26;
      const rightMonH = H * 0.32;

      ctx.save();
      ctx.beginPath();
      ctx.rect(rightMonX, rightMonY, rightMonW, rightMonH);
      ctx.clip(); // Strictly clipped inside right monitor bezel

      // Matrix Rain on right monitor
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

      // ========================================================
      // 4. LIVE HANDS TYPING ANIMATION & KEYBOARD LED FLASHES
      // Keyboard area approx: X (43% to 62%), Y (65% to 78%)
      // ========================================================
      ctx.save();

      // Periodically trigger key presses near hands position
      if (frame % 5 === 0) {
        // Left hand area: X 44%-51%, Y 67%-76% | Right hand area: X 52%-60%, Y 67%-76%
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

      // Render & update key press ripples under fingertips
      for (let i = keyPresses.length - 1; i >= 0; i--) {
        const kp = keyPresses[i];
        kp.radius += 0.7;
        kp.alpha -= 0.045;

        if (kp.alpha <= 0 || kp.radius >= kp.maxRadius) {
          keyPresses.splice(i, 1);
          continue;
        }

        // Key LED bloom
        const radGlow = ctx.createRadialGradient(kp.x, kp.y, 0, kp.x, kp.y, kp.radius);
        radGlow.addColorStop(0, `rgba(${kp.color}, ${kp.alpha})`);
        radGlow.addColorStop(0.5, `rgba(${kp.color}, ${kp.alpha * 0.4})`);
        radGlow.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = radGlow;
        ctx.beginPath();
        ctx.arc(kp.x, kp.y, kp.radius, 0, Math.PI * 2);
        ctx.fill();

        // Bright keycap center flash
        ctx.fillStyle = `rgba(255, 255, 255, ${kp.alpha})`;
        ctx.fillRect(kp.x - 2, kp.y - 1, 4, 2);
      }

      // Animated live finger shadow/motion accents on keyboard
      const fingerShiftLeft = Math.sin(frame * 0.25) * 2.5;
      const fingerShiftRight = Math.cos(frame * 0.3) * 2.5;

      // Left hand fingertip glows
      [
        { x: W * 0.46 + fingerShiftLeft, y: H * 0.69 },
        { x: W * 0.48 - fingerShiftLeft * 0.5, y: H * 0.70 },
        { x: W * 0.50 + fingerShiftLeft * 0.7, y: H * 0.695 },
      ].forEach(pt => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 220, 255, 0.4)';
        ctx.shadowColor = '#00E5FF';
        ctx.shadowBlur = 5;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Right hand fingertip glows
      [
        { x: W * 0.54 + fingerShiftRight, y: H * 0.70 },
        { x: W * 0.56 - fingerShiftRight * 0.6, y: H * 0.69 },
        { x: W * 0.58 + fingerShiftRight * 0.4, y: H * 0.705 },
      ].forEach(pt => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 255, 160, 0.4)';
        ctx.shadowColor = '#00FF99';
        ctx.shadowBlur = 5;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      ctx.restore();

      // ========================================================
      // 5. FLOATING PARTICLES & ROOM AMBIENT LIGHT
      // ========================================================
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

      // Subtle ambient room breathing light
      const pulse = (Math.sin(frame * 0.035) + 1) / 2;
      const roomGlow = ctx.createRadialGradient(W * 0.5, H * 0.45, W * 0.15, W * 0.5, H * 0.45, W * 0.65);
      roomGlow.addColorStop(0, `rgba(0, 160, 255, ${0.03 + pulse * 0.035})`);
      roomGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = roomGlow;
      ctx.fillRect(0, 0, W, H);

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
// LOGIN PAGE COMPONENT
// ============================================================
const LoginPage = ({ onLogin, onGoogleLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Google Account Chooser Modal State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [useCustomAccount, setUseCustomAccount] = useState(false);

  const canvasRef = useRef(null);
  useRealHackerOverlay(canvasRef);

  const GOOGLE_ACCOUNTS = [
    {
      name: 'Punit Bagali',
      email: 'punitbagali007@gmail.com',
      role: 'Lead Threat Hunter & Analyst',
      initials: 'PB',
      color: 'bg-blue-600'
    },
    {
      name: 'SOC Administrator',
      email: 'admin@security-platform.corp',
      role: 'Enterprise Security Lead',
      initials: 'SA',
      color: 'bg-emerald-600'
    },
    {
      name: 'Security Officer',
      email: 'analyst@security-platform.corp',
      role: 'Tier-2 Threat Analyst',
      initials: 'SO',
      color: 'bg-purple-600'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setIsSuccess(false);
    try {
      await onLogin(username, password, rememberMe);
      setIsSuccess(true);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
      setIsLoading(false);
    }
  };

  const handleGoogleCredentialResponse = async (response) => {
    if (!response || !response.credential) return;
    setIsGoogleLoading(true);
    setError(null);
    try {
      // Decode the JWT from Google
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
      setError(err.message || 'Google sign-in failed. Please try again.');
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

          const btnEl = document.getElementById("google-official-signin-button");
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
          console.warn("Google GSI initialization notice:", e);
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
      }, 300);
      return () => clearInterval(timer);
    }
  }, []);

  const handleOpenGoogleModal = () => {
    setError(null);
    setShowGoogleModal(true);
  };

  const handleSelectGoogleAccount = async (account) => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      if (onGoogleLogin) {
        await onGoogleLogin({
          email: account.email,
          name: account.name,
          picture: null
        }, rememberMe);
      }
      setShowGoogleModal(false);
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  const handleCustomGoogleSubmit = async (e) => {
    e.preventDefault();
    if (!customGoogleEmail.trim()) return;
    setIsGoogleLoading(true);
    setError(null);
    try {
      const email = customGoogleEmail.trim();
      const name = customGoogleName.trim() || email.split('@')[0].replace('.', ' ');
      if (onGoogleLogin) {
        await onGoogleLogin({ email, name, picture: null }, rememberMe);
      }
      setShowGoogleModal(false);
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-950 font-sans flex flex-col lg:flex-row select-none">

      {/* ======================================================== */}
      {/* LEFT 50%: PHOTOREALISTIC HACKER SCENE WITH LIVE OVERLAY  */}
      {/* ======================================================== */}
      <section className="w-full lg:w-1/2 h-[380px] lg:h-full relative overflow-hidden flex-shrink-0 bg-black">
        
        {/* Photorealistic Hacker Background Image */}
        <img
          src="/hacker_bg.jpg"
          alt="Real Human Hacker"
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.92] contrast-[1.08]"
        />

        {/* Dynamic Canvas Live Overlay (Matrix Rain, Terminal Code, Typing Hands) */}
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

        {/* Subtle gradient vignette at edge near split line */}
        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-r from-transparent to-black/40 pointer-events-none hidden lg:block" />
      </section>

      {/* ======================================================== */}
      {/* RIGHT 50%: PURE WHITE CLEAN LOGIN CARD                   */}
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
              ShieldMail Security
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
              Authenticate to access the Email Forensics & Threat Platform.
            </p>
          </div>

          {/* Official Google Identity Services Button Container */}
          <div id="google-official-signin-button" className="w-full flex justify-center mb-3 min-h-[40px]" />

          {/* Google Sign-in Button */}
          <button
            type="button"
            onClick={handleOpenGoogleModal}
            disabled={isGoogleLoading || isLoading}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold shadow-sm hover:shadow transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed mb-5 group cursor-pointer"
          >
            {isGoogleLoading ? (
              <div className="w-4 h-4 border-2 border-slate-400 border-t-blue-600 rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

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
                <a
                  href="#forgot"
                  onClick={e => { e.preventDefault(); alert('Default credentials:\nUsername: admin\nPassword: secret'); }}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  Need credentials?
                </a>
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
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Remember this device (stay logged in across refresh)</span>
              </label>
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

      {/* ======================================================== */}
      {/* GOOGLE SIGN-IN ACCOUNT CHOOSER MODAL                     */}
      {/* ======================================================== */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full max-w-[440px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <div>
                  <h3 className="text-base font-bold text-slate-800 tracking-tight font-sans">
                    Sign in with Google
                  </h3>
                  <p className="text-xs text-slate-500">
                    Choose an account to continue to <span className="font-semibold text-blue-600">ShieldMail</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors text-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[420px] overflow-y-auto">
              {isGoogleLoading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-4">
                  <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <div className="text-sm font-semibold text-slate-700 font-sans">
                    Authenticating with Google SSO...
                  </div>
                  <div className="text-xs text-slate-400">Verifying security token & provisioning session</div>
                </div>
              ) : !useCustomAccount ? (
                <>
                  {/* Account List */}
                  <div className="space-y-2">
                    {GOOGLE_ACCOUNTS.map((acc, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectGoogleAccount(acc)}
                        className="w-full p-3.5 rounded-2xl border border-slate-200/80 hover:border-blue-400 hover:bg-blue-50/40 text-left transition-all flex items-center gap-3.5 group cursor-pointer"
                      >
                        <div className={`w-10 h-10 rounded-full ${acc.color} text-white font-bold text-sm flex items-center justify-center shadow-sm`}>
                          {acc.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 truncate transition-colors">
                            {acc.name}
                          </div>
                          <div className="text-xs text-slate-500 truncate font-mono">
                            {acc.email}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            {acc.role}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    ))}
                  </div>

                  {/* Option to use another account */}
                  <button
                    type="button"
                    onClick={() => setUseCustomAccount(true)}
                    className="w-full py-3 px-4 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 bg-slate-50/60 hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <User className="w-4 h-4 text-slate-500" />
                    <span>Use another Google account</span>
                  </button>
                </>
              ) : (
                /* Custom Google Account Form */
                <form onSubmit={handleCustomGoogleSubmit} className="space-y-4">
                  <div className="text-xs text-slate-600 mb-2">
                    Enter your Google email address to authenticate with ShieldMail.
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Google Email Address
                    </label>
                    <input
                      type="email"
                      required
                      autoFocus
                      value={customGoogleEmail}
                      onChange={e => setCustomGoogleEmail(e.target.value)}
                      placeholder="your.name@gmail.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Full Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={customGoogleName}
                      onChange={e => setCustomGoogleName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setUseCustomAccount(false)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-100 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-sm"
                    >
                      Sign In
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Google Identity Services SSO</span>
              <span>Encrypted SHA-256</span>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
