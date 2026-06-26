import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import TaskActionModal from './TaskActionModal';
import '../../styles/tasks.css';

/*
 * ═══════════════════════════════════════════════════════════
 *  TASKS CONFIG
 *
 *  resetType:
 *    'daily' → har roz midnight IST pe reset hota hai
 *    '4h'    → har 4 ghante ke baad reset hota hai
 *
 *  action types:
 *    'video'   — Ad dekho, timer auto-starts
 *    'install' — App kholo (link), timer starts after click
 *    'survey'  — Survey kholo (link), timer starts
 *    'share'   — Web Share API / clipboard copy
 *    'visit'   — Link visit karo, timer starts
 * ═══════════════════════════════════════════════════════════
 */

export const TASK_CATEGORIES = [
  {
    id: 'daily',
    title: '🌅 Daily Tasks',
    subtitle: 'Har roz midnight pe reset hota hai',
    color: '#f59e0b',
    resetLabel: 'Daily',
    resetType: 'daily',
    tasks: [
      {
        id: 'd1', icon: '📺', title: 'Video Ad dekho',
        desc: '10 sec ka ad dekho aur coins kamao',
        coins: 5, tag: 'Daily', resetType: 'daily',
        action: 'video', waitSec: 10,
        actionTitle: '📺 Video Dekho & Kamao',
        actionDesc: 'Ad load hone ke baad timer start hoga — poora dekho phir claim karo!',
      },
      {
        id: 'd2', icon: '🎬', title: 'Bonus Video dekho',
        desc: 'Ek aur video — double reward kamao',
        coins: 10, tag: 'Daily', resetType: 'daily',
        action: 'video', waitSec: 10,
        actionTitle: '🎬 Bonus Video Dekho & Kamao',
        actionDesc: 'Bonus ad dekho aur extra coins lo!',
      },
      {
        id: 'd3', icon: '📝', title: 'Survey bharo',
        desc: '2 min ka quick survey complete karo',
        coins: 15, tag: 'Daily', resetType: 'daily',
        action: 'survey', waitSec: 30,
        link: 'https://forms.gle/SMB2024survey',
        actionTitle: '📝 Survey Bharo & Kamao',
        actionDesc: 'Ad ke baad → Survey kholo → Bharo → Claim karo!',
      },
      {
        id: 'd4', icon: '🔗', title: 'App share karo',
        desc: 'Doston ke saath app share karo',
        coins: 8, tag: 'Daily', resetType: 'daily',
        action: 'share',
        actionTitle: '🔗 App Share Karo',
        actionDesc: 'Apna referral link share karo aur daily coins kamao!',
      },
    ],
  },
  {
    id: '4hour',
    title: '⏰ 4-Hour Tasks',
    subtitle: 'Har 4 ghante mein dobara karo',
    color: '#a855f7',
    resetLabel: '4H',
    resetType: '4h',
    tasks: [
      {
        id: 'h1', icon: '🔥', title: 'Ad Watch Zone 1',
        desc: 'Ad dekho — har 4 ghante mein kamao',
        coins: 5, tag: '4H', resetType: '4h',
        action: 'video', waitSec: 10,
        actionTitle: '🔥 Zone 1 Ad Dekho',
        actionDesc: 'Ad dekho aur har 4 ghante mein yeh coins kamao!',
      },
      {
        id: 'h2', icon: '💎', title: 'Ad Watch Zone 2',
        desc: 'Doosra zone — alag network, alag reward',
        coins: 8, tag: '4H', resetType: '4h',
        action: 'video', waitSec: 10,
        actionTitle: '💎 Zone 2 Ad Dekho',
        actionDesc: 'Zone 2 ka ad dekho aur reward lo!',
      },
      {
        id: 'h3', icon: '⚡', title: 'Ad Watch Zone 3',
        desc: 'Teesra zone — aur coins kamao',
        coins: 6, tag: '4H', resetType: '4h',
        action: 'video', waitSec: 10,
        actionTitle: '⚡ Zone 3 Ad Dekho',
        actionDesc: 'Zone 3 ka ad dekho aur coins lo!',
      },
      {
        id: 'h4', icon: '💰', title: 'Bonus Ad Watch',
        desc: 'Bonus round — sabse zyada reward',
        coins: 12, tag: '4H', resetType: '4h',
        action: 'video', waitSec: 10,
        actionTitle: '💰 Bonus Ad Dekho',
        actionDesc: 'Bonus round — sabse zyada coins yahan milte hain!',
      },
      {
        id: 'h5', icon: '🎯', title: 'Lucky Ad Watch',
        desc: 'Lucky round — special reward chance',
        coins: 10, tag: '4H', resetType: '4h',
        action: 'video', waitSec: 10,
        actionTitle: '🎯 Lucky Ad Dekho',
        actionDesc: 'Lucky round ka ad dekho aur special reward lo!',
      },
    ],
  },
];

