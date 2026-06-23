import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/home.css';

const TASKS = [
  { id: 1, icon: '📺', title: 'Video dekho', desc: 'Ek video dekho aur kamao', coins: 5, tag: 'Easy' },
  { id: 2, icon: '📲', title: 'App install karo', desc: 'Naya app install karo', coins: 20, tag: 'Hot' },
  { id: 3, icon: '🔗', title: 'Link share karo', desc: 'Apna link share karo', coins: 10, tag: 'Easy' },
  { id: 4, icon: '📝', title: 'Survey bharo', desc: '2 min ka survey complete karo', coins: 15, tag: 'New' },
  { id: 5, icon: '👥', title: 'Friend ko refer karo', desc: 'Dost ko invite karo', coins: 50, tag: 'Big' },
];

const STREAK_DAYS = [1, 2, 3, 4, 5, 6, 7];

export default function Home() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [checkedIn, setCheckedIn] = useState(false);
  const [balance, setBalance] = useState(0);
  const [currentStreak] = useState(1);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const handleCheckIn = () => {
    if (checkedIn) return;
    setCheckedIn(true);
    setBalance(b => b + 10);
  };

  const handleTaskClaim = (coins) => {
    setBalance(b => b + coins);
  };

  return (
    <div className="home-page">

      {/* ── TOP BAR ── */}
      <div className="home-topbar">
        <div className="topbar-left">
          <div className="topbar-avatar">😊</div>
          <div>
            <div className="topbar-hello">Namaste! 👋</div>
            <div className="topbar-name">Masti Bazaar User</div>
          </div>
        </div>
        <div className="topbar-right">
          <div className="topbar-notif">🔔</div>
          <div className="topbar-settings">⚙️</div>
        </div>
      </div>

      {/* ── SCROLL AREA ── */}
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
          <div className="balance-inr">≈ ₹{(balance * 0.1).toFixed(2)} INR</div>
          <div className="balance-actions">
            <button className="bal-btn withdraw" onClick={() => setShowWithdraw(true)}>
              💸 Withdraw
            </button>
            <button className="bal-btn add" onClick={() => navigate('/tasks')}>
              ➕ Earn More
            </button>
          </div>
        </div>

        {/* ── QUICK STATS ── */}
        <div className="quick-stats">
          <div className="stat-box">
            <div className="stat-icon">🏆</div>
            <div className="stat-val">0</div>
            <div className="stat-lbl">Tasks Done</div>
          </div>
          <div className="stat-box">
            <div className="stat-icon">🔥</div>
            <div className="stat-val">{currentStreak}</div>
            <div className="stat-lbl">Day Streak</div>
          </div>
          <div className="stat-box">
            <div className="stat-icon">👥</div>
            <div className="stat-val">0</div>
            <div className="stat-lbl">Referrals</div>
          </div>
        </div>

        {/* ── DAILY CHECK-IN ── */}
        <div className="section-header">
          <span>📅 Daily Check-in</span>
          <span className="streak-badge">🔥 {currentStreak} Day Streak</span>
        </div>
        <div className="checkin-card">
          <div className="checkin-days">
            {STREAK_DAYS.map(day => (
              <div key={day} className={`day-box ${day < currentStreak ? 'done' : day === currentStreak ? 'today' : ''}`}>
                <div className="day-coin">{day < currentStreak ? '✅' : day === currentStreak ? '🪙' : '🔒'}</div>
                <div className="day-label">Day {day}</div>
                <div className="day-coins">+{day * 5}</div>
              </div>
            ))}
          </div>
          <button
            className={`checkin-btn ${checkedIn ? 'checked' : ''}`}
            onClick={handleCheckIn}
          >
            {checkedIn ? '✅ Aaj Check-in Ho Gaya!' : '🎁 Aaj ka Check-in Karo — +10 Coins'}
          </button>
        </div>

        {/* ── EARNING TASKS ── */}
        <div className="section-header">
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
              <button className="task-claim-btn" onClick={() => handleTaskClaim(task.coins)}>
                <span className="task-coins">+{task.coins} 🪙</span>
              </button>
            </div>
          ))}
        </div>

        {/* ── REFER BANNER ── */}
        <div className="refer-banner">
          <div className="refer-text">
            <div className="refer-title">👥 Dosto ko Invite karo!</div>
            <div className="refer-desc">Har referral pe ₹5 kamao — seedha wallet mein!</div>
          </div>
          <button className="refer-btn">Share 🔗</button>
        </div>

        <div style={{ height: 90 }} />
      </div>

      {/* ── BOTTOM NAVIGATION ── */}
      <div className="bottom-nav">
        {[
          { key: 'home',    icon: '🏠', label: 'Home' },
          { key: 'tasks',   icon: '📋', label: 'Tasks' },
          { key: 'wallet',  icon: '💰', label: 'Wallet' },
          { key: 'profile', icon: '👤', label: 'Profile' },
        ].map(tab => (
          <button
            key={tab.key}
            className={`nav-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="nav-icon">{tab.icon}</span>
            <span className="nav-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── WITHDRAW POPUP ── */}
      {showWithdraw && (
        <div className="popup-overlay" onClick={() => setShowWithdraw(false)}>
          <div className="popup-box" onClick={e => e.stopPropagation()}>
            <div className="popup-emoji">💸</div>
            <div className="popup-title">Withdrawal</div>
            <div className="popup-desc">
              Minimum withdrawal: <b>500 Coins (₹50)</b><br />
              Tumhare paas abhi <b>{balance} Coins</b> hain.
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
