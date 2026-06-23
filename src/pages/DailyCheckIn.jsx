import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import '../styles/dailyCheckIn.css';

const DAY_REWARDS = [10, 15, 25, 35, 50, 75, 100];

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

export default function DailyCheckIn() {
  const { user, streak, updateCheckIn, CHECKIN_BACKUP_KEY } = useApp();

  const [countdown,      setCountdown]      = useState(getSecsUntilISTMidnight());
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [showClaimed,    setShowClaimed]    = useState(false);
  const [claimedCoins,   setClaimedCoins]   = useState(0);

  const todayIST = getISTDateStr();

  const checkedInSupabase = user?.last_checkin_date === todayIST;
  const checkedInLocal    = typeof localStorage !== 'undefined'
    && localStorage.getItem(CHECKIN_BACKUP_KEY) === todayIST;
  const checkedIn = checkedInSupabase || checkedInLocal;

  const dayIndex    = ((streak - 1) % 7);
  const todayReward = DAY_REWARDS[checkedIn ? dayIndex : (streak % 7)];

  const isStreakBroken = useCallback(() => {
    if (!user?.last_checkin_date) return false;
    const last     = new Date(user.last_checkin_date + 'T00:00:00+05:30');
    const today    = new Date(todayIST + 'T00:00:00+05:30');
    const diffDays = Math.round((today - last) / 86400000);
    return diffDays > 1;
  }, [user?.last_checkin_date, todayIST]);

  useEffect(() => {
    const interval = setInterval(() => setCountdown(getSecsUntilISTMidnight()), 1000);
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
    setClaimedCoins(coinsEarned);
    setShowClaimed(true);
    setTimeout(() => setShowClaimed(false), 2500);
  };

  const gridDays = DAY_REWARDS.map((reward, i) => {
    const streakPos = checkedIn ? streak : streak + 1;
    const cyclePos  = ((streakPos - 1) % 7) + 1;
    let state = 'locked';
    if (i < cyclePos - 1)       state = 'done';
    else if (i === cyclePos - 1) state = checkedIn ? 'claimed' : 'today';
    return { dayNum: i + 1, reward, state };
  });

  return (
    <>
      {showClaimed && (
        <div className="ci-claim-popup">
          <div className="ci-claim-popup-inner">
            <div className="ci-popup-emoji">🎉</div>
            <div className="ci-popup-coins">+{claimedCoins} Coins Mila!</div>
            <div className="ci-popup-sub">Daily Check-in Bonus!</div>
          </div>
        </div>
      )}

      <div className="dci-section-header">
        <span className="dci-section-title">📅 Daily Check-in</span>
        {streak > 0 && (
          <span className="dci-streak-badge">🔥 {streak} Day Streak</span>
        )}
      </div>

      <div className={`dci-card ${checkedIn ? 'dci-card-done' : 'dci-card-active'}`}>
        <div className={`dci-glow-bar ${checkedIn ? 'dci-glow-green' : 'dci-glow-orange'}`} />

        <div className="dci-grid">
          {gridDays.map(({ dayNum, reward, state }) => (
            <div key={dayNum} className={`dci-day dci-day-${state}`}>
              <div className="dci-day-icon">
                {state === 'done'    ? '✅' :
                 state === 'claimed' ? '🎁' :
                 state === 'today'   ? '🪙' : '🔒'}
              </div>
              <div className="dci-day-num">Day {dayNum}</div>
              <div className="dci-day-rew">
                {state === 'done' || state === 'claimed'
                  ? <span className="dci-rew-done">Done</span>
                  : <span className={state === 'locked' ? 'dci-rew-locked' : 'dci-rew-coins'}>
                      +{reward}
                    </span>
                }
              </div>
            </div>
          ))}
        </div>

        <div className="dci-divider" />

        {checkedIn ? (
          <div className="dci-done-area">
            <div className="dci-done-msg">
              <span>✅</span>
              <span>Aaj ka Check-in Complete!</span>
              <span className="dci-done-sub">Kal raat 12 baje phir aana 🌙</span>
            </div>
            <div className="dci-countdown-box">
              <div className="dci-cd-label">⏰ Next check-in mein bacha</div>
              <div className="dci-cd-timer">{fmtCountdown(countdown)}</div>
              <div className="dci-cd-sub">India time (IST) ke hisab se</div>
            </div>
          </div>
        ) : (
          <div className="dci-claim-area">
            <div className="dci-reward-row">
              <div>
                <div className="dci-reward-label">Aaj ka reward</div>
                <div className="dci-reward-coins">🪙 +{todayReward} Coins</div>
              </div>
              {streak > 0 && (
                <div className="dci-streak-pill">🔥 {streak} din ki streak!</div>
              )}
            </div>

            {isStreakBroken() && (
              <div className="dci-broken-warn">
                ⚠️ Streak toot gayi — aaj se naya shuru!
              </div>
            )}

            <button
              className="dci-claim-btn"
              onClick={handleCheckIn}
              disabled={checkedIn || checkInLoading}
            >
              <span className="dci-btn-icon">{checkInLoading ? '⏳' : '🎁'}</span>
              <span className="dci-btn-text">
                {checkInLoading ? 'Save ho raha hai...' : 'Aaj ka Check-in Karo'}
              </span>
              <span className="dci-btn-badge">+{todayReward} 🪙</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
