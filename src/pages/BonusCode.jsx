import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import '../styles/bonusCode.css';

/* ── Valid Bonus Codes ─────────────────────────────────────────
   Format: code → { coins, desc }
   Codes case-insensitive hain — .toUpperCase() se match hoga
──────────────────────────────────────────────────────────────── */
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

/* ── Used codes localStorage key ── */
const usedCodesKey = (userId) => `smb_codes_${userId}`;

function getUsedCodes(userId) {
  if (!userId) return [];
  try { return JSON.parse(localStorage.getItem(usedCodesKey(userId)) || '[]'); }
  catch { return []; }
}

function markCodeUsed(userId, code) {
  if (!userId) return;
  const used = getUsedCodes(userId);
  used.push(code);
  localStorage.setItem(usedCodesKey(userId), JSON.stringify(used));
}

export default function BonusCode() {
  const navigate  = useNavigate();
  const { user, addCoins } = useApp();

  const [code,    setCode]    = useState('');
  const [status,  setStatus]  = useState(null);   // null | 'success' | 'error'
  const [msg,     setMsg]     = useState('');
  const [reward,  setReward]  = useState(null);
  const [loading, setLoading] = useState(false);

  const usedCodes = getUsedCodes(user?.id);

  /* ── Recent redeemed history (last 5) ── */
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`smb_code_history_${user?.id}`) || '[]'); }
    catch { return []; }
  });

  const saveHistory = (entry) => {
    const updated = [entry, ...history].slice(0, 10);
    setHistory(updated);
    localStorage.setItem(`smb_code_history_${user?.id}`, JSON.stringify(updated));
  };

  const handleRedeem = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setStatus('error'); setMsg('⚠️ Pehle code likho!'); return;
    }

    setLoading(true);
    setStatus(null);

    await new Promise(r => setTimeout(r, 800));

    if (!VALID_CODES[trimmed]) {
      setStatus('error');
      setMsg('❌ Galat code! Dobara check karo.');
      setLoading(false);
      return;
    }

    if (usedCodes.includes(trimmed)) {
      setStatus('error');
      setMsg('⚠️ Yeh code pehle hi use ho chuka hai!');
      setLoading(false);
      return;
    }

    const { coins, desc } = VALID_CODES[trimmed];
    await addCoins(coins);
    markCodeUsed(user?.id, trimmed);
    saveHistory({ code: trimmed, coins, desc, date: new Date().toLocaleDateString('en-IN') });

    setReward({ coins, desc });
    setStatus('success');
    setMsg(`🎉 ${desc} — +${coins} coins mile!`);
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

        {/* ── HERO ── */}
        <div className="bc-hero">
          <div className="bc-hero-icon">🎟️</div>
          <div className="bc-hero-title">Bonus Code Daalo</div>
          <div className="bc-hero-sub">Special codes se extra coins kamao!</div>
        </div>

        {/* ── INPUT BOX ── */}
        <div className="bc-card">
          <div className="bc-card-label">Code Yahan Likho</div>
          <div className="bc-input-row">
            <input
              className="bc-input"
              value={code}
              onChange={e => { setCode(e.target.value); setStatus(null); }}
              placeholder="e.g. MASTI50"
              maxLength={20}
              onKeyDown={e => e.key === 'Enter' && handleRedeem()}
              autoCapitalize="characters"
            />
            <button
              className={`bc-redeem-btn ${loading ? 'loading' : ''}`}
              onClick={handleRedeem}
              disabled={loading}
            >
              {loading ? '⏳' : '✅ Redeem'}
            </button>
          </div>

          {/* Status message */}
          {status && (
            <div className={`bc-status ${status}`}>
              {msg}
            </div>
          )}
        </div>

        {/* ── SUCCESS CARD ── */}
        {status === 'success' && reward && (
          <div className="bc-success-card">
            <div className="bc-success-burst">🎉</div>
            <div className="bc-success-amount">+{reward.coins} Coins</div>
            <div className="bc-success-label">{reward.desc}</div>
            <div className="bc-success-hint">Wallet mein add ho gaye!</div>
          </div>
        )}

        {/* ── HOW TO GET CODES ── */}
        <div className="bc-section-title">📢 Code Kahan Se Milega?</div>
        <div className="bc-tips-card">
          {[
            { icon: '📱', text: 'Telegram channel pe join karo — @SabkaMastiBazaar' },
            { icon: '👥', text: 'Friends ko refer karo — special codes milenge' },
            { icon: '🎮', text: 'Games mein top karo — bonus codes reward mein' },
            { icon: '🎉', text: 'Festival days pe special codes announce hote hain' },
          ].map((tip, i) => (
            <div key={i} className="bc-tip-row">
              <span className="bc-tip-icon">{tip.icon}</span>
              <span className="bc-tip-text">{tip.text}</span>
            </div>
          ))}
        </div>

        {/* ── REDEMPTION HISTORY ── */}
        {history.length > 0 && (
          <>
            <div className="bc-section-title">📋 Redeem History</div>
            <div className="bc-history-list">
              {history.map((h, i) => (
                <div key={i} className="bc-history-row">
                  <div className="bc-history-left">
                    <div className="bc-history-code">{h.code}</div>
                    <div className="bc-history-desc">{h.desc}</div>
                  </div>
                  <div className="bc-history-right">
                    <div className="bc-history-coins">+{h.coins} 🪙</div>
                    <div className="bc-history-date">{h.date}</div>
                  </div>
                </div>
              ))}
            </div>
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
