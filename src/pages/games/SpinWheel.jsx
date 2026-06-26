import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getNetUsed, incNetUsed, getNetTimeLeft, fmtMs } from './gameUtils';
import { NET_LIMIT } from './adNetworks';
import AdWatchOverlay from './AdWatchOverlay';

export const SPIN_LIMIT = NET_LIMIT;

/* ─── Segments (clockwise from top) ─── */
const SEG = [
  { label: '1000',    coins: 1000, bg: '#1a3d9e', edge: '#2a5ff5', icon: '🪙', sub: '' },
  { label: '500',     coins: 500,  bg: '#155f2e', edge: '#22c55e', icon: '🪙', sub: '' },
  { label: '200',     coins: 200,  bg: '#7f1d1d', edge: '#ef4444', icon: '🪙', sub: '' },
  { label: 'JACKPOT', coins: 3000, bg: '#2d1570', edge: '#a855f7', icon: '🎁', sub: '' },
  { label: '50',      coins: 50,   bg: '#1e2d7a', edge: '#60a5fa', icon: '🪙', sub: '' },
  { label: '100',     coins: 100,  bg: '#5a1010', edge: '#dc2626', icon: '🪙', sub: '' },
  { label: 'Again',   coins: 0,    bg: '#4c1d95', edge: '#8b5cf6', icon: '😢', sub: 'Try' },
  { label: '2000',    coins: 2000, bg: '#064e29', edge: '#16a34a', icon: '💰', sub: '' },
];
const SEG_ANGLE = 360 / SEG.length;

const WINNERS = [
  { name: 'Amit Verma',  init: 'A', clr: '#ef4444', coins: 1000 },
  { name: 'Pooja Singh', init: 'P', clr: '#8b5cf6', coins: 500  },
  { name: 'Rahul Yadav', init: 'R', clr: '#22c55e', coins: 2000 },
];

function pickWinner() {
  const weights = [0.04, 0.06, 0.12, 0.02, 0.28, 0.18, 0.25, 0.05];
  const r = Math.random(); let c = 0;
  for (let i = 0; i < weights.length; i++) { c += weights[i]; if (r < c) return i; }
  return 4;
}

/* ─── Gold Ring with Light Dots ─── */
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
        const dx = size/2 + (r) * Math.cos(a);
        const dy = size/2 + (r) * Math.sin(a);
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

