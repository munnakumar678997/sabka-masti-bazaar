import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { getNetUsed, incNetUsed, getNetTimeLeft, fmtMs } from './gameUtils';
import { NET_LIMIT } from './adNetworks';
import AdWatchOverlay from './AdWatchOverlay';

const PRIZES   = [5, 5, 10, 10, 25, 25, 50, 100, 200];
const THEMES   = [
  { grad: 'linear-gradient(135deg,#ff6a00,#ee0979)', icon: '💎' },
  { grad: 'linear-gradient(135deg,#22c55e,#0d6632)',  icon: '🏆' },
  { grad: 'linear-gradient(135deg,#7b2ff7,#0088cc)',  icon: '⭐' },
];
export const SCRATCH_LIMIT = NET_LIMIT;

function pick() { return PRIZES[Math.floor(Math.random() * PRIZES.length)]; }

/* ── Canvas Scratch Component ── */
function ScratchLayer({ onDone }) {
  const ref      = useRef(null);
  const drawing  = useRef(false);
  const scratched = useRef(0);
  const notified = useRef(false);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#1a1a3e';
    ctx.fillRect(0, 0, c.width, c.height);

    /* Texture lines */
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let y = 0; y < c.height; y += 12) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(c.width, y); ctx.stroke();
    }
    /* Centre text */
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('✦  SCRATCH KARO  ✦', c.width / 2, c.height / 2 - 10);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.font = '12px sans-serif';
    ctx.fillText('👆 Yahan se scratch karo', c.width / 2, c.height / 2 + 12);
  }, []);

  const pos = (e, c) => {
    const r = c.getBoundingClientRect();
    const sx = c.width  / r.width, sy = c.height / r.height;
    const src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - r.left) * sx, y: (src.clientY - r.top) * sy };
  };

  const erase = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d');
    const { x, y } = pos(e, c);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.fill();
    scratched.current++;
    if (scratched.current % 15 === 0 && !notified.current) {
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      let t = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] === 0) t++;
      if (t / (c.width * c.height) > 0.55) { notified.current = true; onDone(); }
    }
  };

  return (
    <canvas ref={ref} width={300} height={170} className="sc-canvas"
      onMouseDown={e => { drawing.current = true; erase(e); }}
      onMouseMove={erase}
      onMouseUp={() => { drawing.current = false; }}
      onMouseLeave={() => { drawing.current = false; }}
      onTouchStart={e => { drawing.current = true; erase(e); }}
      onTouchMove={erase}
      onTouchEnd={() => { drawing.current = false; }}
    />
  );
}

