import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

const BOT_USERNAME = 'SabkaMastiBazaar_Bot';

const S = {
  page: {
    width: '100%', minHeight: '100dvh',
    background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 55%, #0f3460 100%)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 28, padding: '32px 0',
    position: 'relative', overflow: 'hidden',
  },
  bgCircle1: {
    position: 'absolute', top: -80, right: -80,
    width: 240, height: 240, borderRadius: '50%',
    background: 'rgba(0,136,204,0.07)', pointerEvents: 'none',
  },
  bgCircle2: {
    position: 'absolute', bottom: 60, left: -60,
    width: 180, height: 180, borderRadius: '50%',
    background: 'rgba(0,136,204,0.05)', pointerEvents: 'none',
  },
  topSection: {
    width: '100%', display: 'flex', flexDirection: 'column',
    alignItems: 'center', paddingTop: 0,
  },
  appLogo: {
    width: 90, height: 90, background: 'rgba(255,255,255,0.1)',
    borderRadius: 26, display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 46,
    border: '2.5px solid rgba(255,255,255,0.18)', marginBottom: 14,
    boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
  },
  appName:    { fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: 0.4 },
  appTagline: {
    fontSize: 12, color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2.5, textTransform: 'uppercase', marginTop: 6,
  },
  middleSection: {
    width: '100%', display: 'flex',
    flexDirection: 'column', alignItems: 'center',
    padding: '0 18px',
  },
  userCard: {
    width: '100%', background: 'rgba(255,255,255,0.06)',
    borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)',
    padding: '22px 18px', display: 'flex',
    flexDirection: 'column', alignItems: 'center', gap: 8,
    backdropFilter: 'blur(12px)',
  },
  userAvatar: {
    width: 74, height: 74, borderRadius: '50%',
    border: '3px solid rgba(0,136,204,0.55)',
    background: 'rgba(0,136,204,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 30, color: '#fff', overflow: 'hidden',
  },
  userName:      { fontSize: 18, fontWeight: 700, color: '#fff', textAlign: 'center' },
  userHandle:    { fontSize: 13, color: '#29b6f6' },
  userId: {
    fontSize: 11, color: 'rgba(255,255,255,0.38)',
    background: 'rgba(255,255,255,0.05)',
    padding: '4px 14px', borderRadius: 20, fontFamily: 'monospace',
  },
  detectedBadge: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'rgba(39,174,96,0.13)',
    border: '1px solid rgba(39,174,96,0.28)',
    borderRadius: 20, padding: '5px 14px',
    fontSize: 12, color: '#2ecc71', marginTop: 2,
  },
  webLoginBox: {
    width: '100%', background: 'rgba(255,255,255,0.05)',
    borderRadius: 20, border: '1px solid rgba(255,255,255,0.09)',
    padding: '18px 16px', display: 'flex',
    flexDirection: 'column', alignItems: 'center', gap: 12,
  },
  tgCircle: {
    width: 58, height: 58, borderRadius: '50%',
    background: 'linear-gradient(135deg, #0088cc, #005fa3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 26, boxShadow: '0 6px 20px rgba(0,136,204,0.4)',
  },
  webTitle: { fontSize: 16, fontWeight: 700, color: '#fff', textAlign: 'center' },
  webDesc: {
    fontSize: 12, color: 'rgba(255,255,255,0.45)',
    textAlign: 'center', lineHeight: 1.6,
  },
  stepsBox:  { width: '100%', display: 'flex', flexDirection: 'column', gap: 7 },
  stepRow: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 10, padding: '8px 12px',
  },
  stepNum: {
    width: 22, height: 22, borderRadius: '50%',
    background: '#0088cc', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 700, flexShrink: 0,
  },
  stepText: { fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 },
  widgetWrap: { display: 'flex', justifyContent: 'center', width: '100%' },
  bottomSection: {
    width: '100%', padding: '0 18px',
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
  savingText: {
    fontSize: 13, color: 'rgba(255,255,255,0.5)',
    textAlign: 'center', padding: '18px',
  },
};

