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

    const goHome = async (tgData) => {
      if (navigated) return;
      navigated = true;
      await loadUser(tgData);
      sessionStorage.setItem('smb_session', '1');
      navigate('/home');
    };

    const goLogin = (tgData = null, mode = 'new') => {
      if (navigated) return;
      navigated = true;
      sessionStorage.setItem('smb_session', '1');
      navigate('/login', { state: { tgData, mode } });
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
        if (user) {
          const tgData = {
            id:        user.id,
            name:      `${user.first_name} ${user.last_name || ''}`.trim(),
            username:  user.username  || null,
            photo_url: user.photo_url || null,
          };

          const userSnap = await getDoc(doc(db, 'users', String(tgData.id)));

          if (!userSnap.exists()) {
            return { action: 'login', tgData, mode: 'new' };
          } else if (!userSnap.data().mobile) {
            return { action: 'login', tgData, mode: 'need_mobile' };
          } else {
            return { action: 'home', tgData };
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
            return { action: 'login', tgData, mode: 'need_mobile' };
          }
          return { action: 'home', tgData };
        } else {
          localStorage.removeItem('smb_tg_id');
        }
      }

      return { action: 'login', tgData: null, mode: 'new' };
    };

    Promise.all([minTimer, checkUser()]).then(([, result]) => {
      if (result.action === 'home') {
        goHome(result.tgData);
      } else {
        goLogin(result.tgData, result.mode);
      }
    });

    const fallback = setTimeout(() => goLogin(null, 'new'), 5000);
    return () => clearTimeout(fallback);
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
