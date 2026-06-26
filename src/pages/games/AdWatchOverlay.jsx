import { useState, useEffect, useRef, useCallback } from 'react';

const AD_SECONDS = 5;

// ══ MONETAG ZONE IDs ══
const MONETAG_ZONE = {
  pop: 'show_11204152', // Rewarded Popup
};

function callMonetag(type) {
  return new Promise((resolve, reject) => {
    const fn = window[MONETAG_ZONE[type]];
    if (typeof fn === 'function') {
      fn(type === 'pop' ? 'pop' : 'interstitial').then(resolve).catch(reject);
    } else {
      reject(new Error('Monetag SDK not loaded'));
    }
  });
}

export default function AdWatchOverlay({ network, onComplete, onCancel }) {
  const [phase,     setPhase]     = useState('loading');
  const [countdown, setCountdown] = useState(AD_SECONDS);
  const [mgStatus,  setMgStatus]  = useState(''); // MG ke liye status text
  const doneRef = useRef(false);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setPhase('done');
    setTimeout(onComplete, 500);
  }, [onComplete]);

  useEffect(() => {
    if (network.id === 'mg') {
      // ══ MONETAG MG — Rewarded Popup ══
      setMgStatus('Ad load ho raha hai...');
      const t = setTimeout(() => {
        setPhase('watching');
        setMgStatus('Ad khul raha hai...');
        callMonetag('pop')
          .then(() => {
            setMgStatus('Ad complete! Reward mil raha hai...');
            finish();
          })
          .catch(() => {
            // Ad error ya close — fallback timer se reward do
            setMgStatus('Ad skip — reward mil raha hai...');
            finish();
          });
      }, 800);
      return () => clearTimeout(t);
    } else {
      // ══ Other networks — normal timer ══
      const t = setTimeout(() => setPhase('watching'), 800);
      return () => clearTimeout(t);
    }
  }, [network.id, finish]);

  // Timer sirf MG ke alawa baaki networks ke liye
  useEffect(() => {
    if (network.id === 'mg') return;
    if (phase !== 'watching') return;
    const id = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(id); finish(); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase, finish, network.id]);

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
            <p className="ad-status-txt">
              {network.id === 'mg' ? mgStatus || 'Ad load ho raha hai...' : 'Ad load ho raha hai...'}
            </p>
            {network.id !== 'mg' && (
              <button className="ad-cancel-btn" onClick={onCancel}>Cancel</button>
            )}
          </div>
        )}

        {phase === 'watching' && network.id === 'mg' && (
          <div className="ad-watch-body">
            <div className="ad-spinner">🔥</div>
            <p className="ad-status-txt">{mgStatus || 'Monetag Ad chal raha hai...'}</p>
            <p className="ad-status-sub">Ad dekhne ke baad reward automatic milega!</p>
          </div>
        )}

        {phase === 'watching' && network.id !== 'mg' && (
          <div className="ad-watch-body">
            <div className="ad-slot-box" id={`ad-slot-${network.id}`}>
              <div className="ad-slot-placeholder">
                <span className="ad-slot-icon">📺</span>
                <span className="ad-slot-label">Advertisement</span>
                <span className="ad-slot-net">{network.label} Network</span>
              </div>
            </div>

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
