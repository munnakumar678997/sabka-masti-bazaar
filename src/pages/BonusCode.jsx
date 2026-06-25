import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import '../styles/bonusCode.css';

const historyKey = (uid) => uid ? `smb_code_history_${uid}` : null;

const CODE_SOURCES = [
  {
    icon: '📢',
    title: 'Telegram Channel',
    sub: 'Roz codes announce hote hain',
    handle: '@SabkaMastiBazaar',
    color: '#0088cc',
    bg: 'rgba(0,136,204,0.12)',
    border: 'rgba(0,136,204,0.25)',
  },
  {
    icon: '🎉',
    title: 'Festival & Events',
    sub: 'Diwali, Holi, EID special codes',
    handle: 'Festivals pe',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.12)',
    border: 'rgba(249,115,22,0.25)',
  },
  {
    icon: '👑',
    title: 'Top Players',
    sub: 'Games mein top rank aao',
    handle: 'Leaderboard winners',
    color: '#ffd700',
    bg: 'rgba(255,215,0,0.12)',
    border: 'rgba(255,215,0,0.25)',
  },
  {
    icon: '🎁',
    title: 'Special Giveaway',
    sub: 'Admin khud deta hai active users ko',
    handle: 'Loyal users ke liye',
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.12)',
    border: 'rgba(168,85,247,0.25)',
  },
];

const REWARD_TIERS = [
  { range: '25–75',  label: 'Mini Reward',   color: '#22c55e', icon: '🌱' },
  { range: '100–200', label: 'Medium Bonus',  color: '#0088cc', icon: '⚡' },
  { range: '300–500', label: 'Big Jackpot',   color: '#ffd700', icon: '🏆' },
];

