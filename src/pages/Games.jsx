import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import BottomNav from '../components/BottomNav';
import '../styles/games.css';

function getTodayKey() {
  const istMs = Date.now() + 5.5 * 60 * 60 * 1000;
  return new Date(istMs).toISOString().split('T')[0];
}
function getUsed(k)    { return parseInt(localStorage.getItem(`smb_game_${k}_${getTodayKey()}`) || '0'); }
function incUsed(k)    { localStorage.setItem(`smb_game_${k}_${getTodayKey()}`, String(getUsed(k) + 1)); }

/* ── SPIN WHEEL ── */
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
const SPIN_LIMIT = 5;
const SEG_ANGLE  = 360 / SEG.length;

function pickWinner() {
  const probs = [0.28, 0.02, 0.20, 0.08, 0.16, 0.06, 0.17, 0.03];
  const r = Math.random(); let c = 0;
  for (let i = 0; i < probs.length; i++) { c += probs[i]; if (r < c) return i; }
  return 0;
}

function SpinWheelSVG() {
  const size = 260;
  const cx   = size / 2;
  const cy   = size / 2;
  const r    = cx - 6;
  const labelR = r * 0.68;

  function polarToXY(angle, radius) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  function segPath(i) {
    const start = i * SEG_ANGLE;
    const end   = start + SEG_ANGLE;
    const p1 = polarToXY(start, r);
    const p2 = polarToXY(end,   r);
    return `M ${cx} ${cy} L ${p1.x} ${p1.y} A ${r} ${r} 0 0 1 ${p2.x} ${p2.y} Z`;
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block' }}>
      {SEG.map((s, i) => {
        const midAngle  = i * SEG_ANGLE + SEG_ANGLE / 2;
        const lp        = polarToXY(midAngle, labelR);
        const textAngle = midAngle - 90;
        return (
          <g key={i}>
            <path d={segPath(i)} fill={s.bg} stroke="#1a1a2e" strokeWidth="2" />
            <text
              x={lp.x} y={lp.y}
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

/* ── SCRATCH prizes ── */
const SCRATCH_PRIZES = [5,5,5,10,10,25,25,50,100,200];
const SCRATCH_LIMIT  = 3;
function pickScratch() { return SCRATCH_PRIZES[Math.floor(Math.random() * SCRATCH_PRIZES.length)]; }

/* ═══════════════════════════════ MAIN COMPONENT ═══════════════════════════════ */
export default function Games() {
  const { addCoins, balance } = useApp();

  const [openGame,  setOpenGame]  = useState(null);
  const [toast,     setToast]     = useState('');
  const [tick,      setTick]      = useState(0); // force re-render for used counts

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const refresh   = ()    => setTick(t => t + 1);

  /* ── SPIN state ── */
  const [spinning,    setSpinning]    = useState(false);
  const [rotateDeg,   setRotateDeg]   = useState(0);
  const [spinResult,  setSpinResult]  = useState(null);
  const [spinTrans,   setSpinTrans]   = useState('none');
  const rotateDegRef    = useRef(0);
  const spinTimeoutRef  = useRef(null); // unmount cleanup ke liye

  /* ── SCRATCH state ── */
  const [scratchPrizes, setScratchPrizes] = useState([null, null, null]);
  const [scratchRevealed, setScratchRevealed] = useState([false, false, false]);

  /* ── FLIP state ── */
  const [flipChoice, setFlipChoice] = useState(null);
  const [flipping,   setFlipping]   = useState(false);
  const [flipResult, setFlipResult] = useState(null);
  const [flipFace,   setFlipFace]   = useState('🪙');
  const flipIntervalRef = useRef(null); // unmount cleanup ke liye

  /* ── Cleanup on unmount — memory leak prevent ── */
  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current)  clearTimeout(spinTimeoutRef.current);
      if (flipIntervalRef.current) clearInterval(flipIntervalRef.current);
    };
  }, []);

  /* ══════════════ SPIN LOGIC ══════════════ */
  const handleSpin = () => {
    if (spinning || getUsed('spin') >= SPIN_LIMIT) return;
    const winIdx    = pickWinner();
    const winner    = SEG[winIdx];

    // Pointer (▼) top pe fixed hai (0°). SVG clockwise rotate hota hai.
    // After rotating newDeg°, pointer wheel ke (360 - newDeg % 360) % 360 angle pe point karta hai.
    // Hum chahte hain ki pointer segment winIdx ke center pe land kare:
    //   center = winIdx * SEG_ANGLE + SEG_ANGLE / 2
    // Toh: (360 - newDeg % 360) % 360 = center
    // →   newDeg % 360 = (360 - center) % 360
    const center    = winIdx * SEG_ANGLE + SEG_ANGLE / 2;
    const targetMod = (360 - center % 360 + 360) % 360;
    const prevMod   = rotateDegRef.current % 360;
    let   extraRot  = (targetMod - prevMod + 360) % 360;
    if (extraRot === 0) extraRot = 360; // kam se kam ek full loop adjustment
    const newDeg    = rotateDegRef.current + 5 * 360 + extraRot; // 5 full rotations + exact landing
    rotateDegRef.current = newDeg;

    // Spin start hote hi count record karo — navigate-away cheat se bachao
    incUsed('spin');

    setSpinTrans('transform 5.5s cubic-bezier(0.17,0.67,0.12,0.99)');
    setSpinning(true);
    setSpinResult(null);
    setRotateDeg(newDeg);

    const tid = setTimeout(async () => {
      setSpinTrans('none');
      await addCoins(winner.coins);
      setSpinResult(winner);
      setSpinning(false);
      refresh();
    }, 5700);

    // Timeout ref mein save karo taaki unmount pe clear kar sakein
    spinTimeoutRef.current = tid;
  };

  /* ══════════════ SCRATCH LOGIC ══════════════ */
  const handleScratch = async (i) => {
    if (scratchRevealed[i] || getUsed('scratch') >= SCRATCH_LIMIT) return;
    const coins    = pickScratch();
    const newP     = [...scratchPrizes];    newP[i]  = coins;
    const newR     = [...scratchRevealed];  newR[i]  = true;
    setScratchPrizes(newP);
    setScratchRevealed(newR);
    incUsed('scratch');
    showToast(`🎁 +${coins} coins mile!`);
    refresh();
    await addCoins(coins);
  };

  const resetScratch = () => {
    setScratchPrizes([null, null, null]);
    setScratchRevealed([false, false, false]);
  };

  /* ══════════════ FLIP LOGIC ══════════════ */
  const handleFlip = () => {
    if (flipping || !flipChoice || getUsed('flip') >= 10) return;
    setFlipping(true);
    setFlipResult(null);
    setFlipFace('🌀');
    let count = 0;
    const faces    = ['👑', '🔵'];
    const myChoice = flipChoice; // closure capture — stale state se bachao
    const interval = setInterval(() => {
      setFlipFace(faces[count % 2]);
      count++;
      if (count >= 8) {
        clearInterval(interval);
        flipIntervalRef.current = null;
        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        const won    = result === myChoice;
        setFlipFace(result === 'heads' ? '👑' : '🔵');
        setFlipResult({ result, won });
        if (won) { addCoins(15); showToast('🎉 Sahi! +15 coins!'); }
        else     { showToast('😅 Galat! Next try karo.'); }
        incUsed('flip');
        setFlipping(false);
        setFlipChoice(null);
        refresh();
      }
    }, 120);
    flipIntervalRef.current = interval; // unmount pe clearInterval ke liye
  };


  /* ── games grid data (only 3) ── */
  const GAMES = [
    { key: 'spin',    icon: '🎰', name: 'Spin Wheel',  color: '#ff6a00', desc: '5 spins/day',  earn: 'Up to 200🪙',  used: getUsed('spin'),    limit: SPIN_LIMIT },
    { key: 'scratch', icon: '🎁', name: 'Scratch Card', color: '#22c55e', desc: '3 cards/day',  earn: 'Up to 200🪙',  used: getUsed('scratch'), limit: SCRATCH_LIMIT },
    { key: 'flip',    icon: '🪙', name: 'Coin Flip',    color: '#ffd700', desc: '10 flips/day', earn: '+15🪙 per win', used: getUsed('flip'),    limit: 10 },
  ];

  return (
    <div className="games-page">

      {/* ── TOPBAR ── */}
      <div className="games-topbar">
        <div className="games-topbar-title">🎮 Games Hub</div>
        <div className="games-balance-chip">🪙 {balance.toLocaleString()}</div>
      </div>

      <div className="games-scroll">
        <div className="games-hero-note">🕛 Roz raat 12 baje reset · Daily free plays!</div>

        {/* ── 2-COLUMN GRID ── */}
        <div className="games-grid">
          {GAMES.map(g => {
            const done = g.used >= g.limit;
            const pct  = Math.round((g.used / g.limit) * 100);
            return (
              <div key={g.key}
                className={`game-tile ${done ? 'game-tile-done' : ''}`}
                style={{ '--gc': g.color }}
                onClick={() => { if (!done) { setOpenGame(g.key); if (g.key === 'scratch') resetScratch(); } }}>

                <div className="game-tile-icon-wrap">
                  <span className="game-tile-icon">{done ? '✅' : g.icon}</span>
                </div>

                <div className="game-tile-name">{g.name}</div>
                <div className="game-tile-earn" style={{ color: done ? 'rgba(255,255,255,0.3)' : g.color }}>{g.earn}</div>

                <div className="game-tile-prog-bar">
                  <div className="game-tile-prog-fill" style={{ width: `${pct}%`, background: done ? '#555' : g.color }} />
                </div>
                <div className="game-tile-plays">
                  {done ? '✅ Done aaj ke liye' : `${g.used}/${g.limit} played`}
                </div>

                {!done && (
                  <div className="game-tile-play-btn" style={{ background: `linear-gradient(135deg, ${g.color}, ${g.color}bb)` }}>
                    PLAY ▶
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ height: 100 }} />
      </div>

      <BottomNav />

      {/* ═══════════════════ SPIN WHEEL MODAL ═══════════════════ */}
      {openGame === 'spin' && (
        <div className="gmodal-overlay" onClick={() => !spinning && setOpenGame(null)}>
          <div className="gmodal" onClick={e => e.stopPropagation()}>
            {!spinning && <button className="gmodal-close" onClick={() => setOpenGame(null)}>✕</button>}
            <div className="gmodal-title">🎰 Spin the Wheel</div>
            <div className="gmodal-sub">{SPIN_LIMIT - getUsed('spin')} spins bacha aaj ke liye</div>

            {/* POINTER */}
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
      )}

      {/* ═══════════════════ SCRATCH CARD MODAL ═══════════════════ */}
      {openGame === 'scratch' && (
        <div className="gmodal-overlay" onClick={() => setOpenGame(null)}>
          <div className="gmodal" onClick={e => e.stopPropagation()}>
            <button className="gmodal-close" onClick={() => setOpenGame(null)}>✕</button>
            <div className="gmodal-title">🎁 Scratch Card</div>
            <div className="gmodal-sub">{SCRATCH_LIMIT - getUsed('scratch')} cards bacha aaj ke liye</div>

            <div className="scratch-grid">
              {[0, 1, 2].map(i => (
                <div key={i}
                  className={`scratch-tile ${scratchRevealed[i] ? 'revealed' : ''} ${getUsed('scratch') >= SCRATCH_LIMIT && !scratchRevealed[i] ? 'locked' : ''}`}
                  onClick={() => handleScratch(i)}>
                  {scratchRevealed[i] ? (
                    <>
                      <div className="scratch-coin">🪙</div>
                      <div className="scratch-coins-val">+{scratchPrizes[i]}</div>
                      <div className="scratch-coins-lbl">coins</div>
                    </>
                  ) : (
                    <>
                      <div className="scratch-cover-icon">🎁</div>
                      <div className="scratch-tap-lbl">{getUsed('scratch') >= SCRATCH_LIMIT ? '❌ Done' : 'Tap!'}</div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {getUsed('scratch') >= SCRATCH_LIMIT && (
              <div className="gmodal-done">✅ Aaj ke 3 scratch ho gaye!</div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════ COIN FLIP MODAL ═══════════════════ */}
      {openGame === 'flip' && (
        <div className="gmodal-overlay" onClick={() => !flipping && setOpenGame(null)}>
          <div className="gmodal" onClick={e => e.stopPropagation()}>
            {!flipping && <button className="gmodal-close" onClick={() => setOpenGame(null)}>✕</button>}
            <div className="gmodal-title">🪙 Coin Flip</div>
            <div className="gmodal-sub">{10 - getUsed('flip')} flips bacha aaj ke liye</div>

            <div className={`flip-display ${flipping ? 'spinning' : ''}`}>{flipFace}</div>

            {flipResult && (
              <div className={`flip-outcome ${flipResult.won ? 'won' : 'lost'}`}>
                {flipResult.won ? `🎉 ${flipResult.result.toUpperCase()} — Sahi! +15 coins!` : `😅 ${flipResult.result.toUpperCase()} aaya — Galat!`}
              </div>
            )}

            <div className="flip-choices">
              <button className={`flip-opt ${flipChoice === 'heads' ? 'sel' : ''}`}
                onClick={() => !flipping && setFlipChoice('heads')} disabled={flipping}>
                <span className="flip-opt-icon">👑</span>
                <span>HEADS</span>
              </button>
              <div className="flip-vs">VS</div>
              <button className={`flip-opt ${flipChoice === 'tails' ? 'sel' : ''}`}
                onClick={() => !flipping && setFlipChoice('tails')} disabled={flipping}>
                <span className="flip-opt-icon">🔵</span>
                <span>TAILS</span>
              </button>
            </div>

            <button className="gmodal-btn"
              style={{ background: flipChoice && !flipping && getUsed('flip') < 10 ? 'linear-gradient(135deg,#ffd700,#ff8800)' : '#2a2a3a' }}
              disabled={!flipChoice || flipping || getUsed('flip') >= 10}
              onClick={handleFlip}>
              {flipping ? '🌀 Flipping...' : getUsed('flip') >= 10 ? '✅ Aaj ke liye done!' : '🪙 FLIP KARO!'}
            </button>
          </div>
        </div>
      )}

      {toast && <div className="games-toast">{toast}</div>}
    </div>
  );
}
