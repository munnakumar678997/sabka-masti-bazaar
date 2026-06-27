import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import BottomNav from '../../components/BottomNav';
import '../../styles/games.css';

function getHourKey() {
  return Math.floor(Date.now() / 3600000);
}

const GAMES = [
  {
    id: 'spin',
    emoji: '🎰',
    name: 'Spin Wheel',
    rewardText: 'Up to 100',
    rewardColor: '#ff6a00',
    borderColor: '#ff6a00',
    glowColor: 'rgba(255,106,0,0.18)',
    btnGradient: 'linear-gradient(135deg, #ff6a00, #ee0979)',
    btnShadow: 'rgba(238,9,121,0.45)',
    path: '/games/spin',
    live: true,
  },
  {
    id: 'scratch',
    emoji: '🎁',
    name: 'Scratch Card',
    rewardText: 'Coming Soon',
    rewardColor: '#22c55e',
    borderColor: '#22c55e',
    glowColor: 'rgba(34,197,94,0.15)',
    btnGradient: 'linear-gradient(135deg, #16a34a, #22c55e)',
    btnShadow: 'rgba(34,197,94,0.4)',
    path: null,
    live: false,
  },
];

export default function GamesHub() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  const hourKey   = getHourKey();
  const spinCount = (user?.spin_hour_key === hourKey) ? (user?.spin_hour_count ?? 0) : 0;
  const spinsLeft = Math.max(0, 3 - spinCount);

  const handlePlay = (game) => {
    if (game.live && game.path) navigate(game.path);
  };

  return (
    <div className="gh-page">
      <div className="gh-glow gh-glow1" />
      <div className="gh-glow gh-glow2" />

      <div className={`gh-header ${visible ? 'gh-anim-drop' : 'gh-invisible'}`}>
        <div className="gh-title">🎮 Games</div>
        <div className="gh-balance-chip">
          <span>🪙</span>
          <span>{(user?.balance ?? 0).toLocaleString()}</span>
        </div>
      </div>

      <div className={`gh-subtitle ${visible ? 'gh-anim-fade' : 'gh-invisible'}`}>
        Khelo aur Coins Kamao!
      </div>

      <div className="gh-grid">
        {GAMES.map((game, i) => {
          const isSpinLive = game.id === 'spin';
          return (
            <div
              key={game.id}
              className={`gh-card ${!game.live ? 'gh-card-soon' : ''} ${visible ? 'gh-anim-pop' : 'gh-invisible'}`}
              style={{
                borderColor: game.borderColor,
                boxShadow: `0 0 18px ${game.glowColor}, 0 4px 20px rgba(0,0,0,0.4)`,
                animationDelay: visible ? `${0.1 + i * 0.12}s` : '0s',
              }}
              onClick={() => handlePlay(game)}
            >
              <div
                className="gh-icon-wrap"
                style={{
                  background: game.glowColor,
                  border: `2px solid ${game.borderColor}`,
                }}
              >
                <span className="gh-emoji">{game.emoji}</span>
              </div>

              <div className="gh-game-name">{game.name}</div>

              <div className="gh-reward" style={{ color: game.rewardColor }}>
                {game.live ? `Up to 100` : 'Coming Soon'}
                {game.live && <span className="gh-coin-icon"> 🪙</span>}
              </div>

              <div className="gh-divider" />

              {isSpinLive && (
                <div className="gh-plays">
                  {spinsLeft > 0
                    ? `${spinsLeft} spin${spinsLeft > 1 ? 's' : ''} left this hour`
                    : 'Next reset: next hour'}
                </div>
              )}

              <button
                className="gh-play-btn"
                style={{
                  background: game.btnGradient,
                  boxShadow: `0 4px 16px ${game.btnShadow}`,
                  opacity: game.live ? 1 : 0.55,
                  cursor: game.live ? 'pointer' : 'default',
                }}
                disabled={!game.live}
                onClick={(e) => { e.stopPropagation(); handlePlay(game); }}
              >
                {game.live ? '🎬 Play Now' : '🔒 Soon'}
              </button>
            </div>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
}
