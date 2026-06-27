import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import './spin.css';

function getHourKey() {
  return Math.floor(Date.now() / 3600000);
}

function getSecsLeftInHour() {
  const msInHour   = 3600000;
  const msThisHour = Date.now() % msInHour;
  return Math.ceil((msInHour - msThisHour) / 1000);
}

function fmtMmSs(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const MAX_SPINS  = 3;
const CANVAS_SIZE = 280;

const SEGMENTS = [
  { coins: 10,  color: '#f97316', label: '10',  emoji: '🪙' },
  { coins: 5,   color: '#8b5cf6', label: '5',   emoji: '⭐' },
  { coins: 25,  color: '#ec4899', label: '25',  emoji: '💰' },
  { coins: 15,  color: '#06b6d4', label: '15',  emoji: '🌊' },
  { coins: 50,  color: '#eab308', label: '50',  emoji: '💎' },
  { coins: 10,  color: '#22c55e', label: '10',  emoji: '🌿' },
  { coins: 5,   color: '#ef4444', label: '5',   emoji: '🎯' },
  { coins: 100, color: '#a855f7', label: '100', emoji: '👑' },
];

export default function SpinGame() {
  const { user, spinWheelClaim } = useApp();
  const navigate = useNavigate();

  const [spinning,   setSpinning]   = useState(false);
  const [winner,     setWinner]     = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft,   setTimeLeft]   = useState(getSecsLeftInHour());

  const canvasRef   = useRef(null);
  const rotationRef = useRef(0);
  const rafRef      = useRef(null);
  const dprRef      = useRef(1);
  const audioCtxRef = useRef(null);
  const lastSegRef  = useRef(-1);

  // AudioContext lazy-init (user gesture ke baad)
  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Tick sound — segment cross pe click/pop
  const playTick = useCallback((speed = 1) => {
    try {
      const ctx  = getAudioCtx();
      const t    = ctx.currentTime;
      const buf  = ctx.createBuffer(1, ctx.sampleRate * 0.025, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.15));
      }
      const src  = ctx.createBufferSource();
      src.buffer = buf;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(Math.min(0.35, 0.18 + speed * 0.04), t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
      const bpf  = ctx.createBiquadFilter();
      bpf.type  = 'bandpass';
      bpf.frequency.value = 1800 + speed * 200;
      bpf.Q.value = 1.2;
      src.connect(bpf);
      bpf.connect(gain);
      gain.connect(ctx.destination);
      src.start(t);
    } catch (_) {}
  }, []);

  // Win jingle — ascending chime
  const playWin = useCallback(() => {
    try {
      const ctx    = getAudioCtx();
      const notes  = [523, 659, 784, 1047, 1319];
      notes.forEach((freq, i) => {
        const t    = ctx.currentTime + i * 0.12;
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.28, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.38);
      });
    } catch (_) {}
  }, []);

  const hourKey   = getHourKey();
  const spinCount = (user?.spin_hour_key === hourKey) ? (user?.spin_hour_count ?? 0) : 0;
  const spinsLeft = Math.max(0, MAX_SPINS - spinCount);
  const canSpin   = !spinning && spinsLeft > 0 && !!user;

  // Live countdown when spins exhausted
  useEffect(() => {
    if (spinsLeft > 0) return;
    setTimeLeft(getSecsLeftInHour());
    const id = setInterval(() => {
      const s = getSecsLeftInHour();
      setTimeLeft(s);
      if (s <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [spinsLeft]);

  const drawWheel = useCallback((rotDeg) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx    = canvas.getContext('2d');
    const dpr    = dprRef.current;
    const size   = CANVAS_SIZE;
    const cx     = size / 2;
    const cy     = size / 2;
    const outerR = cx - 6;
    const n      = SEGMENTS.length;
    const arcRad = (2 * Math.PI) / n;
    const rotRad = (rotDeg * Math.PI) / 180;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    SEGMENTS.forEach((seg, i) => {
      const startAngle = rotRad - Math.PI / 2 + i * arcRad;
      const endAngle   = startAngle + arcRad;
      const midAngle   = startAngle + arcRad / 2;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerR, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle   = seg.color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth   = 2.5;
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(midAngle);

      ctx.font         = '15px serif';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle    = '#fff';
      ctx.shadowColor  = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur   = 3;
      ctx.fillText(seg.emoji, outerR * 0.56, -3);

      ctx.font       = `bold 12px "Segoe UI", sans-serif`;
      ctx.shadowBlur = 4;
      ctx.fillText(seg.label, outerR * 0.79, 4);
      ctx.shadowBlur = 0;

      ctx.restore();
    });

    // Center hub
    const hubGrd = ctx.createRadialGradient(cx - 3, cy - 3, 2, cx, cy, 32);
    hubGrd.addColorStop(0, '#3d3d60');
    hubGrd.addColorStop(1, '#1a1a2e');
    ctx.beginPath();
    ctx.arc(cx, cy, 32, 0, 2 * Math.PI);
    ctx.fillStyle   = hubGrd;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth   = 2;
    ctx.stroke();

    // Center label
    if (spinning) {
      ctx.font         = 'bold 9px "Segoe UI", sans-serif';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle    = 'rgba(255,255,255,0.5)';
      ctx.shadowBlur   = 0;
      ctx.fillText('...', cx, cy);
    } else if (spinsLeft > 0) {
      ctx.font         = 'bold 11px "Segoe UI", sans-serif';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle    = '#fff';
      ctx.shadowColor  = 'rgba(255,106,0,0.8)';
      ctx.shadowBlur   = 8;
      ctx.fillText('TAP', cx, cy - 6);
      ctx.font         = 'bold 8px "Segoe UI", sans-serif';
      ctx.fillStyle    = 'rgba(255,200,100,0.9)';
      ctx.shadowBlur   = 0;
      ctx.fillText('SPIN', cx, cy + 7);
    } else {
      ctx.font         = 'bold 8px "Segoe UI", sans-serif';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle    = 'rgba(255,255,255,0.4)';
      ctx.shadowBlur   = 0;
      ctx.fillText('DONE', cx, cy);
    }
  }, [spinning, spinsLeft]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr           = window.devicePixelRatio || 1;
    dprRef.current      = dpr;
    canvas.width        = CANVAS_SIZE * dpr;
    canvas.height       = CANVAS_SIZE * dpr;
    canvas.style.width  = `${CANVAS_SIZE}px`;
    canvas.style.height = `${CANVAS_SIZE}px`;
    drawWheel(0);
  }, [drawWheel]);

  useEffect(() => {
    if (!spinning) drawWheel(rotationRef.current);
  }, [spinning, spinsLeft, drawWheel]);

  const handleCanvasTap = (e) => {
    if (!canSpin) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const tapX = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const tapY = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    const cx   = CANVAS_SIZE / 2;
    const cy   = CANVAS_SIZE / 2;
    if (Math.sqrt((tapX - cx) ** 2 + (tapY - cy) ** 2) <= 32) doSpin();
  };

  const doSpin = () => {
    if (!canSpin) return;
    const n      = SEGMENTS.length;
    const arc    = 360 / n;
    const winIdx = Math.floor(Math.random() * n);

    const segAngle     = (winIdx + 0.5) * arc;
    const targetRotDeg = (360 - (segAngle % 360)) % 360;
    const currentNorm  = ((rotationRef.current % 360) + 360) % 360;
    const delta        = ((targetRotDeg - currentNorm) + 360) % 360;
    const extraSpins   = 5 + Math.floor(Math.random() * 4);
    const totalSpin    = extraSpins * 360 + delta;
    const startRot     = rotationRef.current;
    const finalRot     = startRot + totalSpin;
    const duration     = 4200 + Math.random() * 600;
    const startTime    = performance.now();

    lastSegRef.current = -1;
    setSpinning(true);
    setWinner(null);

    const animate = (now) => {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease     = 1 - Math.pow(1 - progress, 4);
      const current  = startRot + totalSpin * ease;
      rotationRef.current = current;
      drawWheel(current);

      // Tick sound — jab bhi naya segment pointer ke neeche aaye
      const normDeg  = ((current % 360) + 360) % 360;
      const curSeg   = Math.floor(normDeg / arc) % n;
      if (curSeg !== lastSegRef.current) {
        lastSegRef.current = curSeg;
        // speed = derivative (fast pe tez, slow pe halka)
        const speed = Math.max(0, 1 - progress) * 8;
        playTick(speed);
      }

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        rotationRef.current = finalRot;
        drawWheel(finalRot);
        const won = SEGMENTS[winIdx];
        setWinner(won);
        setSpinning(false);
        setShowResult(true);
        playWin();
        spinWheelClaim(won.coins).catch(() => {});
      }
    };
    rafRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const closeResult = () => setShowResult(false);

  const spinsDone = MAX_SPINS - spinsLeft;

  return (
    <div className="sw-page">
      <div className="sw-glow sw-glow1" />
      <div className="sw-glow sw-glow2" />

      {/* ── Header ── */}
      <div className="sw-header">
        <button className="sw-back-btn" onClick={() => navigate('/games')}>
          ← Back
        </button>
        <div className="sw-title">🎰 Spin Wheel</div>
        <div className="sw-balance-chip">
          <span>🪙</span>
          <span>{(user?.balance ?? 0).toLocaleString()}</span>
        </div>
      </div>

      {/* ── Spins dot indicators ── */}
      <div className="sw-spins-row">
        <div className="sw-dots">
          {Array.from({ length: MAX_SPINS }).map((_, i) => (
            <div
              key={i}
              className={`sw-dot ${i < spinsDone ? 'sw-dot-used' : 'sw-dot-free'}`}
            />
          ))}
        </div>
      </div>

      {/* ── Wheel ── */}
      <div className="sw-wheel-area">
        <div className="sw-pointer-wrap">
          <div className="sw-pointer" />
        </div>
        <canvas
          ref={canvasRef}
          className={`sw-canvas ${canSpin ? 'sw-canvas-active' : ''}`}
          onClick={handleCanvasTap}
          onTouchEnd={handleCanvasTap}
        />
        <div className="sw-tap-hint">
          {canSpin ? 'Beech mein tap karke spin karo!' : ''}
        </div>
      </div>

      {/* ── Bottom area ── */}
      <div className="sw-bottom">
        {spinsLeft === 0 ? (
          /* Timer box */
          <div className="sw-timer-box">
            <div className="sw-timer-label">⏳ Agli baar ke liye taiyar raho</div>
            <div className="sw-timer-display">{fmtMmSs(timeLeft)}</div>
            <div className="sw-timer-sub">Naye spins is waqt milenge</div>
          </div>
        ) : (
          /* Rewards info grid */
          <div className="sw-rewards-grid">
            <div className="sw-reward-chip" style={{ borderColor: '#a855f7' }}>
              <span>👑</span>
              <span>100 coins</span>
            </div>
            <div className="sw-reward-chip" style={{ borderColor: '#eab308' }}>
              <span>💎</span>
              <span>50 coins</span>
            </div>
            <div className="sw-reward-chip" style={{ borderColor: '#ec4899' }}>
              <span>💰</span>
              <span>25 coins</span>
            </div>
            <div className="sw-reward-chip" style={{ borderColor: '#06b6d4' }}>
              <span>🌊</span>
              <span>15 coins</span>
            </div>
          </div>
        )}

      </div>

      {/* ── Result overlay ── */}
      {showResult && winner && (
        <div className="sw-overlay" onClick={closeResult}>
          <div className="sw-result-card" onClick={e => e.stopPropagation()}>
            <div className="sw-result-confetti">🎊 🎉 🎊 🎉 🎊</div>
            <div className="sw-result-emoji">{winner.emoji}</div>
            <div className="sw-result-coins">+{winner.coins} Coins!</div>
            <div className="sw-result-sub">Wallet mein add ho gaye 🪙</div>
            {spinsLeft - 1 > 0 && (
              <div className="sw-result-more">
                {spinsLeft - 1} aur spin bacha hai! 🎯
              </div>
            )}
            <button className="sw-result-btn" onClick={closeResult}>
              Awesome! 🎉
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
