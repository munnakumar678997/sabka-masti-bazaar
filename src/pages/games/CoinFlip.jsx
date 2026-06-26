import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getNetUsed, incNetUsed, getNetTimeLeft, fmtMs } from './gameUtils';
import { FLIP_LIMIT } from './adNetworks';
import AdWatchOverlay from './AdWatchOverlay';

export { FLIP_LIMIT };

const FACES = {
  heads: { icon: '👑', label: 'HEADS', color: '#ffd700' },
  tails: { icon: '🔵', label: 'TAILS', color: '#0088cc' },
};

export default function CoinFlipModal({ onClose, onRefresh, network }) {
  const { addCoins, recordGamePlay } = useApp();

  const [choice,   setChoice]   = useState(null); // 'heads' | 'tails'
  const [phase,    setPhase]    = useState('choose'); // choose | flipping | result | claim-ad | claimed
  const [flipFace, setFlipFace] = useState(null);
  const [result,   setResult]   = useState(null);  // { face, won }
  const [tick,     setTick]     = useState(0);
  const flipRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => {
      clearInterval(id);
      if (flipRef.current)  clearInterval(flipRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const used     = getNetUsed(network.id, 'flip');
  const isDone   = used >= FLIP_LIMIT;
  const timeLeft = isDone ? getNetTimeLeft(network.id, 'flip') : 0;

  const doFlip = () => {
    setPhase('flipping');
    setFlipFace(null);
    let count = 0;
    const cycFaces = ['heads', 'tails'];
    flipRef.current = setInterval(() => {
      setFlipFace(cycFaces[count % 2]);
      count++;
      if (count >= 10) {
        clearInterval(flipRef.current);
        flipRef.current = null;
        const face = Math.random() < 0.5 ? 'heads' : 'tails';
        const won  = face === choice;
        setFlipFace(face);
        incNetUsed(network.id, 'flip');
        recordGamePlay('flip').catch(() => {});
        onRefresh();
        timerRef.current = setTimeout(() => {
          setResult({ face, won });
          setPhase('result');
        }, 500);
      }
    }, 130);
  };

  const handleClaimAd = () => setPhase('claim-ad');

  const handleAdDone = async () => {
    await addCoins(15);
    setPhase('claimed');
  };

  const resetRound = () => {
    setChoice(null);
    setFlipFace(null);
    setResult(null);
    setPhase('choose');
  };

  return (
    <>
      <div className="fs-overlay">
        {/* Topbar */}
        <div className="fs-topbar">
          <div className="fs-net-badge" style={{ background: network.grad }}>{network.label}</div>
          <div className="fs-title">🪙 Coin Flip</div>
          {phase === 'choose' ? (
            <button className="fs-close-btn" onClick={onClose}>✕</button>
          ) : <div style={{ width: 36 }} />}
        </div>

        {/* Plays counter */}
        <div className="fs-plays-row">
          {[...Array(Math.min(FLIP_LIMIT, 10))].map((_, i) => (
            <div key={i} className={`fs-play-dot ${i < used ? 'fs-play-dot-used' : 'fs-play-dot-free'}`}
              style={i >= used ? { background: network.color, opacity: 1 - i * 0.05 } : {}} />
          ))}
          <span className="fs-plays-txt">{FLIP_LIMIT - used}/{FLIP_LIMIT} flips</span>
        </div>

        {/* Main arena */}
        <div className="cf-arena">

          {/* Big coin display */}
          <div className={`cf-coin-wrap ${phase === 'flipping' ? 'cf-flipping' : ''} ${phase === 'result' || phase === 'claimed' ? 'cf-result-pop' : ''}`}>
            {phase === 'choose' && !isDone ? (
              <div className="cf-coin-idle">🪙</div>
            ) : phase === 'choose' && isDone ? (
              <div className="cf-coin-idle">⏰</div>
            ) : phase === 'flipping' ? (
              <div className="cf-coin-flip"
                style={{ color: flipFace ? FACES[flipFace].color : '#fff' }}>
                {flipFace ? FACES[flipFace].icon : '🪙'}
              </div>
            ) : (result || phase === 'claimed') ? (
              <div className={`cf-coin-result ${result?.won ? 'cf-win-glow' : 'cf-loss-glow'}`}
                style={{ color: result ? FACES[result.face].color : '#4ade80' }}>
                {phase === 'claimed' ? '✅' : result ? FACES[result.face].icon : '✅'}
              </div>
            ) : null}
          </div>

          {/* Choose heads / tails */}
          {phase === 'choose' && !isDone && (
            <div className="cf-choices">
              {['heads', 'tails'].map(f => (
                <button key={f}
                  className={`cf-choice-btn ${choice === f ? 'cf-choice-sel' : ''}`}
                  style={choice === f ? { '--nc': FACES[f].color, borderColor: FACES[f].color, background: `${FACES[f].color}22` } : {}}
                  onClick={() => setChoice(f)}>
                  <span className="cf-choice-icon">{FACES[f].icon}</span>
                  <span className="cf-choice-lbl">{FACES[f].label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Flipping message */}
          {phase === 'flipping' && (
            <p className="cf-flip-msg">🌀 Coin Flip ho rahi hai...</p>
          )}

          {/* WIN result */}
          {phase === 'result' && result?.won && (
            <div className="cf-result-win">
              <div className="cf-result-badge win">🎊 JEET GAYE!</div>
              <p className="cf-result-face">{result.face.toUpperCase()} aaya!</p>
              <div className="cf-win-prize">
                <span>🪙</span>
                <span className="cf-win-num">+15</span>
                <span className="cf-win-coins">Coins</span>
              </div>
              {/* Win particles */}
              <div className="cf-particles">
                {['🎉','✨','🎊','⭐','💫','🌟','✨','🎉'].map((p, i) => (
                  <span key={i} className="cf-particle"
                    style={{ '--d': `${i * 45}deg`, '--r': `${70 + (i % 3) * 18}px`, '--delay': `${i * 0.05}s` }}>{p}</span>
                ))}
              </div>
            </div>
          )}

          {/* LOSS result */}
          {phase === 'result' && result && !result.won && (
            <div className="cf-result-loss">
              <div className="cf-result-badge loss">😅 HAAR GAYE</div>
              <p className="cf-result-face">{result.face.toUpperCase()} aaya!</p>
              <p className="cf-loss-msg">Chinta mat — agli baar zaroor jeetoge! 💪</p>
            </div>
          )}

          {/* CLAIMED */}
          {phase === 'claimed' && (
            <div className="cf-result-win">
              <div className="cf-result-badge win">✅ Coins Mile!</div>
              <p className="cf-result-face">+15 🪙 Wallet mein add ho gaye!</p>
            </div>
          )}

          {/* Cooldown */}
          {phase === 'choose' && isDone && (
            <div className="cf-cooldown">
              <p className="cf-cooldown-msg">
                {timeLeft > 0 ? `⏰ ${fmtMs(timeLeft)} baad milenge` : '🔄 Ab phir se khel sakte ho!'}
              </p>
            </div>
          )}
        </div>

        {/* Bottom action */}
        <div className="fs-bottom">
          {phase === 'choose' && !isDone && (
            <button className="fs-action-btn"
              style={{ background: choice ? network.grad : '#2a2a3e' }}
              disabled={!choice}
              onClick={doFlip}>
              {choice ? `🎲 ${FACES[choice].label} pe Flip Karo!` : '👆 Pehle choose karo'}
            </button>
          )}
          {phase === 'result' && result?.won && (
            <button className="fs-action-btn" style={{ background: network.grad }}
              onClick={handleClaimAd}>
              🎬 Ad Dekho & Coins Claim Karo
            </button>
          )}
          {phase === 'result' && result && !result.won && (
            isDone ? (
              <div className="fs-cooldown">⏰ {timeLeft > 0 ? fmtMs(timeLeft) : 'Ready!'}</div>
            ) : (
              <button className="fs-action-btn" style={{ background: network.grad }} onClick={resetRound}>
                🎲 Dobara Khelo
              </button>
            )
          )}
          {phase === 'claimed' && (
            isDone ? (
              <button className="fs-action-btn" style={{ background: '#555' }} onClick={onClose}>Wapas Jao</button>
            ) : (
              <button className="fs-action-btn" style={{ background: network.grad }} onClick={resetRound}>
                🎲 Dobara Khelo
              </button>
            )
          )}
          {phase === 'flipping' && (
            <div className="fs-spinning-msg">🌀 Flip ho rahi hai...</div>
          )}
        </div>
      </div>

      {phase === 'claim-ad' && (
        <AdWatchOverlay
          network={network}
          onComplete={handleAdDone}
          onCancel={() => setPhase('result')}
        />
      )}
    </>
  );
}
