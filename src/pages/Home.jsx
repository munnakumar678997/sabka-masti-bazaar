import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import DailyCheckIn from '../components/DailyCheckIn';
import BottomNav from '../components/BottomNav';
import '../styles/home.css';

export default function Home() {
  const navigate = useNavigate();
  const { user, balance, streak, referrals,
          notifUnreadCount } = useApp();

  const [showWithdraw, setShowWithdraw] = useState(false);
  const [avatarError,  setAvatarError]  = useState(false);

  useEffect(() => {
    document.body.style.overflow = showWithdraw ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showWithdraw]);

  const rawName      = user?.name?.trim() || user?.username || '';
  const displayName  = rawName || 'User';
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const photoUrl     = (!avatarError && user?.photo_url) || null;

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
                onError={() => setAvatarError(true)}
              />
            ) : (
              <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{avatarLetter}</span>
            )}
          </div>
          <div className="topbar-name">{displayName}</div>
        </div>
        <div className="topbar-right">
          <div className="topbar-notif-btn" onClick={() => navigate('/notifications')}>
            <span className="notif-bell">🔔</span>
            {notifUnreadCount > 0 && (
              <span className="notif-badge">{notifUnreadCount}</span>
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
            <div className="stat-icon">🔥</div>
            <div className="stat-val">{streak}</div>
            <div className="stat-lbl">Day Streak</div>
          </div>
          <div className="stat-box">
            <div className="stat-icon">👥</div>
            <div className="stat-val">{referrals}</div>
            <div className="stat-lbl">Referrals</div>
          </div>
          <div className="stat-box">
            <div className="stat-icon">📅</div>
            <div className="stat-val">{user?.total_checkins || 0}</div>
            <div className="stat-lbl">Check-ins</div>
          </div>
        </div>

        {/* ── DAILY CHECK-IN ── */}
        <DailyCheckIn />

        <div style={{ height: 90 }} />
      </div>

      <BottomNav />

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
              ? <button className="popup-main-btn" onClick={() => { setShowWithdraw(false); navigate('/wallet'); }}>🏦 Wallet Pe Jao</button>
              : <div className="popup-low">Abhi balance kam hai — Daily Check-in karo aur kamao!</div>
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
