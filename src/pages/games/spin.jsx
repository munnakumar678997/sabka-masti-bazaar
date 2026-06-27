import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import BottomNav from '../../components/BottomNav';
import './spin.css';

function getISTDateStr() {
  const istMs = Date.now() + 5.5 * 60 * 60 * 1000;
  return new Date(istMs).toISOString().split('T')[0];
}

const CANVAS_SIZE = 272;

const SEGMENTS = [
  { coins: 10,  color: '#f97316', dark: '#c2590f', label: '10',  emoji: '🪙' },
  { coins: 5,   color: '#8b5cf6', dark: '#6a3fc4', label: '5',   emoji: '⭐' },
  { coins: 25,  color: '#ec4899', dark: '#be2e72', label: '25',  emoji: '💰' },
  { coins: 15,  color: '#06b6d4', dark: '#0488a0', label: '15',  emoji: '🌊' },
  { coins: 50,  color: '#eab308', dark: '#b38900', label: '50',  emoji: '💎' },
  { coins: 10,  color: '#22c55e', dark: '#169642', label: '10',  emoji: '🌿' },
  { coins: 5,   color: '#ef4444', dark: '#c02020', label: '5',   emoji: '🎯' },
  { coins: 100, color: '#a855f7', dark: '#8228d4', label: '100', emoji: '👑' },
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

  const todayIST   = getISTDateStr();
  const alreadySpun = user?.last_spin_date === todayIST;
  const canSpin     = !spinning && !alreadySpun && !!user;

  const drawWheel = useCallback((rotDeg) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx  = canvas.getContext('2d');
    const dpr  = dprRef.current;
    const size = CANVAS_SIZE;
    const cx   = size / 2;
    const cy   = size / 2;
    const outerR  = cx - 6;
    const n       = SEGMENTS.length;
    const arcRad  = (2 * Math.PI) / n;
    const rotRad  = (rotDeg * Math.PI) / 180;

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
      ctx.fillStyle = seg.color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth   = 2.5;
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(midAngle);

      ctx.font          = '15px serif';
      ctx.textAlign     = 'center';
      ctx.textBaseline  = 'middle';
      ctx.fillStyle     = '#fff';
      ctx.shadowColor   = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur    = 3;
      ctx.fillText(seg.emoji, outerR * 0.56, -3);

      ctx.font        = `bold 12px "Segoe UI", sans-serif`;
      ctx.shadowBlur  = 4;
      ctx.fillText(seg.label, outerR * 0.79, 4);
      ctx.shadowBlur  = 0;

      ctx.restore();
    });

    const hubGrd = ctx.createRadialGradient(cx - 3, cy - 3, 2, cx, cy, 28);
    hubGrd.addColorStop(0, '#3d3d60');
    hubGrd.addColorStop(1, '#1a1a2e');
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, 2 * Math.PI);
    ctx.fillStyle   = hubGrd;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth   = 2;
    ctx.stroke();

    ctx.font         = '20px serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎰', cx, cy);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr          = window.devicePixelRatio || 1;
    dprRef.current     = dpr;
    canvas.width       = CANVAS_SIZE * dpr;
    canvas.height      = CANVAS_SIZE * dpr;
    canvas.style.width  = `${CANVAS_SIZE}px`;
    canvas.style.height = `${CANVAS_SIZE}px`;
    drawWheel(0);
  }, [drawWheel]);

  const doSpin = () => {
    if (!canSpin) return;

    const n      = SEGMENTS.length;
    const arc    = 360 / n;
    const winIdx = Math.floor(Math.random() * n);

    const segAngle      = (winIdx + 0.5) * arc;
    const targetRotDeg  = (360 - (segAngle % 360)) % 360;
    const currentNorm   = ((rotationRef.current % 360) + 360) % 360;
    const delta         = ((targetRotDeg - currentNorm) + 360) % 360;
    const extraSpins    = 5 + Math.floor(Math.random() * 4);
    const totalSpin     = extraSpins * 360 + delta;
    const startRot      = rotationRef.current;
    const finalRot      = startRot + totalSpin;
    const duration      = 4200 + Math.random() * 600;
    const startTime     = performance.now();

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

      <div className="sw-wheel-area">
        <div className="sw-pointer-wrap">
          <div className="sw-pointer" />
        </div>
        <canvas ref={canvasRef} className="sw-canvas" />
      </div>

      <div className="sw-ctrl">
        {spinning ? (
          <div className="sw-spinning-text">⏳ Ghoom raha hai…</div>
        ) : alreadySpun ? (
          <div className="sw-done-card">
            <div className="sw-done-icon">✅</div>
            <div className="sw-done-title">Aaj ka Spin Ho Gaya!</div>
            <div className="sw-done-sub">Kal raat 12 baje ke baad phir aana 🌙</div>
          </div>
        ) : (
          <button className="sw-spin-btn" onClick={doSpin} disabled={!user}>
            SPIN KARO! 🎰
          </button>
        )}
      </div>

      <div className="sw-rules-card">
        <div className="sw-rules-row"><span>🎁</span><span>Roz <b>ek free spin</b> milta hai</span></div>
        <div className="sw-rules-row"><span>👑</span><span>Max reward: <b>100 coins</b> per spin</span></div>
        <div className="sw-rules-row"><span>🔄</span><span>Reset: Har raat <b>12 baje</b> (IST)</span></div>
      </div>

      {showResult && winner && (
        <div className="sw-overlay" onClick={closeResult}>
          <div className="sw-result-card" onClick={e => e.stopPropagation()}>
            <div className="sw-result-confetti">🎊 🎉 🎊 🎉 🎊</div>
            <div className="sw-result-emoji">{winner.emoji}</div>
            <div className="sw-result-coins">+{winner.coins} Coins!</div>
            <div className="sw-result-sub">Wallet mein add ho gaye 🪙</div>
            <button className="sw-result-btn" onClick={closeResult}>
              Awesome! 🎉
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
