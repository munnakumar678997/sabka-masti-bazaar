import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getUsed, incUsed } from './gameUtils';

const SCRATCH_PRIZES = [5, 5, 5, 10, 10, 25, 25, 50, 100, 200];
export const SCRATCH_LIMIT = 3;

function pickScratch() {
  return SCRATCH_PRIZES[Math.floor(Math.random() * SCRATCH_PRIZES.length)];
}

export default function ScratchCardModal({ onClose, onRefresh }) {
  const { addCoins, recordGamePlay } = useApp();

  const [scratchPrizes,   setScratchPrizes]   = useState([null, null, null]);
  const [scratchRevealed, setScratchRevealed] = useState([false, false, false]);
  const [toast,           setToast]           = useState('');
  const toastTimerRef = useRef(null);

  useEffect(() => {
    return () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); };
  }, []);

  const showToast = (msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(''), 3000);
  };

  const handleScratch = async (i) => {
    if (scratchRevealed[i] || getUsed('scratch') >= SCRATCH_LIMIT) return;
    const coins = pickScratch();
    const newP  = [...scratchPrizes];   newP[i]  = coins;
    const newR  = [...scratchRevealed]; newR[i]  = true;
    setScratchPrizes(newP);
    setScratchRevealed(newR);
    incUsed('scratch');
    recordGamePlay('scratch').catch(() => {});
    showToast(`🎁 +${coins} coins mile!`);
    onRefresh();
    await addCoins(coins);
  };

  return (
    <div className="gmodal-overlay" onClick={onClose}>
      <div className="gmodal" onClick={e => e.stopPropagation()}>
        <button className="gmodal-close" onClick={onClose}>✕</button>
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

        {toast && <div className="games-toast">{toast}</div>}
      </div>
    </div>
  );
}
