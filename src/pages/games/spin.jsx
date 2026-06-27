import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import './spin.css';

function getHourKey() {
  return Math.floor(Date.now() / 3600000);
}

const MAX_SPINS_PER_HOUR = 3;
const CANVAS_SIZE        = 280;

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

  const canvasRef   = useRef(null);
  const rotationRef = useRef(0);
  const rafRef      = useRef(null);
  const dprRef      = useRef(1);

  // Hourly spin tracking
  const hourKey   = getHourKey();
  const spinCount = (user?.spin_hour_key === hourKey) ? (user?.spin_hour_count ?? 0) : 0;
  const spinsLeft = Math.max(0, MAX_SPINS_PER_HOUR - spinCount);
  const canSpin   = !spinning && spinsLeft > 0 && !!user;

  const drawWheel = useCallback((rotDeg, isIdle = false) => {
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

    // Center text
    if (spinning) {
      ctx.font         = 'bold 10px "Segoe UI", sans-serif';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle    = 'rgba(255,255,255,0.5)';
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

  // Redraw when spin state changes (to update center text)
  useEffect(() => {
    if (!spinning) drawWheel(rotationRef.current);
  }, [spinning, spinsLeft, drawWheel]);

  const handleCanvasTap = (e) => {
    if (!canSpin) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect   = canvas.getBoundingClientRect();
    const tapX   = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const tapY   = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    const cx     = CANVAS_SIZE / 2;
    const cy     = CANVAS_SIZE / 2;
    const dist   = Math.sqrt((tapX - cx) ** 2 + (tapY - cy) ** 2);
    if (dist <= 32) doSpin();
  };

  const doSpin = () => {
    if (!canSpin) return;

    const n       = SEGMENTS.length;
    const arc     = 360 / n;
    const winIdx  = Math.floor(Math.random() * n);

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

    setSpinning(true);
    setWinner(null);

    const animate = (now) => {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease     = 1 - Math.pow(1 - progress, 4);
      const current  = startRot + totalSpin * ease;

      rotationRef.current = current;
      drawWheel(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        rotationRef.current = finalRot;
        drawWheel(finalRot);
        const won = SEGMENTS[winIdx];
        setWinner(won);
        setSpinning(false);
        setShowResult(true);
        spinWheelClaim(won.coins).catch(() => {});
      }
    };

    rafRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const closeResult = () => setShowResult(false);

  const minutesLeft = () => {
    const msInHour   = 3600000;
    const msThisHour = Date.now() % msInHour;
    const msLeft     = msInHour - msThisHour;
    const minsLeft   = Math.ceil(msLeft / 60000);
    return minsLeft;
  };

  return (
    <div className="sw-page">
      <div className="sw-glow sw-glow1" />
      <div className="sw-glow sw-glow2" />

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

      <div className="sw-spins-info">
        {spinsLeft > 0 ? (
          <span className="sw-spins-left">
            🎯 <b>{spinsLeft}</b> spin{spinsLeft > 1 ? 's' : ''} left this hour
          </span>
        ) : (
          <span className="sw-spins-done">
            ✅ Aaj ke spins ho gaye — {minutesLeft()} min mein reset
          </span>
        )}
      </div>

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
