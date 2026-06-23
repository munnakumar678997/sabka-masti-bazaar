import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import '../styles/profile.css';

function getLevel(balance) {
  if (balance >= 20000) return { name: 'Diamond', icon: '💎', color: '#00d4ff', next: null,   progress: 100,   nextName: '' };
  if (balance >= 5000)  return { name: 'Gold',    icon: '🥇', color: '#ffd700', next: 20000, progress: Math.min(100, Math.floor(((balance - 5000)  / 15000) * 100)), nextName: 'Diamond' };
  if (balance >= 1000)  return { name: 'Silver',  icon: '🥈', color: '#c0c0c0', next: 5000,  progress: Math.min(100, Math.floor(((balance - 1000)  / 4000)  * 100)), nextName: 'Gold'    };
  return               { name: 'Bronze',  icon: '🥉', color: '#cd7f32', next: 1000,  progress: Math.min(100, Math.floor((balance / 1000) * 100)),                  nextName: 'Silver'  };
}

const ALL_BADGES = (balance, streak, tasksCompleted) => [
  { icon: '⭐', name: 'Starter',      desc: 'App join kiya',          earned: true              },
  { icon: '✅', name: 'First Task',   desc: 'Pehla task complete',    earned: tasksCompleted>=1  },
  { icon: '🔥', name: 'Streak Star',  desc: '3 din ki streak',        earned: streak>=3          },
  { icon: '🌟', name: 'Week Warrior', desc: '7 din ki streak',        earned: streak>=7          },
  { icon: '👑', name: 'Streak King',  desc: '30 din ki streak',       earned: streak>=30         },
  { icon: '🏆', name: 'Task Hero',    desc: '10 tasks complete',      earned: tasksCompleted>=10 },
  { icon: '💪', name: 'Task Master',  desc: '50 tasks complete',      earned: tasksCompleted>=50 },
  { icon: '💰', name: 'Coin Saver',   desc: '100+ coins',             earned: balance>=100       },
  { icon: '💎', name: 'Rich Bhai',    desc: '1,000+ coins',           earned: balance>=1000      },
  { icon: '🚀', name: 'High Roller',  desc: '5,000+ coins',           earned: balance>=5000      },
  { icon: '🌈', name: 'Legend',       desc: '20,000+ coins',          earned: balance>=20000     },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, balance, streak, tasksCompleted, referrals } = useApp();

  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState('');

  const level   = getLevel(balance);
  const badges  = ALL_BADGES(balance, streak, tasksCompleted);
  const earned  = badges.filter(b => b.earned).length;

  const displayName  = user?.name?.trim() || user?.username || 'User';
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const photoUrl     = user?.photo_url || null;

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleSaveName = async () => {
    if (!editName.trim() || saving) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('users').update({ name: editName.trim() }).eq('id', user?.id);
      if (!error) { showToast('✅ Naam update ho gaya!'); setShowEdit(false); }
      else showToast('❌ Error! Try again.');
    } catch { showToast('❌ Error! Try again.'); }
    setSaving(false);
  };

  const navTabs = [
    { key: 'home',    icon: '🏠', label: 'Home',    path: '/home'    },
    { key: 'store',   icon: '🛒', label: 'Store',   path: '/store'   },
    { key: 'wallet',  icon: '💰', label: 'Wallet',  path: '/wallet'  },
    { key: 'profile', icon: '👤', label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="profile-page">

      <div className="profile-topbar">
        <button className="profile-back-btn" onClick={() => navigate('/home')}>← Back</button>
        <div className="profile-topbar-title">👤 Profile</div>
        <div style={{ width: 70 }} />
      </div>

      <div className="profile-scroll">

        {/* ── HERO ── */}
        <div className="profile-hero">
          <div className="profile-avatar-wrap" style={{ borderColor: level.color, boxShadow: `0 0 24px ${level.color}55` }}>
            {photoUrl
              ? <img src={photoUrl} alt="dp" className="profile-avatar-img"
                  onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
              : null}
            <span className="profile-avatar-letter" style={{ display: photoUrl ? 'none' : 'flex' }}>{avatarLetter}</span>
          </div>
          <div className="profile-level-badge" style={{ background: `linear-gradient(135deg, ${level.color}cc, ${level.color}88)`, boxShadow: `0 4px 14px ${level.color}55` }}>
            {level.icon} {level.name}
          </div>
          <div className="profile-name">{displayName}</div>
          {user?.username && <div className="profile-handle">@{user.username}</div>}

          <div className="profile-xp-box">
            <div className="profile-xp-label">
              <span style={{ color: level.color, fontWeight: 800 }}>{level.name}</span>
              {level.next && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>→ {level.nextName} ({level.next.toLocaleString()} coins)</span>}
              {!level.next && <span style={{ color: '#ffd700', fontSize: 11 }}>Max Level! 🎉</span>}
            </div>
            <div className="profile-xp-bar">
              <div className="profile-xp-fill" style={{ width: `${level.progress}%`, background: `linear-gradient(90deg, ${level.color}66, ${level.color})` }} />
            </div>
            <div className="profile-xp-pct">{level.progress}% complete</div>
          </div>
        </div>

        {/* ── STATS ── */}
        <div className="profile-section-title">📊 Meri Stats</div>
        <div className="profile-stats-grid">
          {[
            { icon: '🪙', val: balance.toLocaleString(), lbl: 'Total Coins'   },
            { icon: '💵', val: `₹${(balance/100).toFixed(2)}`, lbl: 'INR Value' },
            { icon: '🏆', val: tasksCompleted,            lbl: 'Tasks Done'   },
            { icon: '🔥', val: streak,                    lbl: 'Day Streak'   },
            { icon: '👥', val: referrals,                 lbl: 'Referrals'    },
            { icon: '🎖️', val: `${earned}/${badges.length}`, lbl: 'Badges'   },
          ].map((s, i) => (
            <div key={i} className="profile-stat-box">
              <div className="profile-stat-icon">{s.icon}</div>
              <div className="profile-stat-val">{s.val}</div>
              <div className="profile-stat-lbl">{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* ── BADGES ── */}
        <div className="profile-section-title">🎖️ Badges <span style={{ color:'rgba(255,255,255,0.35)', fontSize:13 }}>({earned}/{badges.length} earned)</span></div>
        <div className="profile-badges-grid">
          {badges.map((b, i) => (
            <div key={i} className={`profile-badge-card ${b.earned ? 'badge-earned' : 'badge-locked'}`}>
              <div className="profile-badge-icon">{b.earned ? b.icon : '🔒'}</div>
              <div className="profile-badge-name">{b.name}</div>
              <div className="profile-badge-desc">{b.desc}</div>
            </div>
          ))}
        </div>

        {/* ── ACCOUNT INFO ── */}
        <div className="profile-section-title">ℹ️ Account Info</div>
        <div className="profile-info-card">
          {[
            { label: 'Naam',        val: displayName              },
            { label: 'Telegram ID', val: user?.id || '—'          },
            { label: 'Username',    val: user?.username ? `@${user.username}` : '—' },
            { label: 'Mobile',      val: user?.mobile || 'Add nahi kiya' },
          ].map((row, i) => (
            <div key={i} className="profile-info-row">
              <span className="profile-info-label">{row.label}</span>
              <span className="profile-info-val">{row.val}</span>
            </div>
          ))}
        </div>

        {/* ── SETTINGS ── */}
        <div className="profile-section-title">⚙️ Settings</div>
        <div className="profile-actions">
          {[
            { icon: '✏️', label: 'Naam Edit Karo',    action: () => { setEditName(displayName); setShowEdit(true); } },
            { icon: '👥', label: 'Referral Program',  action: () => navigate('/referral') },
            { icon: '🎮', label: 'Games Hub',         action: () => navigate('/games')    },
            { icon: '❓', label: 'FAQ / Help',        action: () => navigate('/faq')      },
          ].map((btn, i) => (
            <button key={i} className="profile-action-btn" onClick={btn.action}>
              <span className="profile-action-icon">{btn.icon}</span>
              <span>{btn.label}</span>
              <span className="profile-action-arrow">›</span>
            </button>
          ))}
        </div>

        <div style={{ height: 90 }} />
      </div>

      {/* ── BOTTOM NAV ── */}
      <div className="profile-bottom-nav">
        {navTabs.map(tab => (
          <button key={tab.key} className={`profile-nav-tab ${tab.key === 'profile' ? 'active' : ''}`}
            onClick={() => navigate(tab.path)}>
            <span>{tab.icon}</span>
            <span className="profile-nav-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── EDIT NAME MODAL ── */}
      {showEdit && (
        <div className="profile-overlay" onClick={() => setShowEdit(false)}>
          <div className="profile-modal" onClick={e => e.stopPropagation()}>
            <div className="profile-modal-title">✏️ Naam Edit Karo</div>
            <input className="profile-modal-input" value={editName}
              onChange={e => setEditName(e.target.value)}
              placeholder="Apna naam likho..." maxLength={30} />
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