export const TASKS = TASK_CATEGORIES.flatMap(c => c.tasks);

/* ──────────────────────────────────────────
   Cooldown helpers
────────────────────────────────────────── */
function getTodayKey() {
  const istMs = Date.now() + 5.5 * 60 * 60 * 1000;
  return new Date(istMs).toISOString().split('T')[0];
}

function getMsUntilMidnightIST() {
  const nowMs = Date.now();
  const istMs = nowMs + 5.5 * 60 * 60 * 1000;
  const istDate = new Date(istMs);
  const nextMidnight = new Date(Date.UTC(
    istDate.getUTCFullYear(),
    istDate.getUTCMonth(),
    istDate.getUTCDate() + 1,
    18, 30, 0, 0   // 18:30 UTC = 00:00 IST next day
  ));
  return nextMidnight.getTime() - nowMs;
}

function getTaskState(task) {
  try {
    if (task.resetType === 'daily') {
      const done = localStorage.getItem(`smb_task_${task.id}_${getTodayKey()}`) === '1';
      if (!done) return { done: false, cooldownMs: 0 };
      return { done: true, cooldownMs: getMsUntilMidnightIST() };
    } else {
      const stored = parseInt(localStorage.getItem(`smb_task_4h_${task.id}`) || '0');
      const elapsed = Date.now() - stored;
      const FOUR_H = 4 * 60 * 60 * 1000;
      if (!stored || elapsed >= FOUR_H) return { done: false, cooldownMs: 0 };
      return { done: true, cooldownMs: FOUR_H - elapsed };
    }
  } catch { return { done: false, cooldownMs: 0 }; }
}

function markTaskDone(task) {
  try {
    if (task.resetType === 'daily') {
      localStorage.setItem(`smb_task_${task.id}_${getTodayKey()}`, '1');
    } else {
      localStorage.setItem(`smb_task_4h_${task.id}`, Date.now().toString());
    }
  } catch {}
}

