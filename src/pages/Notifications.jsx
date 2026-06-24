import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import '../styles/notifications.css';

function timeAgo(isoString) {
  if (!isoString) return '';
  const diffMs  = Date.now() - new Date(isoString).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1)   return 'Abhi abhi';
  if (diffMin < 60)  return `${diffMin} min pehle`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24)   return `${diffHr} ghante pehle`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return 'Kal';
  if (diffDay < 7)   return `${diffDay} din pehle`;
  return new Date(isoString).toLocaleDateString('en-IN');
}

const TYPE_COLORS = {
  welcome:   '#ffd700',
  checkin:   '#22c55e',
  referral:  '#0088cc',
  milestone: '#a855f7',
  games:     '#ff6a00',
  withdrawal:'#ee0979',
  admin:     '#e11d48',
  general:   '#64748b',
};

export default function Notifications() {
  const navigate = useNavigate();
  const { fetchNotifications, markNotifRead, markAllNotifsRead, notifUnreadCount } = useApp();

  const [notifs,    setNotifs]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('all'); // 'all' | 'unread'
  const [marking,   setMarking]   = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchNotifications().then(data => {
      if (!cancelled) {
        setNotifs(data);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const handleMarkOne = async (notif) => {
    if (notif.read) return;
    setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    await markNotifRead(notif.id);
  };

  const handleMarkAll = async () => {
    if (marking) return;
    setMarking(true);
    const unreadIds = notifs.filter(n => !n.read).map(n => n.id);
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    await markAllNotifsRead(unreadIds);
    setMarking(false);
  };

  const displayed   = filter === 'unread' ? notifs.filter(n => !n.read) : notifs;
  const localUnread = notifs.filter(n => !n.read).length;

  const navTabs = [
    { key: 'home',    icon: '🏠', label: 'Home',    path: '/home'    },
    { key: 'games',   icon: '🎮', label: 'Games',   path: '/games'   },
    { key: 'store',   icon: '🛒', label: 'Store',   path: '/store'   },
    { key: 'wallet',  icon: '💰', label: 'Wallet',  path: '/wallet'  },
    { key: 'profile', icon: '👤', label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="notif-page">

      {/* ── TOPBAR ── */}
      <div className="notif-topbar">
        <button className="notif-back" onClick={() => navigate('/home')}>← Back</button>
        <div className="notif-topbar-title">
          🔔 Notifications
          {localUnread > 0 && <span className="notif-topbar-badge">{localUnread}</span>}
        </div>
        <button
          className={`notif-markall-btn ${localUnread === 0 || marking ? 'disabled' : ''}`}
          onClick={handleMarkAll}
          disabled={localUnread === 0 || marking}
        >
          {marking ? '⏳' : '✓ Sab Padha'}
        </button>
      </div>

      {/* ── FILTER PILLS ── */}
      <div className="notif-filter-row">
        <button
          className={`notif-pill ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Sab ({notifs.length})
        </button>
        <button
          className={`notif-pill ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Unread {localUnread > 0 && <span className="notif-pill-badge">{localUnread}</span>}
        </button>
      </div>

      {/* ── NOTIF LIST ── */}
      <div className="notif-scroll">
        {loading ? (
          <div className="notif-loading">
            <div className="notif-loading-spin">⏳</div>
            <div>Load ho raha hai...</div>
          </div>
        ) : displayed.length === 0 ? (
          <div className="notif-empty">
            <div className="notif-empty-icon">🔕</div>
            <div className="notif-empty-title">
              {filter === 'unread' ? 'Sab Padh Liye!' : 'Koi Notification Nahi'}
            </div>
            <div className="notif-empty-sub">
              {filter === 'unread'
                ? 'Sab notifications padh li gayi hain 🎉'
                : 'Jab naya update aayega, yahan dikhega!'}
            </div>
            {filter === 'unread' && (
              <button className="notif-view-all-btn" onClick={() => setFilter('all')}>
                Sab Dekho
              </button>
            )}
          </div>
        ) : (
          <>
            {displayed.map(n => (
              <div
                key={n.id}
                className={`notif-card ${n.read ? '' : 'notif-card-unread'}`}
                onClick={() => handleMarkOne(n)}
              >
                <div
                  className="notif-card-icon-wrap"
                  style={{ background: `${TYPE_COLORS[n.type] || TYPE_COLORS.general}18`,
                           border: `1.5px solid ${TYPE_COLORS[n.type] || TYPE_COLORS.general}33` }}
                >
                  <span className="notif-card-icon">{n.icon || '🔔'}</span>
                </div>
                <div className="notif-card-body">
                  <div className="notif-card-title">{n.title}</div>
                  <div className="notif-card-desc">{n.desc}</div>
                  <div className="notif-card-time">{timeAgo(n.createdAt)}</div>
                </div>
                {!n.read && <div className="notif-unread-dot" />}
              </div>
            ))}
            <div style={{ height: 16 }} />
          </>
        )}

        <div style={{ height: 90 }} />
      </div>

      {/* ── BOTTOM NAV ── */}
      <div className="notif-bottom-nav">
        {navTabs.map(tab => (
          <button
            key={tab.key}
            className={`notif-nav-tab ${tab.key === 'home' ? 'active' : ''}`}
            onClick={() => navigate(tab.path)}
          >
            <span>{tab.icon}</span>
            <span className="notif-nav-label">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
