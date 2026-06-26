import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getNetUsed, incNetUsed, getNetTimeLeft, fmtMs } from './gameUtils';
import { NET_LIMIT } from './adNetworks';
import AdWatchOverlay from './AdWatchOverlay';
import '../../styles/scratchCard.css';

export const SPIN_LIMIT = NET_LIMIT;

const SEG = [
  { label: '1000',    coins: 1000, bg: '#1a3d9e', edge: '#2a5ff5', icon: '🪙' },
  { label: '500',     coins: 500,  bg: '#155f2e', edge: '#22c55e', icon: '🪙' },
  { label: '200',     coins: 200,  bg: '#7f1d1d', edge: '#ef4444', icon: '🪙' },
  { label: 'JACKPOT', coins: 3000, bg: '#2d1570', edge: '#a855f7', icon: '🎁' },
  { label: '50',      coins: 50,   bg: '#1e2d7a', edge: '#60a5fa', icon: '🪙' },
  { label: '100',     coins: 100,  bg: '#5a1010', edge: '#dc2626', icon: '🪙' },
  { label: 'Again',   coins: 0,    bg: '#4c1d95', edge: '#8b5cf6', icon: '😢', sub: 'Try' },
  { label: '2000',    coins: 2000, bg: '#064e29', edge: '#16a34a', icon: '💰' },
];
const SEG_ANGLE = 360 / SEG.length;

function pickWinner() {
  const weights = [0.04, 0.06, 0.12, 0.02, 0.28, 0.18, 0.25, 0.05];
  const r = Math.random(); let c = 0;
  for (let i = 0; i < weights.length; i++) { c += weights[i]; if (r < c) return i; }
  return 4;
}

function GoldRing({ size }) {
  const r = size / 2 - 2;
  const dots = 28;
  return (
    <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3 }}
      width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="url(#goldGrad)" strokeWidth="10" />
      {[...Array(dots)].map((_, i) => {
        const a = (i / dots) * 2 * Math.PI - Math.PI / 2;
        const dx = size/2 + r * Math.cos(a);
        const dy = size/2 + r * Math.sin(a);
        return (
          <circle key={i} cx={dx} cy={dy} r="4.5"
            fill={i % 2 === 0 ? '#ffd700' : '#fff'}
            style={{ filter: `drop-shadow(0 0 3px ${i%2===0?'#ffd700':'rgba(255,255,255,0.8)'})` }}
          />
        );
      })}
      <defs>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#ffd700" />
          <stop offset="30%"  stopColor="#ffaa00" />
          <stop offset="60%"  stopColor="#ffe066" />
          <stop offset="100%" stopColor="#b8860b" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function WheelSVG({ size, onSpin, canSpin }) {
  const cx = size / 2, cy = size / 2;
  const outerR = cx - 12;
  const labelR = outerR * 0.70;
  const iconR  = outerR * 0.88;

  function polar(angle, r) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }
  function segPath(i) {
    const s = i * SEG_ANGLE, e = s + SEG_ANGLE;
    const p1 = polar(s, outerR), p2 = polar(e, outerR);
    return `M ${cx} ${cy} L ${p1.x} ${p1.y} A ${outerR} ${outerR} 0 0 1 ${p2.x} ${p2.y} Z`;
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block', position: 'relative', zIndex: 2 }}>
      <defs>
        {SEG.map((s, i) => (
          <radialGradient key={i} id={`sg${i}`} cx="30%" cy="30%">
            <stop offset="0%"   stopColor={s.edge} stopOpacity="0.9" />
            <stop offset="100%" stopColor={s.bg} />
          </radialGradient>
        ))}
        <radialGradient id="centerGold" cx="35%" cy="35%">
          <stop offset="0%"   stopColor="#ffe066" />
          <stop offset="50%"  stopColor="#ffd700" />
          <stop offset="100%" stopColor="#b8860b" />
        </radialGradient>
        <filter id="segShadow">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.5" />
        </filter>
      </defs>

      {SEG.map((s, i) => {
        const mid = i * SEG_ANGLE + SEG_ANGLE / 2;
        const lp  = polar(mid, labelR);
        const ip  = polar(mid, iconR);
        const rot = mid - 90;
        return (
          <g key={i}>
            <path d={segPath(i)} fill={`url(#sg${i})`} stroke="#000" strokeWidth="1.5" />
            <line
              x1={cx} y1={cy}
              x2={polar(i * SEG_ANGLE, outerR).x}
              y2={polar(i * SEG_ANGLE, outerR).y}
              stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            <text x={ip.x} y={ip.y}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="15"
              transform={`rotate(${rot},${ip.x},${ip.y})`}
              style={{ userSelect: 'none', pointerEvents: 'none' }}>
              {s.icon}
            </text>
            {s.sub ? (
              <>
                <text x={lp.x} y={lp.y - 7}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize="9" fontWeight="800" fill="rgba(255,255,255,0.7)"
                  transform={`rotate(${rot},${lp.x},${lp.y})`}
                  style={{ userSelect: 'none', pointerEvents: 'none' }}>
                  {s.sub}
                </text>
                <text x={lp.x} y={lp.y + 5}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize="11" fontWeight="900" fill="#fff"
                  transform={`rotate(${rot},${lp.x},${lp.y})`}
                  style={{ userSelect: 'none', pointerEvents: 'none' }}>
                  {s.label}
                </text>
              </>
            ) : (
              <text x={lp.x} y={lp.y}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={s.label === 'JACKPOT' ? '9' : '13'} fontWeight="900" fill="#fff"
                transform={`rotate(${rot},${lp.x},${lp.y})`}
                style={{ userSelect: 'none', pointerEvents: 'none' }}>
                {s.label}
              </text>
            )}
          </g>
        );
      })}

      {/* Center gold circle — clickable */}
      <circle cx={cx} cy={cy} r="34" fill="url(#centerGold)"
        stroke="#fff" strokeWidth="2.5"
        onClick={canSpin ? onSpin : undefined}
        style={{
          filter: 'drop-shadow(0 0 12px rgba(255,215,0,0.8))',
          cursor: canSpin ? 'pointer' : 'default',
        }} />
      <text x={cx} y={cy + 1}
        textAnchor="middle" dominantBaseline="middle"
        fontSize="13" fontWeight="900" fill="#3d1a00"
        onClick={canSpin ? onSpin : undefined}
        style={{ userSelect: 'none', cursor: canSpin ? 'pointer' : 'default' }}>
        SPIN
      </text>
    </svg>
  );
}