function fmtCooldown(ms) {
  if (ms <= 0) return null;
  const sec = Math.ceil(ms / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2,'0')}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2,'0')}s`;
  return `${s}s`;
}

/* ──────────────────────────────────────────
   Build initial state from localStorage
────────────────────────────────────────── */
function buildInitState() {
  return Object.fromEntries(
    TASKS.map(t => [t.id, getTaskState(t)])
  );
}

const TAG_COLORS = {
  daily: '#f59e0b',
  '4h':  '#a855f7',
};

/* ──────────────────────────────────────────
   Main Component
────────────────────────────────────────── */
export default function TaskSection() {
  const { user, completeTask, recordTaskCompletion } = useApp();

  const [taskState, setTaskState] = useState(buildInitState);
  const [activeTask, setActiveTask] = useState(null);

  const referralLink = user?.ref_code
    ? `https://t.me/SabkaMastiBazaarBot?start=${user.ref_code}`
    : 'https://t.me/SabkaMastiBazaarBot';

  /* Live countdown — har second update */
  useEffect(() => {
    const id = setInterval(() => {
      setTaskState(prev => {
        const next = { ...prev };
        let changed = false;
        TASKS.forEach(t => {
          const cur = prev[t.id];
          if (cur.done && cur.cooldownMs > 0) {
            const newMs = cur.cooldownMs - 1000;
            if (newMs <= 0) {
              next[t.id] = { done: false, cooldownMs: 0 };
            } else {
              next[t.id] = { done: true, cooldownMs: newMs };
            }
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const handleTaskClick = useCallback((task) => {
    if (taskState[task.id]?.done) return;
    setActiveTask(task);
  }, [taskState]);

  const handleClaim = async () => {
    if (!activeTask) return;
    const t = activeTask;
    setActiveTask(null);
    markTaskDone(t);
    setTaskState(prev => ({
      ...prev,
      [t.id]: {
        done: true,
        cooldownMs: t.resetType === 'daily' ? getMsUntilMidnightIST() : 4 * 60 * 60 * 1000,
      },
    }));
    recordTaskCompletion?.(t.id)?.catch(() => {});
    await completeTask(t.coins);
  };

  /* Stats */
  const totalTasks = TASKS.length;
  const totalDone  = TASKS.filter(t => taskState[t.id]?.done).length;
  const totalCoinsLeft = TASKS.reduce((s, t) => s + (taskState[t.id]?.done ? 0 : t.coins), 0);

  return (
    <div className="tsec-wrap">

      {/* ── Master Header ── */}
      <div className="tsec-master-header">
        <div className="tsec-master-left">
          <span className="tsec-master-title">⚡ Earning Tasks</span>
          <span className="tsec-master-sub">Karo, kamao, dobara karo!</span>
        </div>
        <div className="tsec-master-right">
          <div className="tsec-master-count">{totalDone}/{totalTasks}</div>
          <div className="tsec-master-count-lbl">active</div>
        </div>
      </div>

      {/* ── Coins left banner ── */}
      {totalCoinsLeft > 0 && (
        <div className="tsec-coins-banner">
          <span className="tsec-coins-banner-icon">🪙</span>
          <span className="tsec-coins-banner-txt">
            Abhi <b>{totalCoinsLeft} coins</b> kama sakte ho!
          </span>
        </div>
      )}

      {/* ── Progress bar ── */}
      <div className="tsec-progress-bar-wrap">
        <div className="tsec-progress-bar">
          <div
            className="tsec-progress-fill"
            style={{ width: `${totalTasks ? (totalDone / totalTasks) * 100 : 0}%` }}
          />
        </div>
        <span className="tsec-progress-pct">
          {totalTasks ? Math.round((totalDone / totalTasks) * 100) : 0}%
        </span>
      </div>

      {/* ── Category Sections ── */}
      {TASK_CATEGORIES.map(cat => {
        const catDone = cat.tasks.filter(t => taskState[t.id]?.done).length;
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
                const state    = taskState[task.id] || { done: false, cooldownMs: 0 };
                const onCooldown = state.done;
                const cdStr    = fmtCooldown(state.cooldownMs);
                const tagColor = TAG_COLORS[task.tag.toLowerCase()] || '#888';

                return (
                  <div
                    key={task.id}
                    className={`tcard ${onCooldown ? 'tcard-cooldown' : ''}`}
                    style={{ '--cat-color': cat.color }}
                    onClick={() => !onCooldown && handleTaskClick(task)}
                  >
                    {/* Left accent */}
                    <div className="tcard-accent"
                      style={{ background: onCooldown ? 'rgba(255,255,255,0.06)' : cat.color }} />

                    {/* Icon */}
                    <div className={`tcard-icon-wrap ${onCooldown ? 'tcard-icon-cd' : ''}`}
                      style={!onCooldown ? {
                        background: `${cat.color}18`,
                        borderColor: `${cat.color}44`,
                      } : {}}>
                      <span className="tcard-icon">
                        {onCooldown ? (task.resetType === 'daily' ? '✅' : '⏳') : task.icon}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="tcard-info">
                      <div className="tcard-top-row">
                        <span className="tcard-title">{task.title}</span>
                        <span className="tcard-tag"
                          style={{ background: `${tagColor}22`, color: tagColor, border: `1px solid ${tagColor}44` }}>
                          {task.tag}
                        </span>
                      </div>
                      {onCooldown ? (
                        <div className="tcard-cd-info">
                          {task.resetType === 'daily'
                            ? <span className="tcard-cd-done">✓ Aaj complete! Kal dobara milega</span>
                            : <span className="tcard-cd-timer">🔄 Dobara milega: <b>{cdStr}</b></span>
                          }
                        </div>
                      ) : (
                        <>
                          <div className="tcard-desc">{task.desc}</div>
                          <div className="tcard-ad-hint">🎬 Ad dekhne ke baad milega</div>
                        </>
                      )}
                    </div>

                    {/* Reward / Cooldown button */}
                    <button
                      className={`tcard-btn ${onCooldown ? 'tcard-btn-cd' : ''}`}
                      disabled={onCooldown}
                      style={!onCooldown ? { background: `linear-gradient(135deg, ${cat.color}, ${cat.color}bb)` } : {}}
                      onClick={e => { e.stopPropagation(); !onCooldown && handleTaskClick(task); }}
                    >
                      {onCooldown
                        ? (task.resetType === 'daily'
                          ? <span className="tcard-btn-cd-txt">✅</span>
                          : <span className="tcard-btn-cd-txt" style={{ fontSize: '9px', lineHeight: 1.3 }}>{cdStr || '⏳'}</span>
                        )
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

      {/* ── All on cooldown message ── */}
      {totalDone === totalTasks && (
        <div className="tsec-all-done">
          <span className="tsec-all-done-icon">🎉</span>
          <span className="tsec-all-done-txt">
            Sab tasks complete! Daily tasks kal reset honge.<br />
            4-Hour tasks thodi der mein wapas aayenge.
          </span>
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