export default function ScratchCardModal({ onClose, onRefresh, network }) {
  const { addCoins, recordGamePlay } = useApp();

  const [cardIdx,   setCardIdx]   = useState(0);
  const [phase,     setPhase]     = useState('pre'); // pre | ad | scratching | done-card | all-done
  const [prize,     setPrize]     = useState(null);
  const [total,     setTotal]     = useState(0);
  const [prizes,    setPrizes]    = useState([]);
  const [tick,      setTick]      = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const used     = getNetUsed(network.id, 'scratch');
  const isDone   = used >= NET_LIMIT;
  const timeLeft = isDone ? getNetTimeLeft(network.id, 'scratch') : 0;

  const handleAdDone = useCallback(async () => {
    const coins = pick();
    setPrize(coins);
    setPhase('scratching');
    incNetUsed(network.id, 'scratch');
    recordGamePlay('scratch').catch(() => {});
    await addCoins(coins);
    setTotal(t => t + coins);
    setPrizes(p => [...p, coins]);
    onRefresh();
  }, [network.id, addCoins, recordGamePlay, onRefresh]);

  const handleScratched = () => setPhase('done-card');

  const handleNext = () => {
    const next = cardIdx + 1;
    if (next >= NET_LIMIT) { setPhase('all-done'); return; }
    setCardIdx(next);
    setPhase('pre');
    setPrize(null);
  };

  const theme = THEMES[cardIdx % THEMES.length];

  return (
    <>
      <div className="fs-overlay">
        {/* Top bar */}
        <div className="fs-topbar">
          <div className="fs-net-badge" style={{ background: network.grad }}>{network.label}</div>
          <div className="fs-title">🎁 Scratch Card</div>
          {(phase === 'pre' || phase === 'all-done') && (
            <button className="fs-close-btn" onClick={onClose}>✕</button>
          )}
          {phase !== 'pre' && phase !== 'all-done' && <div style={{ width: 36 }} />}
        </div>

        {/* Progress dots */}
        <div className="fs-plays-row">
          {[...Array(NET_LIMIT)].map((_, i) => (
            <div key={i} className={`fs-play-dot ${
              prizes[i] !== undefined ? 'fs-play-dot-used' :
              i === cardIdx ? 'fs-play-dot-active' : 'fs-play-dot-free'
            }`} style={
              prizes[i] === undefined && i >= cardIdx
                ? { background: network.color, opacity: i === cardIdx ? 1 : 0.3 } : {}
            } />
          ))}
          <span className="fs-plays-txt">Card {Math.min(cardIdx + 1, NET_LIMIT)}/{NET_LIMIT}</span>
        </div>

        {/* Main content */}
        <div className="sc-main">

          {isDone && phase === 'pre' ? (
            <div className="fs-empty-state">
              <div style={{ fontSize: 60 }}>⏰</div>
              <p className="fs-empty-title">Aaj ke cards khatam!</p>
              <p className="fs-empty-sub">{timeLeft > 0 ? fmtMs(timeLeft) + ' baad milenge' : '🔄 Ready ho gaye!'}</p>
            </div>
          ) : phase === 'pre' ? (
            /* Locked card */
            <div className="sc-locked-card" style={{ background: theme.grad }}
              onClick={() => setPhase('ad')}>
              <div className="sc-lock-icon-big">🎁</div>
              <p className="sc-lock-title">Card {cardIdx + 1}</p>
              <p className="sc-lock-sub">Tap karke ad dekho</p>
              <div className="sc-lock-shine" />
            </div>
          ) : phase === 'scratching' ? (
            /* Scratch area */
            <div className="sc-scratch-wrap">
              <div className="sc-prize-bg" style={{ background: theme.grad }}>
                <span className="sc-prize-bg-icon">{theme.icon}</span>
                <span className="sc-prize-bg-val">+{prize}</span>
                <span className="sc-prize-bg-lbl">🪙 Coins</span>
              </div>
              <div className="sc-canvas-wrap">
                <ScratchLayer onDone={handleScratched} />
              </div>
              <p className="sc-hint">👆 ऊपर scratch karo prize dekhne ke liye</p>
            </div>
          ) : phase === 'done-card' ? (
            /* Card revealed */
            <div className="sc-reveal-screen">
              <div className="sc-reveal-card" style={{ background: theme.grad }}>
                <div className="sc-reveal-icon">{theme.icon}</div>
                <div className="sc-reveal-val">+{prize}</div>
                <div className="sc-reveal-lbl">🪙 Coins Mile!</div>
              </div>
            </div>
          ) : phase === 'all-done' ? (
            /* Summary */
            <div className="sc-summary-screen">
              <div className="sc-summary-emoji">🎊</div>
              <p className="sc-summary-heading">Teeno Cards Complete!</p>
              <div className="sc-summary-list">
                {prizes.map((p, i) => (
                  <div key={i} className="sc-summary-item">
                    <span>Card {i + 1}</span>
                    <span style={{ color: '#fbbf24', fontWeight: 900 }}>+{p} 🪙</span>
                  </div>
                ))}
              </div>
              <div className="sc-summary-total">
                <span>Total</span>
                <span>+{total} 🪙</span>
              </div>
            </div>
          ) : null}

        </div>

        {/* Bottom action */}
        <div className="fs-bottom">
          {phase === 'pre' && !isDone && (
            <button className="fs-action-btn" style={{ background: network.grad }}
              onClick={() => setPhase('ad')}>
              🎬 Ad Dekho & Scratch Karo
            </button>
          )}
          {phase === 'done-card' && (
            cardIdx + 1 < NET_LIMIT ? (
              <button className="fs-action-btn" style={{ background: network.grad }} onClick={handleNext}>
                Agla Card → Card {cardIdx + 2}
              </button>
            ) : (
              <button className="fs-action-btn" style={{ background: '#22c55e' }} onClick={handleNext}>
                🎊 Complete! Summary Dekho
              </button>
            )
          )}
          {phase === 'all-done' && (
            <button className="fs-action-btn" style={{ background: network.grad }} onClick={onClose}>
              Wapas Jao
            </button>
          )}
          {phase === 'scratching' && (
            <p className="fs-spinning-msg">👆 Scratch karte raho...</p>
          )}
        </div>
      </div>

      {phase === 'ad' && (
        <AdWatchOverlay
          network={network}
          onComplete={handleAdDone}
          onCancel={() => setPhase('pre')}
        />
      )}
    </>
  );
}
