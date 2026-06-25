import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getUsed, incUsed } from './gameUtils';

const SEG = [
  { label: '5🪙',   coins: 5,   bg: '#ff6a00', text: '#fff' },
  { label: '200🪙', coins: 200, bg: '#ffd700', text: '#000' },
  { label: '10🪙',  coins: 10,  bg: '#ee0979', text: '#fff' },
  { label: '50🪙',  coins: 50,  bg: '#22c55e', text: '#fff' },
  { label: '20🪙',  coins: 20,  bg: '#7b2ff7', text: '#fff' },
  { label: '100🪙', coins: 100, bg: '#0088cc', text: '#fff' },
  { label: '5🪙',   coins: 5,   bg: '#ff6a00', text: '#fff' },
  { label: '30🪙',  coins: 30,  bg: '#e11d48', text: '#fff' },
];
export const SPIN_LIMIT = 5;
const SEG_ANGLE = 360 / SEG.length;

function pickWinner() {
  const probs = [0.28, 0.02, 0.20, 0.08, 0.16, 0.06, 0.17, 0.03];
  const r = Math.random(); let c = 0;
  for (let i = 0; i < probs.length; i++) { c += probs[i]; if (r < c) return i; }
  return 0;
}

function SpinWheelSVG() {
  const size = 260, cx = size / 2, cy = size / 2;
  const r = cx - 6, labelR = r * 0.68;

  function polarToXY(angle, radius) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }
  function segPath(i) {
    const start = i * SEG_ANGLE, end = start + SEG_ANGLE;
    const p1 = polarToXY(start, r), p2 = polarToXY(end, r);
    return `M ${cx} ${cy} L ${p1.x} ${p1.y} A ${r} ${r} 0 0 1 ${p2.x} ${p2.y} Z`;
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      {SEG.map((s, i) => {
        const midAngle  = i * SEG_ANGLE + SEG_ANGLE / 2;
        const lp        = polarToXY(midAngle, labelR);
        const textAngle = midAngle - 90;
        return (
          <g key={i}>
            <path d={segPath(i)} fill={s.bg} stroke="#1a1a2e" strokeWidth="2" />
            <text x={lp.x} y={lp.y}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="11" fontWeight="900" fill={s.text}
              transform={`rotate(${textAngle}, ${lp.x}, ${lp.y})`}
              style={{ userSelect: 'none', pointerEvents: 'none' }}>
              {s.label}
            </text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r="18" fill="#1a1a2e" stroke="#fff" strokeWidth="3" />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="12" fill="#fff">🎰</text>
    </svg>
  );
}

export default function SpinWheelModal({ onClose, onRefresh }) {
  const { addCoins } = useApp();

  const [spinning,   setSpinning]   = useState(false);
  const [rotateDeg,  setRotateDeg]  = useState(0);
  const [spinResult, setSpinResult] = useState(null);
  const [spinTrans,  setSpinTrans]  = useState('none');
  const rotateDegRef   = useRef(0);
  const spinTimeoutRef = useRef(null);

  useEffect(() => {
    return () => { if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current); };
  }, []);

  const handleSpin = () => {
    if (spinning || getUsed('spin') >= SPIN_LIMIT) return;
    const winIdx    = pickWinner();
    const winner    = SEG[winIdx];
    const center    = winIdx * SEG_ANGLE + SEG_ANGLE / 2;
    const targetMod = (360 - center % 360 + 360) % 360;
    const prevMod   = rotateDegRef.current % 360;
    let   extraRot  = (targetMod - prevMod + 360) % 360;
    if (extraRot === 0) extraRot = 360;
    const newDeg    = rotateDegRef.current + 5 * 360 + extraRot;
    rotateDegRef.current = newDeg;

    incUsed('spin');
    setSpinTrans('transform 5.5s cubic-bezier(0.17,0.67,0.12,0.99)');
    setSpinning(true);
    setSpinResult(null);
    setRotateDeg(newDeg);

    spinTimeoutRef.current = setTimeout(async () => {
      setSpinTrans('none');
      await addCoins(winner.coins);
      setSpinResult(winner);
      setSpinning(false);
      onRefresh();
    }, 5700);
  };

  return (
    <div className="gmodal-overlay" onClick={() => !spinning && onClose()}>
      <div className="gmodal" onClick={e => e.stopPropagation()}>
        {!spinning && <button className="gmodal-close" onClick={onClose}>✕</button>}
        <div className="gmodal-title">🎰 Spin the Wheel</div>
        <div className="gmodal-sub">{SPIN_LIMIT - getUsed('spin')} spins bacha aaj ke liye</div>

        <div className="spin-wrap">
          <div className="spin-ptr">▼</div>
          <div style={{ transform: `rotate(${rotateDeg}deg)`, transition: spinTrans }}>
            <SpinWheelSVG />
          </div>
        </div>

        {spinResult && (
          <div className="spin-win-box">
            🎉 +{spinResult.coins} Coins Mile!
          </div>
        )}

        <button className="gmodal-btn"
          style={{ background: spinning || getUsed('spin') >= SPIN_LIMIT ? '#333' : 'linear-gradient(135deg,#ff6a00,#ee0979)' }}
          disabled={spinning || getUsed('spin') >= SPIN_LIMIT}
          onClick={handleSpin}>
          {spinning ? '🌀 Spinning...' : getUsed('spin') >= SPIN_LIMIT ? '✅ Aaj ke liye done!' : '🎰 SPIN KARO!'}
        </button>
      </div>
    </div>
  );
}
