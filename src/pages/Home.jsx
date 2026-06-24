import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import DailyCheckIn from './DailyCheckIn';
import '../styles/home.css';

const TASKS = [
  { id: 1, icon: '📺', title: 'Video dekho',          desc: 'Ek video dekho aur kamao',       coins: 5,  tag: 'Easy' },
  { id: 2, icon: '📲', title: 'App install karo',     desc: 'Naya app install karo',          coins: 20, tag: 'Hot'  },
  { id: 3, icon: '🔗', title: 'Link share karo',      desc: 'Apna link share karo',           coins: 10, tag: 'Easy' },
  { id: 4, icon: '📝', title: 'Survey bharo',         desc: '2 min ka survey complete karo',  coins: 15, tag: 'New'  },
  { id: 5, icon: '👥', title: 'Friend ko refer karo', desc: 'Dost ko invite karo',            coins: 50, tag: 'Big'  },
];

const NOTIFICATIONS = [
  { id: 1, icon: '🎁', title: 'Check-in Bonus Mila!',      desc: '+25 coins tumhare wallet mein aa gaye.',     time: '2 min pehle',    unread: true  },
  { id: 2, icon: '🔥', title: 'Streak 5 din ka!',           desc: 'Waah! 5 din ki streak maintain kar li.',     time: '1 ghante pehle', unread: true  },
  { id: 3, icon: '💸', title: 'Withdrawal Process Ho Raha', desc: 'Tumhara ₹50 ka withdrawal process mein hai.', time: 'Kal',             unread: false },
  { id: 4, icon: '👥', title: 'Naya Referral!',              desc: 'Ek dost ne tumhare link se join kiya!',      time: '2 din pehle',     unread: false },
  { id: 5, icon: '📢', title: 'Naya Task Available',         desc: 'Video dekho aur 5 coins kamao — abhi karo!', time: '3 din pehle',     unread: false },
];

