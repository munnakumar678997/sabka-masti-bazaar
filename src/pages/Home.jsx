import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import '../styles/home.css';

const TASKS = [
  { id: 1, icon: '📺', title: 'Video dekho',       desc: 'Ek video dekho aur kamao',       coins: 5,  tag: 'Easy' },
  { id: 2, icon: '📲', title: 'App install karo',  desc: 'Naya app install karo',          coins: 20, tag: 'Hot'  },
  { id: 3, icon: '🔗', title: 'Link share karo',   desc: 'Apna link share karo',           coins: 10, tag: 'Easy' },
  { id: 4, icon: '📝', title: 'Survey bharo',       desc: '2 min ka survey complete karo',  coins: 15, tag: 'New'  },
  { id: 5, icon: '👥', title: 'Friend ko refer karo', desc: 'Dost ko invite karo',         coins: 50, tag: 'Big'  },
];

const DAY_REWARDS = [10, 15, 25, 35, 50, 75, 100];

const NOTIFICATIONS = [
  { id: 1, icon: '🎁', title: 'Check-in Bonus Mila!',     desc: '+25 coins tumhare wallet mein aa gaye.',     time: '2 min pehle', unread: true  },
  { id: 2, icon: '🔥', title: 'Streak 5 din ka!',          desc: 'Waah! 5 din ki streak maintain kar li.',     time: '1 ghante pehle', unread: true },
  { id: 3, icon: '💸', title: 'Withdrawal Process Ho Raha', desc: 'Tumhara ₹50 ka withdrawal process mein hai.', time: 'Kal',           unread: false },
  { id: 4, icon: '👥', title: 'Naya Referral!',             desc: 'Ek dost ne tumhare link se join kiya!',      time: '2 din pehle',   unread: false },
  { id: 5, icon: '📢', title: 'Naya Task Available',        desc: 'Video dekho aur 5 coins kamao — abhi karo!', time: '3 din pehle',   unread: false },
];

function getISTDateStr() {
  const now   = new Date();
  const istMs = now.getTime() + 5.5 * 60 * 60 * 1000;
  return new Date(istMs).toISOString().split('T')[0];
}

function getSecsUntilISTMidnight() {
  const now   = new Date();
  const istMs = now.getTime() + 5.5 * 60 * 60 * 1000;
  const ist   = new Date(istMs);
  const h = ist.getUTCHours(), m = ist.getUTCMinutes(), s = ist.getUTCSeconds();
  return 86400 - (h * 3600 + m * 60 + s);
}

