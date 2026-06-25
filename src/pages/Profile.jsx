import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import BottomNav from '../components/BottomNav';
import '../styles/profile.css';

/* ═══════════════════════════════════════
   LEVEL SYSTEM — coins + tasks ke basis pe
═══════════════════════════════════════ */
const LEVELS = [
  { min: 0,     max: 499,   icon: '🌱', name: 'Naya Khiladi', color: '#64748b', next: 500   },
  { min: 500,   max: 1999,  icon: '🎮', name: 'Kamau Yaar',   color: '#22c55e', next: 2000  },
  { min: 2000,  max: 4999,  icon: '💫', name: 'Mast Player',  color: '#0088cc', next: 5000  },
  { min: 5000,  max: 9999,  icon: '🔥', name: 'Coin Pro',     color: '#f97316', next: 10000 },
  { min: 10000, max: 19999, icon: '👑', name: 'Legend Boss',  color: '#a855f7', next: 20000 },
  { min: 20000, max: Infinity, icon: '🌈', name: 'Supreme',   color: '#ffd700', next: null  },
];

function getLevel(balance) {
  return LEVELS.find(l => balance >= l.min && balance <= l.max) || LEVELS[0];
}
function getNextLevel(balance) {
  const idx = LEVELS.findIndex(l => balance >= l.min && balance <= l.max);
  return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
}

