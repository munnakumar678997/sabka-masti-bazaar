import { useEffect, useRef, useCallback } from 'react';

const MONETAG_ZONE = { pop: 'show_11204152' };

function callMonetag(type) {
  return new Promise((resolve) => {
    const fn = window[MONETAG_ZONE[type]];
    if (typeof fn === 'function') {
      const timer = setTimeout(() => resolve('timeout'), 6000);
      fn(type === 'pop' ? 'pop' : 'interstitial')
        .then(() => { clearTimeout(timer); resolve('done'); })
        .catch(() => { clearTimeout(timer); resolve('skip'); });
    } else {
      setTimeout(() => resolve('no-sdk'), 800);
    }
  });
}

export default function AdWatchOverlay({ network, onComplete, onCancel }) {
  const doneRef = useRef(false);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    if (network.id === 'mg') {
      callMonetag('pop').then(() => finish());
    } else {
      const id = setTimeout(() => finish(), 5000);
      return () => clearTimeout(id);
    }
  }, [network.id, finish]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.5)',
    }}>
      <div id={`ad-slot-${network.id}`} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
