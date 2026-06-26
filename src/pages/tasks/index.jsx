import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import TaskActionModal from './TaskActionModal';
import '../../styles/tasks.css';

/*
 * ═══════════════════════════════════════════════════════════
 *  TASKS CONFIG — Categories mein divide kiya gaya hai
 *
 *  action types:
 *    'video'   — Ad dekho, timer auto-starts
 *    'install' — App kholo (link), timer starts after click
 *    'survey'  — Survey kholo (link), timer starts
 *    'share'   — Web Share API / clipboard copy
 *    'visit'   — Link visit karo, timer starts
 *
 *  waitSec: kitne seconds timer chalega
 *  link:    install/survey/visit tasks ke liye URL
 * ═══════════════════════════════════════════════════════════
 */

export const TASK_CATEGORIES = [
  {
    id: 'daily',
    title: '📅 Daily Tasks',
    subtitle: 'Roz karo, roz kamao',
    color: '#ff6a00',
    tasks: [
      {
        id: 1, icon: '📺', title: 'Video Ad dekho',
        desc: '10 sec ka ad dekho aur kamao',
        coins: 5, tag: 'Easy',
        action: 'video', waitSec: 10,
        actionTitle: '📺 Video Dekho & Kamao',
        actionDesc: 'Ad load hone ke baad timer start hoga — poora dekho phir reward lo!',
      },
      {
        id: 2, icon: '🎬', title: 'Bonus Video dekho',
        desc: 'Ek aur video dekho — double reward',
        coins: 8, tag: 'Hot',
        action: 'video', waitSec: 10,
        actionTitle: '🎬 Bonus Video & Kamao',
        actionDesc: 'Bonus ad dekho aur extra coins kamao!',
      },
      {
        id: 3, icon: '📝', title: 'Survey bharo',
        desc: '2 min ka quick survey complete karo',
        coins: 15, tag: 'New',
        action: 'survey', waitSec: 30,
        link: 'https://forms.gle/SMB2024survey',
        actionTitle: '📝 Survey Complete Karo',
        actionDesc: 'Ad dekhne ke baad → Survey kholo → Bharo → Claim karo!',
      },
    ],
  },
  {
    id: 'social',
    title: '📲 Social Tasks',
    subtitle: 'Share karo, zyada kamao',
    color: '#0ea5e9',
    tasks: [
      {
        id: 4, icon: '📲', title: 'App install karo',
        desc: 'Naya app install karke kamao',
        coins: 20, tag: 'Hot',
        action: 'install', waitSec: 15,
        link: 'https://play.google.com/store/apps',
        actionTitle: '📲 App Install Karo',
        actionDesc: 'Ad dekhne ke baad → App kholo → Install karo → Claim karo!',
      },
      {
        id: 5, icon: '🔗', title: 'App share karo',
        desc: 'Doston ke saath app share karo',
        coins: 10, tag: 'Easy',
        action: 'share',
        actionTitle: '🔗 App Share Karo',
        actionDesc: 'Apna referral link doston ke saath share karo aur coins kamao!',
      },
      {
        id: 6, icon: '📢', title: 'Telegram join karo',
        desc: 'Hamara Telegram channel join karo',
        coins: 12, tag: 'Easy',
        action: 'visit', waitSec: 8,
        link: 'https://t.me/SabkaMastiBazaar',
        actionTitle: '📢 Telegram Join Karo',
        actionDesc: 'Ad dekhne ke baad → Channel kholo → Join karo → Claim karo!',
      },
    ],
  },
  {
    id: 'special',
    title: '🎁 Special Tasks',
    subtitle: 'Zyada kaam, zyada inam',
    color: '#a855f7',
    tasks: [
      {
        id: 7, icon: '🌐', title: 'Website visit karo',
        desc: 'Partner website visit karke kamao',
        coins: 8, tag: 'Easy',
        action: 'visit', waitSec: 12,
        link: 'https://sabka-masti-bazaar-71333.web.app',
        actionTitle: '🌐 Website Visit Karo',
        actionDesc: 'Ad dekhne ke baad → Website kholo → Visit karo → Claim karo!',
      },
      {
        id: 8, icon: '⭐', title: 'App rate karo',
        desc: '5 star rating dekar kamao',
        coins: 25, tag: 'Big',
        action: 'visit', waitSec: 20,
        link: 'https://t.me/SabkaMastiBazaarBot',
        actionTitle: '⭐ App Rate Karo',
        actionDesc: 'Ad dekhne ke baad → App kholo → 5 star do → Claim karo!',
      },
      {
        id: 9, icon: '💬', title: 'Bot se baat karo',
        desc: 'Telegram bot start karke reward lo',
        coins: 10, tag: 'New',
        action: 'visit', waitSec: 10,
        link: 'https://t.me/SabkaMastiBazaarBot',
        actionTitle: '💬 Bot Start Karo',
        actionDesc: 'Ad dekhne ke baad → Bot kholo → /start bhejo → Claim karo!',
      },
    ],
  },
];

export const TASKS = TASK_CATEGORIES.flatMap(c => c.tasks);

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

const TAG_COLORS = {
  easy: '#22c55e',
  hot:  '#ef4444',
  new:  '#3b82f6',
  big:  '#f59e0b',
};

