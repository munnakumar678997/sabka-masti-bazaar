import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getNetUsed, incNetUsed, getNetTimeLeft, fmtMs } from './gameUtils';
import { FLIP_LIMIT } from './adNetworks';
import AdWatchOverlay from './AdWatchOverlay';

export { FLIP_LIMIT };

export default function CoinFlipModal({ onClose, onRefresh, network }) {
  const { addCoins, recordGamePlay } = useApp();

  const [flipChoice,   setFlipChoice]   = useState(null);
  const [phase,        setPhase]        = useState('choose'); // choose | flipping | result | claiming
  const [flipFace,     setFlipFace]     = useState('🪙');
  const [resultData,   setResultData]   = useState(null); // { result, won }
  const [claimingAd,   setClaimingAd]   = useState(false);
  const [claimed,      setClaimed]      = useState(false);
  const [tick,         setTick]         = useState(0);
  const flipIntervalRef = useRef(null);
  const timerRef        = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => {
      clearInterval(id);
      if (flipIntervalRef.current) clearInterval(flipIntervalRef.current);
      if (timerRef.current)        clearTimeout(timerRef.current);
    };
  }, []);

  const used     = getNetUsed(network.id, 'flip');
  const isDone   = used >= FLIP_LIMIT;
  const timeLeft = isDone ? getNetTimeLeft(network.id, 'flip') : 0;

  const doFlip = () => {
    if (phase !== 'choose' || !flipChoice) return;
    setPhase('flipping');
    setFlipFace('🌀');
    let count = 0;
    const faces = ['👑', '🔵'];

    const interval = setInterval(() => {
      setFlipFace(faces[count % 2]);
      count++;
      if (count >= 10) {
        clearInterval(interval);
        flipIntervalRef.current = null;

        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        const won    = result === flipChoice;
        setFlipFace(result === 'heads' ? '👑' : '🔵');

        incNetUsed(network.id, 'flip');
        recordGamePlay('flip').catch(() => {});
        onRefresh();

        setResultData({ result, won });
        setPhase('result');
      }
    }, 130);
    flipIntervalRef.current = interval;
  };

  // Claim coins — watch ad first
  const handleClaim = () => setClaimingAd(true);

  const handleAdComplete = async () => {
    setClaimingAd(false);
    await addCoins(15);
    setClaimed(true);
    setPhase('claimed');
  };

  const handlePlayAgain = () => {
    setFlipChoice(null);
    setResultData(null);
    setClaimed(false);
    setPhase('choose');
    setFlipFace('🪙');
  };

  const canFlip = flipChoice && phase === 'choose' && !isDone;

  return (
    <>
      <div className="gmodal-overlay"
        onClick={() => phase === 'choose' && !claimingAd && onClose()}>
        <div className="gmodal flip-gmodal" onClick={e => e.stopPropagation()}>

          {phase === 'choose' && !claimingAd && (
            <button className="gmodal-close" onClick={onClose}>✕</button>
          )}

          <div className="gmodal-title">🪙 Coin Flip</div>
          <div className="gmodal-net-badge" style={{ '--nc': network.color, '--ng': network.grad }}>
            {network.label} · {FLIP_LIMIT - used}/{FLIP_LIMIT} flips
          </div>

          {/* Coin display */}
          <div className={`flip-display ${phase === 'flipping' ? 'spinning' : ''} ${phase === 'result' || phase === 'claimed' ? 'flip-result-show' : ''}`}>
            {flipFace}
          </div>

          {/* Choose phase */}
          {(phase === 'choose' || phase === 'flipping') && (
            <>
              <div className="flip-choices">
                <button
                  className={`flip-opt ${flipChoice === 'heads' ? 'sel' : ''}`}
                  style={flipChoice === 'heads' ? { '--nc': network.color } : {}}
                  onClick={() => phase === 'choose' && setFlipChoice('heads')}
                  disabled={phase === 'flipping' || isDone}>
                  <span className="flip-opt-icon">👑</span>
                  <span>HEADS</span>
                </button>
                <div className="flip-vs">VS</div>
                <button
                  className={`flip-opt ${flipChoice === 'tails' ? 'sel' : ''}`}
                  style={flipChoice === 'tails' ? { '--nc': network.color } : {}}
                  onClick={() => phase === 'choose' && setFlipChoice('tails')}
                  disabled={phase === 'flipping' || isDone}>
                  <span className="flip-opt-icon">🔵</span>
                  <span>TAILS</span>
                </button>
              </div>

              {isDone ? (
                <div className="net-cooldown-box">
                  {timeLeft > 0
                    ? <><span>⏰</span><span>{fmtMs(timeLeft)} baad milenge</span></>
                    : <span>🔄 Ab phir se khel sakte ho!</span>}
                </div>
              ) : (
                <button
                  className="gmodal-btn"
                  style={{ background: canFlip ? network.grad : '#2a2a3a' }}
                  disabled={!canFlip}
                  onClick={doFlip}>
                  {phase === 'flipping'
                    ? '🌀 Flip ho raha hai...'
                    : !flipChoice
                    ? '👆 Pehle choose karo'
                    : '🎲 Flip Karo!'}
                </button>
              )}
            </>
          )}

          {/* Result phase */}
          {phase === 'result' && resultData && (
            <div className={`flip-result-card ${resultData.won ? 'frc-win' : 'frc-loss'}`}>
              {resultData.won ? (
                <>
                  <div className="frc-particles">
                    {['🎉','✨','🎊','⭐','🌟','🎊','✨','🎉'].map((p, i) => (
                      <span key={i} className="frc-particle"
                        style={{ '--d': `${i * 45}deg`, '--r': `${60 + (i % 3) * 15}px` }}>{p}</span>
                    ))}
                  </div>
                  <div className="frc-status win">🎊 JEET GAYE!</div>
                  <div className="frc-result-txt">{resultData.result.toUpperCase()} aaya</div>
                  <div className="frc-coins-box">
                    <span className="frc-coin-icon">🪙</span>
                    <span className="frc-coin-val">+15</span>
                    <span className="frc-coin-lbl">Coins</span>
                  </div>
                  <button className="gmodal-btn frc-claim-btn"
                    style={{ background: network.grad }}
                    onClick={handleClaim}>
                    🎬 Ad Dekho & Coins Claim Karo
                  </button>
                  {!isDone && (
                    <button className="frc-again-btn" onClick={handlePlayAgain}>
                      Dobara Khelo →
                    </button>
                  )}
                </>
              ) : (
                <>
                  <div className="frc-status loss">😅 HAAR GAYE</div>
                  <div className="frc-result-txt">{resultData.result.toUpperCase()} aaya</div>
                  <div className="frc-loss-msg">Chinta mat! Agli baar zaroor jeetoge 💪</div>
                  {!isDone ? (
                    <button className="gmodal-btn"
                      style={{ background: network.grad }}
                      onClick={handlePlayAgain}>
                      🎲 Dobara Khelo
                    </button>
                  ) : (
                    <div className="net-cooldown-box" style={{ marginTop: 12 }}>
                      {timeLeft > 0
                        ? <><span>⏰</span><span>{fmtMs(timeLeft)} baad milenge</span></>
                        : <span>🔄 Ab phir se khel sakte ho!</span>}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Claimed phase */}
          {phase === 'claimed' && (
            <div className="flip-result-card frc-claimed">
              <div className="frc-claimed-icon">✅</div>
              <div className="frc-status win">+15 Coins Mile!</div>
              <div className="frc-loss-msg">Coins wallet mein add ho gaye!</div>
              {!isDone ? (
                <button className="gmodal-btn"
                  style={{ background: network.grad, marginTop: 12 }}
                  onClick={handlePlayAgain}>
                  🎲 Dobara Khelo
                </button>
              ) : (
                <button className="gmodal-btn"
                  style={{ background: '#555', marginTop: 12 }}
                  onClick={onClose}>
                  Wapas Jao
                </button>
              )}
            </div>
          )}

        </div>
      </div>

      {claimingAd && (
        <AdWatchOverlay
          network={network}
          onComplete={handleAdComplete}
          onCancel={() => setClaimingAd(false)}
        />
      )}
    </>
  );
}
