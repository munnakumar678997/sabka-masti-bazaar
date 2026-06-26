import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import BottomNav from '../../components/BottomNav';
import SpinWheelModal  from './SpinWheel';
import ScratchCardModal from './ScratchCard';
import CoinFlipModal   from './CoinFlip';
import { getNetUsed, getNetTimeLeft, fmtMs } from './gameUtils';
import { AD_NETWORKS, NET_LIMIT } from './adNetworks';
import '../../styles/games.css';

const GAME_DEFS = [
  { key: 'spin',    icon: '🎰', name: 'Spin Wheel',  color: '#ff6a00', earn: 'Up to 200🪙' },
  { key: 'scratch', icon: '🎁', name: 'Scratch Card', color: '#22c55e', earn: 'Up to 200🪙' },
  { key: 'flip',    icon: '🪙', name: 'Coin Flip',    color: '#ffd700', earn: '+15🪙 per win' },
];

export default function Games() {
  const { balance }  = useApp();
  const [openGame,   setOpenGame]  = useState(null);
  const [activeNet,  setActiveNet] = useState(AD_NETWORKS[0]);
  const [tick,       setTick]      = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const refresh = () => setTick(t => t + 1);

  return (
    <div className="games-page">

      {/* ── TOPBAR ── */}
      <div className="games-topbar">
        <div className="games-topbar-title">🎮 Games Hub</div>
        <div className="games-balance-chip">🪙 {balance.toLocaleString()}</div>
      </div>

      {/* ── NETWORK SELECTOR TABS ── */}
      <div className="net-tabs-wrap">
        <div className="net-tabs-lbl">🎯 Ad Zone चुनो</div>
        <div className="net-tabs">
          {AD_NETWORKS.map(net => {
            const totalUsed = GAME_DEFS.reduce((a, g) => a + getNetUsed(net.id, g.key), 0);
            const totalLeft = NET_LIMIT * GAME_DEFS.length - totalUsed;
            const isActive  = activeNet.id === net.id;
            return (
              <button
                key={net.id}
                className={`net-tab ${isActive ? 'net-tab-active' : ''}`}
                style={{ '--nc': net.color, '--ng': net.grad }}
                onClick={() => setActiveNet(net)}>
                <span className="net-tab-icon">{net.label}</span>
                <span className="net-tab-count">{totalLeft}/{NET_LIMIT * GAME_DEFS.length}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── SCROLLABLE CONTENT ── */}
      <div className="games-scroll">

        <div className="games-hero-note">
          ⏰ Har zone 4 ghante baad reset · Ad dekho = Reward pao!
        </div>

        {/* ── GAME GRID ── */}
        <div className="games-grid">
          {GAME_DEFS.map(g => {
            const used     = getNetUsed(activeNet.id, g.key);
            const done     = used >= NET_LIMIT;
            const pct      = Math.round((used / NET_LIMIT) * 100);
            const timeLeft = done ? getNetTimeLeft(activeNet.id, g.key) : 0;
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
                  style={{ color: done ? 'rgba(255,255,255,0.28)' : g.color }}>
                  {g.earn}
                </div>
                <div className="game-tile-prog-bar">
                  <div className="game-tile-prog-fill"
                    style={{ width: `${pct}%`, background: done ? '#555' : g.color }} />
                </div>
                <div className="game-tile-plays">
                  {done
                    ? (timeLeft > 0 ? `⏰ ${fmtMs(timeLeft)}` : '🔄 Ready!')
                    : `${used}/${NET_LIMIT} played`}
                </div>
                {!done && (
                  <div className="game-tile-play-btn"
                    style={{ background: `linear-gradient(135deg,${g.color},${g.color}bb)` }}>
                    🎬 AD & PLAY
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── NET STATUS CARD ── */}
        <div className="net-status-card" style={{ '--nc': activeNet.color, '--ng': activeNet.grad }}>
          <div className="nsc-title">
            <span className="nsc-badge" style={{ background: activeNet.grad }}>{activeNet.label}</span>
            <span className="nsc-zone">Zone Status</span>
          </div>
          <div className="nsc-row">
            {GAME_DEFS.map(g => {
              const left     = NET_LIMIT - getNetUsed(activeNet.id, g.key);
              const timeLeft = getNetTimeLeft(activeNet.id, g.key);
              const icons    = { spin: '🎰', scratch: '🎁', flip: '🪙' };
              return (
                <div key={g.key} className="nsc-item">
                  <span className="nsc-icon">{icons[g.key]}</span>
                  <span className="nsc-val" style={{ color: left > 0 ? activeNet.color : '#f87171' }}>
                    {left > 0 ? `${left} left` : timeLeft > 0 ? fmtMs(timeLeft) : '✅'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ height: 100 }} />
      </div>

      <BottomNav />

      {openGame === 'spin'    && <SpinWheelModal   network={activeNet} onClose={() => setOpenGame(null)} onRefresh={refresh} />}
      {openGame === 'scratch' && <ScratchCardModal  network={activeNet} onClose={() => setOpenGame(null)} onRefresh={refresh} />}
      {openGame === 'flip'    && <CoinFlipModal     network={activeNet} onClose={() => setOpenGame(null)} onRefresh={refresh} />}
    </div>
  );
}
