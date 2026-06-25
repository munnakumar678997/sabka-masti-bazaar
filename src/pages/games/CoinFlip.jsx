import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getUsed, incUsed } from './gameUtils';

export const FLIP_LIMIT = 10;

export default function CoinFlipModal({ onClose, onRefresh }) {
  const { addCoins, recordGamePlay } = useApp();

  const [flipChoice,     setFlipChoice]     = useState(null);
  const [flipping,       setFlipping]       = useState(false);
  const [flipFace,       setFlipFace]       = useState('🪙');
  const [showFlipResult, setShowFlipResult] = useState(false);
  const [flipResultData, setFlipResultData] = useState(null);
  const flipIntervalRef    = useRef(null);
  const flipResultTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (flipIntervalRef.current)    clearInterval(flipIntervalRef.current);
      if (flipResultTimerRef.current) clearTimeout(flipResultTimerRef.current);
    };
  }, []);

  const handleFlip = () => {
    if (flipping || !flipChoice || getUsed('flip') >= FLIP_LIMIT) return;
    setFlipping(true);
    setFlipFace('🌀');
    let count = 0;
    const faces    = ['👑', '🔵'];
    const myChoice = flipChoice;

    const interval = setInterval(() => {
      setFlipFace(faces[count % 2]);
      count++;
      if (count >= 8) {
        clearInterval(interval);
        flipIntervalRef.current = null;
        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        const won    = result === myChoice;
        setFlipFace(result === 'heads' ? '👑' : '🔵');
        if (won) addCoins(15);
        incUsed('flip');
        recordGamePlay('flip').catch(() => {});
        setFlipping(false);
        setFlipChoice(null);
        onRefresh();
        setFlipResultData({ result, won });
        setShowFlipResult(true);
        if (flipResultTimerRef.current) clearTimeout(flipResultTimerRef.current);
        flipResultTimerRef.current = setTimeout(() => setShowFlipResult(false), 3500);
      }
    }, 120);
    flipIntervalRef.current = interval;
  };

  const dismissResult = () => {
    setShowFlipResult(false);
    if (flipResultTimerRef.current) clearTimeout(flipResultTimerRef.current);
  };

  return (
    <div className="gmodal-overlay" onClick={() => !flipping && !showFlipResult && onClose()}>
      <div className="gmodal flip-gmodal" onClick={e => e.stopPropagation()}>

        {!flipping && !showFlipResult && (
          <button className="gmodal-close" onClick={onClose}>✕</button>
        )}
        <div className="gmodal-title">🪙 Coin Flip</div>
        <div className="gmodal-sub">{FLIP_LIMIT - getUsed('flip')} flips bacha aaj ke liye</div>

        <div className={`flip-display ${flipping ? 'spinning' : ''}`}>{flipFace}</div>

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
          style={{ background: flipChoice && !flipping && getUsed('flip') < FLIP_LIMIT ? 'linear-gradient(135deg,#ffd700,#ff8800)' : '#2a2a3a' }}
          disabled={!flipChoice || flipping || getUsed('flip') >= FLIP_LIMIT}
          onClick={handleFlip}>
          {flipping ? '🌀 Flipping...' : getUsed('flip') >= FLIP_LIMIT ? '✅ Aaj ke liye done!' : '🪙 FLIP KARO!'}
        </button>

        {/* ── BIG RESULT CARD OVERLAY ── */}
        {showFlipResult && flipResultData && (
          <div
            className={`flip-result-overlay ${flipResultData.won ? 'fro-win' : 'fro-loss'}`}
            onClick={dismissResult}>

            <div className="fro-particles">
              {flipResultData.won
                ? ['🎉','✨','🎊','⭐','🌟','🎊','✨','🎉'].map((p, i) => (
                    <span key={i} className="fro-particle"
                      style={{ '--d': `${i * 45}deg`, '--r': `${55 + (i % 3) * 20}px` }}>{p}</span>
                  ))
                : ['💨','😮','💫','😬'].map((p, i) => (
                    <span key={i} className="fro-particle"
                      style={{ '--d': `${i * 90}deg`, '--r': '50px' }}>{p}</span>
                  ))
              }
            </div>

            <div className="fro-main-icon">
              {flipResultData.won ? '👑' : '🔵'}
            </div>

            <div className="fro-status-badge">
              {flipResultData.won ? '🎊 JEET GAYE!' : '😅 HAAR GAYE!'}
            </div>

            <div className="fro-result-text">
              {flipResultData.result.toUpperCase()} aaya
            </div>

            {flipResultData.won ? (
              <div className="fro-coins-won">
                <span className="fro-coins-icon">🪙</span>
                <span className="fro-coins-num">+15</span>
                <span className="fro-coins-lbl">Coins Mile!</span>
              </div>
            ) : (
              <div className="fro-retry-msg">
                Chinta mat karo —<br />agli baar zaroor jeetoge! 💪
              </div>
            )}

            <div className="fro-tap-hint">Tap karke band karo</div>
          </div>
        )}
      </div>
    </div>
  );
}
