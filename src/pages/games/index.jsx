import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import BottomNav from '../../components/BottomNav';
import SpinWheelModal,  { SPIN_LIMIT    } from './SpinWheel';
import ScratchCardModal,{ SCRATCH_LIMIT } from './ScratchCard';
import CoinFlipModal,   { FLIP_LIMIT    } from './CoinFlip';
import { getUsed } from './gameUtils';
import '../../styles/games.css';

export default function Games() {
  const { balance } = useApp();
  const [openGame, setOpenGame] = useState(null);
  const [tick,     setTick]     = useState(0);

  const refresh = () => setTick(t => t + 1);

  const GAMES = [
    {
      key: 'spin',    icon: '🎰', name: 'Spin Wheel',
      color: '#ff6a00', earn: 'Up to 200🪙',
      used: getUsed('spin'),    limit: SPIN_LIMIT,
    },
    {
      key: 'scratch', icon: '🎁', name: 'Scratch Card',
      color: '#22c55e', earn: 'Up to 200🪙',
      used: getUsed('scratch'), limit: SCRATCH_LIMIT,
    },
    {
      key: 'flip',    icon: '🪙', name: 'Coin Flip',
      color: '#ffd700', earn: '+15🪙 per win',
      used: getUsed('flip'),    limit: FLIP_LIMIT,
    },
  ];

  return (
    <div className="games-page">

      <div className="games-topbar">
        <div className="games-topbar-title">🎮 Games Hub</div>
        <div className="games-balance-chip">🪙 {balance.toLocaleString()}</div>
      </div>

      <div className="games-scroll">
        <div className="games-hero-note">🕛 Roz raat 12 baje reset · Daily free plays!</div>

        <div className="games-grid">
          {GAMES.map(g => {
            const done = g.used >= g.limit;
            const pct  = Math.round((g.used / g.limit) * 100);
            return (
              <div key={g.key}
                className={`game-tile ${done ? 'game-tile-done' : ''}`}
                style={{ '--gc': g.color }}
                onClick={() => { if (!done) setOpenGame(g.key); }}>

                <div className="game-tile-icon-wrap">
                  <span className="game-tile-icon">{done ? '✅' : g.icon}</span>
                </div>
                <div className="game-tile-name">{g.name}</div>
                <div className="game-tile-earn"
                  style={{ color: done ? 'rgba(255,255,255,0.3)' : g.color }}>
                  {g.earn}
                </div>
                <div className="game-tile-prog-bar">
                  <div className="game-tile-prog-fill"
                    style={{ width: `${pct}%`, background: done ? '#555' : g.color }} />
                </div>
                <div className="game-tile-plays">
                  {done ? '✅ Done aaj ke liye' : `${g.used}/${g.limit} played`}
                </div>
                {!done && (
                  <div className="game-tile-play-btn"
                    style={{ background: `linear-gradient(135deg, ${g.color}, ${g.color}bb)` }}>
                    PLAY ▶
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ height: 100 }} />
      </div>

      <BottomNav />

      {openGame === 'spin'    && <SpinWheelModal   onClose={() => setOpenGame(null)} onRefresh={refresh} />}
      {openGame === 'scratch' && <ScratchCardModal  onClose={() => setOpenGame(null)} onRefresh={refresh} />}
      {openGame === 'flip'    && <CoinFlipModal     onClose={() => setOpenGame(null)} onRefresh={refresh} />}
    </div>
  );
}
