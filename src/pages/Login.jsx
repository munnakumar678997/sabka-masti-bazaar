import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── BOT USERNAME ────────────────────────────────────────────────────────────
const BOT_USERNAME = 'SabkaMastiBazaar_Bot';

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  page: {
    width: '100%', minHeight: '100dvh',
    background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 55%, #0f3460 100%)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'space-between',
    padding: '0 0 40px 0', position: 'relative', overflow: 'hidden',
  },
  bgCircle1: {
    position: 'absolute', top: -100, right: -100,
    width: 300, height: 300, borderRadius: '50%',
    background: 'rgba(0,136,204,0.07)', pointerEvents: 'none',
  },
  bgCircle2: {
    position: 'absolute', bottom: 80, left: -80,
    width: 220, height: 220, borderRadius: '50%',
    background: 'rgba(0,136,204,0.05)', pointerEvents: 'none',
  },
  topSection: {
    width: '100%', display: 'flex', flexDirection: 'column',
    alignItems: 'center', paddingTop: 55,
  },
  appLogo: {
    width: 78, height: 78, background: 'rgba(255,255,255,0.08)',
    borderRadius: 22, display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 38,
    border: '2px solid rgba(255,255,255,0.12)', marginBottom: 12,
  },
  appName: { fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: 0.3 },
  appTagline: {
    fontSize: 11, color: 'rgba(255,255,255,0.45)',
    letterSpacing: 2, textTransform: 'uppercase', marginTop: 5,
  },
  middleSection: {
    width: '100%', flex: 1, display: 'flex',
    flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '24px 22px',
  },

  // ─── User Card (Mini App + Web verified) ───
  userCard: {
    width: '100%', background: 'rgba(255,255,255,0.06)',
    borderRadius: 22, border: '1px solid rgba(255,255,255,0.1)',
    padding: '26px 20px', display: 'flex',
    flexDirection: 'column', alignItems: 'center', gap: 10,
    backdropFilter: 'blur(12px)',
  },
  userAvatar: {
    width: 82, height: 82, borderRadius: '50%',
    border: '3px solid rgba(0,136,204,0.55)',
    background: 'rgba(0,136,204,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 34, color: '#fff', overflow: 'hidden',
  },
  userName: { fontSize: 20, fontWeight: 700, color: '#fff', textAlign: 'center' },
  userHandle: { fontSize: 13, color: '#29b6f6' },
  userId: {
    fontSize: 11, color: 'rgba(255,255,255,0.38)',
    background: 'rgba(255,255,255,0.05)',
    padding: '4px 14px', borderRadius: 20, fontFamily: 'monospace',
  },
  detectedBadge: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'rgba(39,174,96,0.13)',
    border: '1px solid rgba(39,174,96,0.28)',
    borderRadius: 20, padding: '6px 16px',
    fontSize: 12, color: '#2ecc71', marginTop: 4,
  },

  // ─── Web Login Box ───
  webLoginBox: {
    width: '100%', background: 'rgba(255,255,255,0.05)',
    borderRadius: 22, border: '1px solid rgba(255,255,255,0.09)',
    padding: '30px 22px', display: 'flex',
    flexDirection: 'column', alignItems: 'center', gap: 20,
  },
  tgCircle: {
    width: 72, height: 72, borderRadius: '50%',
    background: 'linear-gradient(135deg, #0088cc, #005fa3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 34, boxShadow: '0 6px 20px rgba(0,136,204,0.4)',
  },
  webTitle: { fontSize: 18, fontWeight: 700, color: '#fff', textAlign: 'center' },
  webDesc: {
    fontSize: 13, color: 'rgba(255,255,255,0.45)',
    textAlign: 'center', lineHeight: 1.7,
  },
  stepsBox: {
    width: '100%', display: 'flex',
    flexDirection: 'column', gap: 10,
  },
  stepRow: {
    display: 'flex', alignItems: 'flex-start', gap: 12,
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 12, padding: '10px 14px',
  },
  stepNum: {
    width: 24, height: 24, borderRadius: '50%',
    background: '#0088cc', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, flexShrink: 0,
  },
  stepText: { fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 },

  // Telegram Widget container
  widgetWrap: {
    display: 'flex', justifyContent: 'center',
    width: '100%',
  },
  // Custom styled button (as fallback / overlay)
  tgLoginBtn: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: '#0088cc', color: '#fff',
    border: 'none', borderRadius: 14,
    padding: '15px 28px', fontSize: 16,
    fontWeight: 700, cursor: 'pointer',
    width: '100%', justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(0,136,204,0.4)',
  },

  // ─── Bottom CTA ───
  bottomSection: {
    width: '100%', padding: '0 22px',
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  createBtn: {
    width: '100%', padding: '18px',
    background: 'linear-gradient(135deg, #ff6a00, #ee0979)',
    color: '#fff', border: 'none', borderRadius: 16,
    fontSize: 17, fontWeight: 800, cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(238,9,121,0.38)',
    display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: 8, letterSpacing: 0.3,
  },
  termsText: {
    fontSize: 11, color: 'rgba(255,255,255,0.3)',
    textAlign: 'center', lineHeight: 1.5,
  },

  // ─── Centered Popup ───
  popupOverlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000, backdropFilter: 'blur(6px)',
    padding: '0 24px',
  },
  popupBox: {
    width: '100%', maxWidth: 400,
    background: '#1c2340', borderRadius: 24,
    padding: '32px 24px',
    border: '1px solid rgba(255,255,255,0.12)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 16,
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    animation: 'popIn 0.25s ease',
  },
  popupShareBtn: {
    width: '100%', padding: '16px',
    background: 'linear-gradient(135deg, #0088cc, #005fa3)',
    color: '#fff', border: 'none', borderRadius: 14,
    fontSize: 16, fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 4px 18px rgba(0,136,204,0.3)',
    display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: 8,
  },
  popupCancelBtn: {
    background: 'none',
    border: '1px solid rgba(255,255,255,0.15)',
    color: 'rgba(255,255,255,0.5)', fontSize: 14,
    cursor: 'pointer', padding: '10px 24px',
    borderRadius: 10, width: '100%', textAlign: 'center',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function Login() {
  const navigate   = useNavigate();
  const widgetRef  = useRef(null);

  const [isMiniApp, setIsMiniApp] = useState(false);
  const [tgUser, setTgUser]       = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    // ─── Telegram Mini App detect ───
    if (tg && tg.initData && tg.initData.length > 0) {
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#1a1a2e');
      tg.setBackgroundColor('#1a1a2e');
      const user = tg.initDataUnsafe?.user;
      if (user) {
        setIsMiniApp(true);
        setTgUser({
          id:        user.id,
          name:      `${user.first_name} ${user.last_name || ''}`.trim(),
          username:  user.username || null,
          photo_url: user.photo_url || null,
        });
        return;
      }
    }

    // ─── Website: Telegram Login Widget load karo ───
    // Global callback — Telegram widget isko call karta hai
    window.onTelegramAuth = (user) => {
      // user = { id, first_name, last_name, username, photo_url, auth_date, hash }
      setTgUser({
        id:        user.id,
        name:      `${user.first_name} ${user.last_name || ''}`.trim(),
        username:  user.username || null,
        photo_url: user.photo_url || null,
        hash:      user.hash,       // backend pe verify ke liye
        auth_date: user.auth_date,
      });
    };

    // Telegram widget script inject karo
    if (widgetRef.current && !widgetRef.current.querySelector('script')) {
      const script = document.createElement('script');
      script.src   = 'https://telegram.org/js/telegram-widget.js?22';
      script.setAttribute('data-telegram-login', BOT_USERNAME);
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-radius', '14');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.setAttribute('data-request-access', 'write');
      script.async = true;
      widgetRef.current.appendChild(script);
    }

    return () => { delete window.onTelegramAuth; };
  }, []);

  // ─── Mini App: Phone share popup ───
  const handleOpenPopup = () => setShowPopup(true);

  const handleSharePhone = () => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;
    setLoading(true);
    tg.requestContact((accepted, contact) => {
      setLoading(false);
      setShowPopup(false);
      if (accepted && contact) {
        navigate('/home');
      }
    });
  };

  const handleCreateAccount = () => {
    // TODO: Supabase mein user save karo tgUser data ke saath
    navigate('/home');
  };

  return (
    <div style={S.page}>
      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.88); }
          to   { opacity: 1; transform: scale(1); }
        }
        /* Telegram widget button ko style match karao */
        .tgme_widget_login > button,
        iframe { border-radius: 14px !important; width: 100% !important; }
      `}</style>

      <div style={S.bgCircle1} />
      <div style={S.bgCircle2} />

      {/* ─── TOP: App Logo ─── */}
      <div style={S.topSection}>
        <div style={S.appLogo}>🎪</div>
        <div style={S.appName}>Sabka Masti Bazaar</div>
        <div style={S.appTagline}>Khelo • Jeeto • Kamao</div>
      </div>

      {/* ─── MIDDLE ─── */}
      <div style={S.middleSection}>

        {/* CASE 1: Mini App — User Card */}
        {isMiniApp && tgUser && (
          <div style={S.userCard}>
            <div style={S.userAvatar}>
              {tgUser.photo_url
                ? <img src={tgUser.photo_url} alt="dp"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : tgUser.name?.charAt(0).toUpperCase()}
            </div>
            <div style={S.userName}>{tgUser.name}</div>
            {tgUser.username && <div style={S.userHandle}>@{tgUser.username}</div>}
            <div style={S.userId}>Telegram ID: {tgUser.id}</div>
            <div style={S.detectedBadge}>✅ Telegram se detect ho gaya</div>
          </div>
        )}

        {/* CASE 2: Website — Telegram Widget ya verified user */}
        {!isMiniApp && (
          <>
            {/* User verified ho gaya */}
            {tgUser ? (
              <div style={S.userCard}>
                <div style={S.userAvatar}>
                  {tgUser.photo_url
                    ? <img src={tgUser.photo_url} alt="dp"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : tgUser.name?.charAt(0).toUpperCase()}
                </div>
                <div style={S.userName}>{tgUser.name}</div>
                {tgUser.username && <div style={S.userHandle}>@{tgUser.username}</div>}
                <div style={S.userId}>Telegram ID: {tgUser.id}</div>
                <div style={S.detectedBadge}>✅ Telegram se verified!</div>
              </div>
            ) : (
              /* Telegram Widget */
              <div style={S.webLoginBox}>
                <div style={S.tgCircle}>✈️</div>
                <div style={S.webTitle}>Telegram se Login karo</div>
                <div style={S.webDesc}>
                  Sirf ek click! Telegram pe "Confirm" dabao —
                  tumhara naam, username aur photo automatic aa jaayega.
                  Koi password nahi, koi OTP nahi! ⚡
                </div>

                {/* Steps */}
                <div style={S.stepsBox}>
                  {[
                    ['1', 'Neeche ka Telegram button dabao'],
                    ['2', 'Telegram pe notification aayega — "Confirm" dabao'],
                    ['3', 'Tumhara account automatically ban jaayega! 🎉'],
                  ].map(([num, text]) => (
                    <div key={num} style={S.stepRow}>
                      <div style={S.stepNum}>{num}</div>
                      <div style={S.stepText}>{text}</div>
                    </div>
                  ))}
                </div>

                {/* Telegram Login Widget yahan render hoga */}
                <div style={S.widgetWrap} ref={widgetRef} />
              </div>
            )}
          </>
        )}

      </div>

      {/* ─── BOTTOM: CTA ─── */}
      <div style={S.bottomSection}>
        {/* Mini App — phone share button */}
        {isMiniApp && tgUser && (
          <>
            <button style={S.createBtn} onClick={handleOpenPopup}>
              🚀 Kamai Shuru Karo — Join Now!
            </button>
            <div style={S.termsText}>
              Apna Telegram number share karke account banao — 100% free!
            </div>
          </>
        )}

        {/* Website — verified, account banao */}
        {!isMiniApp && tgUser && (
          <>
            <button style={S.createBtn} onClick={handleCreateAccount}>
              🚀 Kamai Shuru Karo — Join Now!
            </button>
            <div style={S.termsText}>
              Telegram verified — tumhara account ready hai! 🎉
            </div>
          </>
        )}

        {/* Website — abhi tak login nahi */}
        {!isMiniApp && !tgUser && (
          <div style={S.termsText}>
            Upar Telegram button dabao — koi OTP nahi, koi password nahi ⚡
          </div>
        )}
      </div>

      {/* ─── CENTERED POPUP (Mini App phone share) ─── */}
      {showPopup && (
        <div style={S.popupOverlay} onClick={() => setShowPopup(false)}>
          <div style={S.popupBox} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 48 }}>📱</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', textAlign: 'center' }}>
              Mobile Number Share karo
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 1.65 }}>
              Sabka Masti Bazaar ko tumhara Telegram number chahiye taaki
              tumhara account secure rahe. Yeh sirf ek baar maanga jaayega!
            </div>
            {loading
              ? <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>⏳ Thoda wait karo...</div>
              : <>
                  <button style={S.popupShareBtn} onClick={handleSharePhone}>
                    📱 Number Share karo & Join Karo
                  </button>
                  <button style={S.popupCancelBtn} onClick={() => setShowPopup(false)}>
                    Abhi nahi
                  </button>
                </>
            }
          </div>
        </div>
      )}
    </div>
  );
}
