import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { showAdByPlatform, getSelectedPlatform } from './adManager';
import './scratch.css';

const MAX_SCRATCHES     = 3;
const CARD_W            = 272;
const CARD_H            = 154;
const BRUSH_R           = 24;
const REVEAL_THRESHOLD  = 0.62;

const REWARDS = [
  { coins: 5,  label: '5',  emoji: '🌿', bg: 'linear-gradient(135deg,#16a34a,#22c55e)' },
  { coins: 5,  label: '5',  emoji: '⭐', bg: 'linear-gradient(135deg,#ca8a04,#eab308)' },
  { coins: 10, label: '10', emoji: '🪙', bg: 'linear-gradient(135deg,#ea580c,#f97316)' },
  { coins: 10, label: '10', emoji: '🎯', bg: 'linear-gradient(135deg,#dc2626,#ef4444)' },
  { coins: 15, label: '15', emoji: '💫', bg: 'linear-gradient(135deg,#0891b2,#06b6d4)' },
  { coins: 25, label: '25', emoji: '💰', bg: 'linear-gradient(135deg,#7c3aed,#a855f7)' },
  { coins: 50, label: '50', emoji: '👑', bg: 'linear-gradient(135deg,#ff6a00,#ee0979)' },
];

function getHourKey()       { return Math.floor(Date.now() / 3600000); }
function getSecsLeftInHour(){ const ms = Date.now() % 3600000; return Math.ceil((3600000 - ms) / 1000); }
function fmtMmSs(secs)      { const m = Math.floor(secs/60), s = secs%60; return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; }
function pickReward()       { return REWARDS[Math.floor(Math.random() * REWARDS.length)]; }

