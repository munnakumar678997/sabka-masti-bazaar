import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import '../styles/bonusCode.css';

const VALID_CODES = {
  'MASTI50':    { coins: 50,   desc: 'Masti Bonus'        },
  'WELCOME100': { coins: 100,  desc: 'Welcome Special'    },
  'SABKA200':   { coins: 200,  desc: 'Sabka Bazaar Bonus' },
  'LUCKY25':    { coins: 25,   desc: 'Lucky Coins'        },
  'DIWALI500':  { coins: 500,  desc: 'Diwali Special 🪔'  },
  'EARN75':     { coins: 75,   desc: 'Earning Reward'     },
  'BONUS150':   { coins: 150,  desc: 'Special Bonus'      },
  'SUPER300':   { coins: 300,  desc: 'Super Reward'       },
};

const historyKey = (uid) => uid ? `smb_code_history_${uid}` : null;

export default function BonusCode() {
  const navigate = useNavigate();
  const { user, addCoins, redeemedCodes, markCodeRedeemed } = useApp();

  const [code,    setCode]    = useState('');
  const [status,  setStatus]  = useState(null);
  const [msg,     setMsg]     = useState('');
  const [reward,  setReward]  = useState(null);
  const [loading, setLoading] = useState(false);

  // history sirf local — sirf display ke liye, anti-cheat Firestore mein hai
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

    setLoading(true);
    setStatus(null);
    setReward(null);

    await new Promise(r => setTimeout(r, 700));

    if (!VALID_CODES[trimmed]) {
      setStatus('error'); setMsg('❌ Galat code! Dobara check karo.');
      setLoading(false); return;
    }

    // Firestore-backed check — device change pe bhi safe
    if (redeemedCodes.includes(trimmed)) {
      setStatus('error'); setMsg('⚠️ Yeh code pehle hi use ho chuka hai!');
      setLoading(false); return;
    }

    const { coins, desc } = VALID_CODES[trimmed];
    // Pehle Firestore mein mark karo, phir coins do
    await markCodeRedeemed(trimmed);
    await addCoins(coins);
    saveHistory({ code: trimmed, coins, desc, date: new Date().toLocaleDateString('en-IN') });

    setReward({ coins, desc });
    setStatus('success');
    setMsg('');
    setCode('');
    setLoading(false);
  };

  const navTabs = [
    { key: 'home',    icon: '🏠', label: 'Home',    path: '/home'    },
    { key: 'games',   icon: '🎮', label: 'Games',   path: '/games'   },
    { key: 'store',   icon: '🛒', label: 'Store',   path: '/store'   },
    { key: 'wallet',  icon: '💰', label: 'Wallet',  path: '/wallet'  },
    { key: 'profile', icon: '👤', label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="bc-page">

      {/* ── TOPBAR ── */}
      <div className="bc-topbar">
        <button className="bc-back" onClick={() => navigate(-1)}>← Back</button>
        <div className="bc-topbar-title">🎟️ Bonus Code</div>
        <div style={{ width: 60 }} />
      </div>

      <div className="bc-scroll">

        {/* ── SUCCESS STATE ── */}
        {status === 'success' && reward ? (
          <div className="bc-success-full">
            <div className="bc-success-ring">
              <div className="bc-success-inner">
                <div className="bc-success-emoji">🎉</div>
                <div className="bc-success-coins">+{reward.coins}</div>
                <div className="bc-success-unit">Coins</div>
              </div>
            </div>
            <div className="bc-success-desc">{reward.desc}</div>
            <div className="bc-success-hint">Wallet mein add ho gaye!</div>
            <button className="bc-try-again-btn" onClick={() => { setStatus(null); setReward(null); }}>
              🎟️ Aur Code Try Karo
            </button>
          </div>
        ) : (

          <>
            {/* ── HEADER ── */}
            <div className="bc-header">
              <div className="bc-header-icon">🎟️</div>
              <div className="bc-header-title">Bonus Code Daalo</div>
              <div className="bc-header-sub">Special codes se extra coins kamao instantly!</div>
            </div>

            {/* ── INPUT SECTION ── */}
            <div className="bc-input-card">
              <div className="bc-input-label">Code Yahan Daalo</div>
              <input
                className={`bc-input ${status === 'error' ? 'bc-input-error' : ''}`}
                value={code}
                onChange={e => { setCode(e.target.value); setStatus(null); }}
                placeholder="e.g. MASTI50"
                maxLength={20}
                onKeyDown={e => e.key === 'Enter' && handleRedeem()}
                autoCapitalize="characters"
              />
              {status === 'error' && (
                <div className="bc-error-msg">{msg}</div>
              )}
              <button
                className={`bc-redeem-btn ${loading ? 'bc-loading' : ''}`}
                onClick={handleRedeem}
                disabled={loading}
              >
                {loading ? (
                  <span className="bc-spinner">⏳ Checking...</span>
                ) : (
                  '✅ Redeem Karo'
                )}
              </button>
            </div>

            {/* ── WHERE TO GET CODES ── */}
            <div className="bc-section-title">📢 Code Kahan Se Milega?</div>
            <div className="bc-sources-grid">
              {[
                { icon: '📱', title: 'Telegram Channel',  sub: 'Join @SabkaMastiBazaar' },
                { icon: '👥', title: 'Referral Bonus',    sub: 'Dost ko invite karo'     },
                { icon: '🎮', title: 'Games Top Rank',    sub: 'Top players ko code'     },
                { icon: '🎉', title: 'Festival Special',  sub: 'Events pe announce hote' },
              ].map((s, i) => (
                <div key={i} className="bc-source-card">
                  <div className="bc-source-icon">{s.icon}</div>
                  <div className="bc-source-title">{s.title}</div>
                  <div className="bc-source-sub">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* ── HISTORY ── */}
            {history.length > 0 && (
              <>
                <div className="bc-section-title">📋 Redeem History</div>
                <div className="bc-history-card">
                  {history.map((h, i) => (
                    <div key={i} className="bc-history-row">
                      <div className="bc-history-badge">{h.coins}</div>
                      <div className="bc-history-info">
                        <div className="bc-history-code">{h.code}</div>
                        <div className="bc-history-desc">{h.desc} · {h.date}</div>
                      </div>
                      <div className="bc-history-coins">+{h.coins} 🪙</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        <div style={{ height: 90 }} />
      </div>

      {/* ── BOTTOM NAV ── */}
      <div className="bc-bottom-nav">
        {navTabs.map(tab => (
          <button key={tab.key} className="bc-nav-tab"
            onClick={() => navigate(tab.path)}>
            <span>{tab.icon}</span>
            <span className="bc-nav-label">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
