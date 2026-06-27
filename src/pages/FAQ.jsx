import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/faq.css';

const CATEGORIES = [
  { id: 'all',        label: 'Sab',        icon: '🔥' },
  { id: 'earning',    label: 'Earning',     icon: '💰' },
  { id: 'games',      label: 'Games',       icon: '🎮' },
  { id: 'withdrawal', label: 'Withdrawal',  icon: '💸' },
  { id: 'referral',   label: 'Referral',    icon: '👥' },
  { id: 'general',    label: 'General',     icon: '❓' },
];

const FAQS = [
  {
    cat: 'general',
    q: 'Sabka Masti Bazaar kya hai?',
    a: 'Yeh ek desi earning Telegram Mini App hai jahan tum games khelo, daily check-in karo, aur coins kamao. Coins ko directly UPI pe withdraw kar sakte ho — bilkul free!',
  },
  {
    cat: 'general',
    q: 'Kya yeh app bilkul free hai?',
    a: 'Haan! 100% free. Koi subscription nahi, koi hidden charges nahi. Sirf Telegram se open karo aur shuru ho jao.',
  },
  {
    cat: 'general',
    q: 'Account delete kar sakte hain?',
    a: 'Abhi account delete ka option nahi hai. Agar koi problem hai toh Telegram Support pe contact karo — hum help karenge.',
  },
  {
    cat: 'earning',
    q: 'Coins kaise kamate hain?',
    a: 'Kai tarike hain:\n• Daily Check-in — roz aao, streak pe bonus\n• Spin the Wheel — roz 5 baar\n• Scratch Card — roz 3 baar\n• Coin Flip — roz 10 baar\n• Referral — dost ko invite karo\n• Bonus Code — special codes redeem karo',
  },
  {
    cat: 'earning',
    q: '100 Coins = kitne rupees?',
    a: '100 Coins = ₹1. Agar tumhare paas 5000 coins hain toh ₹50 withdraw kar sakte ho. Jitne zyada coins, utne zyada paise!',
  },
  {
    cat: 'earning',
    q: 'Daily Check-in kya hai?',
    a: 'Roz app kholo aur Check-in button dabao. Har din ka alag reward hai — Day 7 pe 100 coins milte hain! Streak maintain karna zaroori hai.',
  },
  {
    cat: 'earning',
    q: 'Streak toot gayi toh kya hoga?',
    a: 'Agar ek din check-in na kiya toh streak toot jaayegi aur wapas Day 1 se shuru hoga. Raat 12 baje (IST) se pehle check-in karo.',
  },
  {
    cat: 'games',
    q: 'Games roz kab reset hote hain?',
    a: 'Raat 12:00 baje IST pe sab games reset ho jaate hain. Har roz nayi chances milti hain — Spin 5x, Scratch 3x, Coin Flip 10x.',
  },
  {
    cat: 'games',
    q: 'Spin the Wheel mein max kitne coins milte hain?',
    a: 'Spin the Wheel mein 5 se 200 coins tak milte hain har spin pe. Lucky spin pe 200 coins bhi mil sakte hain!',
  },
  {
    cat: 'games',
    q: 'Scratch Card se kitne coins milte hain?',
    a: 'Scratch Card mein 5 se 200 coins milte hain har card pe — roz 3 cards scratch kar sakte ho.',
  },
  {
    cat: 'withdrawal',
    q: 'Minimum withdrawal kitna hai?',
    a: 'Minimum 500 Coins (₹5) withdraw kar sakte ho. UPI ID chahiye hogi. Request submit karne ke baad 24-48 ghante ka wait karo.',
  },
  {
    cat: 'withdrawal',
    q: 'Withdrawal kitne time mein hota hai?',
    a: '24 se 48 ghante mein UPI pe transfer ho jaata hai. Tab tak "Pending" status dikhega. Festive season mein thoda zyada time lag sakta hai.',
  },
  {
    cat: 'withdrawal',
    q: 'Galat UPI pe transfer ho gaya toh?',
    a: 'Galat UPI ID daali toh coins wapas nahi honge. Isliye UPI ID DHYAN SE enter karo. Submit karne se pehle ek baar check karo.',
  },
  {
    cat: 'withdrawal',
    q: 'Withdrawal mein koi charge lagta hai?',
    a: 'Bilkul nahi! Withdrawal 100% free hai. Jo bhi coins kamao woh poore rupees mein milenge — koi deduction nahi.',
  },
  {
    cat: 'referral',
    q: 'Referral coins kab milenge?',
    a: 'Jab tumhara dost tumhare referral link se join karega aur mobile number verify karega — tabhi +50 coins tumhare account mein aayenge.',
  },
  {
    cat: 'referral',
    q: 'Referral link kahan milega?',
    a: 'Profile → Refer & Earn section mein jaao. Wahan tumhara unique referral link aur code milega. Share karo aur kamao!',
  },
  {
    cat: 'referral',
    q: 'Ek din mein kitne referrals kar sakte hain?',
    a: 'Koi limit nahi! Jitne dosto ko invite karo utne coins kamao. Har verified referral pe +50 coins milte hain.',
  },
];

