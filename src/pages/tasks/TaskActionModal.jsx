import { useState, useEffect, useRef, useCallback } from 'react';
import '../../styles/tasks.css';

/*
 * ═══════════════════════════════════════════════════════════
 *  TaskActionModal — Ad-Gated Task Reward System
 *
 *  PHASES:
 *   ad_loading → ad_shown → waiting → ready
 *                         (timer starts only after ad loads)
 *
 *  Real ad integration:
 *   Apne ad network script ke loaded/impression callback mein:
 *     window.smbTaskAdLoaded && window.smbTaskAdLoaded();
 *   Call karo — tab timer automatically start hoga.
 * ═══════════════════════════════════════════════════════════
 */

const AD_LOAD_TIMEOUT_MS = 8000; // 8s ke baad fallback

export default function TaskActionModal({ task, onClaim, onClose, referralLink }) {
  const [phase,   setPhase]   = useState('ad_loading'); // ad_loading | ad_shown | action | waiting | ready | ad_failed
  const [seconds, setSeconds] = useState(task.waitSec || 0);
  const [copied,  setCopied]  = useState(false);
  const [loadingDots, setLoadingDots] = useState('');

  const timerRef      = useRef(null);
  const adTimeoutRef  = useRef(null);
  const dotTimerRef   = useRef(null);
  const adLoadedRef   = useRef(false);

  // ── Cleanup ────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearTimeout(adTimeoutRef.current);
      clearInterval(dotTimerRef.current);
      delete window.smbTaskAdLoaded;
    };
  }, []);

  // ── Animated dots for loading text ─────────────────────
  useEffect(() => {
    if (phase !== 'ad_loading') return;
    dotTimerRef.current = setInterval(() => {
      setLoadingDots(d => d.length >= 3 ? '' : d + '.');
    }, 500);
    return () => clearInterval(dotTimerRef.current);
  }, [phase]);

  // ── Start countdown timer ───────────────────────────────
  const startTimer = useCallback(() => {
    setPhase('waiting');
    setSeconds(task.waitSec);
    timerRef.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          setPhase('ready');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, [task.waitSec]);

  // ── When ad loads → move to next phase ─────────────────
  const onAdLoaded = useCallback(() => {
    if (adLoadedRef.current) return;
    adLoadedRef.current = true;
    clearTimeout(adTimeoutRef.current);

    // Video task: ad loaded → timer directly start
    // Install/Survey task: ad loaded → show action button
    if (task.action === 'video') {
      startTimer();
    } else if (task.action === 'install' || task.action === 'survey') {
      setPhase('action');
    } else {
      setPhase('action');
    }
  }, [task.action, startTimer]);

  // ── Register global callback for ad networks ───────────
  useEffect(() => {
    window.smbTaskAdLoaded = onAdLoaded;

    // Timeout: agar real ad nahi aaya toh fallback
    adTimeoutRef.current = setTimeout(() => {
      if (!adLoadedRef.current) {
        setPhase('ad_failed');
      }
    }, AD_LOAD_TIMEOUT_MS);
  }, [onAdLoaded]);

  // ── Handle action buttons ───────────────────────────────
  const handleActionBtn = () => {
    if (task.action === 'install' || task.action === 'survey' || task.action === 'visit') {
      window.open(task.link, '_blank');
      setTimeout(() => startTimer(), 600);
    } else if (task.action === 'share') {
      const shareText = `Sabka Masti Bazaar pe aao aur coins kamao! 🎮🪙\n${referralLink}`;
      if (navigator.share) {
        navigator.share({ title: 'Sabka Masti Bazaar', text: shareText, url: referralLink })
          .then(() => setPhase('ready'))
          .catch(() => {
            navigator.clipboard?.writeText(shareText).catch(() => {});
            setCopied(true);
            setPhase('ready');
          });
      } else {
        navigator.clipboard?.writeText(shareText).catch(() => {});
        setCopied(true);
        setPhase('ready');
      }
    }
  };

  // ── Progress % for timer ring ───────────────────────────
  const pct  = task.waitSec ? Math.round(((task.waitSec - seconds) / task.waitSec) * 100) : 0;
  const r    = 38;
  const circ = 2 * Math.PI * r;

  return (
    <div className="tmodal-overlay" onClick={onClose}>
      <div className="tmodal-box" onClick={e => e.stopPropagation()}>

        <button className="tmodal-close" onClick={onClose}>✕</button>

        {/* ── Task identity ── */}
        <div className="tmodal-icon">{task.icon}</div>
        <div className="tmodal-title">{task.actionTitle}</div>
        <div className="tmodal-desc">{task.actionDesc}</div>

        {/* ══ AD SLOT — Real ad script yahaan inject hoga ══
            Ad network ke callback mein:
              window.smbTaskAdLoaded && window.smbTaskAdLoaded();
            Call karo jab ad visible ho.
        */}
        <div className="tmodal-ad-slot" id="task-ad-slot">
          {/* Ad network (Monetag / PropellerAds / Adsterra / Ezoic)
              apna script/iframe yahaan inject karega */}
        </div>

        {/* ── PHASE: Ad loading spinner ── */}
        {phase === 'ad_loading' && (
          <div className="tmodal-ad-loading">
            <div className="tmodal-spinner" />
            <div className="tmodal-loading-txt">Ad load ho raha hai{loadingDots}</div>
            <div className="tmodal-loading-sub">Ek second ruko — phir timer shuru hoga</div>
          </div>
        )}

        {/* ── PHASE: Ad failed to load ── */}
        {phase === 'ad_failed' && (
          <div className="tmodal-ad-failed">
            <div className="tmodal-failed-icon">📡</div>
            <div className="tmodal-failed-txt">Ad load nahi hua</div>
            <div className="tmodal-failed-sub">Internet check karo ya thodi der baad try karo</div>
            <button className="tmodal-retry-btn" onClick={onClose}>🔄 Wapas Jao</button>
          </div>
        )}

        {/* ── PHASE: Action button (install/survey/visit after ad loads) ── */}
        {phase === 'action' && (task.action === 'install' || task.action === 'survey' || task.action === 'visit') && (
          <div className="tmodal-action-area">
            <div className="tmodal-ad-done-note">✅ Ad load ho gaya!</div>
            <button className="tmodal-action-btn" onClick={handleActionBtn}>
              {task.action === 'install' ? '📲 App Kholo & Install Karo'
               : task.action === 'survey' ? '📝 Survey Kholo & Bharo'
               : `${task.icon} ${task.title} — Kholo`}
            </button>
          </div>
        )}

        {/* ── PHASE: Share action ── */}
        {phase === 'action' && task.action === 'share' && (
          <div className="tmodal-action-area">
            <button className="tmodal-action-btn share" onClick={handleActionBtn}>
              🔗 Link Share / Copy Karo
            </button>
          </div>
        )}

        {/* ── PHASE: Timer countdown ring ── */}
        {phase === 'waiting' && (
          <div className="tmodal-timer-wrap">
            <svg width="96" height="96" viewBox="0 0 96 96" className="tmodal-timer-svg">
              <circle cx="48" cy="48" r={r} fill="none"
                stroke="rgba(255,255,255,0.07)" strokeWidth="7" />
              <circle cx="48" cy="48" r={r} fill="none"
                stroke="url(#tmg)" strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - pct / 100)}
                transform="rotate(-90 48 48)"
              />
              <defs>
                <linearGradient id="tmg" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ff6a00" />
                  <stop offset="100%" stopColor="#ee0979" />
                </linearGradient>
              </defs>
            </svg>
            <div className="tmodal-timer-center">
              <span className="tmodal-timer-num">{seconds}</span>
              <span className="tmodal-timer-unit">sec</span>
            </div>
            <div className="tmodal-timer-hint">
              {task.action === 'video' ? '🎬 Ad dekho...' : '⏳ Wait karo...'}
            </div>
          </div>
        )}

        {/* ── PHASE: Claim ready ── */}
        {phase === 'ready' && (
          <div className="tmodal-claim-area">
            {copied && (
              <div className="tmodal-copied-note">✅ Link clipboard mein copy ho gaya!</div>
            )}
            <div className="tmodal-success-icon">🎉</div>
            <button className="tmodal-claim-btn" onClick={onClaim}>
              Claim +{task.coins} 🪙 Coins
            </button>
          </div>
        )}

        {/* ── Reward info (always visible) ── */}
        {phase !== 'ad_failed' && (
          <div className="tmodal-reward-row">
            <span className="tmodal-reward-lbl">🎁 Reward</span>
            <span className="tmodal-reward-val">+{task.coins} 🪙</span>
          </div>
        )}

      </div>
    </div>
  );
}
