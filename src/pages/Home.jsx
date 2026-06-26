import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import DailyCheckIn from './DailyCheckIn';
import BottomNav from '../components/BottomNav';
import '../styles/home.css';

const TASKS = [
  {
    id: 1, icon: '📺', title: 'Video dekho',
    desc: 'Ek video dekho aur kamao',
    coins: 5, tag: 'Easy', action: 'video', waitSec: 10,
    actionTitle: '📺 Video Dekho & Kamao',
    actionDesc: 'Timer poora hone tak video dekho — phir reward lo!',
  },
  {
    id: 2, icon: '📲', title: 'App install karo',
    desc: 'Naya app install karo',
    coins: 20, tag: 'Hot', action: 'install', waitSec: 15,
    link: 'https://play.google.com/store/apps',
    actionTitle: '📲 App Install Karo',
    actionDesc: '"App Kholo" button dabaao → install karo → wapas aao → Claim karo!',
  },
  {
    id: 3, icon: '🔗', title: 'Link share karo',
    desc: 'Apna link share karo',
    coins: 10, tag: 'Easy', action: 'share',
    actionTitle: '🔗 Link Share Karo',
    actionDesc: 'Apna referral link doston ke saath share karo!',
  },
  {
    id: 4, icon: '📝', title: 'Survey bharo',
    desc: '2 min ka survey complete karo',
    coins: 15, tag: 'New', action: 'survey', waitSec: 30,
    link: 'https://forms.gle/SMB2024survey',
    actionTitle: '📝 Survey Complete Karo',
    actionDesc: '"Survey Kholo" dabaao → 2 min mein bharo → wapas aao → Claim karo!',
  },
  {
    id: 5, icon: '👥', title: 'Friend ko refer karo',
    desc: 'Dost ko invite karo',
    coins: 50, tag: 'Big', action: 'refer',
    actionTitle: '👥 Dost ko Invite Karo',
    actionDesc: 'Referral link se dost ko bulao — jab dost join kare tab 50 coins milenge!',
  },
];

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

