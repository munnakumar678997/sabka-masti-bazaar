import { useState, useEffect, useRef, useCallback } from 'react';

const AD_SECONDS = 5;

export default function AdWatchOverlay({ network, onComplete, onCancel }) {
  const [phase,     setPhase]     = useState('loading');
  const [countdown, setCountdown] = useState(AD_SECONDS);
  const doneRef = useRef(false);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setPhase('done');
    setTimeout(onComplete, 500);
  }, [onComplete]);

  useEffect(() => {
    const t = setTimeout(() => setPhase('watching'), 800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== 'watching') return;
    const id = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(id); finish(); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase, finish]);

  return (
    <div className="ad-watch-overlay">
      <div className="ad-watch-card">

        <div className="ad-watch-header" style={{ background: network.grad }}>
          <span className="ad-watch-net-lbl">{network.label}</span>
          <span className="ad-watch-net-txt">Ad Playing</span>
        </div>

        {phase === 'loading' && (
          <div className="ad-watch-body">
            <div className="ad-spinner">⏳</div>
            <p className="ad-status-txt">Ad load ho raha hai...</p>
            <button className="ad-cancel-btn" onClick={onCancel}>Cancel</button>
          </div>
        )}

        {phase === 'watching' && (
          <div className="ad-watch-body">
            {/* ══ AD SLOT ══ Real ad script yahaan replace karna ══ */}
            <div className="ad-slot-box" id={`ad-slot-${network.id}`}>
              <div className="ad-slot-placeholder">
                <span className="ad-slot-icon">📺</span>
                <span className="ad-slot-label">Advertisement</span>
                <span className="ad-slot-net">{network.label} Network</span>
              </div>
            </div>
            {/* ══ AD SLOT END ══ */}

            <div className="ad-timer-row">
              <div className="ad-timer-circle" style={{ '--nc': network.color }}>
                <span>{countdown}</span>
              </div>
              <span className="ad-timer-txt">seconds mein reward milega</span>
            </div>
          </div>
        )}

        {phase === 'done' && (
          <div className="ad-watch-body">
            <div className="ad-done-icon">✅</div>
            <p className="ad-status-txt">Ad dekh li! Reward aa raha hai...</p>
          </div>
        )}

      </div>
    </div>
  );
}