export default function Home() {
  const navigate = useNavigate();
  const { user, balance, streak, completeTask, tasksCompleted, referrals } = useApp();

  const [activeTab,    setActiveTab]    = useState('home');
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showNotif,    setShowNotif]    = useState(false);
  const [notifs,       setNotifs]       = useState(NOTIFICATIONS);

  const unreadCount = notifs.filter(n => n.unread).length;
  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, unread: false })));

  // Topbar — user ka naam aur photo
  const rawName     = user?.name?.trim() || user?.username || '';
  const displayName = rawName || 'User';
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const photoUrl     = user?.photo_url || null;

  return (
    <div className="home-page">

      {/* ── TOPBAR ── */}
      <div className="home-topbar">
        <div className="topbar-left">
          <div className="topbar-avatar">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="dp"
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                onError={e => {
                  e.target.style.display = 'none';
                  e.target.parentNode.setAttribute('data-fallback', 'true');
                }}
              />
            ) : (
              <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{avatarLetter}</span>
            )}
          </div>
          <div className="topbar-name">{displayName}</div>
        </div>
        <div className="topbar-right">
          <div className="topbar-notif-btn" onClick={() => setShowNotif(true)}>
            <span className="notif-bell">🔔</span>
            {unreadCount > 0 && (
              <span className="notif-badge">{unreadCount}</span>
            )}
          </div>
        </div>
      </div>

      <div className="home-scroll">

        {/* ── BALANCE CARD ── */}
        <div className="balance-card">
          <div className="balance-card-bg1" />
          <div className="balance-card-bg2" />
          <div className="balance-label">Tumhara Total Balance</div>
          <div className="balance-amount">
            <span className="balance-icon">🪙</span>
            <span className="balance-num">{balance.toLocaleString()}</span>
            <span className="balance-unit">Coins</span>
          </div>
          <div className="balance-inr">≈ ₹{(balance / 100).toFixed(2)} INR</div>
          <div className="balance-actions">
            <button className="bal-btn withdraw" onClick={() => setShowWithdraw(true)}>
              💸 Withdraw
            </button>
            <button className="bal-btn add" onClick={() => navigate('/store')}>
              🛒 Store
            </button>
          </div>
        </div>

        {/* ── QUICK STATS ── */}
        <div className="quick-stats">
          <div className="stat-box">
            <div className="stat-icon">🏆</div>
            <div className="stat-val">{tasksCompleted}</div>
            <div className="stat-lbl">Tasks Done</div>
          </div>
          <div className="stat-box">
            <div className="stat-icon">🔥</div>
            <div className="stat-val">{streak}</div>
            <div className="stat-lbl">Day Streak</div>
          </div>
          <div className="stat-box">
            <div className="stat-icon">👥</div>
            <div className="stat-val">{referrals}</div>
            <div className="stat-lbl">Referrals</div>
          </div>
        </div>

        {/* ── DAILY CHECK-IN (separate component) ── */}
        <DailyCheckIn />

        {/* ── EARNING TASKS ── */}
        <div className="section-header" style={{ marginTop: 20 }}>
          <span>⚡ Earning Tasks</span>
          <span className="see-all">Sab dekho →</span>
        </div>

        <div className="tasks-list">
          {TASKS.map(task => (
            <div key={task.id} className="task-card">
              <div className="task-icon-wrap">{task.icon}</div>
              <div className="task-info">
                <div className="task-title-row">
                  <span className="task-title">{task.title}</span>
                  <span className={`task-tag tag-${task.tag.toLowerCase()}`}>{task.tag}</span>
                </div>
                <div className="task-desc">{task.desc}</div>
              </div>
              <button className="task-claim-btn" onClick={() => completeTask(task.coins)}>
                <span className="task-coins">+{task.coins} 🪙</span>
              </button>
            </div>
          ))}
        </div>

        {/* ── GAMES BANNER ── */}
        <div className="games-banner" onClick={() => navigate('/games')}>
          <div className="games-banner-left">
            <div className="games-banner-title">🎮 Games Hub</div>
            <div className="games-banner-desc">Spin, Scratch, Quiz — daily coins kamao!</div>
          </div>
          <button className="games-banner-btn">Khelo ▶</button>
        </div>

        {/* ── REFER BANNER ── */}
        <div className="refer-banner" onClick={() => navigate('/referral')}>
          <div className="refer-text">
            <div className="refer-title">👥 Dosto ko Invite karo!</div>
            <div className="refer-desc">Har referral pe +50 coins kamao!</div>
          </div>
          <button className="refer-btn" onClick={e => { e.stopPropagation(); navigate('/referral'); }}>Share 🔗</button>
        </div>

        {/* ── BONUS CODE BANNER ── */}
        <div className="bonus-code-banner" onClick={() => navigate('/bonus-code')}>
          <div className="bonus-code-left">
            <div className="bonus-code-icon">🎟️</div>
            <div>
              <div className="bonus-code-title">Bonus Code Hai?</div>
              <div className="bonus-code-desc">Redeem karo — extra coins pao!</div>
            </div>
          </div>
          <button className="bonus-code-btn">Redeem ▶</button>
        </div>

        <div style={{ height: 90 }} />
      </div>

      {/* ── BOTTOM NAV ── */}
      <div className="bottom-nav">
        {[
          { key: 'home',    icon: '🏠', label: 'Home',    path: '/home'    },
          { key: 'games',   icon: '🎮', label: 'Games',   path: '/games'   },
          { key: 'store',   icon: '🛒', label: 'Store',   path: '/store'   },
          { key: 'wallet',  icon: '💰', label: 'Wallet',  path: '/wallet'  },
          { key: 'profile', icon: '👤', label: 'Profile', path: '/profile' },
        ].map(tab => (
          <button
            key={tab.key}
            className={`nav-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => { setActiveTab(tab.key); navigate(tab.path); }}
          >
            <span className="nav-icon">{tab.icon}</span>
            <span className="nav-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── NOTIFICATION PANEL ── */}
      {showNotif && (
        <div className="notif-overlay" onClick={() => setShowNotif(false)}>
          <div className="notif-panel" onClick={e => e.stopPropagation()}>
            <div className="notif-panel-header">
              <div className="notif-panel-title">
                <span>🔔 Notifications</span>
                {unreadCount > 0 && <span className="notif-count-chip">{unreadCount} naye</span>}
              </div>
              <div className="notif-header-actions">
                {unreadCount > 0 && (
                  <button className="notif-mark-read" onClick={markAllRead}>Sab padha</button>
                )}
                <button className="notif-close" onClick={() => setShowNotif(false)}>✕</button>
              </div>
            </div>
            <div className="notif-list">
              {notifs.map(n => (
                <div
                  key={n.id}
                  className={`notif-item ${n.unread ? 'notif-unread' : ''}`}
                  onClick={() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, unread: false } : x))}
                >
                  <div className="notif-item-icon">{n.icon}</div>
                  <div className="notif-item-body">
                    <div className="notif-item-title">{n.title}</div>
                    <div className="notif-item-desc">{n.desc}</div>
                    <div className="notif-item-time">{n.time}</div>
                  </div>
                  {n.unread && <div className="notif-dot" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── WITHDRAW POPUP ── */}
      {showWithdraw && (
        <div className="popup-overlay" onClick={() => setShowWithdraw(false)}>
          <div className="popup-box" onClick={e => e.stopPropagation()}>
            <div className="popup-emoji">💸</div>
            <div className="popup-title">Withdrawal</div>
            <div className="popup-desc">
              Minimum withdrawal: <b>500 Coins (₹5)</b><br />
              Tumhare paas abhi <b>{balance.toLocaleString()} Coins</b> hain.
            </div>
            {balance >= 500
              ? <button className="popup-main-btn">🏦 Withdraw Karo</button>
              : <div className="popup-low">Abhi balance kam hai — aur tasks karo!</div>
            }
            <button className="popup-cancel" onClick={() => setShowWithdraw(false)}>
              Band karo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