export default function ScratchGame() {
  const { user, scratchClaim } = useApp();
  const navigate               = useNavigate();

  const [phase,      setPhase]      = useState('ready'); // 'ready' | 'done'
  const [reward,     setReward]     = useState(() => pickReward());
  const [timeLeft,   setTimeLeft]   = useState(getSecsLeftInHour());
  const [pct,        setPct]        = useState(0);
  const [adWatched,  setAdWatched]  = useState(false);
  const [adLoading,  setAdLoading]  = useState(false);

  const canvasRef    = useRef(null);
  const ctxRef       = useRef(null);
  const isDrawing    = useRef(false);
  const audioCtxRef  = useRef(null);
  const lastNoiseRef = useRef(0);
  const claimedRef   = useRef(false);

  const hourKey       = getHourKey();
  const scratchCount  = (user?.scratch_hour_key === hourKey) ? (user?.scratch_hour_count ?? 0) : 0;
  const scratchesLeft = Math.max(0, MAX_SCRATCHES - scratchCount);
  const cardsDone     = MAX_SCRATCHES - scratchesLeft;
  const canScratch    = phase === 'ready' && scratchesLeft > 0 && !!user && adWatched;

  // ── Audio helpers ──────────────────────────────────────────────
  const getAudioCtx = () => {
    if (!audioCtxRef.current)
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtxRef.current.state !== 'running') audioCtxRef.current.resume();
    return audioCtxRef.current;
  };

  // Scratch sound — soft paper whisper (low-freq filtered noise)
  const playScratch = useCallback(() => {
    const now = Date.now();
    if (now - lastNoiseRef.current < 50) return;
    lastNoiseRef.current = now;
    try {
      const ac   = getAudioCtx();
      const t    = ac.currentTime;
      const len  = Math.floor(ac.sampleRate * 0.035);
      const buf  = ac.createBuffer(1, len, ac.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++)
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.5));
      const src  = ac.createBufferSource();
      src.buffer = buf;
      const lpf  = ac.createBiquadFilter();
      lpf.type   = 'lowpass';
      lpf.frequency.value = 900;
      lpf.Q.value = 0.5;
      const gain = ac.createGain();
      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
      src.connect(lpf); lpf.connect(gain); gain.connect(ac.destination);
      src.start(t);
    } catch (_) {}
  }, []);

  // Win jingle — soft marimba chime (triangle wave, slow decay)
  const playWin = useCallback(() => {
    try {
      const ac    = getAudioCtx();
      const notes = [
        { freq: 523,  vol: 0.22, delay: 0    },
        { freq: 659,  vol: 0.20, delay: 0.14 },
        { freq: 784,  vol: 0.20, delay: 0.26 },
        { freq: 1047, vol: 0.18, delay: 0.38 },
        { freq: 1319, vol: 0.16, delay: 0.50 },
      ];
      notes.forEach(({ freq, vol, delay }) => {
        const t    = ac.currentTime + delay;
        const osc  = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.98, t + 0.5);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(vol, t + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
        osc.connect(gain); gain.connect(ac.destination);
        osc.start(t); osc.stop(t + 0.68);
      });
    } catch (_) {}
  }, []);

  // ── Audio pre-warm on first touch ────────────────────────────
  useEffect(() => {
    const prime = async () => {
      try {
        const ac = getAudioCtx();
        if (ac.state !== 'running') await ac.resume();
        const buf = ac.createBuffer(1, 1, ac.sampleRate);
        const src = ac.createBufferSource();
        src.buffer = buf; src.connect(ac.destination); src.start(0);
      } catch (_) {}
    };
    document.addEventListener('touchstart', prime, { capture: true, once: true });
    document.addEventListener('mousedown',  prime, { capture: true, once: true });
    return () => {
      document.removeEventListener('touchstart', prime, true);
      document.removeEventListener('mousedown',  prime, true);
    };
  }, []);

  // ── Countdown timer ───────────────────────────────────────────
  useEffect(() => {
    if (scratchesLeft > 0) return;
    setTimeLeft(getSecsLeftInHour());
    const id = setInterval(() => {
      const s = getSecsLeftInHour();
      setTimeLeft(s);
      if (s <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [scratchesLeft]);

  // ── Draw scratch overlay ──────────────────────────────────────
  const drawOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx  = canvas.getContext('2d');
    ctxRef.current = ctx;
    ctx.clearRect(0, 0, CARD_W, CARD_H);

    // Silver scratch layer — rounded rect (all browsers compatible)
    const grd = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
    grd.addColorStop(0,   '#b8b8c8');
    grd.addColorStop(0.4, '#d8d8e8');
    grd.addColorStop(0.7, '#a8a8b8');
    grd.addColorStop(1,   '#c0c0d0');
    ctx.fillStyle = grd;
    const r = 18;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(CARD_W - r, 0);
    ctx.arcTo(CARD_W, 0, CARD_W, r, r);
    ctx.lineTo(CARD_W, CARD_H - r);
    ctx.arcTo(CARD_W, CARD_H, CARD_W - r, CARD_H, r);
    ctx.lineTo(r, CARD_H);
    ctx.arcTo(0, CARD_H, 0, CARD_H - r, r);
    ctx.lineTo(0, r);
    ctx.arcTo(0, 0, r, 0, r);
    ctx.closePath();
    ctx.fill();

    // Scratch texture lines
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth   = 1;
    for (let y = 6; y < CARD_H; y += 9) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CARD_W, y); ctx.stroke();
    }

    // Center hint text
    ctx.font         = 'bold 15px "Segoe UI", sans-serif';
    ctx.fillStyle    = 'rgba(80,80,100,0.7)';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✦ Scratch Here ✦', CARD_W / 2, CARD_H / 2 - 8);
    ctx.font      = '12px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(80,80,100,0.5)';
    ctx.fillText('Isko Scratch Karo!', CARD_W / 2, CARD_H / 2 + 12);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width  = CARD_W;
    canvas.height = CARD_H;
    drawOverlay();
    claimedRef.current = false;
    setPct(0);
  }, [drawOverlay, reward]);

  // ── Scratch logic ─────────────────────────────────────────────
  const scratchAt = useCallback((x, y) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, BRUSH_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    playScratch();

    // Check reveal %
    const canvas     = canvasRef.current;
    const imageData  = ctx.getImageData(0, 0, CARD_W, CARD_H).data;
    let transparent  = 0;
    for (let i = 3; i < imageData.length; i += 4)
      if (imageData[i] === 0) transparent++;
    const revealed = transparent / (CARD_W * CARD_H);
    setPct(Math.round(revealed * 100));

    if (revealed >= REVEAL_THRESHOLD && !claimedRef.current) {
      claimedRef.current = true;
      // Fully clear overlay
      ctx.clearRect(0, 0, CARD_W, CARD_H);
      setPhase('done');
      playWin();
      scratchClaim(reward.coins).catch(() => {});
    }
  }, [playScratch, playWin, reward, scratchClaim]);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const src  = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const onStart = (e) => {
    if (phase !== 'ready' || !canScratch) return;
    e.preventDefault();
    isDrawing.current = true;
    const { x, y } = getPos(e, canvasRef.current);
    scratchAt(x, y);
  };
  const onMove = (e) => {
    if (!isDrawing.current || phase !== 'ready') return;
    e.preventDefault();
    const { x, y } = getPos(e, canvasRef.current);
    scratchAt(x, y);
  };
  const onEnd = () => { isDrawing.current = false; };

  // ── Watch Ad → unlock scratching ─────────────────────────────
  const handleWatchAd = async () => {
    if (adLoading) return;
    setAdLoading(true);
    try {
      const platformId = window.__smbAdPlatform || getSelectedPlatform();
      await showAdByPlatform(platformId);
      setAdWatched(true);
    } catch (_) {
      // Ad fail ya skip hone pe bhi scratch unlock karo
      setAdWatched(true);
    } finally {
      setAdLoading(false);
    }
  };

  // ── New card ──────────────────────────────────────────────────
  const handleNewCard = () => {
    setReward(pickReward());
    setPhase('ready');
    setAdWatched(false);   // naya card = phir se ad dekhna hoga
    setAdLoading(false);
    claimedRef.current = false;
    setPct(0);
  };

  // ── Render ────────────────────────────────────────────────────
  const scratchsDone = MAX_SCRATCHES - scratchesLeft;

  return (
    <div className="sc-page">
      <div className="sc-glow sc-glow1" />
      <div className="sc-glow sc-glow2" />

      {/* Header */}
      <div className="sc-header">
        <button className="sc-back-btn" onClick={() => navigate('/games')}>← Back</button>
        <div className="sc-title">🎁 Scratch Card</div>
        <div className="sc-balance-chip">
          <span>🪙</span>
          <span>{(user?.balance ?? 0).toLocaleString()}</span>
        </div>
      </div>

      {/* Dots counter */}
      <div className="sc-dots-row">
        {Array.from({ length: MAX_SCRATCHES }).map((_, i) => (
          <div key={i} className={`sc-dot ${i < scratchsDone ? 'sc-dot-used' : 'sc-dot-free'}`} />
        ))}
      </div>

      {/* Card area */}
      <div className="sc-card-wrap">
        {/* Reward layer — sirf scratching ke time dikhao */}
        {phase !== 'done' && (
          <div className="sc-reward-bg" style={{ background: reward.bg }}>
            <div className="sc-reward-emoji">{reward.emoji}</div>
            <div className="sc-reward-coins">{reward.label}</div>
            <div className="sc-reward-label">Coins</div>
          </div>
        )}

        {/* Canvas scratch layer */}
        <canvas
          ref={canvasRef}
          className={`sc-canvas ${canScratch ? 'sc-canvas-active' : ''}`}
          style={{ display: phase === 'done' ? 'none' : 'block' }}
          onMouseDown={onStart}
          onMouseMove={onMove}
          onMouseUp={onEnd}
          onMouseLeave={onEnd}
          onTouchStart={onStart}
          onTouchMove={onMove}
          onTouchEnd={onEnd}
        />

        {/* Ad gate — ad dekhne ke baad hi scratch milega */}
        {phase === 'ready' && scratchesLeft > 0 && !adWatched && (
          <div className="sc-ad-gate">
            <div className="sc-ad-icon">📺</div>
            <div className="sc-ad-title">Ad Dekho, Scratch Karo!</div>
            <div className="sc-ad-sub">Short ad dekne ke baad card scratch kar sakte ho</div>
            <button
              className={`sc-ad-btn ${adLoading ? 'sc-ad-btn-loading' : ''}`}
              onClick={handleWatchAd}
              disabled={adLoading}
            >
              {adLoading ? '⏳ Loading...' : '▶ Ad Dekho & Khelo'}
            </button>
          </div>
        )}

        {/* Win card — reward bg ka same gradient, koi overlap nahi */}
        {phase === 'done' && (
          <div className="sc-win-overlay" style={{ background: reward.bg }}>
            <div className="sc-win-emoji">{reward.emoji}</div>
            <div className="sc-win-text">+{reward.coins} Coins!</div>
            <div className="sc-win-sub">Badhai ho! Coins add ho gaye 🎉</div>
          </div>
        )}
      </div>

      {/* Hint or pct */}
      <div className="sc-hint">
        {phase === 'ready' && !adWatched && scratchesLeft > 0 && 'Ad dekho aur scratch card unlock karo!'}
        {phase === 'ready' && canScratch && pct < 10  && 'Ungli se ghisao aur jeeto!'}
        {phase === 'ready' && canScratch && pct >= 10 && pct < 60 && `${pct}% scratched...`}
        {phase === 'ready' && canScratch && pct >= 60 && 'Almost done!'}
        {phase === 'done' && ' '}
        {scratchesLeft === 0 && phase !== 'done' && ' '}
      </div>

      {/* Bottom */}
      <div className="sc-bottom">
        {scratchesLeft === 0 && phase !== 'done' ? (
          <div className="sc-timer-box">
            <div className="sc-timer-label">Agli Card</div>
            <div className="sc-timer-val">{fmtMmSs(timeLeft)}</div>
          </div>
        ) : phase === 'done' ? (
          scratchesLeft > 0 ? (
            <button className="sc-next-btn" onClick={handleNewCard}>
              🎁 Agli Card ({scratchesLeft} bachi)
            </button>
          ) : (
            <div className="sc-timer-box">
              <div className="sc-timer-label">Agli Card</div>
              <div className="sc-timer-val">{fmtMmSs(timeLeft)}</div>
            </div>
          )
        ) : (
          <div className="sc-reward-chips">
            {[5, 10, 15, 25, 50].map(c => (
              <div key={c} className="sc-chip">
                <span className="sc-chip-emoji">🪙</span>
                <span className="sc-chip-val">{c} coins</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