function fmtCountdown(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

export default function Home() {
  const navigate = useNavigate();
  const { user, balance, streak, completeTask, tasksCompleted, referrals, updateCheckIn } = useApp();

  const [activeTab,       setActiveTab]       = useState('home');
  const [showWithdraw,    setShowWithdraw]    = useState(false);
  const [showClaimed,     setShowClaimed]     = useState(false);
  const [countdown,       setCountdown]       = useState(getSecsUntilISTMidnight());
  const [checkInLoading,  setCheckInLoading]  = useState(false);
  const [showNotif,       setShowNotif]       = useState(false);
  const [notifs,          setNotifs]          = useState(NOTIFICATIONS);

  const unreadCount = notifs.filter(n => n.unread).length;

  const todayIST   = getISTDateStr();
  const checkedIn  = user?.last_checkin_date === todayIST;
  const dayIndex   = ((streak - 1) % 7);
  const todayReward = DAY_REWARDS[checkedIn ? dayIndex : (streak % 7)];

  const isStreakBroken = useCallback(() => {
    if (!user?.last_checkin_date) return false;
    const last     = new Date(user.last_checkin_date + 'T00:00:00+05:30');
    const today    = new Date(todayIST + 'T00:00:00+05:30');
    const diffDays = Math.round((today - last) / 86400000);
    return diffDays > 1;
  }, [user?.last_checkin_date, todayIST]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getSecsUntilISTMidnight());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCheckIn = async () => {
    if (checkedIn || checkInLoading) return;
    setCheckInLoading(true);
    const broken      = isStreakBroken();
    const newStreak   = broken ? 1 : streak + 1;
    const rewardDay   = (newStreak - 1) % 7;
    const coinsEarned = DAY_REWARDS[rewardDay];
    const totalDays   = (user?.total_checkins || 0) + 1;

    await updateCheckIn(newStreak, totalDays, todayIST, coinsEarned);
    setCheckInLoading(false);
    setShowClaimed(coinsEarned);
    setTimeout(() => setShowClaimed(false), 2500);
  };

  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const gridDays = DAY_REWARDS.map((reward, i) => {
    const streakPos = checkedIn ? streak : streak + 1;
    const cyclePos  = ((streakPos - 1) % 7) + 1;
    let state = 'locked';
    if (i < cyclePos - 1)      state = 'done';
    else if (i === cyclePos - 1) state = checkedIn ? 'claimed' : 'today';
    return { dayNum: i + 1, reward, state };
  });

  const displayName = user?.name || 'Masti Bazaar User';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="home-page">

      {showClaimed && (
        <div className="claim-popup">
          <div className="claim-popup-inner">
            <div className="claim-anim">🎉</div>
            <div className="claim-title">+{showClaimed} Coins Mila!</div>
            <div className="claim-sub">Check-in bonus credited!</div>
          </div>
        </div>
      )}

      {/* ── TOPBAR ── */}
      <div className="home-topbar">
        <div className="topbar-left">
          <div className="topbar-avatar">
            {user?.photo_url
              ? <img src={user.photo_url} alt="dp"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : avatarLetter}
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

        <div className="balance-card">
          <div className="balance-card-bg1" />
          <div className="balance-card-bg2" />
          <div className="balance-label">Tumhara Total Balance</div>
          <div className="balance-amount">
            <span className="balance-icon">🪙</span>
            <span className="balance-num">{balance.toLocaleString()}</span>
            <span className="balance-unit">Coins</span>
          </div>
          <div className="balance-inr">≈ ₹{(balance * 0.1).toFixed(2)} INR</div>
          <div className="balance-actions">
            <button className="bal-btn withdraw" onClick={() => setShowWithdraw(true)}>
              💸 Withdraw
            </button>
            <button className="bal-btn add" onClick={() => navigate('/store')}>
              🛒 Store
            </button>
          </div>
        </div>

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

        <div className="section-header">
          <span>📅 Daily Check-in</span>
          {streak > 0 && <span className="streak-badge">🔥 {streak} Day Streak</span>}
        </div>

        <div className="checkin-card-v2">
          <div className={`checkin-glow-bar ${checkedIn ? 'glow-green' : 'glow-orange'}`} />
          <div className="checkin-grid">
            {gridDays.map(({ dayNum, reward, state }) => (
              <div key={dayNum} className={`ci-day ci-${state}`}>
                <div className="ci-day-icon">
                  {state === 'done'    ? '✅' :
                   state === 'claimed' ? '🎁' :
                   state === 'today'   ? '🪙' : '🔒'}
                </div>
                <div className="ci-day-num">Day {dayNum}</div>
                <div className="ci-day-reward">
                  {state === 'done' || state === 'claimed'
                    ? <span className="ci-done-lbl">Done</span>
                    : <span className="ci-coins-lbl">+{reward}</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="ci-divider" />

          {checkedIn ? (
            <div className="ci-done-section">
              <div className="ci-countdown-box">
                <div className="ci-countdown-lbl">⏰ Next check-in mein bacha</div>
                <div className="ci-countdown-timer">{fmtCountdown(countdown)}</div>
                <div className="ci-countdown-sub">India time (IST) ke hisab se</div>
              </div>
            </div>
          ) : (
            <div className="ci-claim-section">
              <div className="ci-today-reward-row">
                <div>
                  <div className="ci-today-label">Aaj ka reward</div>
                  <div className="ci-today-coins">🪙 +{todayReward} Coins</div>
                </div>
                {streak > 0 && (
                  <div className="ci-streak-pill">🔥 {streak} din ki streak!</div>
                )}
              </div>
              {isStreakBroken() && (
                <div className="ci-broken-streak">
                  ⚠️ Streak toot gayi — aaj se naya shuru!
                </div>
              )}
              <button
                className="ci-claim-btn"
                onClick={handleCheckIn}
                disabled={checkedIn || checkInLoading}
                style={checkInLoading ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              >
                <span className="ci-btn-icon">{checkInLoading ? '⏳' : '🎁'}</span>
                <span className="ci-btn-text">
                  {checkInLoading ? 'Save ho raha hai...' : 'Aaj ka Check-in Karo'}
                </span>
                <span className="ci-btn-coins">+{todayReward} 🪙</span>
              </button>
            </div>
          )}
        </div>

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

        <div className="refer-banner">
          <div className="refer-text">
            <div className="refer-title">👥 Dosto ko Invite karo!</div>
            <div className="refer-desc">Har referral pe ₹5 kamao — seedha wallet mein!</div>
          </div>
          <button className="refer-btn">Share 🔗</button>
        </div>

        <div style={{ height: 90 }} />
      </div>

      {/* ── BOTTOM NAV ── */}
      <div className="bottom-nav">
        {[
          { key: 'home',    icon: '🏠', label: 'Home',    path: null     },
          { key: 'store',   icon: '🛒', label: 'Store',   path: '/store' },
          { key: 'wallet',  icon: '💰', label: 'Wallet',  path: null     },
          { key: 'profile', icon: '👤', label: 'Profile', path: null     },
        ].map(tab => (
          <button
            key={tab.key}
            className={`nav-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => { setActiveTab(tab.key); if (tab.path) navigate(tab.path); }}
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
              Minimum withdrawal: <b>500 Coins (₹50)</b><br />
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
