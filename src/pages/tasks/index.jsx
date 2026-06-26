import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import TaskActionModal from './TaskActionModal';
import '../../styles/tasks.css';

/*
 * ═══════════════════════════════════════════════════════════
 *  TASKS CONFIG
 *
 *  action types:
 *    'video'   — Ad dekho, timer auto-starts after ad loads
 *    'install' — App kholo (link), timer starts after click
 *    'survey'  — Survey kholo (link), timer starts after click
 *    'share'   — Web Share API / clipboard copy
 *    'refer'   — Referral page pe navigate (no modal)
 *
 *  waitSec: kitne seconds timer chalega
 *  link:    install/survey tasks ke liye URL
 * ═══════════════════════════════════════════════════════════
 */
export const TASKS = [
  {
    id: 1, icon: '📺', title: 'Video dekho',
    desc: 'Ek video dekho aur kamao',
    coins: 5, tag: 'Easy',
    action: 'video', waitSec: 10,
    actionTitle: '📺 Video Dekho & Kamao',
    actionDesc: 'Ad load hone ke baad timer start hoga — poora dekho phir reward lo!',
  },
  {
    id: 2, icon: '📲', title: 'App install karo',
    desc: 'Naya app install karo',
    coins: 20, tag: 'Hot',
    action: 'install', waitSec: 15,
    link: 'https://play.google.com/store/apps',
    actionTitle: '📲 App Install Karo',
    actionDesc: 'Ad dekhne ke baad → App kholo → Install karo → Claim karo!',
  },
  {
    id: 3, icon: '🔗', title: 'Link share karo',
    desc: 'Apna link share karo',
    coins: 10, tag: 'Easy',
    action: 'share',
    actionTitle: '🔗 Link Share Karo',
    actionDesc: 'Apna referral link doston ke saath share karo!',
  },
  {
    id: 4, icon: '📝', title: 'Survey bharo',
    desc: '2 min ka survey complete karo',
    coins: 15, tag: 'New',
    action: 'survey', waitSec: 30,
    link: 'https://forms.gle/SMB2024survey',
    actionTitle: '📝 Survey Complete Karo',
    actionDesc: 'Ad dekhne ke baad → Survey kholo → Bharo → Claim karo!',
  },
  {
    id: 5, icon: '👥', title: 'Friend ko refer karo',
    desc: 'Dost ko invite karo',
    coins: 50, tag: 'Big',
    action: 'refer',
    actionTitle: '👥 Dost ko Invite Karo',
    actionDesc: 'Referral link se dost ko bulao — join karne pe 50 coins!',
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

const TAG_COLORS = {
  easy: '#22c55e',
  hot:  '#ef4444',
  new:  '#3b82f6',
  big:  '#f59e0b',
};

export default function TaskSection() {
  const navigate = useNavigate();
  const { user, completeTask, recordTaskCompletion } = useApp();

  const [taskDone,   setTaskDone]   = useState(() =>
    Object.fromEntries(TASKS.map(t => [t.id, getTaskUsed(t.id)]))
  );
  const [activeTask, setActiveTask] = useState(null);

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
    const t = activeTask;
    setActiveTask(null);
    markTaskUsed(t.id);
    setTaskDone(prev => ({ ...prev, [t.id]: true }));
    recordTaskCompletion(t.id).catch(() => {});
    await completeTask(t.coins);
  };

  const doneCount  = TASKS.filter(t => taskDone[t.id]).length;
  const totalCoins = TASKS.reduce((s, t) => s + (taskDone[t.id] ? 0 : t.coins), 0);

  return (
    <div className="tsec-wrap">

      {/* ── Section Header ── */}
      <div className="tsec-header">
        <div className="tsec-title-row">
          <span className="tsec-title">⚡ Earning Tasks</span>
          <span className="tsec-progress">{doneCount}/{TASKS.length} done</span>
        </div>
        {totalCoins > 0 && (
          <div className="tsec-potential">
            🪙 {totalCoins} coins aur kamaao!
          </div>
        )}
      </div>

      {/* ── Task Cards ── */}
      <div className="tsec-list">
        {TASKS.map(task => {
          const done = taskDone[task.id];
          const tagColor = TAG_COLORS[task.tag.toLowerCase()] || '#888';
          return (
            <div
              key={task.id}
              className={`tcard ${done ? 'tcard-done' : ''}`}
              onClick={() => handleTaskClick(task)}
            >
              {/* Icon */}
              <div className={`tcard-icon-wrap ${done ? 'tcard-icon-done' : ''}`}>
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
                {!done && task.action !== 'refer' && (
                  <div className="tcard-ad-hint">
                    🎬 Ad dekhne ke baad milega
                  </div>
                )}
              </div>

              {/* Reward button */}
              <button
                className={`tcard-btn ${done ? 'tcard-btn-done' : ''}`}
                disabled={done}
                onClick={e => { e.stopPropagation(); handleTaskClick(task); }}
              >
                {done
                  ? <span>✅</span>
                  : task.id === 5
                    ? <span className="tcard-btn-refer">👥<br />Refer</span>
                    : <span className="tcard-btn-coins">+{task.coins}<br />🪙</span>
                }
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Task Action Modal (ad-gated) ── */}
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
