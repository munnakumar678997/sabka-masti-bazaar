import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import BottomNav from '../components/BottomNav';
import '../styles/profile.css';

const ALL_BADGES = (balance, streak, tasksCompleted) => [
  { icon: '⭐', name: 'Starter',      desc: 'App join kiya',       earned: true               },
  { icon: '✅', name: 'First Task',   desc: 'Pehla task done',     earned: tasksCompleted >= 1 },
  { icon: '🔥', name: 'Streak Star',  desc: '3 din ki streak',     earned: streak >= 3         },
  { icon: '🌟', name: 'Week Warrior', desc: '7 din ki streak',     earned: streak >= 7         },
  { icon: '👑', name: 'Streak King',  desc: '30 din ki streak',    earned: streak >= 30        },
  { icon: '🏆', name: 'Task Hero',    desc: '10 tasks done',       earned: tasksCompleted >= 10},
  { icon: '💪', name: 'Task Master',  desc: '50 tasks done',       earned: tasksCompleted >= 50},
  { icon: '💰', name: 'Coin Saver',   desc: '100+ coins',          earned: balance >= 100      },
  { icon: '💎', name: 'Rich Bhai',    desc: '1,000+ coins',        earned: balance >= 1000     },
  { icon: '🚀', name: 'High Roller',  desc: '5,000+ coins',        earned: balance >= 5000     },
  { icon: '🌈', name: 'Legend',       desc: '20,000+ coins',       earned: balance >= 20000    },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, balance, streak, tasksCompleted, referrals, updateUserName } = useApp();

  const [showEdit,    setShowEdit]    = useState(false);
  const [editName,    setEditName]    = useState('');
  const [saving,      setSaving]      = useState(false);
  const [toast,       setToast]       = useState('');
  const [avatarError, setAvatarError] = useState(false);

  const badges      = ALL_BADGES(balance, streak, tasksCompleted);
  const earned      = badges.filter(b => b.earned).length;
  const displayName = user?.name?.trim() || user?.username || 'User';
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const photoUrl    = (!avatarError && user?.photo_url) || null;

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleSaveName = async () => {
    if (!editName.trim() || saving) return;
    setSaving(true);
    try {
      await updateUserName(editName.trim());
      showToast('✅ Naam update ho gaya!');
      setShowEdit(false);
    } catch { showToast('❌ Error! Try again.'); }
    setSaving(false);
  };


  const quickActions = [
    { icon: '🎟️', label: 'Bonus Code',    sub: 'Extra coins redeem karo',  action: () => navigate('/bonus-code'), color: '#ffd700' },
    { icon: '👥', label: 'Refer & Earn',  sub: '+50 coins per referral',    action: () => navigate('/referral'),   color: '#00d4ff' },
    { icon: '🎮', label: 'Games Hub',     sub: 'Daily coins kamao',         action: () => navigate('/games'),     color: '#a855f7' },
    { icon: '❓', label: 'FAQ / Help',    sub: 'Sawalon ke jawab',          action: () => navigate('/faq'),       color: '#22c55e' },
  ];

  return (
    <div className="profile-page">

      {/* ── TOPBAR ── */}
      <div className="profile-topbar">
        <div className="profile-topbar-title">👤 My Profile</div>
        <div style={{ width: 70 }} />
      </div>

      <div className="profile-scroll">

        {/* ── HERO CARD ── */}
        <div className="profile-hero-card">
          <div className="profile-hero-bg" />

          <div className="profile-avatar-row">
            <div className="profile-avatar-wrap">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="dp"
                  className="profile-avatar-img"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <span className="profile-avatar-letter" style={{ display: 'flex' }}>
                  {avatarLetter}
                </span>
              )}
              {/* Online dot */}
              <span className="profile-online-dot" />
            </div>

            {/* Settings gear — right of avatar */}
            <button className="profile-settings-gear"
              title="Naam Edit Karo"
              onClick={() => { setEditName(displayName); setShowEdit(true); }}>
              ⚙️
            </button>
          </div>

          <div className="profile-name">{displayName}</div>
          {user?.username && <div className="profile-handle">@{user.username}</div>}

          {/* Balance pill */}
          <div className="profile-balance-pill">
            <span className="profile-balance-pill-icon">🪙</span>
            <span className="profile-balance-pill-val">{balance.toLocaleString()}</span>
            <span className="profile-balance-pill-sep">·</span>
            <span className="profile-balance-pill-inr">₹{(balance / 100).toFixed(2)}</span>
          </div>
        </div>

        {/* ── STATS ROW ── */}
        <div className="profile-stats-row">
          {[
            { icon: '🏆', val: tasksCompleted, lbl: 'Tasks'    },
            { icon: '🔥', val: streak,          lbl: 'Streak'   },
            { icon: '👥', val: referrals,        lbl: 'Referrals'},
            { icon: '🎖️', val: `${earned}/${badges.length}`, lbl: 'Badges' },
          ].map((s, i) => (
            <div key={i} className="profile-stat-pill">
              <div className="profile-stat-pill-icon">{s.icon}</div>
              <div className="profile-stat-pill-val">{s.val}</div>
              <div className="profile-stat-pill-lbl">{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* ── ACCOUNT INFO ── */}
        <div className="profile-section-title">ℹ️ Account Info</div>
        <div className="profile-info-card">
          {[
            { label: 'Naam',        val: displayName,    icon: '👤' },
            { label: 'Telegram ID', val: user?.id || '—', icon: '🆔' },
            { label: 'Username',    val: user?.username ? `@${user.username}` : '—', icon: '📛' },
            { label: 'Mobile',      val: user?.mobile || 'Add nahi kiya', icon: '📱' },
          ].map((row, i) => (
            <div key={i} className="profile-info-row">
              <div className="profile-info-left">
                <span className="profile-info-icon">{row.icon}</span>
                <span className="profile-info-label">{row.label}</span>
              </div>
              <span className="profile-info-val">{row.val}</span>
            </div>
          ))}
        </div>

        {/* ── BADGES ── */}
        <div className="profile-section-title">
          🎖️ Badges
          <span className="profile-section-count">{earned}/{badges.length} earned</span>
        </div>
        <div className="profile-badges-grid">
          {badges.map((b, i) => (
            <div key={i} className={`profile-badge-card ${b.earned ? 'badge-earned' : 'badge-locked'}`}>
              <div className="profile-badge-icon">{b.earned ? b.icon : '🔒'}</div>
              <div className="profile-badge-name">{b.name}</div>
              <div className="profile-badge-desc">{b.desc}</div>
            </div>
          ))}
        </div>

        {/* ── QUICK ACTIONS ── */}
        <div className="profile-section-title">⚡ Quick Actions</div>
        <div className="profile-quick-actions">
          {quickActions.map((a, i) => (
            <button key={i} className="profile-qa-btn" onClick={a.action}>
              <div className="profile-qa-icon-wrap" style={{ background: `${a.color}18`, border: `1px solid ${a.color}33` }}>
                <span className="profile-qa-icon">{a.icon}</span>
              </div>
              <div className="profile-qa-text">
                <div className="profile-qa-label">{a.label}</div>
                <div className="profile-qa-sub">{a.sub}</div>
              </div>
              <span className="profile-qa-arrow">›</span>
            </button>
          ))}
        </div>

        <div style={{ height: 90 }} />
      </div>

      <BottomNav />

      {/* ── EDIT NAME MODAL ── */}
      {showEdit && (
        <div className="profile-overlay" onClick={() => setShowEdit(false)}>
          <div className="profile-modal" onClick={e => e.stopPropagation()}>
            <div className="profile-modal-title">✏️ Naam Edit Karo</div>
            <input className="profile-modal-input" value={editName}
              onChange={e => setEditName(e.target.value)}
              placeholder="Apna naam likho..." maxLength={30}
              autoFocus />
            <div className="profile-modal-btns">
              <button className="profile-modal-cancel" onClick={() => setShowEdit(false)}>Cancel</button>
              <button className="profile-modal-save" onClick={handleSaveName} disabled={saving}>
                {saving ? '⏳ Saving...' : '✅ Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="profile-toast">{toast}</div>}
    </div>
  );
}
