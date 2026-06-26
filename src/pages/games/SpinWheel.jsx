import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getNetUsed, incNetUsed, getNetTimeLeft, fmtMs } from './gameUtils';
import { NET_LIMIT } from './adNetworks';
import AdWatchOverlay from './AdWatchOverlay';

const SEG = [
  { label: '5',   coins: 5,   bg: '#ff6a00', text: '#fff' },
  { label: '200', coins: 200, bg: '#ffd700', text: '#000' },
  { label: '10',  coins: 10,  bg: '#ee0979', text: '#fff' },
  { label: '50',  coins: 50,  bg: '#22c55e', text: '#fff' },
  { label: '20',  coins: 20,  bg: '#7b2ff7', text: '#fff' },
  { label: '100', coins: 100, bg: '#0088cc', text: '#fff' },
  { label: '5',   coins: 5,   bg: '#ff6a00', text: '#fff' },
  { label: '30',  coins: 30,  bg: '#e11d48', text: '#fff' },
];
export const SPIN_LIMIT = NET_LIMIT;
const SEG_ANGLE = 360 / SEG.length;

function pickWinner() {
  const probs = [0.28, 0.02, 0.20, 0.08, 0.16, 0.06, 0.17, 0.03];
  const r = Math.random(); let c = 0;
  for (let i = 0; i < probs.length; i++) { c += probs[i]; if (r < c) return i; }
  return 0;
}

function WheelSVG({ rotateDeg, transition }) {
  const size = 290, cx = size / 2, cy = size / 2;
  const r = cx - 4, labelR = r * 0.66;
  function polar(angle, radius) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }
  function segPath(i) {
    const s = i * SEG_ANGLE, e = s + SEG_ANGLE;
    const p1 = polar(s, r), p2 = polar(e, r);
    return `M ${cx} ${cy} L ${p1.x} ${p1.y} A ${r} ${r} 0 0 1 ${p2.x} ${p2.y} Z`;
  }
  return (
    <div style={{ transform: `rotate(${rotateDeg}deg)`, transition, willChange: 'transform', filter: 'drop-shadow(0 0 24px rgba(0,0,0,0.6))' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
        <circle cx={cx} cy={cy} r={r + 2} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
        {SEG.map((s, i) => {
          const mid = i * SEG_ANGLE + SEG_ANGLE / 2;
          const lp  = polar(mid, labelR);
          return (
            <g key={i}>
              <path d={segPath(i)} fill={s.bg} stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />
              <text x={lp.x} y={lp.y - 5}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="12" fontWeight="900" fill={s.text}
                transform={`rotate(${mid - 90},${lp.x},${lp.y})`}
                style={{ userSelect: 'none', pointerEvents: 'none' }}>
                {s.label}🪙
              </text>
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r="20" fill="#111" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize="14" fill="#fff">🎰</text>
      </svg>
    </div>
  );
}

export default function SpinWheelModal({ onClose, onRefresh, network }) {
  const { addCoins, recordGamePlay } = useApp();
  const [rotateDeg,  setRotateDeg]  = useState(0);
  const [transition, setTransition] = useState('none');
  const [phase,      setPhase]      = useState('idle'); // idle | ad | spinning | won
  const [result,     setResult]     = useState(null);
  const [tick,       setTick]       = useState(0);
  const rotateDegRef = useRef(0);
  const timeoutRef   = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => { clearInterval(id); if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  const used     = getNetUsed(network.id, 'spin');
  const isDone   = used >= NET_LIMIT;
  const timeLeft = isDone ? getNetTimeLeft(network.id, 'spin') : 0;

  const doSpin = () => {
    const winIdx = pickWinner();
    const winner = SEG[winIdx];
    const center = winIdx * SEG_ANGLE + SEG_ANGLE / 2;
    const targetMod = (360 - center % 360 + 360) % 360;
    const prevMod   = rotateDegRef.current % 360;
    let   extra     = (targetMod - prevMod + 360) % 360;
    if (extra === 0) extra = 360;
    const newDeg = rotateDegRef.current + 5 * 360 + extra;
    rotateDegRef.current = newDeg;

    incNetUsed(network.id, 'spin');
    recordGamePlay('spin').catch(() => {});
    setTransition('transform 5.5s cubic-bezier(0.17,0.67,0.12,0.99)');
    setPhase('spinning');
    setResult(null);
    setRotateDeg(newDeg);

    timeoutRef.current = setTimeout(async () => {
      setTransition('none');
      await addCoins(winner.coins);
      setResult(winner);
      setPhase('won');
      onRefresh();
    }, 5700);
  };

  return (
    <>
      <div className="fs-overlay">
        {/* Top bar */}
        <div className="fs-topbar">
          <div className="fs-net-badge" style={{ background: network.grad }}>{network.label}</div>
          <div className="fs-title">🎰 Spin Wheel</div>
          {phase === 'idle' || phase === 'won' ? (
            <button className="fs-close-btn" onClick={onClose}>✕</button>
          ) : <div style={{ width: 36 }} />}
        </div>

        {/* Plays left */}
        <div className="fs-plays-row">
          {[...Array(NET_LIMIT)].map((_, i) => (
            <div key={i} className={`fs-play-dot ${i < used ? 'fs-play-dot-used' : 'fs-play-dot-free'}`}
              style={i >= used ? { background: network.color, boxShadow: `0 0 8px ${network.color}66` } : {}} />
          ))}
          <span className="fs-plays-txt">{NET_LIMIT - used} spins bacha</span>
        </div>

        {/* Wheel area */}
        <div className="sw-arena">
          {/* Glow ring */}
          <div className="sw-glow-ring" style={{ '--nc': network.color }} />
          {/* Pointer */}
          <div className="sw-pointer">▼</div>
          <WheelSVG rotateDeg={rotateDeg} transition={transition} />
        </div>

        {/* Win result */}
        {phase === 'won' && result && (
          <div className="sw-result-banner" style={{ borderColor: result.bg }}>
            <span className="sw-result-icon">🎉</span>
            <span className="sw-result-val" style={{ color: result.bg }}>+{result.coins}</span>
            <span className="sw-result-lbl">🪙 Coins Mile!</span>
          </div>
        )}

        {/* Bottom action */}
        <div className="fs-bottom">
          {isDone ? (
            <div className="fs-cooldown">
              <span>⏰</span>
              <span>{timeLeft > 0 ? `${fmtMs(timeLeft)} baad milenge` : '🔄 Ready! Phir se khelo'}</span>
            </div>
          ) : phase === 'idle' || phase === 'won' ? (
            <button className="fs-action-btn" style={{ background: network.grad }}
              onClick={() => setPhase('ad')}>
              🎬 Ad Dekho & Spin Karo
            </button>
          ) : phase === 'spinning' ? (
            <div className="fs-spinning-msg">🌀 Wheel ghoom rahi hai...</div>
          ) : null}
        </div>
      </div>

      {phase === 'ad' && (
        <AdWatchOverlay
          network={network}
          onComplete={() => { setPhase('idle'); doSpin(); }}
          onCancel={() => setPhase('idle')}
        />
      )}
    </>
  );
}