function TaskActionModal({ task, onClaim, onClose, referralLink }) {
  const [phase, setPhase]   = useState(task.action === 'video' ? 'waiting' : 'action');
  const [seconds, setSeconds] = useState(task.waitSec || 0);
  const [copied, setCopied]   = useState(false);
  const timerRef              = useRef(null);

  const startTimer = (sec) => {
    setPhase('waiting');
    setSeconds(sec || task.waitSec);
    timerRef.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          setPhase('ready');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (task.action === 'video') startTimer(task.waitSec);
    return () => clearInterval(timerRef.current);
  }, []);

  const handleActionBtn = () => {
    if (task.action === 'install' || task.action === 'survey') {
      window.open(task.link, '_blank');
      setTimeout(() => startTimer(task.waitSec), 500);
    } else if (task.action === 'share') {
      const shareText = `Sabka Masti Bazaar pe aao aur coins kamao! 🎮🪙\n${referralLink}`;
      if (navigator.share) {
        navigator.share({ title: 'Sabka Masti Bazaar', text: shareText, url: referralLink })
          .then(() => setPhase('ready'))
          .catch(() => {
            navigator.clipboard?.writeText(shareText).catch(() => {});
            setCopied(true);
            setPhase('ready');
          });
      } else {
        navigator.clipboard?.writeText(shareText).catch(() => {});
        setCopied(true);
        setPhase('ready');
      }
    }
  };

  const pct = task.waitSec ? Math.round(((task.waitSec - seconds) / task.waitSec) * 100) : 0;
  const r   = 36;
  const circ = 2 * Math.PI * r;

  return (
    <div className="task-modal-overlay" onClick={onClose}>
      <div className="task-modal-box" onClick={e => e.stopPropagation()}>
        <button className="task-modal-close" onClick={onClose}>✕</button>

        <div className="task-modal-icon-big">{task.icon}</div>
        <div className="task-modal-title">{task.actionTitle}</div>
        <div className="task-modal-desc">{task.actionDesc}</div>

        {phase === 'waiting' && (
          <div className="task-timer-wrap">
            <svg width="90" height="90" viewBox="0 0 90 90" className="task-timer-svg">
              <circle cx="45" cy="45" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
              <circle
                cx="45" cy="45" r={r}
                fill="none"
                stroke="url(#tg)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - pct / 100)}
                transform="rotate(-90 45 45)"
              />
              <defs>
                <linearGradient id="tg" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ff6a00" />
                  <stop offset="100%" stopColor="#ee0979" />
                </linearGradient>
              </defs>
            </svg>
            <div className="task-timer-center">
              <span className="task-timer-num">{seconds}</span>
              <span className="task-timer-s">sec</span>
            </div>
            <div className="task-timer-hint">
              {task.action === 'video' ? '🎬 Dekho...' : '⏳ Wait karo...'}
            </div>
          </div>
        )}

        {phase === 'action' && (task.action === 'install' || task.action === 'survey') && (
          <button className="task-action-btn" onClick={handleActionBtn}>
            {task.action === 'install' ? '📲 App Kholo' : '📝 Survey Kholo'}
          </button>
        )}

        {phase === 'action' && task.action === 'share' && (
          <button className="task-action-btn share-btn" onClick={handleActionBtn}>
            🔗 Link Share / Copy Karo
          </button>
        )}

        {phase === 'ready' && (
          <>
            {copied && (
              <div className="task-copied-note">✅ Link clipboard mein copy ho gaya!</div>
            )}
            <button className="task-claim-final-btn" onClick={onClaim}>
              🎉 Claim +{task.coins} 🪙 Coins
            </button>
          </>
        )}

        <div className="task-modal-reward-row">
          <span className="task-modal-reward-lbl">🎁 Reward:</span>
          <span className="task-modal-reward-coins">+{task.coins} 🪙</span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { user, balance, streak, completeTask, tasksCompleted, referrals,
          notifUnreadCount, recordTaskCompletion } = useApp();

  const [showWithdraw, setShowWithdraw] = useState(false);
  const [avatarError,  setAvatarError]  = useState(false);
  const [taskDone,     setTaskDone]     = useState(() =>
    Object.fromEntries(TASKS.map(t => [t.id, getTaskUsed(t.id)]))
  );
  const [activeTask,   setActiveTask]   = useState(null);

  useEffect(() => {
    document.body.style.overflow = (showWithdraw || activeTask) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showWithdraw, activeTask]);

  const rawName     = user?.name?.trim() || user?.username || '';
  const displayName = rawName || 'User';
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const photoUrl    = (!avatarError && user?.photo_url) || null;

  const referralLink = user?.ref_code
    ? `https://t.me/SabkaMastiBazaarBot?start=${user.ref_code}`
    : 'https://t.me/SabkaMastiBazaarBot';

  const handleTaskClick = (task) => {
    if (taskDone[task.id]) return;
    if (task.action === 'refer') {
      markTaskUsed(task.id);
      setTaskDone(prev => ({ ...prev, [task.id]: true }));
      recordTaskCompletion(task.id).catch(() => {});
      navigate('/referral');
      return;
    }
    setActiveTask(task);
  };

  const handleClaim = async () => {
    if (!activeTask) return;
    markTaskUsed(activeTask.id);
    setTaskDone(prev => ({ ...prev, [activeTask.id]: true }));
    recordTaskCompletion(activeTask.id).catch(() => {});
    await completeTask(activeTask.coins);
    setActiveTask(null);
  };

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

        {/* ── DAILY CHECK-IN ── */}
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
                  <div className="task-desc">
                    {done ? 'Aaj ka done! Kal dobara karo.' : task.desc}
                  </div>
                </div>
                <button
                  className={`task-claim-btn ${done ? 'task-claim-done' : ''}`}
                  disabled={done}
                  onClick={() => handleTaskClick(task)}
                >
                  <span className="task-coins">
                    {done
                      ? '✅ Done'
                      : task.id === 5
                        ? '👥 Refer Karo'
                        : `+${task.coins} 🪙`}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        <div style={{ height: 90 }} />
      </div>

      <BottomNav />

      {/* ── TASK ACTION MODAL ── */}
      {activeTask && (
        <TaskActionModal
          task={activeTask}
          referralLink={referralLink}
          onClaim={handleClaim}
          onClose={() => setActiveTask(null)}
        />
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