const SPARKS = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${5 + (i * 17 + i * i * 3) % 90}%`,
  top:  `${5 + (i * 23 + i * 7) % 85}%`,
  size: 6 + (i % 4) * 4,
  delay: `${(i * 0.4) % 2.5}s`,
  dur:   `${2 + (i % 3) * 0.7}s`,
}));

export default function SpinWheelModal({ onClose, onRefresh, network }) {
  const { addCoins, recordGamePlay, balance } = useApp();

  const [rotateDeg,  setRotateDeg]  = useState(0);
  const [transition, setTransition] = useState('none');
  const [phase,      setPhase]      = useState('idle'); // idle | ad | spinning | result
  const [result,     setResult]     = useState(null);
  const [tick,       setTick]       = useState(0);
  const rotRef   = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => { clearInterval(id); if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const used     = getNetUsed(network.id, 'spin');
  const isDone   = used >= NET_LIMIT;
  const timeLeft = isDone ? getNetTimeLeft(network.id, 'spin') : 0;

  const doSpin = () => {
    const wi  = pickWinner();
    const seg = SEG[wi];
    const center   = wi * SEG_ANGLE + SEG_ANGLE / 2;
    const targetMod = (360 - center % 360 + 360) % 360;
    const prevMod   = rotRef.current % 360;
    let   extra     = (targetMod - prevMod + 360) % 360;
    if (extra < 10) extra += 360;
    const newDeg = rotRef.current + 6 * 360 + extra;
    rotRef.current = newDeg;

    incNetUsed(network.id, 'spin');
    recordGamePlay('spin').catch(() => {});
    setTransition('transform 5.8s cubic-bezier(0.17,0.67,0.12,0.99)');
    setPhase('spinning');
    setRotateDeg(newDeg);

    timerRef.current = setTimeout(async () => {
      setTransition('none');
      if (seg.coins > 0) await addCoins(seg.coins);
      setResult(seg);
      setPhase('result');
      onRefresh();
    }, 6000);
  };

  const handleCenterClick = () => {
    if (phase === 'spinning') return;
    if (isDone) return;
    if (phase === 'result') {
      setResult(null);
      setPhase('ad');
      return;
    }
    setPhase('ad');
  };

  const WHEEL = 310;
  const canSpin = phase === 'idle' && !isDone;

  return (
    <>
      <div className="ls-page" style={{ overflow: 'hidden' }}>
        {/* Sparkles */}
        <div className="ls-sparks">
          {SPARKS.map(s => (
            <div key={s.id} className="ls-spark"
              style={{ left: s.left, top: s.top, width: s.size, height: s.size,
                       animationDuration: s.dur, animationDelay: s.delay }} />
          ))}
        </div>

        {/* Header — back button + coin balance */}
        <div className="ls-header">
          <button className="sc2-back-btn" onClick={onClose}>←</button>
          <div className="sc2-balance-pill">
            <span className="sc2-coin-icon">🪙</span>
            <span className="sc2-balance-val">{balance.toLocaleString()}</span>
            <button className="sc2-plus-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Title */}
        <div className="ls-title-wrap">
          <span className="ls-star">✦</span>
          <div className="ls-title">
            <span className="ls-title-lucky">LUCKY</span>
            <span className="ls-title-spin">SPIN</span>
          </div>
          <span className="ls-star">✦</span>
        </div>

        {/* Wheel area */}
        <div className="ls-wheel-wrap" style={{ margin: '0 auto' }}>
          <div className="ls-wheel-glow" style={{ '--nc': network.color }} />
          <div className="ls-pointer">
            <div className="ls-gem">◆</div>
          </div>
          <div className="ls-wheel-spin-wrap"
            style={{ transform: `rotate(${rotateDeg}deg)`, transition,
                     willChange: 'transform', position: 'relative' }}>
            <WheelSVG size={WHEEL} onSpin={handleCenterClick} canSpin={canSpin} />
            <GoldRing size={WHEEL} />
          </div>
        </div>

        {/* Result strip */}
        {phase === 'result' && result && (
          <div className={`ls-result ${result.coins === 0 ? 'ls-result-try' : 'ls-result-win'}`}>
            <span className="ls-result-icon">{result.coins > 0 ? '🎉' : '😢'}</span>
            <span className="ls-result-txt">
              {result.coins > 0
                ? `+${result.label === 'JACKPOT' ? '3000' : result.label} 🪙 Mile!`
                : 'Try Again! Agli baar jeetoge!'}
            </span>
          </div>
        )}

        {/* Cooldown */}
        {isDone && (
          <div className="ls-result ls-result-try" style={{ margin: '8px 20px 0' }}>
            <span className="ls-result-icon">⏰</span>
            <span className="ls-result-txt">
              {timeLeft > 0 ? `${fmtMs(timeLeft)} baad milenge` : '🔄 Ready!'}
            </span>
          </div>
        )}

        {/* Spinning hint */}
        {phase === 'spinning' && (
          <div style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.4)',
                        fontWeight: 700, padding: '8px 0', flexShrink: 0 }}>
            🌀 Spinning...
          </div>
        )}

        {/* Idle hint */}
        {phase === 'idle' && !isDone && (
          <div style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.35)',
                        fontWeight: 700, padding: '8px 0', flexShrink: 0 }}>
            👆 Beech mein SPIN dabao
          </div>
        )}

        {/* Next spin hint (after result) */}
        {phase === 'result' && !isDone && (
          <div style={{ padding: '8px 20px 0', flexShrink: 0 }}>
            <button
              onClick={handleCenterClick}
              style={{
                width: '100%', padding: '15px', border: 'none', borderRadius: 14,
                background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
                color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(168,85,247,0.4)',
              }}>
              🎰 Dobara Spin Karo ({NET_LIMIT - used - 1} bache)
            </button>
          </div>
        )}

        <div style={{ flex: 1 }} />
      </div>

      {phase === 'ad' && (
        <AdWatchOverlay
          network={network}
          onComplete={() => doSpin()}
          onCancel={() => setPhase('idle')}
        />
      )}
    </>
  );
}
