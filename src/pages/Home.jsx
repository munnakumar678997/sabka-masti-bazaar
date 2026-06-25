import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import DailyCheckIn from './DailyCheckIn';
import BottomNav from '../components/BottomNav';
import '../styles/home.css';

const TASKS = [
  { id: 1, icon: '📺', title: 'Video dekho',          desc: 'Ek video dekho aur kamao',       coins: 5,  tag: 'Easy' },
  { id: 2, icon: '📲', title: 'App install karo',     desc: 'Naya app install karo',          coins: 20, tag: 'Hot'  },
  { id: 3, icon: '🔗', title: 'Link share karo',      desc: 'Apna link share karo',           coins: 10, tag: 'Easy' },
  { id: 4, icon: '📝', title: 'Survey bharo',         desc: '2 min ka survey complete karo',  coins: 15, tag: 'New'  },
  { id: 5, icon: '👥', title: 'Friend ko refer karo', desc: 'Dost ko invite karo',            coins: 50, tag: 'Big'  },
];

// Daily task limit — localStorage based daily tracking
function getTodayKey() {
  const istMs = Date.now() + 5.5 * 60 * 60 * 1000;
  return new Date(istMs).toISOString().split('T')[0];
}
function getTaskUsed(taskId) {
  try { return localStorage.getItem(`smb_task_${taskId}_${getTodayKey()}`) === '1'; }
  catch { return false; }
}
function markTaskUsed(taskId) {
  try { localStorage.setItem(`smb_task_${taskId}_${getTodayKey()}`, '1'); } catch {}
}


export default function Home() {
  const navigate = useNavigate();
  const { user, balance, streak, completeTask, tasksCompleted, referrals, notifUnreadCount } = useApp();

  const [showWithdraw, setShowWithdraw] = useState(false);
  const [avatarError,  setAvatarError]  = useState(false);

  // Popup open hone pe body scroll lock karo
  useEffect(() => {
    if (showWithdraw) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showWithdraw]);

  const [taskDone,     setTaskDone]     = useState(() =>
    Object.fromEntries(TASKS.map(t => [t.id, getTaskUsed(t.id)]))
  );

  // Topbar — user ka naam aur photo
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
          {TASKS.map(task => {
            const done = taskDone[task.id];
            return (
              <div key={task.id} className={`task-card ${done ? 'task-card-done' : ''}`}>
                <div className="task-icon-wrap">{done ? '✅' : task.icon}</div>
                <div className="task-info">
                  <div className="task-title-row">
                    <span className="task-title">{task.title}</span>
                    <span className={`task-tag tag-${task.tag.toLowerCase()}`}>{task.tag}</span>
                  </div>
                  <div className="task-desc">{done ? 'Aaj ka done! Kal dobara karo.' : task.desc}</div>
                </div>
                <button
                  className={`task-claim-btn ${done ? 'task-claim-done' : ''}`}
                  disabled={done}
                  onClick={async () => {
                    if (done) return;
                    // Task 5 = "Friend ko refer karo" — sirf actual referral pe coins milte hain
                    // Yahan sirf navigate karo, coins auto milenge jab dost join kare
                    if (task.id === 5) {
                      markTaskUsed(task.id);
                      setTaskDone(prev => ({ ...prev, [task.id]: true }));
                      navigate('/referral');
                      return;
                    }
                    markTaskUsed(task.id);
                    setTaskDone(prev => ({ ...prev, [task.id]: true }));
                    await completeTask(task.coins);
                  }}
                >
                  <span className="task-coins">
                    {done ? '✅ Done' : task.id === 5 ? '👥 Refer Karo' : `+${task.coins} 🪙`}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

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
