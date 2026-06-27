// 😊 Games Coming Soon page — naye games aane wale hain! 😊
import { useEffect, useState } from 'react';
import BottomNav from '../../components/BottomNav';
import '../../styles/games.css';

// 😊 Launch date — yahan change karo jab games ready hon 😊
const LAUNCH_DATE = new Date('2026-07-15T00:00:00+05:30');

// 😊 Target features — preview cards 😊
const COMING_GAMES = [
  { icon: '🎰', name: 'Spin Wheel',   desc: 'Ghoomao aur jeeto!' },
  { icon: '🃏', name: 'Scratch Card', desc: 'Khurcho aur pao!' },
  { icon: '🪙', name: 'Coin Flip',    desc: 'Heads ya Tails?' },
  { icon: '🎯', name: 'Lucky Zone',   desc: 'Kismat aazmaao!' },
];

// 😊 Countdown ka helper — remaining time calculate karo 😊
function getTimeLeft() {
  const diff = LAUNCH_DATE - Date.now();
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, done: true };
  return {
    d:    Math.floor(diff / 86400000),
    h:    Math.floor((diff % 86400000) / 3600000),
    m:    Math.floor((diff % 3600000)  / 60000),
    s:    Math.floor((diff % 60000)    / 1000),
    done: false,
  };
}

export default function Games() {
  const [time,    setTime]    = useState(getTimeLeft);
  const [visible, setVisible] = useState(false);

  // 😊 Countdown timer — har second update 😊
  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  // 😊 Fade-in animation — page load hone par 😊
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`gs-page ${visible ? 'gs-visible' : ''}`}>

      {/* 😊 Background glow circles — decoration 😊 */}
      <div className="gs-glow gs-glow1" />
      <div className="gs-glow gs-glow2" />
      <div className="gs-glow gs-glow3" />

      <div className="gs-scroll">

        {/* 😊 Hero section — main icon aur title 😊 */}
        <div className="gs-hero">
          <div className="gs-icon-ring">
            <div className="gs-icon-inner">🎮</div>
          </div>
          <div className="gs-title">Games Aa Rahe Hain!</div>
          <div className="gs-subtitle">
            Spin karo, Scratch karo, Coin Flip karo —<br />
            aur coins kamao har game mein! 🪙
          </div>
        </div>

        {/* 😊 Countdown timer — launch date tak 😊 */}
        {!time.done ? (
          <div className="gs-countdown-card">
            <div className="gs-cd-label">⏳ Launch mein kitna waqt bacha</div>
            <div className="gs-cd-boxes">
              {[
                { val: time.d, unit: 'Din'    },
                { val: time.h, unit: 'Ghante' },
                { val: time.m, unit: 'Minute' },
                { val: time.s, unit: 'Second' },
              ].map(({ val, unit }) => (
                <div key={unit} className="gs-cd-box">
                  <div className="gs-cd-num">{String(val).padStart(2, '0')}</div>
                  <div className="gs-cd-unit">{unit}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="gs-launched-banner">
            🎉 Games Launch Ho Gaye! Refresh karo!
          </div>
        )}

        {/* 😊 Preview cards — kaunse games aayenge 😊 */}
        <div className="gs-section-title">🔮 Kya Aane Wala Hai?</div>
        <div className="gs-games-grid">
          {COMING_GAMES.map((g, i) => (
            <div
              key={g.name}
              className="gs-game-card"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {/* 😊 Lock badge — abhi nahi khel sakte 😊 */}
              <div className="gs-lock-badge">🔒</div>
              <div className="gs-game-icon">{g.icon}</div>
              <div className="gs-game-name">{g.name}</div>
              <div className="gs-game-desc">{g.desc}</div>
            </div>
          ))}
        </div>

        {/* 😊 Ad networks info — kaise kamaoge 😊 */}
        <div className="gs-info-card">
          <div className="gs-info-icon">💰</div>
          <div className="gs-info-text">
            <div className="gs-info-title">Ads dekhoge, Coins paoge!</div>
            <div className="gs-info-desc">
              Har game ke baad ek short ad dekhna hoga —<br />
              phir seedha coins tumhare wallet mein!
            </div>
          </div>
        </div>

        {/* 😊 Notify message — baaki pages use karo 😊 */}
        <div className="gs-notify-card">
          <div className="gs-notify-title">📢 Jaldi Aa Rahe Hain!</div>
          <div className="gs-notify-desc">
            Tab tak Tasks karo, Daily Check-in karo<br />
            aur Referral se coins kamao! 🚀
          </div>
          <div className="gs-notify-dots">
            <span className="gs-dot" />
            <span className="gs-dot" />
            <span className="gs-dot" />
          </div>
        </div>

        <div style={{ height: 100 }} />
      </div>

      <BottomNav />
    </div>
  );
}
