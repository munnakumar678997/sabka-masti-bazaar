import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/loading.css';

export default function Loading() {
  const navigate = useNavigate();

  useEffect(() => {
    sessionStorage.removeItem('smb_session');
    const timer = setTimeout(() => {
      sessionStorage.setItem('smb_session', '1');
      navigate('/login');
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

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
