import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import '../styles/dailyCheckIn.css';

const DAY_REWARDS = [10, 15, 25, 35, 50, 75, 100];

function getISTDateStr() {
  const istMs = Date.now() + 5.5 * 60 * 60 * 1000;
  return new Date(istMs).toISOString().split('T')[0];
}

export default function DailyCheckIn() {
  const { user, streak, updateCheckIn, CHECKIN_BACKUP_KEY } = useApp();

  const [checkInLoading, setCheckInLoading] = useState(false);
  const [showClaimed,    setShowClaimed]    = useState(false);
  const [claimedCoins,   setClaimedCoins]   = useState(0);
  const claimTimerRef = useRef(null);

  const todayIST = getISTDateStr();

  const checkedInFirestore = user?.last_checkin_date === todayIST;
  const checkedInLocal     = typeof localStorage !== 'undefined'
    && localStorage.getItem(CHECKIN_BACKUP_KEY) === todayIST;
  const checkedIn = checkedInFirestore || checkedInLocal;

  const isStreakBroken = useCallback(() => {
    if (!user?.last_checkin_date) return false;
    const last     = new Date(user.last_checkin_date + 'T00:00:00+05:30');
    const today    = new Date(todayIST + 'T00:00:00+05:30');
    const diffDays = Math.round((today - last) / 86400000);
    return diffDays > 1;
  }, [user?.last_checkin_date, todayIST]);

  useEffect(() => {
    return () => {
      if (claimTimerRef.current) clearTimeout(claimTimerRef.current);
    };
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
    if (claimTimerRef.current) clearTimeout(claimTimerRef.current);
    claimTimerRef.current = setTimeout(() => setShowClaimed(false), 2500);
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
          {gridDays.map(({ dayNum, reward, state }) => {
            const isToday = state === 'today';
            const Tag = isToday ? 'button' : 'div';
            return (
              <Tag
                key={dayNum}
                className={`dci-day dci-day-${state}${checkInLoading && isToday ? ' dci-day-loading' : ''}`}
                onClick={isToday ? handleCheckIn : undefined}
                disabled={isToday ? (checkInLoading || checkedIn) : undefined}
              >
                {isToday && !checkInLoading && (
                  <>
                    <span className="dci-scan-ring dci-scan-ring-1" />
                    <span className="dci-scan-ring dci-scan-ring-2" />
                  </>
                )}
                <div className="dci-day-icon">
                  {state === 'done'    ? '✅' :
                   state === 'claimed' ? '🎁' :
                   state === 'today'   ? (checkInLoading ? '⏳' : '🎁') : '🔒'}
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
              </Tag>
            );
          })}
        </div>

        {isStreakBroken() && !checkedIn && (
          <div className="dci-broken-warn">
            ⚠️ Streak toot gayi — aaj se naya shuru!
          </div>
        )}
      </div>
    </>
  );
}
