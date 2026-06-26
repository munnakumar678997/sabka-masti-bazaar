import { useState, useEffect, useRef, useCallback } from 'react';

const MONETAG_TIMEOUT_MS = 4000; // 4s mein response nahi aaya toh auto-complete

const MONETAG_ZONE = {
  pop: 'show_11204152',
};

function callMonetag(type) {
  return new Promise((resolve, reject) => {
    const fn = window[MONETAG_ZONE[type]];
    if (typeof fn === 'function') {
      const timer = setTimeout(() => resolve('timeout'), MONETAG_TIMEOUT_MS);
      fn(type === 'pop' ? 'pop' : 'interstitial')
        .then(() => { clearTimeout(timer); resolve('done'); })
        .catch(() => { clearTimeout(timer); resolve('skip'); });
    } else {
      setTimeout(() => resolve('no-sdk'), 800);
    }
  });
}

export default function AdWatchOverlay({ network, onComplete, onCancel }) {
  const [phase,    setPhase]    = useState('loading');
  const [dots,     setDots]     = useState('');
  const [countdown,setCountdown]= useState(5);
  const doneRef = useRef(false);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setPhase('done');
    setTimeout(onComplete, 600);
  }, [onComplete]);

  // Animated dots for loading
  useEffect(() => {
    const id = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (network.id === 'mg') {
      // Monetag Rewarded Popup
      const t = setTimeout(() => {
        setPhase('watching');
        callMonetag('pop').then(() => finish());
      }, 600);
      return () => clearTimeout(t);
    } else {
      // Other networks — 5s countdown timer (placeholder)
      const t = setTimeout(() => setPhase('watching'), 600);
      return () => clearTimeout(t);
    }
  }, [network.id, finish]);

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

  const pct = network.id === 'mg' ? null : Math.round(((5 - countdown) / 5) * 100);

  return (
    <div className="adw-backdrop">
      <div className="adw-card">

        {/* Header */}
        <div className="adw-header" style={{ background: network.grad }}>
          <span className="adw-net-pill">{network.label}</span>
          <span className="adw-header-txt">
            {phase === 'done' ? '✅ Complete!' : '📺 Ad Playing'}
          </span>
        </div>

        {/* Body */}
        <div className="adw-body">

          {phase === 'loading' && (
            <div className="adw-loading-state">
              <div className="adw-pulse-ring" style={{ '--nc': network.color }} />
              <div className="adw-load-icon">📺</div>
              <p className="adw-txt-main">Ad load ho rahi hai{dots}</p>
              <p className="adw-txt-sub">Thoda wait karo, reward pakka milega!</p>
              {network.id !== 'mg' && (
                <button className="adw-cancel-btn" onClick={onCancel}>Baad mein</button>
              )}
            </div>
          )}

          {phase === 'watching' && network.id === 'mg' && (
            <div className="adw-watching-mg">
              <div className="adw-fire-icon">🔥</div>
              <p className="adw-txt-main">Monetag Ad chal rahi hai{dots}</p>
              <p className="adw-txt-sub">Ad dekhne ke baad reward automatic milega!</p>
              <div className="adw-mg-bar">
                <div className="adw-mg-bar-fill" style={{ background: network.grad }} />
              </div>
            </div>
          )}

          {phase === 'watching' && network.id !== 'mg' && (
            <div className="adw-watching-timer">
              {/* Ad slot placeholder for other networks */}
              <div className="adw-slot-box" id={`ad-slot-${network.id}`}>
                <span className="adw-slot-icon">📺</span>
                <span className="adw-slot-net">{network.label} Network</span>
              </div>

              {/* Progress circle */}
              <div className="adw-timer-wrap">
                <svg className="adw-ring-svg" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5"/>
                  <circle cx="32" cy="32" r="28" fill="none"
                    stroke={network.color} strokeWidth="5"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - pct / 100)}`}
                    strokeLinecap="round"
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.9s linear' }}
                  />
                  <text x="32" y="37" textAnchor="middle" fontSize="16" fontWeight="900" fill="#fff">{countdown}</text>
                </svg>
                <p className="adw-timer-lbl">seconds baad reward milega</p>
              </div>
            </div>
          )}

          {phase === 'done' && (
            <div className="adw-done-state">
              <div className="adw-done-icon">🎉</div>
              <p className="adw-txt-main">Ad complete!</p>
              <p className="adw-txt-sub">Reward aa raha hai...</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
