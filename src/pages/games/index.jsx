import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import BottomNav from '../../components/BottomNav';
import '../../styles/games.css';

function getISTDateStr() {
  const istMs = Date.now() + 5.5 * 60 * 60 * 1000;
  return new Date(istMs).toISOString().split('T')[0];
}

const GAMES = [
  {
    id: 'spin',
    emoji: '🎰',
    name: 'Spin Wheel',
    reward: 'Up to 100',
    rewardColor: '#ff6a00',
    borderColor: '#ff6a00',
    glowColor: 'rgba(255,106,0,0.18)',
    btnColor: 'linear-gradient(135deg, #ff6a00, #ee0979)',
    btnShadow: 'rgba(238,9,121,0.45)',
    path: '/games/spin',
    live: true,
  },
  {
    id: 'scratch',
    emoji: '🎁',
    name: 'Scratch Card',
    reward: 'Coming Soon',
    rewardColor: '#22c55e',
    borderColor: '#22c55e',
    glowColor: 'rgba(34,197,94,0.15)',
    btnColor: 'linear-gradient(135deg, #16a34a, #22c55e)',
    btnShadow: 'rgba(34,197,94,0.4)',
    path: null,
    live: false,
  },
  {
    id: 'coinflip',
    emoji: '🪙',
    name: 'Coin Flip',
    reward: 'Coming Soon',
    rewardColor: '#eab308',
    borderColor: '#eab308',
    glowColor: 'rgba(234,179,8,0.15)',
    btnColor: 'linear-gradient(135deg, #a16207, #eab308)',
    btnShadow: 'rgba(234,179,8,0.4)',
    path: null,
    live: false,
  },
  {
    id: 'lucky',
    emoji: '🎯',
    name: 'Lucky Zone',
    reward: 'Coming Soon',
    rewardColor: '#a855f7',
    borderColor: '#a855f7',
    glowColor: 'rgba(168,85,247,0.15)',
    btnColor: 'linear-gradient(135deg, #7c3aed, #a855f7)',
    btnShadow: 'rgba(168,85,247,0.4)',
    path: null,
    live: false,
  },
];

export default function GamesHub() {
  const navigate = useNavigate();
  const { user } = useApp();

  const todayIST    = getISTDateStr();
  const alreadySpun = user?.last_spin_date === todayIST;

  const handlePlay = (game) => {
    if (game.live && game.path) navigate(game.path);
  };

  return (
    <div className="gh-page">
      <div className="gh-glow gh-glow1" />
      <div className="gh-glow gh-glow2" />

      <div className="gh-header">
        <div className="gh-title">🎮 Games</div>
        <div className="gh-balance-chip">
          <span>🪙</span>
          <span>{(user?.balance ?? 0).toLocaleString()}</span>
        </div>
      </div>

      <div className="gh-subtitle">Khelo aur Coins Kamao!</div>

      <div className="gh-grid">
        {GAMES.map((game) => {
          const played = game.id === 'spin' && alreadySpun ? 1 : 0;
          return (
            <div
              key={game.id}
              className={`gh-card ${!game.live ? 'gh-card-soon' : ''}`}
              style={{
                borderColor: game.borderColor,
                boxShadow: `0 0 18px ${game.glowColor}, 0 4px 20px rgba(0,0,0,0.4)`,
              }}
              onClick={() => handlePlay(game)}
            >
              <div
                className="gh-icon-wrap"
                style={{ background: `${game.glowColor}`, border: `2px solid ${game.borderColor}` }}
              >
                <span className="gh-emoji">{game.emoji}</span>
              </div>

              <div className="gh-game-name">{game.name}</div>

              <div className="gh-reward" style={{ color: game.rewardColor }}>
                {game.live ? `Up to 100` : 'Coming Soon'}
                {game.live && <span className="gh-coin-icon"> 🪙</span>}
              </div>

              <div className="gh-divider" />

              {game.live && (
                <div className="gh-plays">{played}/1 played today</div>
              )}

              <button
                className="gh-play-btn"
                style={{
                  background: game.btnColor,
                  boxShadow: `0 4px 16px ${game.btnShadow}`,
                  opacity: game.live ? 1 : 0.55,
                  cursor: game.live ? 'pointer' : 'default',
                }}
                disabled={!game.live}
                onClick={(e) => { e.stopPropagation(); handlePlay(game); }}
              >
                {game.live ? '🎬 Play Now' : '🔒 Soon'}
              </button>

              {!game.live && (
                <div className="gh-soon-badge">Coming Soon</div>
              )}
            </div>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
}