export default function Login() {
  const navigate             = useNavigate();
  const widgetRef            = useRef(null);
  const { loadUser }         = useApp();

  const [isMiniApp,   setIsMiniApp]   = useState(false);
  const [tgUser,      setTgUser]      = useState(null);
  const [btnLoading,  setBtnLoading]  = useState(false);
  const [autoLogging, setAutoLogging] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    // ── MINI APP: Auto-detect + Auto-login ──
    if (tg && tg.initData && tg.initData.length > 0) {
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#1a1a2e');
      tg.setBackgroundColor('#1a1a2e');
      const user = tg.initDataUnsafe?.user;
      if (user) {
        const tgData = {
          id:        user.id,
          name:      `${user.first_name} ${user.last_name || ''}`.trim(),
          username:  user.username || null,
          photo_url: user.photo_url || null,
        };
        setIsMiniApp(true);
        setTgUser(tgData);

        // Check karo — existing user hai? Agar hai toh seedha home bhejo
        setAutoLogging(true);
        supabase
          .from('users')
          .select('id')
          .eq('id', tgData.id)
          .maybeSingle()
          .then(async ({ data }) => {
            if (data) {
              // Existing user — seedha load karke home bhejo
              await loadUser(tgData);
              navigate('/home');
            } else {
              // Naya user — button dikhao
              setAutoLogging(false);
            }
          });
        return;
      }
    }

    // ── WEB: Pehle localStorage check karo ──
    const savedId = localStorage.getItem('smb_tg_id');
    if (savedId) {
      setAutoLogging(true);
      supabase
        .from('users')
        .select('*')
        .eq('id', parseInt(savedId))
        .maybeSingle()
        .then(async ({ data }) => {
          if (data) {
            await loadUser({
              id:        data.id,
              name:      data.name,
              username:  data.username,
              photo_url: data.photo_url,
            });
            navigate('/home');
          } else {
            localStorage.removeItem('smb_tg_id');
            setAutoLogging(false);
          }
        });
      return;
    }

    // ── WEB: Telegram widget dikhao ──
    window.onTelegramAuth = (user) => {
      setTgUser({
        id:        user.id,
        name:      `${user.first_name} ${user.last_name || ''}`.trim(),
        username:  user.username || null,
        photo_url: user.photo_url || null,
        hash:      user.hash,
        auth_date: user.auth_date,
      });
    };

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

  const handleCreateAccount = async () => {
    if (!tgUser || btnLoading) return;
    setBtnLoading(true);
    await loadUser(tgUser);
    // Web ke liye localStorage mein save karo
    localStorage.setItem('smb_tg_id', String(tgUser.id));
    navigate('/home');
  };

  const handleJoinNow = async () => {
    const tg = window.Telegram?.WebApp;
    if (!tg || btnLoading) return;
    setBtnLoading(true);
    tg.requestContact(async (accepted) => {
      if (accepted) {
        await loadUser(tgUser);
        navigate('/home');
      } else {
        setBtnLoading(false);
      }
    });
  };

  // Auto-login loading screen
  if (autoLogging) {
    return (
      <div style={{ ...S.page, gap: 16 }}>
        <div style={S.appLogo}>🎪</div>
        <div style={S.appName}>Sabka Masti Bazaar</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>
          ⏳ Account detect ho raha hai...
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <style>{`
        .tgme_widget_login { width: 100% !important; display: block !important; }
        .tgme_widget_login > button, .tgme_widget_login_button {
          width: 100% !important; padding: 16px 20px !important;
          font-size: 17px !important; font-weight: 800 !important;
          border-radius: 16px !important;
          box-shadow: 0 6px 22px rgba(0,136,204,0.45) !important;
          background: linear-gradient(135deg, #0088cc, #0055aa) !important;
          display: flex !important; align-items: center !important;
          justify-content: center !important; gap: 10px !important;
          border: none !important; cursor: pointer !important; color: #fff !important;
        }
      `}</style>

      <div style={S.bgCircle1} />
      <div style={S.bgCircle2} />

      <div style={S.topSection}>
        <div style={S.appLogo}>🎪</div>
        <div style={S.appName}>Sabka Masti Bazaar</div>
        <div style={S.appTagline}>Khelo • Jeeto • Kamao</div>
      </div>

      <div style={S.middleSection}>
        {tgUser && (
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

        {!isMiniApp && !tgUser && (
          <div style={S.webLoginBox}>
            <div style={S.tgCircle}>✈️</div>
            <div style={S.webTitle}>Telegram se Login karo</div>
            <div style={S.webDesc}>
              Sirf ek click! Koi password nahi, koi OTP nahi! ⚡
            </div>
            <div style={S.stepsBox}>
              {[
                ['1', 'Neeche ka Telegram button dabao'],
                ['2', 'Telegram pe "Confirm" dabao'],
                ['3', 'Account automatically ban jaayega! 🎉'],
              ].map(([num, text]) => (
                <div key={num} style={S.stepRow}>
                  <div style={S.stepNum}>{num}</div>
                  <div style={S.stepText}>{text}</div>
                </div>
              ))}
            </div>
            <div style={S.widgetWrap} ref={widgetRef} />
          </div>
        )}
      </div>

      <div style={S.bottomSection}>
        {tgUser && (
          <>
            {btnLoading ? (
              <div style={S.savingText}>⏳ Account save ho raha hai...</div>
            ) : (
              <button style={S.createBtn}
                onClick={isMiniApp ? handleJoinNow : handleCreateAccount}>
                🚀 Create New Account
              </button>
            )}
            <div style={S.termsText}>
              {isMiniApp
                ? 'Apna Telegram number share karke account banao — 100% free!'
                : 'Telegram verified — tumhara account ready hai! 🎉'}
            </div>
          </>
        )}

        {!isMiniApp && !tgUser && (
          <div style={S.termsText}>
            Upar Telegram button dabao — koi OTP nahi, koi password nahi ⚡
          </div>
        )}
      </div>
    </div>
  );
}
