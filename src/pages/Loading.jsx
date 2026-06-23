import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/loading.css';

export default function Loading() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="loading-page">

      {/* Background circles */}
      <div className="bg-circle bg-circle-1" />
      <div className="bg-circle bg-circle-2" />
      <div className="bg-circle bg-circle-3" />

      {/* Floating coins */}
      <span className="coin coin-1">🪙</span>
      <span className="coin coin-2">💰</span>
      <span className="coin coin-3">💸</span>
      <span className="coin coin-4">🪙</span>

      {/* Logo */}
      <div className="logo-area">
        <div className="logo-box">🎪</div>
        <h1 className="app-name">Sabka Masti Bazaar</h1>
        <p className="app-tagline">Khelo • Jeeto • Kamao</p>
      </div>

      {/* Loading bar */}
      <div className="loader-area">
        <div className="bar-track">
          <div className="bar-fill" />
        </div>
        <span className="loader-text">Loading...</span>
      </div>

      {/* Bottom tagline */}
      <p className="bottom-tag">🇮🇳 Desh ka sabse mast earning app</p>

    </div>
  );
}
