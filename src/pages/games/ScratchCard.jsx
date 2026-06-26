import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { getNetUsed, incNetUsed, getNetTimeLeft, fmtMs } from './gameUtils';
import { NET_LIMIT } from './adNetworks';
import AdWatchOverlay from './AdWatchOverlay';
import '../../styles/scratchCard.css';

export const SCRATCH_LIMIT = NET_LIMIT;

const TOP_PRIZES = [
  { icon: '🪙', val: '10,000' },
  { icon: '🏆', val: '5,000'  },
  { icon: '💰', val: '2,000'  },
  { icon: '🎖️', val: '500'    },
];

const PRIZES = [5, 10, 15, 25, 50, 50, 100, 150, 200];
function pick() { return PRIZES[Math.floor(Math.random() * PRIZES.length)]; }

const STARS = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 1 + Math.random() * 2.5,
  delay: Math.random() * 2.5,
}));

/* ── Canvas Scratch Layer ── */
function ScratchCanvas({ onDone }) {
  const ref     = useRef(null);
  const drawing = useRef(false);
  const count   = useRef(0);
  const done    = useRef(false);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    const W = c.width, H = c.height;

    /* Silver metallic gradient */
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0,   '#c8c8c8');
    grad.addColorStop(0.2, '#e8e8e8');
    grad.addColorStop(0.4, '#b0b0b0');
    grad.addColorStop(0.6, '#d8d8d8');
    grad.addColorStop(0.8, '#a8a8a8');
    grad.addColorStop(1,   '#c0c0c0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    /* Brush stroke texture */
    ctx.globalAlpha = 0.25;
    for (let i = 0; i < 18; i++) {
      const brushGrad = ctx.createLinearGradient(
        Math.random() * W, Math.random() * H,
        Math.random() * W, Math.random() * H
      );
      brushGrad.addColorStop(0, 'rgba(255,255,255,0)');
      brushGrad.addColorStop(0.5, 'rgba(255,255,255,0.6)');
      brushGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = brushGrad;
      ctx.beginPath();
      ctx.ellipse(
        Math.random() * W, Math.random() * H,
        80 + Math.random() * 100, 20 + Math.random() * 30,
        Math.random() * Math.PI, 0, Math.PI * 2
      );
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    /* Dark speckles */
    ctx.fillStyle = 'rgba(80,80,80,0.08)';
    for (let i = 0; i < 600; i++) {
      ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
    }

    /* Hand icon */
    ctx.globalAlpha = 0.3;
    ctx.font = '52px serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#555';
    ctx.fillText('☝️', W / 2, H / 2 - 8);

    /* SCRATCH HERE */
    ctx.globalAlpha = 0.38;
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#444';
    ctx.fillText('SCRATCH HERE', W / 2, H / 2 + 38);
    ctx.globalAlpha = 1;
  }, []);

  const getPos = (e, c) => {
    const r  = c.getBoundingClientRect();
    const sx = c.width / r.width, sy = c.height / r.height;
    const src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - r.left) * sx, y: (src.clientY - r.top) * sy };
  };

  const erase = (e) => {
    e.preventDefault();
    if (!drawing.current || done.current) return;
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d');
    const { x, y } = getPos(e, c);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();
    count.current++;
    if (count.current % 12 === 0) {
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      let t = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] === 0) t++;
      if (t / (c.width * c.height) > 0.52) {
        done.current = true;
        onDone();
      }
    }
  };

  return (
    <canvas
      ref={ref}
      width={340} height={210}
      className="sc2-canvas"
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
  const { balance, addCoins, recordGamePlay } = useApp();

  const [cardIdx,    setCardIdx]    = useState(0);
  // phases: 'scratching' | 'ad' | 'win' | 'all-done' | 'cooldown'
  const [phase,      setPhase]      = useState('scratching');
  const [prize,      setPrize]      = useState(null);
  const [prizes,     setPrizes]     = useState([]);
  const [total,      setTotal]      = useState(0);
  const [tick,       setTick]       = useState(0);
  const [showPrizes, setShowPrizes] = useState(false);
  const [canvasKey,  setCanvasKey]  = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  /* Check cooldown on mount and on cardIdx change */
  useEffect(() => {
    const used = getNetUsed(network.id, 'scratch');
    if (used >= NET_LIMIT) {
      setPhase('cooldown');
    } else {
      setPhase('scratching');
    }
  }, [cardIdx, network.id]);

  const used     = getNetUsed(network.id, 'scratch');
  const timeLeft = phase === 'cooldown' ? getNetTimeLeft(network.id, 'scratch') : 0;

  /* Scratch done → show ad */
  const handleScratched = useCallback(() => {
    setPhase('ad');
  }, []);

  /* Ad done → add coins → show win */
  const handleAdDone = useCallback(async () => {
    const coins = pick();
    setPrize(coins);
    incNetUsed(network.id, 'scratch');
    recordGamePlay('scratch').catch(() => {});
    await addCoins(coins);
    setTotal(t => t + coins);
    setPrizes(p => [...p, coins]);
    onRefresh();
    setPhase('win');
  }, [network.id, addCoins, recordGamePlay, onRefresh]);

  const handleNext = () => {
    const next = cardIdx + 1;
    if (next >= NET_LIMIT) {
      setPhase('all-done');
      return;
    }
    setCardIdx(next);
    setPrize(null);
    setCanvasKey(k => k + 1);
  };

  return (
    <>
      <div className="sc2-page">

        {/* Starfield */}
        <div className="sc2-stars">
          {STARS.map(s => (
            <div key={s.id} className="sc2-star" style={{
              left: `${s.x}%`, top: `${s.y}%`,
              width: s.size, height: s.size,
              animationDelay: `${s.delay}s`,
            }} />
          ))}
        </div>

        {/* Header */}
        <div className="sc2-header">
          <button className="sc2-back-btn" onClick={onClose}>←</button>
          <div className="sc2-balance-pill">
            <span className="sc2-coin-icon">🪙</span>
            <span className="sc2-balance-val">{balance.toLocaleString()}</span>
            <button className="sc2-plus-btn">+</button>
          </div>
        </div>

        {/* Title */}
        <div className="sc2-title-wrap">
          <div className="sc2-title-stars">
            <span className="sc2-star-deco">⭐</span>
            <div>
              <span className="sc2-title-scratch">SCRATCH</span>
              <span className="sc2-title-card">CARD</span>
            </div>
            <span className="sc2-star-deco">⭐</span>
          </div>
          <div className="sc2-subtitle-banner">
            <span>MATCH &amp; <b>WIN BIG!</b></span>
          </div>
        </div>

        {/* Scratch Card Area */}
        <div className="sc2-card-wrap">
          <div className="sc2-card-border">
            <div className="sc2-card-inner">

              {/* Prize behind canvas */}
              {phase !== 'cooldown' && (
                <div className="sc2-prize-reveal">
                  <span className="sc2-prize-icon">🎉</span>
                  <span className="sc2-prize-amount">{prize != null ? `+${prize}` : '?'}</span>
                  <span className="sc2-prize-lbl">🪙 Coins Mile!</span>
                </div>
              )}

              {/* Cooldown */}
              {phase === 'cooldown' && (
                <div className="sc2-cooldown-overlay">
                  <div className="sc2-cooldown-icon">⏰</div>
                  <div className="sc2-cooldown-title">Aaj ke Cards Khatam!</div>
                  <div className="sc2-cooldown-time">
                    {timeLeft > 0 ? fmtMs(timeLeft) : '🔄 Ready!'}
                  </div>
                  <div className="sc2-cooldown-sub">4 ghante baad naye cards milenge</div>
                </div>
              )}

              {/* Scratch canvas */}
              {phase === 'scratching' && (
                <ScratchCanvas key={canvasKey} onDone={handleScratched} />
              )}

              {/* Win reveal */}
              {phase === 'win' && (
                <div className="sc2-win-overlay">
                  <div className="sc2-win-icon">🎊</div>
                  <div className="sc2-win-amount">+{prize}</div>
                  <div className="sc2-win-lbl">🪙 Coins Jeet Liye!</div>
                </div>
              )}

              {/* Progress dots */}
              {phase !== 'all-done' && phase !== 'cooldown' && (
                <div className="sc2-progress-row">
                  {[...Array(NET_LIMIT)].map((_, i) => (
                    <div key={i} className={`sc2-progress-dot ${
                      prizes[i] !== undefined ? 'used' :
                      i === cardIdx ? 'active' : ''
                    }`} />
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>

        {/* TOP PRIZES */}
        <div className="sc2-prizes-section">
          <div className="sc2-prizes-header">
            <div className="sc2-prizes-divider-left" />
            <span className="sc2-prizes-header-star">⭐</span>
            <span className="sc2-prizes-title">TOP PRIZES</span>
            <span className="sc2-prizes-header-star">⭐</span>
            <div className="sc2-prizes-divider-right" />
          </div>
          <div className="sc2-prizes-grid">
            {TOP_PRIZES.map((p, i) => (
              <div key={i} className="sc2-prize-tile">
                <span className="sc2-prize-tile-icon">{p.icon}</span>
                <span className="sc2-prize-tile-val">
                  <span className="sc2-prize-coin-icon">🪙</span>
                  {p.val}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom actions */}
        {(phase === 'scratching' || phase === 'cooldown') && (
          <div className="sc2-bottom-btns" style={{ marginTop: 14 }}>
            <button className="sc2-btn-view" onClick={() => setShowPrizes(true)}>
              <span className="sc2-btn-icon">👁️</span>
              VIEW PRIZES
            </button>
            <button className="sc2-btn-upgrade">
              <span className="sc2-btn-icon">🎫</span>
              UPGRADE CARD
            </button>
          </div>
        )}

        {phase === 'win' && (
          <button className="sc2-next-btn" onClick={handleNext}>
            {cardIdx + 1 < NET_LIMIT
              ? `➡️ Agla Card (${cardIdx + 2}/${NET_LIMIT})`
              : '🎊 Complete! Summary Dekho'}
          </button>
        )}

        {/* All done summary */}
        {phase === 'all-done' && (
          <div className="sc2-summary">
            <div className="sc2-summary-emoji">🎊</div>
            <div className="sc2-summary-title">Teeno Cards Complete!</div>
            <div className="sc2-summary-list">
              {prizes.map((p, i) => (
                <div key={i} className="sc2-summary-row">
                  <span className="sc2-summary-row-lbl">🎁 Card {i + 1}</span>
                  <span className="sc2-summary-row-val">+{p} 🪙</span>
                </div>
              ))}
            </div>
            <div className="sc2-summary-total">
              <span className="sc2-summary-total-lbl">💰 Total Jeeta</span>
              <span className="sc2-summary-total-val">+{total} 🪙</span>
            </div>
            <button className="sc2-summary-done-btn" onClick={onClose}>
              🏠 Wapas Jao
            </button>
          </div>
        )}

      </div>

      {/* Ad Overlay */}
      {phase === 'ad' && (
        <AdWatchOverlay
          network={network}
          onComplete={handleAdDone}
          onCancel={() => setPhase('scratching')}
        />
      )}

      {/* Prizes Modal */}
      {showPrizes && (
        <div className="sc2-prizes-modal-overlay" onClick={() => setShowPrizes(false)}>
          <div className="sc2-prizes-modal" onClick={e => e.stopPropagation()}>
            <div className="sc2-pm-handle" />
            <div className="sc2-pm-title">🏆 Prize Table</div>
            {[
              { icon: '🪙', name: 'Gold Coins',   val: '10,000 🪙', chance: 'Very Rare' },
              { icon: '🏆', name: 'Trophy',        val: '5,000 🪙',  chance: 'Rare' },
              { icon: '💰', name: 'Money Bag',     val: '2,000 🪙',  chance: 'Uncommon' },
              { icon: '🎖️', name: 'Silver Medal',  val: '500 🪙',    chance: 'Common' },
              { icon: '🎁', name: 'Bonus Coins',   val: '200 🪙',    chance: 'Very Common' },
              { icon: '⭐', name: 'Star Reward',   val: '50 🪙',     chance: 'Most Common' },
            ].map((p, i) => (
              <div key={i} className="sc2-pm-row">
                <div className="sc2-pm-left">
                  <span className="sc2-pm-icon">{p.icon}</span>
                  <div>
                    <div className="sc2-pm-name">{p.name}</div>
                    <div className="sc2-pm-chance">{p.chance}</div>
                  </div>
                </div>
                <span className="sc2-pm-val">{p.val}</span>
              </div>
            ))}
            <button className="sc2-pm-close" onClick={() => setShowPrizes(false)}>
              Theek Hai ✓
            </button>
          </div>
        </div>
      )}
    </>
  );
}
