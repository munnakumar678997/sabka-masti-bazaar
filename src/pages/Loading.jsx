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
    // sessionStorage hard reload pe automatically clear hoti hai — manually remove mat karo
    // warna React navigation pe bhi session delete ho jaata hai

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

    // initDataUnsafe?.user kabhi kabhi null hota hai — seedha initData string parse karo
    // initData ek URLencoded string hai: user={"id":...}&hash=...
    function parseTgUser(tg) {
      if (!tg?.initData) return null;
      // Method 1: initDataUnsafe (fastest)
      const u1 = tg.initDataUnsafe?.user;
      if (u1?.id) return u1;
      // Method 2: URLSearchParams se seedha parse karo (reliable fallback)
      try {
        const params = new URLSearchParams(tg.initData);
        const userStr = params.get('user');
        if (userStr) {
          const u2 = JSON.parse(userStr);
          if (u2?.id) return u2;
        }
      } catch (_) {}
      return null;
    }

    function parseTgStartParam(tg) {
      // Method 1: initDataUnsafe
      const sp1 = tg?.initDataUnsafe?.start_param;
      if (sp1) return sp1;
      // Method 2: URLSearchParams
      try {
        const params = new URLSearchParams(tg.initData);
        return params.get('start_param') || null;
      } catch (_) { return null; }
    }

    const checkUser = async () => {
      const tg = window.Telegram?.WebApp;

      // ── MINI APP ──
      if (tg && tg.initData && tg.initData.length > 0) {
        tg.ready();
        tg.expand();
        tg.setHeaderColor('#1a1a2e');
        tg.setBackgroundColor('#1a1a2e');

        const startParam = parseTgStartParam(tg);
        const referredBy = startParam && /^SMB\d+$/i.test(startParam) ? startParam : null;

        const user = parseTgUser(tg);

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

      // ── Fallback: localStorage check (Mini App + Web dono ke liye) ──
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
      <div className="bg-circle bg-circle-4" />

      <span className="coin coin-1">🪙</span>
      <span className="coin coin-2">💰</span>
      <span className="coin coin-3">💸</span>
      <span className="coin coin-4">🪙</span>
      <span className="coin coin-5">🎯</span>
      <span className="coin coin-6">🎪</span>

      <div className="logo-area">
        <div className="logo-box">🎪</div>
        <h1 className="app-name">Sabka Masti Bazaar</h1>
        <p className="app-tagline">Khelo • Jeeto • Kamao</p>
      </div>

      <div className="loader-area">
        <div className="bar-track">
          <div className="bar-fill" />
        </div>
        <span className="loader-text">
          Loading
          <i className="loader-dot">.</i>
          <i className="loader-dot">.</i>
          <i className="loader-dot">.</i>
        </span>
      </div>

      <p className="bottom-tag">🇮🇳 Desh ka sabse mast earning app</p>
    </div>
  );
}
