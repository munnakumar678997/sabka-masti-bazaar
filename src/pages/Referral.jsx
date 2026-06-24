import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import BottomNav from '../components/BottomNav';
import '../styles/referral.css';

const MILESTONE_COINS = { 1: 50, 3: 200, 5: 500, 10: 1200, 25: 3500, 50: 8000 };

const MILESTONES = [
  { count: 1,  bonus: 50,   icon: '🌱', label: '1st Referral' },
  { count: 3,  bonus: 200,  icon: '🌿', label: '3 Referrals'  },
  { count: 5,  bonus: 500,  icon: '🌳', label: '5 Referrals'  },
  { count: 10, bonus: 1200, icon: '🏆', label: '10 Referrals' },
  { count: 25, bonus: 3500, icon: '👑', label: '25 Referrals' },
  { count: 50, bonus: 8000, icon: '💎', label: '50 Referrals' },
];

export default function Referral() {
  const navigate   = useNavigate();
  const { user, referrals, balance } = useApp();
  const [copied, setCopied] = useState(false);

  // Accurate total calculation — base coins + milestone bonuses jo award ho chuke
  const referralCoinsTotal = useMemo(() => {
    const base             = referrals * 50;
    const awardedMilestones = user?.awarded_milestones || [];
    const milestoneTotal   = awardedMilestones.reduce(
      (sum, m) => sum + (MILESTONE_COINS[m] || 0), 0
    );
    return base + milestoneTotal;
  }, [referrals, user?.awarded_milestones]);

  const refCode = user?.id ? `SMB${user.id}` : 'SMB0000';
  const refLink = `https://t.me/SabkaMastiBazaar_Bot?start=${refCode}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(refLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const msg = encodeURIComponent(
      `🎪 Sabka Masti Bazaar pe aao!\n\n` +
      `Khelo, jeeto aur kamao — har din!\n` +
      `Join karo mere referral link se:\n${refLink}\n\n` +
      `🪙 100% FREE · Daily Coins · Spin & Scratch Games!`
    );
    const url = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${msg}`;
    if (window.Telegram?.WebApp?.openLink) window.Telegram.WebApp.openLink(url);
    else window.open(url, '_blank');
  };


  return (
    <div className="ref-page">

      <div className="ref-topbar">
        <button className="ref-back-btn" onClick={() => navigate('/profile')}>← Back</button>
        <div className="ref-topbar-title">👥 Referral</div>
        <div style={{ width: 70 }} />
      </div>

      <div className="ref-scroll">

        {/* ── HERO ── */}
        <div className="ref-hero">
          <div className="ref-hero-icon">🤝</div>
          <div className="ref-hero-title">Dosto ko Invite Karo!</div>
          <div className="ref-hero-desc">Har referral pe coins kamao — seedha wallet mein!</div>
          <div className="ref-hero-stat">
            <div className="ref-stat-box">
              <div className="ref-stat-val">{referrals}</div>
              <div className="ref-stat-lbl">Total Referrals</div>
            </div>
            <div className="ref-stat-box">
              <div className="ref-stat-val">🪙 {referralCoinsTotal.toLocaleString()}</div>
              <div className="ref-stat-lbl">Coins Earned</div>
            </div>
          </div>
        </div>

        {/* ── REFERRAL CODE ── */}
        <div className="ref-section-title">🔗 Tumhara Referral Link</div>
        <div className="ref-code-card">
          <div className="ref-code-label">Referral Code</div>
          <div className="ref-code">{refCode}</div>
          <div className="ref-link-text">{refLink}</div>
          <div className="ref-btns">
            <button className="ref-copy-btn" onClick={handleCopy}>
              {copied ? '✅ Copied!' : '📋 Copy Link'}
            </button>
            <button className="ref-share-btn" onClick={handleShare}>
              📲 Share on Telegram
            </button>
          </div>
        </div>

        {/* ── HOW IT WORKS ── */}
        <div className="ref-section-title">📖 Kaise Kaam Karta Hai</div>
        <div className="ref-steps-card">
          {[
            { num: '1', text: 'Apna referral link share karo Telegram pe' },
            { num: '2', text: 'Dost link se bot open kare aur join kare' },
            { num: '3', text: 'Dost mobile number verify kare' },
            { num: '4', text: 'Tumhare wallet mein coins automatically aa jayenge!' },
          ].map(s => (
            <div key={s.num} className="ref-step-row">
              <div className="ref-step-num">{s.num}</div>
              <div className="ref-step-text">{s.text}</div>
            </div>
          ))}
        </div>

        {/* ── MILESTONES ── */}
        <div className="ref-section-title">🏆 Milestone Bonuses</div>
        <div className="ref-milestones">
          {MILESTONES.map(m => {
            const done = referrals >= m.count;
            return (
              <div key={m.count} className={`ref-milestone ${done ? 'done' : ''}`}>
                <div className="ref-mile-icon">{m.icon}</div>
                <div className="ref-mile-info">
                  <div className="ref-mile-label">{m.label}</div>
                  <div className="ref-mile-bonus" style={{ color: done ? '#22c55e' : '#ffd700' }}>
                    🪙 +{m.bonus.toLocaleString()} Bonus Coins
                  </div>
                </div>
                <div className={`ref-mile-status ${done ? 'status-done' : ''}`}>
                  {done ? '✅' : `${Math.min(referrals, m.count)}/${m.count}`}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── PER REFERRAL ── */}
        <div className="ref-per-ref-box">
          <div className="ref-per-ref-icon">🪙</div>
          <div>
            <div className="ref-per-ref-title">Har referral pe milega</div>
            <div className="ref-per-ref-coins">+50 Coins</div>
          </div>
        </div>

        <div style={{ height: 90 }} />
      </div>

      <BottomNav />
    </div>
  );
}
