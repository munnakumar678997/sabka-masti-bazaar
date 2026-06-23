import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import '../styles/loading.css';

export default function Loading() {
  const navigate       = useNavigate();
  const { loadUser }   = useApp();

  useEffect(() => {
    sessionStorage.removeItem('smb_session');

    let navigated = false;

    const goHome  = async (tgData) => {
      if (navigated) return;
      navigated = true;
      await loadUser(tgData);
      sessionStorage.setItem('smb_session', '1');
      navigate('/home');
    };

    const goLogin = () => {
      if (navigated) return;
      navigated = true;
      sessionStorage.setItem('smb_session', '1');
      navigate('/login');
    };

    // ── Minimum 2.5s splash dikhao ──
    const minTimer = new Promise(res => setTimeout(res, 2500));

    // ── Background check: user pehle se hai? ──
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
          const { data } = await supabase
            .from('users')
            .select('id')
            .eq('id', tgData.id)
            .maybeSingle();

          return data ? { found: true, tgData } : { found: false, tgData };
        }
      }

      // ── WEB: localStorage check ──
      const savedId = localStorage.getItem('smb_tg_id');
      if (savedId) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', parseInt(savedId))
          .maybeSingle();

        if (data) {
          return {
            found: true,
            tgData: {
              id:        data.id,
              name:      data.name,
              username:  data.username,
              photo_url: data.photo_url,
            },
          };
        } else {
          localStorage.removeItem('smb_tg_id');
        }
      }

      return { found: false, tgData: null };
    };

    // Dono parallel chalao — jo pehle khatam ho
    Promise.all([minTimer, checkUser()]).then(([, result]) => {
      if (result.found && result.tgData) {
        goHome(result.tgData);
      } else {
        goLogin();
      }
    });

    // Fallback: 5s ke baad bhi kuch na hua toh login bhejo
    const fallback = setTimeout(() => goLogin(), 5000);
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
