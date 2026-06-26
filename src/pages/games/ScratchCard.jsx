import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getNetUsed, incNetUsed, getNetTimeLeft, fmtMs } from './gameUtils';
import { NET_LIMIT } from './adNetworks';
import AdWatchOverlay from './AdWatchOverlay';

const SCRATCH_PRIZES = [5, 5, 5, 10, 10, 25, 25, 50, 100, 200];
export const SCRATCH_LIMIT = NET_LIMIT;

function pickScratch() {
  return SCRATCH_PRIZES[Math.floor(Math.random() * SCRATCH_PRIZES.length)];
}

export default function ScratchCardModal({ onClose, onRefresh, network }) {
  const { addCoins, recordGamePlay } = useApp();

  const [prizes,       setPrizes]       = useState([null, null, null]);
  const [revealed,     setRevealed]     = useState([false, false, false]);
  const [watchingCard, setWatchingCard] = useState(null);
  const [toast,        setToast]        = useState('');
  const [tick,         setTick]         = useState(0);
  const toastRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => { clearInterval(id); if (toastRef.current) clearTimeout(toastRef.current); };
  }, []);

  const showToast = msg => {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast(msg);
    toastRef.current = setTimeout(() => setToast(''), 3000);
  };

  const used     = getNetUsed(network.id, 'scratch');
  const isDone   = used >= NET_LIMIT;
  const timeLeft = isDone ? getNetTimeLeft(network.id, 'scratch') : 0;

  const handleTapCard = (i) => {
    if (revealed[i] || isDone || watchingCard !== null) return;
    setWatchingCard(i);
  };

  const handleAdComplete = async () => {
    const i = watchingCard;
    setWatchingCard(null);
    const coins = pickScratch();
    setPrizes(p  => { const n = [...p];  n[i] = coins; return n; });
    setRevealed(r => { const n = [...r]; n[i] = true;  return n; });
    incNetUsed(network.id, 'scratch');
    recordGamePlay('scratch').catch(() => {});
    showToast(`🎁 +${coins} coins mile!`);
    onRefresh();
    await addCoins(coins);
  };

  const allRevealed = revealed.every(Boolean);

  return (
    <>
      <div className="gmodal-overlay" onClick={() => watchingCard === null && onClose()}>
        <div className="gmodal" onClick={e => e.stopPropagation()}>
          {watchingCard === null && (
            <button className="gmodal-close" onClick={onClose}>✕</button>
          )}
          <div className="gmodal-title">🎁 Scratch Card</div>
          <div className="gmodal-net-badge" style={{ '--nc': network.color, '--ng': network.grad }}>
            {network.label} · {NET_LIMIT - used} cards bacha
          </div>

          <div className="scratch-grid">
            {[0, 1, 2].map(i => {
              const isRevealed = revealed[i];
              const canTap     = !isRevealed && !isDone && watchingCard === null;
              const isWaiting  = !isRevealed && watchingCard !== null && watchingCard !== i;
              return (
                <div key={i}
                  className={`scratch-tile ${isRevealed ? 'revealed' : ''} ${isDone && !isRevealed ? 'locked' : ''}`}
                  onClick={() => canTap && handleTapCard(i)}>
                  {isRevealed ? (
                    <>
                      <div className="scratch-coin">🪙</div>
                      <div className="scratch-coins-val">+{prizes[i]}</div>
                      <div className="scratch-coins-lbl">coins</div>
                    </>
                  ) : (
                    <>
                      <div className="scratch-cover-icon">🎁</div>
                      <div className="scratch-tap-lbl">
                        {isDone    ? '❌ Done'
                        : isWaiting ? '⏳ Wait'
                        : watchingCard === i ? '📺 Ad...'
                        : '🎬 Ad dekho'}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {isDone && (
            <div className="net-cooldown-box">
              {timeLeft > 0
                ? <><span>⏰</span><span>{fmtMs(timeLeft)} baad milenge</span></>
                : <span>🔄 Ab phir se khel sakte ho!</span>}
            </div>
          )}

          {!isDone && !allRevealed && (
            <div className="scratch-hint">
              Kisi bhi card pe tap karo → Ad dekho → Prize pao! 🎁
            </div>
          )}

          {allRevealed && (
            <div className="gmodal-done">✅ Teeno cards scratch ho gaye!</div>
          )}

          {toast && <div className="games-toast">{toast}</div>}
        </div>
      </div>

      {watchingCard !== null && (
        <AdWatchOverlay
          network={network}
          onComplete={handleAdComplete}
          onCancel={() => setWatchingCard(null)}
        />
      )}
    </>
  );
}
