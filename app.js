/**
 * SHIELDMAIL SECURITY // THE GLOBAL SANITY STREAM (DATA FLOW ANIMATION)
 * Features:
 * - Light Ice-Blue Background with Faint Connection Grid Arcs
 * - Constant, Soothing Flow of Slow-Moving Soft Blue & Emerald Glowing Pulses
 * - Tiny Faint Expanding Rings upon Destination Arrival (Successful Packet Delivery)
 * - Calming, Reassuring Visual Aesthetics
 */

(function () {
  'use strict';

  const FIXED_NODES = [
    { id: 'US-E', name: 'US East Enclave', xNorm: 0.26, yNorm: 0.35, city: 'New York' },
    { id: 'US-W', name: 'US West Enclave', xNorm: 0.16, yNorm: 0.39, city: 'San Francisco' },
    { id: 'EU-W', name: 'EU West Gateway', xNorm: 0.48, yNorm: 0.28, city: 'London' },
    { id: 'EU-C', name: 'EU Central Core', xNorm: 0.54, yNorm: 0.31, city: 'Frankfurt' },
    { id: 'AP-N', name: 'Asia North Hub', xNorm: 0.84, yNorm: 0.38, city: 'Tokyo' },
    { id: 'AP-S', name: 'Asia South Hub', xNorm: 0.76, yNorm: 0.58, city: 'Singapore' },
    { id: 'OC-S', name: 'Oceania Relay', xNorm: 0.88, yNorm: 0.76, city: 'Sydney' },
    { id: 'SA-E', name: 'South America Vault', xNorm: 0.34, yNorm: 0.70, city: 'São Paulo' },
    { id: 'ME-C', name: 'Middle East Node', xNorm: 0.64, yNorm: 0.45, city: 'Dubai' },
    { id: 'CA-E', name: 'Canada East Node', xNorm: 0.24, yNorm: 0.30, city: 'Toronto' }
  ];

  const FIXED_CONNECTIONS = [
    [0, 1], [0, 2], [0, 7], [0, 9], [1, 9], [1, 4], [2, 3], 
    [3, 8], [8, 5], [4, 5], [5, 6], [4, 6], [2, 8]
  ];

  function generateContinentalMesh() {
    const pts = [];
    function addCluster(cx, cy, rx, ry, count) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random());
        pts.push({
          xNorm: cx + Math.cos(angle) * rx * r,
          yNorm: cy + Math.sin(angle) * ry * r
        });
      }
    }
    addCluster(0.20, 0.34, 0.12, 0.10, 110);
    addCluster(0.33, 0.68, 0.08, 0.16, 80);
    addCluster(0.50, 0.28, 0.08, 0.08, 90);
    addCluster(0.52, 0.54, 0.09, 0.16, 90);
    addCluster(0.72, 0.36, 0.16, 0.12, 140);
    addCluster(0.85, 0.74, 0.07, 0.08, 60);
    return pts;
  }

  const CONTINENT_POINTS = generateContinentalMesh();

  const canvas = document.getElementById('threatMap');
  const ctx = canvas.getContext('2d');

  let width = 0;
  let height = 0;
  let dpr = window.devicePixelRatio || 1;
  let lastSpawnTime = 0;

  const activePulses = [];
  const arrivalRipples = [];

  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    ctx.scale(dpr, dpr);
  }

  class SafeDataPulse {
    constructor(srcIndex, dstIndex, pulseType = 'blue') {
      this.src = FIXED_NODES[srcIndex];
      this.dst = FIXED_NODES[dstIndex];
      this.type = pulseType;
      this.progress = 0;
      this.speed = 0.004 + Math.random() * 0.003;
      
      const x0 = this.src.xNorm * width;
      const y0 = this.src.yNorm * height;
      const x1 = this.dst.xNorm * width;
      const y1 = this.dst.yNorm * height;

      const midX = (x0 + x1) / 2;
      const midY = (y0 + y1) / 2;
      const dx = x1 - x0;
      const dy = y1 - y0;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const elevation = Math.min(dist * 0.28, 65);
      const nx = -dy / dist;
      const ny = dx / dist;

      this.cpX = midX + nx * elevation * (midY > height / 2 ? -1 : 1);
      this.cpY = midY + ny * elevation * (midY > height / 2 ? -1 : 1) - (dist * 0.08);

      this.tail = [];
      this.maxTail = 16;
    }

    getPoint(t) {
      const x0 = this.src.xNorm * width;
      const y0 = this.src.yNorm * height;
      const x1 = this.dst.xNorm * width;
      const y1 = this.dst.yNorm * height;

      const inv = 1 - t;
      const x = inv * inv * x0 + 2 * inv * t * this.cpX + t * t * x1;
      const y = inv * inv * y0 + 2 * inv * t * this.cpY + t * t * y1;
      return { x, y };
    }

    update() {
      this.progress += this.speed;
      const pt = this.getPoint(Math.min(this.progress, 1));
      this.tail.unshift(pt);
      if (this.tail.length > this.maxTail) {
        this.tail.pop();
      }
    }

    draw(c) {
      if (this.tail.length < 2) return;

      const isGreen = this.type === 'green';
      const primaryColor = isGreen ? '#10B981' : '#3B82F6';
      const strokeColor = isGreen ? 'rgba(16, 185, 129,' : 'rgba(59, 130, 246,';

      for (let i = 0; i < this.tail.length - 1; i++) {
        const p1 = this.tail[i];
        const p2 = this.tail[i + 1];
        const ratio = 1 - (i / this.tail.length);
        const alpha = ratio * 0.75;
        const lineW = ratio * 2.6 + 0.6;

        c.beginPath();
        c.moveTo(p1.x, p1.y);
        c.lineTo(p2.x, p2.y);
        c.strokeStyle = `${strokeColor} ${alpha})`;
        c.lineWidth = lineW;
        c.stroke();
      }

      const head = this.tail[0];
      c.beginPath();
      c.arc(head.x, head.y, 2.8, 0, Math.PI * 2);
      c.fillStyle = '#FFFFFF';
      c.shadowColor = primaryColor;
      c.shadowBlur = 8;
      c.fill();
      c.shadowBlur = 0;
    }
  }

  class DeliveryRing {
    constructor(x, y, isGreen = false) {
      this.x = x;
      this.y = y;
      this.r = 2;
      this.maxR = 18;
      this.alpha = 0.65;
      this.color = isGreen ? 'rgba(16, 185, 129,' : 'rgba(37, 99, 235,';
      this.alive = true;
    }

    update() {
      this.r += 0.6;
      this.alpha = Math.max(0, 0.65 * (1 - this.r / this.maxR));
      if (this.r >= this.maxR) {
        this.alive = false;
      }
    }

    draw(c) {
      if (!this.alive || this.alpha <= 0) return;
      c.save();
      c.beginPath();
      c.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      c.strokeStyle = `${this.color} ${this.alpha})`;
      c.lineWidth = 1.2;
      c.stroke();
      c.restore();
    }
  }

  function triggerArrival(pulse) {
    const dx = pulse.dst.xNorm * width;
    const dy = pulse.dst.yNorm * height;
    arrivalRipples.push(new DeliveryRing(dx, dy, pulse.type === 'green'));
  }

  function render(timestamp) {
    ctx.clearRect(0, 0, width, height);

    // 1. Grid
    ctx.save();
    ctx.strokeStyle = 'rgba(219, 234, 254, 0.55)';
    ctx.lineWidth = 1;
    const gridSpacing = 50;
    for (let x = gridSpacing; x < width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = gridSpacing; y < height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();

    // 2. Continents
    ctx.save();
    ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
    CONTINENT_POINTS.forEach(p => {
      const px = p.xNorm * width;
      const py = p.yNorm * height;
      ctx.beginPath();
      ctx.arc(px, py, 1.1, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // 3. Faint Connections
    ctx.save();
    FIXED_CONNECTIONS.forEach(([i, j]) => {
      const n1 = FIXED_NODES[i];
      const n2 = FIXED_NODES[j];
      if (n1 && n2) {
        const x0 = n1.xNorm * width;
        const y0 = n1.yNorm * height;
        const x1 = n2.xNorm * width;
        const y1 = n2.yNorm * height;

        const midX = (x0 + x1) / 2;
        const midY = (y0 + y1) / 2;
        const dx = x1 - x0;
        const dy = y1 - y0;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const elevation = Math.min(dist * 0.28, 65);
        const nx = -dy / dist;
        const ny = dx / dist;

        const cpX = midX + nx * elevation * (midY > height / 2 ? -1 : 1);
        const cpY = midY + ny * elevation * (midY > height / 2 ? -1 : 1) - (dist * 0.08);

        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo(cpX, cpY, x1, y1);
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.65)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });
    ctx.restore();

    // 4. Spawn Pulses
    if (timestamp - lastSpawnTime > 1200 && activePulses.length < 8) {
      const conn = FIXED_CONNECTIONS[Math.floor(Math.random() * FIXED_CONNECTIONS.length)];
      const isReverse = Math.random() > 0.5;
      const srcIdx = isReverse ? conn[1] : conn[0];
      const dstIdx = isReverse ? conn[0] : conn[1];
      const type = Math.random() > 0.45 ? 'blue' : 'green';

      activePulses.push(new SafeDataPulse(srcIdx, dstIdx, type));
      lastSpawnTime = timestamp;
    }

    // 5. Update Pulses
    for (let i = activePulses.length - 1; i >= 0; i--) {
      const p = activePulses[i];
      p.update();
      p.draw(ctx);

      if (p.progress >= 1.0) {
        triggerArrival(p);
        activePulses.splice(i, 1);
      }
    }

    // 6. Update Rings
    for (let i = arrivalRipples.length - 1; i >= 0; i--) {
      const ring = arrivalRipples[i];
      ring.update();
      ring.draw(ctx);
      if (!ring.alive) {
        arrivalRipples.splice(i, 1);
      }
    }

    // 7. Draw Nodes
    const time = timestamp * 0.002;
    FIXED_NODES.forEach((node, idx) => {
      const nx = node.xNorm * width;
      const ny = node.yNorm * height;

      ctx.save();
      const aura = Math.sin(time + idx * 0.8) * 1.2;
      ctx.beginPath();
      ctx.arc(nx, ny, 4.5 + aura, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.10)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(nx, ny, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 1.2;
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(nx, ny, 1.6, 0, Math.PI * 2);
      ctx.fillStyle = idx % 2 === 0 ? '#2563EB' : '#10B981';
      ctx.fill();

      ctx.font = '500 9.5px "Inter", sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText(node.city, nx + 7, ny + 3.5);
      ctx.restore();
    });

    requestAnimationFrame(render);
  }

  // Form Controls
  const loginForm = document.getElementById('loginForm');
  const submitBtn = document.getElementById('submitBtn');
  const btnText = document.getElementById('btnText');
  const togglePasswordBtn = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('password');
  const eyeOpenIcon = document.getElementById('eyeOpenIcon');
  const eyeClosedIcon = document.getElementById('eyeClosedIcon');
  const authStatus = document.getElementById('authStatus');
  const statusMessage = document.getElementById('statusMessage');
  const statusSpinner = document.getElementById('statusSpinner');
  const forgotLink = document.getElementById('forgotLink');

  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', function () {
      const isPass = passwordInput.type === 'password';
      passwordInput.type = isPass ? 'text' : 'password';
      eyeOpenIcon.classList.toggle('hidden', isPass);
      eyeClosedIcon.classList.toggle('hidden', !isPass);
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const username = document.getElementById('username').value.trim();
      const password = passwordInput.value.trim();

      if (!username || !password) {
        showStatus('Please provide both username and password.', 'error');
        return;
      }

      submitBtn.disabled = true;
      btnText.textContent = 'Verifying Credentials...';
      showStatus('Establishing secure TLS session with server...', 'loading');

      setTimeout(() => {
        btnText.textContent = 'Signed In Successfully';
        submitBtn.style.backgroundColor = '#10B981';
        showStatus('Authentication successful. Redirecting to portal...', 'success');

        setTimeout(() => {
          btnText.textContent = 'Sign In Securely';
          submitBtn.disabled = false;
          submitBtn.style.backgroundColor = '';
          authStatus.className = 'auth-status';
        }, 3000);
      }, 1200);
    });
  }

  function showStatus(msg, type) {
    if (!authStatus || !statusMessage) return;
    authStatus.className = `auth-status visible ${type}`;
    statusMessage.textContent = msg;
    if (statusSpinner) {
      statusSpinner.style.display = type === 'loading' ? 'block' : 'none';
    }
  }

  if (forgotLink) {
    forgotLink.addEventListener('click', function (e) {
      e.preventDefault();
      alert('Password reset instructions will be sent to your registered corporate email.');
    });
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  activePulses.push(new SafeDataPulse(0, 2, 'blue'));
  activePulses.push(new SafeDataPulse(1, 4, 'green'));
  activePulses.push(new SafeDataPulse(3, 8, 'blue'));

  requestAnimationFrame(render);

})();