export default function BonusCode() {
  const navigate     = useNavigate();
  const { user, redeemBonusCode } = useApp();
  const redeemingRef = useRef(false);

  const [code,    setCode]    = useState('');
  const [status,  setStatus]  = useState(null);
  const [msg,     setMsg]     = useState('');
  const [reward,  setReward]  = useState(null);
  const [loading, setLoading] = useState(false);

  const [history, setHistory] = useState(() => {
    const key = historyKey(user?.id);
    if (!key) return [];
    try { return JSON.parse(localStorage.getItem(key) || '[]'); }
    catch { return []; }
  });

  const saveHistory = (entry) => {
    const updated = [entry, ...history].slice(0, 10);
    setHistory(updated);
    const key = historyKey(user?.id);
    if (key) localStorage.setItem(key, JSON.stringify(updated));
  };

  const handleRedeem = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { setStatus('error'); setMsg('⚠️ Pehle code daalo!'); return; }
    if (redeemingRef.current) return;
    redeemingRef.current = true;
    setLoading(true);
    setStatus(null);
    setReward(null);
    try {
      const { coins, desc } = await redeemBonusCode(trimmed);
      saveHistory({ code: trimmed, coins, desc, date: new Date().toLocaleDateString('en-IN') });
      setReward({ coins, desc });
      setStatus('success');
      setMsg('');
      setCode('');
    } catch (err) {
      const errCode = err?.message || '';
      if (errCode === 'ALREADY_USED')  { setStatus('error'); setMsg('⚠️ Yeh code pehle hi use ho chuka hai!'); }
      else if (errCode === 'INVALID_CODE') { setStatus('error'); setMsg('❌ Galat code! Dobara check karo.'); }
      else if (errCode === 'NOT_LOGGED_IN') { setStatus('error'); setMsg('⚠️ Pehle login karo!'); }
      else { setStatus('error'); setMsg('❌ Server error! Thodi der mein dobara try karo.'); }
    }
    redeemingRef.current = false;
    setLoading(false);
  };

  return (
    <div className="bc-page">

      {/* ── TOPBAR ── */}
      <div className="bc-topbar">
        <button className="bc-back" onClick={() => navigate(-1)}>← Back</button>
        <div className="bc-topbar-title">🎟️ Bonus Code</div>
        <div style={{ width: 60 }} />
      </div>

      <div className="bc-scroll">

        {/* ══ SUCCESS STATE ══ */}
        {status === 'success' && reward ? (
          <div className="bc-success-full">
            <div className="bc-confetti-wrap">
              {['🎉','✨','🌟','💫','🎊','⭐','🎉','✨'].map((p, i) => (
                <span key={i} className="bc-confetti-piece" style={{ '--i': i }}>{p}</span>
              ))}
            </div>
            <div className="bc-success-ring">
              <div className="bc-success-inner">
                <div className="bc-success-emoji">🎟️</div>
                <div className="bc-success-plus">+</div>
                <div className="bc-success-coins">{reward.coins}</div>
                <div className="bc-success-unit">Coins</div>
              </div>
            </div>
            <div className="bc-success-title">Wah! Code Redeem Ho Gaya!</div>
            <div className="bc-success-desc">{reward.desc}</div>
            <div className="bc-success-wallet-row">
              <span className="bc-success-wallet-icon">🪙</span>
              <span className="bc-success-wallet-text">Wallet mein add ho gaye!</span>
            </div>
            <button className="bc-try-again-btn" onClick={() => { setStatus(null); setReward(null); }}>
              🎟️ Aur Code Try Karo
            </button>
          </div>

        ) : (
          <>

            {/* ══ HERO ══ */}
            <div className="bc-hero">
              <div className="bc-hero-glow" />
              <div className="bc-hero-icon-wrap">
                <span className="bc-hero-icon">🎟️</span>
                <div className="bc-hero-icon-ring" />
              </div>
              <div className="bc-hero-title">Bonus Code Daalo</div>
              <div className="bc-hero-sub">Special codes se coins kamao — instantly!</div>

              {/* Reward tiers */}
              <div className="bc-tiers-row">
                {REWARD_TIERS.map((t, i) => (
                  <div key={i} className="bc-tier-chip"
                    style={{ background: `${t.color}15`, border: `1px solid ${t.color}35`, color: t.color }}>
                    <span>{t.icon}</span>
                    <div>
                      <div className="bc-tier-range">🪙 {t.range}</div>
                      <div className="bc-tier-label">{t.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ══ INPUT CARD ══ */}
            <div className={`bc-input-card ${status === 'error' ? 'bc-input-card-error' : ''}`}>
              <div className="bc-input-card-label">
                <span className="bc-input-card-dot" />
                CODE YAHAN DAALO
              </div>

              <div className="bc-input-wrap">
                <span className="bc-input-prefix">🔑</span>
                <input
                  className={`bc-input ${status === 'error' ? 'bc-input-error' : ''}`}
                  value={code}
                  onChange={e => { setCode(e.target.value.toUpperCase()); setStatus(null); }}
                  placeholder="e.g. MASTI50"
                  maxLength={20}
                  onKeyDown={e => e.key === 'Enter' && handleRedeem()}
                  autoCapitalize="characters"
                />
                {code.length > 0 && (
                  <button className="bc-input-clear" onClick={() => { setCode(''); setStatus(null); }}>✕</button>
                )}
              </div>

              {status === 'error' && (
                <div className="bc-error-msg">
                  <span>{msg}</span>
                </div>
              )}

              <button
                className={`bc-redeem-btn ${loading ? 'bc-loading' : ''} ${code.length === 0 ? 'bc-btn-dim' : ''}`}
                onClick={handleRedeem}
                disabled={loading || code.length === 0}
              >
                <span className="bc-btn-shimmer" />
                {loading
                  ? <><span className="bc-spin">⏳</span> Verify ho raha hai...</>
                  : <><span>✅</span> Redeem Karo</>}
              </button>

              <div className="bc-input-note">
                💡 Code case-insensitive hai — MASTI50 = masti50
              </div>
            </div>

            {/* ══ CODE KAHAN SE MILEGA ══ */}
            <div className="bc-section-hdr">
              <div className="bc-section-line" />
              <div className="bc-section-text">📢 Code Kahan Se Milega?</div>
              <div className="bc-section-line" />
            </div>

            <div className="bc-sources-list">
              {CODE_SOURCES.map((s, i) => (
                <div key={i} className="bc-source-row"
                  style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                  <div className="bc-source-icon-wrap" style={{ color: s.color }}>
                    {s.icon}
                  </div>
                  <div className="bc-source-info">
                    <div className="bc-source-title" style={{ color: s.color }}>{s.title}</div>
                    <div className="bc-source-sub">{s.sub}</div>
                  </div>
                  <div className="bc-source-handle"
                    style={{ color: s.color, background: `${s.color}15`, border: `1px solid ${s.color}30` }}>
                    {s.handle}
                  </div>
                </div>
              ))}
            </div>

            {/* ══ HISTORY ══ */}
            {history.length > 0 && (
              <>
                <div className="bc-section-hdr">
                  <div className="bc-section-line" />
                  <div className="bc-section-text">📋 Redeem History</div>
                  <div className="bc-section-line" />
                </div>
                <div className="bc-history-card">
                  {history.map((h, i) => (
                    <div key={i} className="bc-history-row">
                      <div className="bc-history-num" style={{ animationDelay: `${i * 0.05}s` }}>
                        <span className="bc-hist-coin">🪙</span>
                        <span className="bc-hist-val">+{h.coins}</span>
                      </div>
                      <div className="bc-history-info">
                        <div className="bc-history-code">{h.code}</div>
                        <div className="bc-history-desc">{h.desc} · {h.date}</div>
                      </div>
                      <div className="bc-history-check">✅</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div style={{ height: 40 }} />
          </>
        )}

      </div>
    </div>
  );
}