/* ─── Wheel SVG ─── */
function WheelSVG({ size }) {
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
    const lg = i % 2 === 0 ? 0 : 0;
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

      {/* Segments */}
      {SEG.map((s, i) => {
        const mid = i * SEG_ANGLE + SEG_ANGLE / 2;
        const lp  = polar(mid, labelR);
        const ip  = polar(mid, iconR);
        const rot = mid - 90;
        return (
          <g key={i}>
            <path d={segPath(i)} fill={`url(#sg${i})`} stroke="#000" strokeWidth="1.5" />
            {/* Divider line shimmer */}
            <line
              x1={cx} y1={cy}
              x2={polar(i * SEG_ANGLE, outerR).x}
              y2={polar(i * SEG_ANGLE, outerR).y}
              stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
            {/* Icon */}
            <text x={ip.x} y={ip.y}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="15"
              transform={`rotate(${rot},${ip.x},${ip.y})`}
              style={{ userSelect: 'none', pointerEvents: 'none' }}>
              {s.icon}
            </text>
            {/* Label */}
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

      {/* Center gold circle */}
      <circle cx={cx} cy={cy} r="34" fill="url(#centerGold)"
        stroke="#fff" strokeWidth="2.5"
        style={{ filter: 'drop-shadow(0 0 12px rgba(255,215,0,0.8))' }} />
      <text x={cx} y={cy + 1}
        textAnchor="middle" dominantBaseline="middle"
        fontSize="14" fontWeight="900" fill="#3d1a00"
        style={{ userSelect: 'none', pointerEvents: 'none' }}>
        SPIN
      </text>
    </svg>
  );
}

/* ─── Daily Bonus Countdown ─── */
function useDailyCountdown() {
  const [ms, setMs] = useState(0);
  useEffect(() => {
    const calc = () => {
      const now  = Date.now();
      const istMs = now + 5.5 * 3600000;
      const d    = new Date(istMs);
      const toMid = new Date(istMs);
      toMid.setUTCHours(18, 30, 0, 0);
      if (toMid.getTime() <= istMs) toMid.setUTCDate(toMid.getUTCDate() + 1);
      setMs(toMid.getTime() - now);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

/* ─── Sparkle background ─── */
const SPARKS = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${5 + (i * 17 + i * i * 3) % 90}%`,
  top:  `${5 + (i * 23 + i * 7)    % 85}%`,
  size: 6 + (i % 4) * 4,
  delay: `${(i * 0.4) % 2.5}s`,
  dur:   `${2 + (i % 3) * 0.7}s`,
}));

/* ─── Main Component ─── */
export default function SpinWheelModal({ onClose, onRefresh, network }) {
  const { addCoins, recordGamePlay, balance, user } = useApp();

  const [rotateDeg,  setRotateDeg]  = useState(0);
  const [transition, setTransition] = useState('none');
  const [phase,      setPhase]      = useState('idle'); // idle | ad | spinning | result
  const [result,     setResult]     = useState(null);
  const [tick,       setTick]       = useState(0);
  const rotRef    = useRef(0);
  const timerRef  = useRef(null);

  const bonusTime = useDailyCountdown();

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

  const WHEEL = 310;

  return (
    <>
      <div className="ls-page">
        {/* Sparkles */}
        <div className="ls-sparks">
          {SPARKS.map(s => (
            <div key={s.id} className="ls-spark"
              style={{ left: s.left, top: s.top, width: s.size, height: s.size,
                       animationDuration: s.dur, animationDelay: s.delay }} />
          ))}
        </div>

        {/* Header */}
        <div className="ls-header">
          <div className="ls-user-chip">
            <div className="ls-avatar">
              {user?.user_metadata?.full_name?.[0]?.toUpperCase() || '🎮'}
            </div>
            <div className="ls-user-info">
              <span className="ls-hello">Hello, {user?.user_metadata?.full_name?.split(' ')[0] || 'Player'}</span>
              <span className="ls-level">⭐ {network.label} Zone</span>
            </div>
          </div>
          <div className="ls-header-right">
            <div className="ls-balance">
              <span className="ls-bal-icon">🪙</span>
              <span className="ls-bal-num">{balance.toLocaleString()}</span>
            </div>
            <button className="ls-close" onClick={onClose}>✕</button>
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
        <div className="ls-wheel-wrap">
          {/* Outer glow */}
          <div className="ls-wheel-glow" style={{ '--nc': network.color }} />

          {/* Pointer gem */}
          <div className="ls-pointer">
            <div className="ls-gem">◆</div>
          </div>

          {/* Wheel + Gold ring */}
          <div className="ls-wheel-spin-wrap"
            style={{ transform: `rotate(${rotateDeg}deg)`, transition,
                     willChange: 'transform', position: 'relative' }}>
            <WheelSVG size={WHEEL} />
            <GoldRing size={WHEEL} />
          </div>
        </div>

        {/* Win result popup */}
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

        {/* SPIN NOW button */}
        <div className="ls-spin-btn-wrap">
          {isDone ? (
            <div className="fs-cooldown" style={{ margin: '0 20px' }}>
              <span>⏰</span>
              <span>{timeLeft > 0 ? `${fmtMs(timeLeft)} baad milenge` : '🔄 Ready!'}</span>
            </div>
          ) : phase === 'spinning' ? (
            <button className="ls-spin-btn ls-spin-btn-spinning" disabled>
              🌀 Spinning...
            </button>
          ) : (
            <button className="ls-spin-btn" onClick={() => setPhase('ad')}>
              SPIN NOW
            </button>
          )}
        </div>

        {/* Bottom 2-col cards */}
        <div className="ls-bottom-cards">
          {/* Recent Winners */}
          <div className="ls-card">
            <div className="ls-card-title">RECENT WINNERS</div>
            <div className="ls-winners-list">
              {WINNERS.map((w, i) => (
                <div key={i} className="ls-winner-row">
                  <div className="ls-winner-init" style={{ background: w.clr }}>{w.init}</div>
                  <div className="ls-winner-name">
                    <span className="ls-wname">{w.name}</span>
                    <span className="ls-wcoins">🪙 {w.coins}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="ls-view-all">VIEW ALL</button>
          </div>

          {/* Daily Bonus */}
          <div className="ls-card">
            <div className="ls-card-title">DAILY BONUS</div>
            <div className="ls-daily-gift">🎁</div>
            <div className="ls-countdown">{bonusTime}</div>
            <button className="ls-claim-btn" onClick={onClose}
              style={{ background: 'linear-gradient(135deg,#22c55e,#15803d)' }}>
              CLAIM
            </button>
          </div>
        </div>

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