export default function FAQ() {
  const navigate   = useNavigate();
  const [openIdx,  setOpenIdx]  = useState(null);
  const [activeCat, setActiveCat] = useState('all');
  const [search,   setSearch]   = useState('');

  const filtered = useMemo(() => {
    let list = FAQS;
    if (activeCat !== 'all') list = list.filter(f => f.cat === activeCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(f => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
    }
    return list;
  }, [activeCat, search]);

  const catCount = (id) => id === 'all' ? FAQS.length : FAQS.filter(f => f.cat === id).length;

  const handleCat = (id) => {
    setActiveCat(id);
    setOpenIdx(null);
    setSearch('');
  };

  return (
    <div className="faq-page">

      {/* ── TOPBAR ── */}
      <div className="faq-topbar">
        <button className="faq-back-btn" onClick={() => navigate('/profile')}>← Back</button>
        <div className="faq-topbar-title">FAQ / Help</div>
        <div style={{ width: 70 }} />
      </div>

      <div className="faq-scroll">

        {/* ── HERO ── */}
        <div className="faq-hero">
          <div className="faq-hero-ring">
            <span className="faq-hero-emoji">💬</span>
          </div>
          <div className="faq-hero-title">Koi sawaal hai?</div>
          <div className="faq-hero-desc">Search karo ya category choose karo</div>
          <div className="faq-hero-stats">
            <div className="faq-stat-box"><span className="faq-stat-val">{FAQS.length}</span><span className="faq-stat-lbl">Questions</span></div>
            <div className="faq-stat-box"><span className="faq-stat-val">{CATEGORIES.length - 1}</span><span className="faq-stat-lbl">Topics</span></div>
            <div className="faq-stat-box"><span className="faq-stat-val">24/7</span><span className="faq-stat-lbl">Support</span></div>
          </div>
        </div>

        {/* ── SEARCH ── */}
        <div className="faq-search-wrap">
          <span className="faq-search-icon">🔍</span>
          <input
            className="faq-search-input"
            placeholder="Search questions..."
            value={search}
            onChange={e => { setSearch(e.target.value); setOpenIdx(null); }}
          />
          {search && (
            <button className="faq-search-clear" onClick={() => { setSearch(''); setOpenIdx(null); }}>✕</button>
          )}
        </div>

        {/* ── CATEGORY CHIPS ── */}
        {!search && (
          <div className="faq-cats">
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                className={`faq-cat-chip ${activeCat === c.id ? 'active' : ''}`}
                onClick={() => handleCat(c.id)}
              >
                {c.icon} {c.label}
                <span className="faq-cat-count">{catCount(c.id)}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── RESULTS COUNT ── */}
        <div className="faq-results-label">
          {search
            ? `"${search}" ke liye ${filtered.length} result${filtered.length !== 1 ? 's' : ''}`
            : `${filtered.length} questions`}
        </div>

        {/* ── FAQ LIST ── */}
        <div className="faq-list">
          {filtered.length === 0 ? (
            <div className="faq-empty">
              <div className="faq-empty-icon">🤔</div>
              <div className="faq-empty-text">Koi match nahi mila!<br />Dusra keyword try karo.</div>
            </div>
          ) : (
            filtered.map((f, i) => {
              const isOpen = openIdx === i;
              const catInfo = CATEGORIES.find(c => c.id === f.cat);
              return (
                <div key={i} className={`faq-item ${isOpen ? 'open' : ''}`} data-cat={f.cat}>
                  <button className="faq-question" onClick={() => setOpenIdx(isOpen ? null : i)}>
                    <div className="faq-q-left">
                      <span className="faq-q-cat-dot" data-cat={f.cat}>{catInfo?.icon}</span>
                      <span className="faq-q-text">{f.q}</span>
                    </div>
                    <span className={`faq-arrow ${isOpen ? 'up' : ''}`}>›</span>
                  </button>
                  <div className={`faq-answer-wrap ${isOpen ? 'open' : ''}`}>
                    <div className="faq-answer">{f.a}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── CONTACT CARD ── */}
        <div className="faq-contact-card">
          <div className="faq-contact-top">
            <span className="faq-contact-icon">📲</span>
            <div>
              <div className="faq-contact-title">Aur help chahiye?</div>
              <div className="faq-contact-desc">Telegram pe humse directly baat karo</div>
            </div>
          </div>
          <button className="faq-contact-btn" onClick={() => {
            const url = 'https://t.me/Munnapm70045';
            if (window.Telegram?.WebApp?.openLink) window.Telegram.WebApp.openLink(url);
            else window.open(url, '_blank');
          }}>
            ✈️ Telegram Support
          </button>
        </div>

        <div style={{ height: 30 }} />
      </div>
    </div>
  );
}
