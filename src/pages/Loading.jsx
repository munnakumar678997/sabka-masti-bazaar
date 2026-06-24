import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import '../styles/loading.css';

export default function Loading() {
  const navigate     = useNavigate();
  const { loadUser } = useApp();

  useEffect(() => {
    sessionStorage.removeItem('smb_session');

    let navigated = false;

    const goHome = async (tgData, referredBy = null) => {
      if (navigated) return;
      navigated = true;
      await loadUser(tgData, null, referredBy);
      sessionStorage.setItem('smb_session', '1');
      navigate('/home');
    };

    const goLogin = (tgData = null, mode = 'new', referredBy = null) => {
      if (navigated) return;
      navigated = true;
      sessionStorage.setItem('smb_session', '1');
      navigate('/login', { state: { tgData, mode, referredBy } });
    };

    const minTimer = new Promise(res => setTimeout(res, 2500));

    const checkUser = async () => {
      const tg = window.Telegram?.WebApp;

      // ── MINI APP ──
      if (tg && tg.initData && tg.initData.length > 0) {
        tg.ready();
        tg.expand();
        tg.setHeaderColor('#1a1a2e');
        tg.setBackgroundColor('#1a1a2e');
        const user = tg.initDataUnsafe?.user;

        // Referral code capture — start_param mein hota hai (e.g. "SMB12345")
        const startParam  = tg.initDataUnsafe?.start_param || null;
        const referredBy  = startParam && /^SMB\d+$/i.test(startParam) ? startParam : null;

        if (user) {
          const tgData = {
            id:        user.id,
            name:      `${user.first_name} ${user.last_name || ''}`.trim(),
            username:  user.username  || null,
            photo_url: user.photo_url || null,
          };

          const userSnap = await getDoc(doc(db, 'users', String(tgData.id)));

          if (!userSnap.exists()) {
            return { action: 'login', tgData, mode: 'new', referredBy };
          } else if (!userSnap.data().mobile) {
            return { action: 'login', tgData, mode: 'need_mobile', referredBy: null };
          } else {
            return { action: 'home', tgData, referredBy: null };
          }
        }
      }

      // ── WEB: localStorage check ──
      const savedId = localStorage.getItem('smb_tg_id');
      if (savedId) {
        const userSnap = await getDoc(doc(db, 'users', savedId));

        if (userSnap.exists()) {
          const data = userSnap.data();
          const tgData = {
            id:        data.id,
            name:      data.name,
            username:  data.username,
            photo_url: data.photo_url,
          };
          if (!data.mobile) {
            return { action: 'login', tgData, mode: 'need_mobile', referredBy: null };
          }
          return { action: 'home', tgData, referredBy: null };
        } else {
          localStorage.removeItem('smb_tg_id');
        }
      }

      return { action: 'login', tgData: null, mode: 'new', referredBy: null };
    };

    Promise.all([minTimer, checkUser()])
      .then(([, result]) => {
        if (result.action === 'home') {
          goHome(result.tgData, result.referredBy);
        } else {
          goLogin(result.tgData, result.mode, result.referredBy);
        }
      })
      .catch((err) => {
        // Network error ya Firestore fail — login pe le jao
        console.error('Loading checkUser error:', err);
        goLogin(null, 'new', null);
      });

    const fallback = setTimeout(() => goLogin(null, 'new', null), 10000);
    return () => clearTimeout(fallback);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="loading-page">
      <div className="bg-circle bg-circle-1" />
      <div className="bg-circle bg-circle-2" />
      <div className="bg-circle bg-circle-3" />

      <span className="coin coin-1">🪙</span>
      <span className="coin coin-2">💰</span>
      <span className="coin coin-3">💸</span>
      <span className="coin coin-4">🪙</span>

      <div className="logo-area">
        <div className="logo-box">🎪</div>
        <h1 className="app-name">Sabka Masti Bazaar</h1>
        <p className="app-tagline">Khelo • Jeeto • Kamao</p>
      </div>

      <div className="loader-area">
        <div className="bar-track">
          <div className="bar-fill" />
        </div>
        <span className="loader-text">Loading...</span>
      </div>

      <p className="bottom-tag">🇮🇳 Desh ka sabse mast earning app</p>
    </div>
  );
}
