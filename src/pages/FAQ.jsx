import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/faq.css';

const FAQS = [
  { q: 'Sabka Masti Bazaar kya hai?',              a: 'Yeh ek desi earning app hai jahan tum daily tasks karo, games khelo, aur coins kamao. Coins ko UPI pe withdraw kar sakte ho!' },
  { q: 'Coins kaise kamate hain?',                  a: 'Daily Check-in, Earning Tasks, Spin the Wheel, Scratch Card, Quiz, aur doston ko Refer karke coins kamao.' },
  { q: '100 Coins = kitne rupees?',                 a: '100 Coins = ₹1. Toh agar tumhare paas 500 coins hain toh ₹5 withdraw kar sakte ho.' },
  { q: 'Minimum withdrawal kitna hai?',             a: 'Minimum 500 Coins (₹5) withdraw kar sakte ho. UPI ID chahiye hogi.' },
  { q: 'Withdrawal kitne time mein hota hai?',      a: '24 se 48 ghante mein UPI pe transfer ho jaata hai. Pending status mein dikhega.' },
  { q: 'Daily Check-in kya hai?',                   a: 'Roz app kholo aur check-in button dabao. Streak maintain karne pe zyada coins milte hain — Day 7 pe 100 coins!' },
  { q: 'Streak toot gayi toh kya hoga?',            a: 'Streak toot gayi toh wapas Day 1 se shuru hoga. Roz aana zaroori hai midnight se pehle (IST).' },
  { q: 'Referral coins kab milenge?',               a: 'Jab tumhara dost tumhare link se join karke mobile verify karega, toh +50 coins milenge.' },
  { q: 'Games roz kab reset hote hain?',            a: 'Raat 12 baje (IST) sab games reset ho jaate hain. Roz naye plays milte hain.' },
  { q: 'Galat UPI pe transfer ho gaya toh?',        a: 'Galat UPI ID pe transfer hone par coins wapas nahi honge. UPI ID dhyan se enter karo.' },
  { q: 'Account delete kar sakte hain?',            a: 'Abhi account delete ka option nahi hai. Support ke liye Telegram pe contact karo.' },
  { q: 'Kya yeh app bilkul free hai?',              a: 'Haan! 100% free. Koi subscription nahi, koi hidden charges nahi.' },
];

export default function FAQ() {
  const navigate = useNavigate();
  const [openIdx, setOpenIdx] = useState(null);

  return (
    <div className="faq-page">

      <div className="faq-topbar">
        <button className="faq-back-btn" onClick={() => navigate('/profile')}>← Back</button>
        <div className="faq-topbar-title">❓ FAQ / Help</div>
        <div style={{ width: 70 }} />
      </div>

      <div className="faq-scroll">
        <div className="faq-hero">
          <div className="faq-hero-icon">💬</div>
          <div className="faq-hero-title">Koi sawaal hai?</div>
          <div className="faq-hero-desc">Neeche se jawab dhundho!</div>
        </div>

        <div className="faq-list">
          {FAQS.map((f, i) => (
            <div key={i} className={`faq-item ${openIdx === i ? 'open' : ''}`}>
              <button className="faq-question" onClick={() => setOpenIdx(openIdx === i ? null : i)}>
                <span>{f.q}</span>
                <span className="faq-arrow">{openIdx === i ? '▲' : '▼'}</span>
              </button>
              {openIdx === i && (
                <div className="faq-answer">{f.a}</div>
              )}
            </div>
          ))}
        </div>

        <div className="faq-contact-card">
          <div className="faq-contact-icon">📲</div>
          <div className="faq-contact-title">Aur help chahiye?</div>
          <div className="faq-contact-desc">Telegram pe humse contact karo</div>
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