/* ═══════════════════════════════════════
   DAILY ACTIVITY — localStorage se aaj ka status
═══════════════════════════════════════ */
function getTodayKey() {
  const istMs = Date.now() + 5.5 * 60 * 60 * 1000;
  return new Date(istMs).toISOString().split('T')[0];
}
function getDailyGamePlays() {
  const today = getTodayKey();
  const spin    = parseInt(localStorage.getItem(`smb_game_spin_${today}`)    || '0');
  const scratch = parseInt(localStorage.getItem(`smb_game_scratch_${today}`) || '0');
  const flip    = parseInt(localStorage.getItem(`smb_game_flip_${today}`)    || '0');
  return { spin, scratch, flip, total: spin + scratch + flip, max: 18 };
}
function getDailyTasks() {
  const today = getTodayKey();
  let done = 0;
  for (let i = 1; i <= 5; i++) {
    if (localStorage.getItem(`smb_task_${i}_${today}`) === '1') done++;
  }
  return { done, max: 5 };
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, balance, streak, tasksCompleted, referrals, updateUserName, CHECKIN_BACKUP_KEY } = useApp();

  const [showEdit,    setShowEdit]    = useState(false);
  const [editName,    setEditName]    = useState('');
  const [saving,      setSaving]      = useState(false);
  const [toast,       setToast]       = useState('');
  const [avatarError, setAvatarError] = useState(false);

  const toastTimerRef = useRef(null);
  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  /* ── Level data ── */
  const currentLevel = getLevel(balance);
  const nextLevel    = getNextLevel(balance);
  const levelPct     = nextLevel
    ? Math.round(((balance - currentLevel.min) / (currentLevel.max - currentLevel.min + 1)) * 100)
    : 100;

  /* ── Daily activity ── */
  const todayIST   = getTodayKey();
  // BUG FIX B5: Hardcoded 'smb_checkin_ist' ki jagah CHECKIN_BACKUP_KEY context se liya
  const checkedIn  = user?.last_checkin_date === todayIST
    || localStorage.getItem(CHECKIN_BACKUP_KEY) === todayIST;
  const games      = getDailyGamePlays();
  const tasks      = getDailyTasks();

  /* ── Profile display ── */
  const displayName  = user?.name?.trim() || user?.username || 'User';
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const photoUrl     = (!avatarError && user?.photo_url) || null;

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
    { icon: '🎟️', label: 'Bonus Code',   sub: 'Extra coins redeem karo', action: () => navigate('/bonus-code'), color: '#ffd700' },
    { icon: '👥', label: 'Refer & Earn', sub: '+50 coins per referral',   action: () => navigate('/referral'),   color: '#00d4ff' },
    { icon: '🎮', label: 'Games Hub',    sub: 'Daily coins kamao',        action: () => navigate('/games'),      color: '#a855f7' },
    { icon: '❓', label: 'FAQ / Help',   sub: 'Sawalon ke jawab',         action: () => navigate('/faq'),        color: '#22c55e' },
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
                <img src={photoUrl} alt="dp" className="profile-avatar-img" onError={() => setAvatarError(true)} />
              ) : (
                <span className="profile-avatar-letter" style={{ display: 'flex' }}>{avatarLetter}</span>
              )}
              <span className="profile-online-dot" />
            </div>
          </div>
          <div className="profile-name">{displayName}</div>
          {user?.username && <div className="profile-handle">@{user.username}</div>}
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
            { icon: '🏆', val: tasksCompleted,          lbl: 'Tasks'     },
            { icon: '🔥', val: streak,                  lbl: 'Streak'    },
            { icon: '👥', val: referrals,               lbl: 'Referrals' },
            { icon: '📅', val: user?.total_checkins||0, lbl: 'Check-ins' },
          ].map((s, i) => (
            <div key={i} className="profile-stat-pill">
              <div className="profile-stat-pill-icon">{s.icon}</div>
              <div className="profile-stat-pill-val">{s.val}</div>
              <div className="profile-stat-pill-lbl">{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* ══════════════════════════════
            MERA LEVEL — dynamic level card
        ══════════════════════════════ */}
        <div className="profile-section-title">⚡ Mera Level</div>
        <div className="lvl-card" style={{ borderColor: `${currentLevel.color}44` }}>
          <div className="lvl-card-glow" style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${currentLevel.color}22 0%, transparent 70%)` }} />

          <div className="lvl-top-row">
            <div className="lvl-icon-wrap" style={{ background: `${currentLevel.color}20`, border: `2px solid ${currentLevel.color}66` }}>
              <span className="lvl-icon">{currentLevel.icon}</span>
            </div>
            <div className="lvl-info">
              <div className="lvl-name" style={{ color: currentLevel.color }}>{currentLevel.name}</div>
              <div className="lvl-coins-label">
                {nextLevel
                  ? `${(currentLevel.max + 1 - balance).toLocaleString()} coins aur — ${nextLevel.icon} ${nextLevel.name}`
                  : '🌈 Maximum level pe pohonch gaye!'}
              </div>
            </div>
            <div className="lvl-pct-badge" style={{ background: `${currentLevel.color}22`, color: currentLevel.color }}>
              {levelPct}%
            </div>
          </div>

          <div className="lvl-bar-wrap">
            <div className="lvl-bar-track">
              <div
                className="lvl-bar-fill"
                style={{ width: `${levelPct}%`, background: `linear-gradient(90deg, ${currentLevel.color}99, ${currentLevel.color})` }}
              />
            </div>
            <div className="lvl-bar-labels">
              <span style={{ color: currentLevel.color }}>{currentLevel.min.toLocaleString()}</span>
              {nextLevel && <span style={{ color: 'rgba(255,255,255,0.3)' }}>{(currentLevel.max + 1).toLocaleString()}</span>}
            </div>
          </div>

          {/* Level milestones row */}
          <div className="lvl-milestones">
            {LEVELS.map((l, i) => {
              const reached = balance >= l.min;
              const isCurrent = l.name === currentLevel.name;
              return (
                <div key={i} className={`lvl-dot-wrap ${isCurrent ? 'lvl-dot-active' : ''}`}>
                  <div
                    className="lvl-dot"
                    style={{
                      background: reached ? l.color : 'rgba(255,255,255,0.08)',
                      border: isCurrent ? `2px solid ${l.color}` : '2px solid transparent',
                      boxShadow: isCurrent ? `0 0 8px ${l.color}88` : 'none',
                    }}
                  >
                    <span style={{ fontSize: 10 }}>{l.icon}</span>
                  </div>
                  <div className="lvl-dot-name" style={{ color: reached ? l.color : 'rgba(255,255,255,0.2)' }}>
                    {l.name.split(' ')[0]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ══════════════════════════════
            AAJ KI ACTIVITY — daily tracker
        ══════════════════════════════ */}
        <div className="profile-section-title">📊 Aaj Ki Activity</div>
        <div className="activity-grid">

          {/* Check-in tile */}
          <div className={`act-tile ${checkedIn ? 'act-done' : 'act-pending'}`} onClick={() => navigate('/home')}>
            <div className="act-tile-icon">{checkedIn ? '✅' : '📅'}</div>
            <div className="act-tile-label">Daily Check-in</div>
            <div className="act-tile-status" style={{ color: checkedIn ? '#22c55e' : '#fbbf24' }}>
              {checkedIn ? 'Ho gaya!' : 'Baaki hai'}
            </div>
            {!checkedIn && <div className="act-tile-cta">→ Jao</div>}
          </div>

          {/* Games tile */}
          <div className="act-tile act-games" onClick={() => navigate('/games')}>
            <div className="act-tile-icon">🎮</div>
            <div className="act-tile-label">Games</div>
            <div className="act-tile-bar-wrap">
              <div className="act-tile-bar">
                <div className="act-tile-bar-fill act-fill-games" style={{ width: `${Math.min(100, (games.total / games.max) * 100)}%` }} />
              </div>
            </div>
            <div className="act-tile-status" style={{ color: '#a855f7' }}>
              {games.total}/{games.max} played
            </div>
          </div>

          {/* Tasks tile */}
          <div className="act-tile act-tasks" onClick={() => navigate('/home')}>
            <div className="act-tile-icon">⚡</div>
            <div className="act-tile-label">Tasks</div>
            <div className="act-tile-bar-wrap">
              <div className="act-tile-bar">
                <div className="act-tile-bar-fill act-fill-tasks" style={{ width: `${(tasks.done / tasks.max) * 100}%` }} />
              </div>
            </div>
            <div className="act-tile-status" style={{ color: '#f97316' }}>
              {tasks.done}/{tasks.max} done
            </div>
          </div>

          {/* Streak tile */}
          <div className={`act-tile ${streak >= 3 ? 'act-done' : 'act-pending'}`} onClick={() => navigate('/home')}>
            <div className="act-tile-icon">{streak >= 7 ? '🔥' : streak >= 3 ? '⚡' : '🌱'}</div>
            <div className="act-tile-label">Streak</div>
            <div className="act-tile-status" style={{ color: streak >= 3 ? '#ff6a00' : '#fbbf24' }}>
              {streak} din
            </div>
            <div className="act-tile-cta" style={{ color: streak >= 7 ? '#ff6a00' : 'rgba(255,255,255,0.3)' }}>
              {streak >= 7 ? '🔥 Hot!' : streak >= 3 ? '⚡ Good' : 'Start karo'}
            </div>
          </div>

        </div>

        {/* ── ACCOUNT INFO ── */}
        <div className="profile-section-title">ℹ️ Account Info</div>
        <div className="profile-info-card">
          {[
            { label: 'Naam',        val: displayName,                                   icon: '👤' },
            { label: 'Telegram ID', val: user?.id || '—',                               icon: '🆔' },
            { label: 'Username',    val: user?.username ? `@${user.username}` : '—',    icon: '📛' },
            { label: 'Mobile',      val: user?.mobile || 'Add nahi kiya',               icon: '📱' },
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
