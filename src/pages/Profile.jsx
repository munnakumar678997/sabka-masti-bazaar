import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import BottomNav from '../components/BottomNav';
import '../styles/profile.css';

// level: 1=Beginner, 2=Growing, 3=Committed, 4=Elite
const ALL_BADGES = (balance, streak, tasksCompleted, referrals, totalCheckins, redeemedCount) => [

  /* ── LEVEL 1 — Beginner (easy start) ── */
  { icon: '⭐', name: 'Starter',         desc: 'App join kiya',            level: 1, earned: true                    },
  { icon: '✅', name: 'First Task',      desc: 'Pehla task complete kiya', level: 1, earned: tasksCompleted >= 1     },
  { icon: '📅', name: 'Check-in Debut', desc: 'Pehli baar check-in kiya', level: 1, earned: totalCheckins >= 1      },
  { icon: '🎟️', name: 'Code Hunter',    desc: '1 bonus code redeem kiya', level: 1, earned: redeemedCount >= 1      },
  { icon: '👥', name: 'Inviter',         desc: 'Pehla dost refer kiya',    level: 1, earned: referrals >= 1          },

  /* ── LEVEL 2 — Growing (medium-easy) ── */
  { icon: '🔥', name: 'Streak Star',     desc: '3 din ki streak',          level: 2, earned: streak >= 3             },
  { icon: '💰', name: 'Coin Saver',      desc: '500+ coins jode',          level: 2, earned: balance >= 500         },
  { icon: '🏆', name: 'Task Hero',       desc: '10 tasks done',            level: 2, earned: tasksCompleted >= 10   },
  { icon: '📆', name: 'Regular Player',  desc: '7 baar check-in kiya',     level: 2, earned: totalCheckins >= 7     },
  { icon: '🤝', name: 'Squad Builder',   desc: '3 dost refer kiye',        level: 2, earned: referrals >= 3         },

  /* ── LEVEL 3 — Committed (medium-hard) ── */
  { icon: '🌟', name: 'Week Warrior',    desc: '7 din ki streak',          level: 3, earned: streak >= 7             },
  { icon: '💎', name: 'Rich Bhai',       desc: '2,000+ coins',             level: 3, earned: balance >= 2000        },
  { icon: '💪', name: 'Task Master',     desc: '25 tasks done',            level: 3, earned: tasksCompleted >= 25   },
  { icon: '🗓️', name: 'Dedicated',      desc: '30 baar check-in kiya',    level: 3, earned: totalCheckins >= 30    },
  { icon: '🌍', name: 'Community Star',  desc: '10 dost refer kiye',       level: 3, earned: referrals >= 10        },

  /* ── LEVEL 4 — Elite (hard) ── */
  { icon: '👑', name: 'Streak King',     desc: '30 din ki streak',         level: 4, earned: streak >= 30            },
  { icon: '🚀', name: 'High Roller',     desc: '5,000+ coins',             level: 4, earned: balance >= 5000        },
  { icon: '🦁', name: 'Grind God',       desc: '50 tasks done',            level: 4, earned: tasksCompleted >= 50   },
  { icon: '🌈', name: 'Legend',          desc: '20,000+ coins',            level: 4, earned: balance >= 20000       },
];

const LEVEL_META = {
  1: { label: 'Level 1 · Beginner',  color: '#22c55e' },
  2: { label: 'Level 2 · Growing',   color: '#0088cc' },
  3: { label: 'Level 3 · Committed', color: '#a855f7' },
  4: { label: 'Level 4 · Elite',     color: '#ffd700' },
};

export default function Profile() {
  const navigate = useNavigate();
  const { user, balance, streak, tasksCompleted, referrals, updateUserName, redeemedCodes } = useApp();

  const [showEdit,    setShowEdit]    = useState(false);
  const [editName,    setEditName]    = useState('');
  const [saving,      setSaving]      = useState(false);
  const [toast,       setToast]       = useState('');
  const [avatarError, setAvatarError] = useState(false);

  const toastTimerRef = useRef(null);
  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  const totalCheckins  = user?.total_checkins  || 0;
  const redeemedCount  = redeemedCodes?.length || 0;

  const badges = ALL_BADGES(balance, streak, tasksCompleted, referrals, totalCheckins, redeemedCount);
  const earned = badges.filter(b => b.earned).length;

  // Level groups ke liye
  const levels = [1, 2, 3, 4];
  const badgesByLevel = levels.map(lvl => ({
    lvl,
    meta:   LEVEL_META[lvl],
    badges: badges.filter(b => b.level === lvl),
  }));
  const displayName = user?.name?.trim() || user?.username || 'User';
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const photoUrl    = (!avatarError && user?.photo_url) || null;

  const showToast = (msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(''), 3000);
  };

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
        <button
          className="profile-settings-gear"
          title="Naam Edit Karo"
          onClick={() => { setEditName(displayName); setShowEdit(true); }}
        >⚙️</button>
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

        {badgesByLevel.map(({ lvl, meta, badges: lvlBadges }) => {
          const lvlEarned = lvlBadges.filter(b => b.earned).length;
          const allDone   = lvlEarned === lvlBadges.length;
          return (
            <div key={lvl} className="badge-level-group">
              <div className="badge-level-header">
                <span className="badge-level-label" style={{ color: meta.color }}>
                  {allDone ? '✅' : `${lvlEarned}/${lvlBadges.length}`} &nbsp;{meta.label}
                </span>
                <div className="badge-level-bar">
                  <div
                    className="badge-level-fill"
                    style={{
                      width: `${(lvlEarned / lvlBadges.length) * 100}%`,
                      background: meta.color,
                    }}
                  />
                </div>
              </div>
              <div className="profile-badges-grid">
                {lvlBadges.map((b, i) => (
                  <div key={i} className={`profile-badge-card ${b.earned ? 'badge-earned' : 'badge-locked'}`}
                    style={b.earned ? { borderColor: `${meta.color}66`, boxShadow: `0 0 12px ${meta.color}22` } : {}}>
                    <div className="profile-badge-icon">{b.earned ? b.icon : '🔒'}</div>
                    <div className="profile-badge-name">{b.name}</div>
                    <div className="profile-badge-desc">{b.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

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