export default function TaskSection() {
  const navigate = useNavigate();
  const { user, completeTask, recordTaskCompletion } = useApp();

  const [taskDone, setTaskDone] = useState(() =>
    Object.fromEntries(TASKS.map(t => [t.id, getTaskUsed(t.id)]))
  );
  const [activeTask, setActiveTask] = useState(null);

  const referralLink = user?.ref_code
    ? `https://t.me/SabkaMastiBazaarBot?start=${user.ref_code}`
    : 'https://t.me/SabkaMastiBazaarBot';

  const handleTaskClick = (task) => {
    if (taskDone[task.id]) return;
    setActiveTask(task);
  };

  const handleClaim = async () => {
    if (!activeTask) return;
    const t = activeTask;
    setActiveTask(null);
    markTaskUsed(t.id);
    setTaskDone(prev => ({ ...prev, [t.id]: true }));
    recordTaskCompletion(t.id).catch(() => {});
    await completeTask(t.coins);
  };

  const totalDone  = TASKS.filter(t => taskDone[t.id]).length;
  const totalTasks = TASKS.length;
  const totalCoinsLeft = TASKS.reduce((s, t) => s + (taskDone[t.id] ? 0 : t.coins), 0);

  return (
    <div className="tsec-wrap">

      {/* ── Master Header ── */}
      <div className="tsec-master-header">
        <div className="tsec-master-left">
          <span className="tsec-master-title">⚡ Earning Tasks</span>
          <span className="tsec-master-sub">Roz karo, roz kamao!</span>
        </div>
        <div className="tsec-master-right">
          <div className="tsec-master-count">{totalDone}/{totalTasks}</div>
          <div className="tsec-master-count-lbl">done</div>
        </div>
      </div>

      {/* ── Total coins left banner ── */}
      {totalCoinsLeft > 0 && (
        <div className="tsec-coins-banner">
          <span className="tsec-coins-banner-icon">🪙</span>
          <span className="tsec-coins-banner-txt">
            Aaj aur <b>{totalCoinsLeft} coins</b> kama sakte ho!
          </span>
        </div>
      )}

      {/* ── Progress bar ── */}
      <div className="tsec-progress-bar-wrap">
        <div className="tsec-progress-bar">
          <div
            className="tsec-progress-fill"
            style={{ width: `${(totalDone / totalTasks) * 100}%` }}
          />
        </div>
        <span className="tsec-progress-pct">
          {Math.round((totalDone / totalTasks) * 100)}%
        </span>
      </div>

      {/* ── Category Sections ── */}
      {TASK_CATEGORIES.map(cat => {
        const catDone = cat.tasks.filter(t => taskDone[t.id]).length;
        return (
          <div key={cat.id} className="tsec-category">

            {/* Category Header */}
            <div className="tsec-cat-header">
              <div className="tsec-cat-left">
                <span className="tsec-cat-title" style={{ color: cat.color }}>{cat.title}</span>
                <span className="tsec-cat-sub">{cat.subtitle}</span>
              </div>
              <span className="tsec-cat-badge" style={{
                background: `${cat.color}22`,
                color: cat.color,
                border: `1px solid ${cat.color}44`,
              }}>
                {catDone}/{cat.tasks.length}
              </span>
            </div>

            {/* Task Cards */}
            <div className="tsec-list">
              {cat.tasks.map(task => {
                const done = taskDone[task.id];
                const tagColor = TAG_COLORS[task.tag.toLowerCase()] || '#888';
                return (
                  <div
                    key={task.id}
                    className={`tcard ${done ? 'tcard-done' : ''}`}
                    style={{ '--cat-color': cat.color }}
                    onClick={() => handleTaskClick(task)}
                  >
                    {/* Left accent */}
                    <div className="tcard-accent" style={{ background: done ? 'rgba(255,255,255,0.1)' : cat.color }} />

                    {/* Icon */}
                    <div className={`tcard-icon-wrap ${done ? 'tcard-icon-done' : ''}`}
                      style={!done ? {
                        background: `${cat.color}18`,
                        borderColor: `${cat.color}44`,
                      } : {}}>
                      <span className="tcard-icon">{done ? '✅' : task.icon}</span>
                    </div>

                    {/* Info */}
                    <div className="tcard-info">
                      <div className="tcard-top-row">
                        <span className="tcard-title">{task.title}</span>
                        <span
                          className="tcard-tag"
                          style={{ background: `${tagColor}22`, color: tagColor, border: `1px solid ${tagColor}44` }}
                        >
                          {task.tag}
                        </span>
                      </div>
                      <div className="tcard-desc">
                        {done ? '✓ Aaj ka complete! Kal dobara aao.' : task.desc}
                      </div>
                      {!done && (
                        <div className="tcard-ad-hint">🎬 Ad dekhne ke baad milega</div>
                      )}
                    </div>

                    {/* Reward button */}
                    <button
                      className={`tcard-btn ${done ? 'tcard-btn-done' : ''}`}
                      disabled={done}
                      style={!done ? { background: `linear-gradient(135deg, ${cat.color}, ${cat.color}bb)` } : {}}
                      onClick={e => { e.stopPropagation(); handleTaskClick(task); }}
                    >
                      {done
                        ? <span>✅</span>
                        : <span className="tcard-btn-coins">+{task.coins}<br />🪙</span>
                      }
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* ── All done message ── */}
      {totalDone === totalTasks && (
        <div className="tsec-all-done">
          <span className="tsec-all-done-icon">🎉</span>
          <span className="tsec-all-done-txt">Aaj ke saare tasks complete! Kal dobara aao.</span>
        </div>
      )}

      {/* ── Task Action Modal ── */}
      {activeTask && (
        <TaskActionModal
          task={activeTask}
          referralLink={referralLink}
          onClaim={handleClaim}
          onClose={() => setActiveTask(null)}
        />
      )}
    </div>
  );
}
