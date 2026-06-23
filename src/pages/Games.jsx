import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import '../styles/games.css';

// ── Daily limit helpers ──
function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}
function getUsed(gameKey) {
  const key = `smb_game_${gameKey}_${getTodayKey()}`;
  return parseInt(localStorage.getItem(key) || '0');
}
function incUsed(gameKey) {
  const key = `smb_game_${gameKey}_${getTodayKey()}`;
  localStorage.setItem(key, String(getUsed(gameKey) + 1));
}

// ── Spin Wheel config ──
const SPIN_SEGMENTS = [
  { label: '5',   coins: 5,   color: '#ff6a00', prob: 0.38 },
  { label: '10',  coins: 10,  color: '#ee0979', prob: 0.25 },
  { label: '20',  coins: 20,  color: '#7b2ff7', prob: 0.16 },
  { label: '50',  coins: 50,  color: '#0088cc', prob: 0.10 },
  { label: '100', coins: 100, color: '#22c55e', prob: 0.07 },
  { label: '200', coins: 200, color: '#ffd700', prob: 0.04 },
];
const SPIN_LIMIT = 5;

function pickSegment() {
  const r = Math.random();
  let cum = 0;
  for (const s of SPIN_SEGMENTS) { cum += s.prob; if (r < cum) return s; }
  return SPIN_SEGMENTS[0];
}

// ── Scratch Card prizes ──
const SCRATCH_PRIZES = [
  { coins: 5,   prob: 0.40 }, { coins: 10,  prob: 0.25 },
  { coins: 25,  prob: 0.18 }, { coins: 50,  prob: 0.10 },
  { coins: 100, prob: 0.06 }, { coins: 200, prob: 0.01 },
];
const SCRATCH_LIMIT = 3;

function pickScratch() {
  const r = Math.random(); let cum = 0;
  for (const p of SCRATCH_PRIZES) { cum += p.prob; if (r < cum) return p.coins; }
  return 5;
}

// ── Quiz questions ──
const QUIZ_QUESTIONS = [
  { q: 'India ki capital kya hai?',            opts: ['Mumbai','New Delhi','Kolkata','Chennai'],  ans: 1 },
  { q: '2 × 8 kitna hota hai?',                opts: ['14','15','16','18'],                       ans: 2 },
  { q: 'Kaunsa planet sabse bada hai?',         opts: ['Saturn','Earth','Jupiter','Neptune'],      ans: 2 },
  { q: 'Cricket mein ek over mein kitni balls?',opts: ['4','5','6','8'],                           ans: 2 },
  { q: 'India ne pehli cricket World Cup kab jeeti?', opts: ['1975','1979','1983','1987'],         ans: 2 },
  { q: 'Sabse badi ocean kaun si hai?',         opts: ['Atlantic','Indian','Pacific','Arctic'],    ans: 2 },
  { q: 'Rupee ka symbol kya hai?',              opts: ['Rs','₹','R','Rp'],                        ans: 1 },
  { q: 'Google ka CEO kaun hai?',               opts: ['Elon Musk','Sundar Pichai','Jeff Bezos','Tim Cook'], ans: 1 },
  { q: '100 - 37 kitna hai?',                   opts: ['53','63','73','83'],                       ans: 1 },
  { q: 'Taj Mahal kahan hai?',                  opts: ['Delhi','Jaipur','Agra','Lucknow'],         ans: 2 },
];
const QUIZ_LIMIT = 5;
const QUIZ_COINS = 15;

export default function Games() {
  const navigate = useNavigate();
  const { addCoins, balance } = useApp();

  // Which game is open
  const [openGame, setOpenGame] = useState(null);
  const [toast,    setToast]    = useState('');
  const [, forceUpdate] = useState(0);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const refresh = () => forceUpdate(n => n + 1);

  // ── SPIN WHEEL state ──
  const [spinning,    setSpinning]    = useState(false);
  const [spinResult,  setSpinResult]  = useState(null);
  const [spinDeg,     setSpinDeg]     = useState(0);
  const spinDegRef = useRef(0);

  // ── SCRATCH state ──
  const [scratchCards, setScratchCards] = useState([null, null, null]);
  const [scratchDone,  setScratchDone]  = useState([false, false, false]);

  // ── COIN FLIP state ──
  const [flipChoice,  setFlipChoice]  = useState(null);
  const [flipping,    setFlipping]    = useState(false);
  const [flipResult,  setFlipResult]  = useState(null);

  // ── NUMBER GUESS state ──
  const [guessTarget, setGuessTarget] = useState(() => Math.ceil(Math.random() * 10));
  const [guessInput,  setGuessInput]  = useState('');
  const [guessHint,   setGuessHint]   = useState('');
  const [guessWon,    setGuessWon]    = useState(false);

  // ── QUIZ state ──
  const [quizIdx,     setQuizIdx]     = useState(() => Math.floor(Math.random() * QUIZ_QUESTIONS.length));
  const [quizPicked,  setQuizPicked]  = useState(null);
  const [quizDone,    setQuizDone]    = useState(false);

  // ─────────────── SPIN WHEEL ───────────────
  const handleSpin = () => {
    if (spinning || getUsed('spin') >= SPIN_LIMIT) return;
    setSpinning(true); setSpinResult(null);
    const winner  = pickSegment();
    const segDeg  = 360 / SPIN_SEGMENTS.length;
    const winIdx  = SPIN_SEGMENTS.indexOf(winner);
    const extra   = 1800 + Math.floor(Math.random() * 360);
    const newDeg  = spinDegRef.current + extra - (winIdx * segDeg) - segDeg / 2;
    spinDegRef.current = newDeg;
    setSpinDeg(newDeg);
    setTimeout(async () => {
      await addCoins(winner.coins);
      incUsed('spin');
      setSpinResult(winner);
      setSpinning(false);
      refresh();
    }, 3200);
  };

  // ─────────────── SCRATCH CARD ───────────────
  const handleScratch = (i) => {
    if (scratchDone[i] || getUsed('scratch') >= SCRATCH_LIMIT) return;
    const coins = pickScratch();
    const newCards = [...scratchCards]; newCards[i] = coins;
    const newDone  = [...scratchDone];  newDone[i]  = true;
    setScratchCards(newCards); setScratchDone(newDone);
    addCoins(coins); incUsed('scratch');
    showToast(`🎁 +${coins} coins mile!`); refresh();
  };

  // ─────────────── COIN FLIP ───────────────
  const handleFlip = () => {
    if (flipping || !flipChoice || getUsed('flip') >= 10) return;
    setFlipping(true); setFlipResult(null);
    setTimeout(async () => {
      const result = Math.random() < 0.5 ? 'heads' : 'tails';
      const won    = result === flipChoice;
      setFlipResult({ result, won });
      if (won) { await addCoins(10); showToast('🎉 Sahi! +10 coins!'); }
      else     { showToast('😅 Galat! Next try karo.'); }
      incUsed('flip');
      setFlipping(false);
      setFlipChoice(null);
      refresh();
    }, 1200);
  };

  // ─────────────── NUMBER GUESS ───────────────
  const handleGuess = async () => {
    const n = parseInt(guessInput);
    if (!n || n < 1 || n > 10 || guessWon || getUsed('guess') >= 3) return;
    incUsed('guess');
    if (n === guessTarget) {
      await addCoins(50); setGuessWon(true);
      setGuessHint('🎉 Bilkul sahi! +50 coins mile!'); refresh();
    } else {
      const rem = 3 - getUsed('guess');
      setGuessHint(n < guessTarget ? `📈 Zyada hai! (${rem} try bacha)` : `📉 Kam hai! (${rem} try bacha)`);
      if (rem <= 0) setGuessHint(`❌ Ho gaya! Sahi tha: ${guessTarget}`);
    }
    setGuessInput('');
  };

  const resetGuess = () => {
    setGuessTarget(Math.ceil(Math.random() * 10));
    setGuessHint(''); setGuessWon(false); setGuessInput('');
  };

  // ─────────────── QUIZ ───────────────
  const handleQuizAnswer = async (optIdx) => {
    if (quizDone || getUsed('quiz') >= QUIZ_LIMIT) return;
    setQuizPicked(optIdx);
    setQuizDone(true);
    if (optIdx === QUIZ_QUESTIONS[quizIdx].ans) {
      await addCoins(QUIZ_COINS);
      showToast(`✅ Sahi jawab! +${QUIZ_COINS} coins!`);
    } else {
      showToast('❌ Galat jawab! Agli baar try karo.');
    }
    incUsed('quiz');
    refresh();
  };

  const nextQuiz = () => {
    if (getUsed('quiz') >= QUIZ_LIMIT) return;
    setQuizIdx(Math.floor(Math.random() * QUIZ_QUESTIONS.length));
    setQuizPicked(null); setQuizDone(false);
  };

  // ── Games list ──
  const games = [
    {
      key: 'spin',  icon: '🎰', name: 'Spin the Wheel', color: '#ff6a00',
      desc: 'Spin karo, coins jeeto!', earn: 'Up to 200 coins',
      used: getUsed('spin'), limit: SPIN_LIMIT,
    },
    {
      key: 'scratch', icon: '🎁', name: 'Scratch Card', color: '#22c55e',
      desc: 'Scratch karo, surprise pao!', earn: 'Up to 200 coins',
      used: getUsed('scratch'), limit: SCRATCH_LIMIT,
    },
    {
      key: 'flip',  icon: '🪙', name: 'Coin Flip', color: '#ffd700',
      desc: 'Heads ya Tails — luck azmaao!', earn: '+10 coins per win',
      used: getUsed('flip'), limit: 10,
    },
    {
      key: 'guess', icon: '🔢', name: 'Number Guess', color: '#7b2ff7',
      desc: '1-10 mein number guess karo!', earn: '+50 coins if correct',
      used: getUsed('guess'), limit: 3,
    },
    {
      key: 'quiz',  icon: '❓', name: 'Quiz',       color: '#0088cc',
      desc: 'Sawaal ka sahi jawab do!',     earn: `+${QUIZ_COINS} coins per correct`,
      used: getUsed('quiz'), limit: QUIZ_LIMIT,
    },
  ];

  const navTabs = [
    { key: 'home',    icon: '🏠', label: 'Home',    path: '/home'    },
    { key: 'store',   icon: '🛒', label: 'Store',   path: '/store'   },
    { key: 'wallet',  icon: '💰', label: 'Wallet',  path: '/wallet'  },
    { key: 'profile', icon: '👤', label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="games-page">

      <div className="games-topbar">
        <button className="games-back-btn" onClick={() => navigate('/home')}>← Back</button>
        <div className="games-topbar-title">🎮 Games Hub</div>
        <div className="games-balance-chip">🪙 {balance.toLocaleString()}</div>
      </div>

      <div className="games-scroll">
        <div className="games-sub">DAILY GAMES · COINS KAMAO</div>

        <div className="games-list">
          {games.map(g => {
            const done = g.used >= g.limit;
            return (
              <div key={g.key} className={`games-card ${done ? 'games-card-done' : ''}`}
                style={{ borderColor: done ? 'rgba(255,255,255,0.06)' : `${g.color}55` }}
                onClick={() => !done && setOpenGame(g.key)}>
                <div className="games-card-icon" style={{ background: done ? 'rgba(255,255,255,0.05)' : `${g.color}22`, border: `2px solid ${done ? 'rgba(255,255,255,0.1)' : g.color+'66'}` }}>
                  {done ? '✅' : g.icon}
                </div>
                <div className="games-card-info">
                  <div className="games-card-name">{g.name}</div>
                  <div className="games-card-desc">{g.desc}</div>
                  <div className="games-card-earn" style={{ color: done ? 'rgba(255,255,255,0.3)' : g.color }}>
                    {done ? `Aaj ke ${g.limit} plays khatam!` : g.earn}
                  </div>
                </div>
                <div className="games-card-right">
                  <div className="games-plays" style={{ color: done ? '#444' : 'rgba(255,255,255,0.5)' }}>
                    {g.used}/{g.limit}
                  </div>
                  {!done && <div className="games-play-btn" style={{ background: `linear-gradient(135deg,${g.color},${g.color}aa)` }}>▶</div>}
                </div>
              </div>
            );
          })}
        </div>

        <div className="games-note">🕛 Sab games roz raat 12 baje reset hote hain (IST)</div>
        <div style={{ height: 90 }} />
      </div>

      {/* ── BOTTOM NAV ── */}
      <div className="games-bottom-nav">
        {navTabs.map(t => (
          <button key={t.key} className="games-nav-tab" onClick={() => navigate(t.path)}>
            <span>{t.icon}</span>
            <span className="games-nav-label">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ═══════════════ GAME MODALS ═══════════════ */}

      {/* ── SPIN WHEEL ── */}
      {openGame === 'spin' && (
        <div className="game-overlay">
          <div className="game-modal">
            <button className="game-close-btn" onClick={() => { setOpenGame(null); setSpinResult(null); }}>✕</button>
            <div className="game-modal-title">🎰 Spin the Wheel</div>
            <div className="game-plays-left">{SPIN_LIMIT - getUsed('spin')} spins bacha aaj ke liye</div>

            <div className="spin-container">
              <div className="spin-pointer">▼</div>
              <div className="spin-wheel" style={{ transform: `rotate(${spinDeg}deg)`, transition: spinning ? 'transform 3s cubic-bezier(0.17,0.67,0.12,0.99)' : 'none' }}>
                {SPIN_SEGMENTS.map((seg, i) => {
                  const angle = (360 / SPIN_SEGMENTS.length) * i;
                  return (
                    <div key={i} className="spin-segment" style={{
                      transform: `rotate(${angle}deg)`,
                      background: `conic-gradient(from ${-360/SPIN_SEGMENTS.length/2}deg, ${seg.color} 0deg, ${seg.color} ${360/SPIN_SEGMENTS.length}deg, transparent ${360/SPIN_SEGMENTS.length}deg)`
                    }}>
                      <div className="spin-label" style={{ transform: `rotate(${360/SPIN_SEGMENTS.length/2}deg) translateY(-52px)` }}>
                        {seg.label}🪙
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {spinResult && (
              <div className="spin-result">🎉 +{spinResult.coins} Coins Mile!</div>
            )}

            <button className="game-play-btn" onClick={handleSpin}
              disabled={spinning || getUsed('spin') >= SPIN_LIMIT}
              style={{ background: spinning || getUsed('spin') >= SPIN_LIMIT ? '#333' : 'linear-gradient(135deg,#ff6a00,#ee0979)' }}>
              {spinning ? '🌀 Spinning...' : getUsed('spin') >= SPIN_LIMIT ? '✅ Aaj ke liye done!' : '🎰 SPIN KARO!'}
            </button>
          </div>
        </div>
      )}

      {/* ── SCRATCH CARD ── */}
      {openGame === 'scratch' && (
        <div className="game-overlay">
          <div className="game-modal">
            <button className="game-close-btn" onClick={() => { setOpenGame(null); setScratchCards([null,null,null]); setScratchDone([false,false,false]); }}>✕</button>
            <div className="game-modal-title">🎁 Scratch Card</div>
            <div className="game-plays-left">{SCRATCH_LIMIT - getUsed('scratch')} cards bacha aaj ke liye</div>

            <div className="scratch-grid">
              {[0,1,2].map(i => (
                <div key={i} className={`scratch-card ${scratchDone[i] ? 'scratched' : ''}`}
                  onClick={() => handleScratch(i)}
                  style={{ background: scratchDone[i] ? 'rgba(34,197,94,0.15)' : 'linear-gradient(135deg,#333,#222)', border: scratchDone[i] ? '2px solid #22c55e' : '2px solid #444' }}>
                  {scratchDone[i]
                    ? <><div className="scratch-prize">🪙</div><div className="scratch-amount">+{scratchCards[i]}</div></>
                    : <><div className="scratch-cover">🎁</div><div className="scratch-tap">Tap to Scratch</div></>
                  }
                </div>
              ))}
            </div>

            {getUsed('scratch') >= SCRATCH_LIMIT && (
              <div className="game-done-msg">✅ Aaj ke 3 cards scratch ho gaye!</div>
            )}
          </div>
        </div>
      )}

      {/* ── COIN FLIP ── */}
      {openGame === 'flip' && (
        <div className="game-overlay">
          <div className="game-modal">
            <button className="game-close-btn" onClick={() => { setOpenGame(null); setFlipResult(null); setFlipChoice(null); }}>✕</button>
            <div className="game-modal-title">🪙 Coin Flip</div>
            <div className="game-plays-left">{10 - getUsed('flip')} flips bacha aaj ke liye</div>

            <div className={`flip-coin ${flipping ? 'flipping' : ''}`}>
              {flipping ? '🌀' : flipResult ? (flipResult.result === 'heads' ? '👑' : '🔵') : '🪙'}
            </div>

            {flipResult && (
              <div className={`flip-result ${flipResult.won ? 'won' : 'lost'}`}>
                {flipResult.won ? '🎉 Sahi! +10 coins!' : `😅 Galat! ${flipResult.result} aaya.`}
              </div>
            )}

            <div className="flip-choice-row">
              <button className={`flip-choice-btn ${flipChoice==='heads'?'active':''}`}
                onClick={() => setFlipChoice('heads')} disabled={flipping}>
                👑 Heads
              </button>
              <button className={`flip-choice-btn ${flipChoice==='tails'?'active':''}`}
                onClick={() => setFlipChoice('tails')} disabled={flipping}>
                🔵 Tails
              </button>
            </div>

            <button className="game-play-btn" onClick={handleFlip}
              disabled={!flipChoice || flipping || getUsed('flip') >= 10}
              style={{ background: flipChoice && !flipping && getUsed('flip') < 10 ? 'linear-gradient(135deg,#ffd700,#ff8800)' : '#333' }}>
              {flipping ? '🌀 Flipping...' : getUsed('flip') >= 10 ? '✅ Aaj ke liye done!' : '🪙 FLIP KARO!'}
            </button>
          </div>
        </div>
      )}

      {/* ── NUMBER GUESS ── */}
      {openGame === 'guess' && (
        <div className="game-overlay">
          <div className="game-modal">
            <button className="game-close-btn" onClick={() => { setOpenGame(null); resetGuess(); }}>✕</button>
            <div className="game-modal-title">🔢 Number Guess</div>
            <div className="game-plays-left">{3 - getUsed('guess')} tries bacha aaj ke liye</div>

            <div className="guess-info">1 se 10 mein se ek number socho!</div>
            <div className="guess-numbers">
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <button key={n} className="guess-num-btn"
                  onClick={() => { setGuessInput(String(n)); }}
                  style={{ background: guessInput === String(n) ? 'linear-gradient(135deg,#7b2ff7,#0088cc)' : 'rgba(255,255,255,0.07)', border: guessInput === String(n) ? '2px solid #7b2ff7' : '1px solid rgba(255,255,255,0.1)' }}>
                  {n}
                </button>
              ))}
            </div>
            {guessHint && <div className="guess-hint">{guessHint}</div>}

            {!guessWon && getUsed('guess') < 3 && (
              <button className="game-play-btn" onClick={handleGuess} disabled={!guessInput}
                style={{ background: guessInput ? 'linear-gradient(135deg,#7b2ff7,#0088cc)' : '#333' }}>
                🎯 GUESS KARO
              </button>
            )}
            {(guessWon || getUsed('guess') >= 3) && (
              <div className="game-done-msg">
                {guessWon ? '🎉 +50 coins mile!' : `❌ Aaj ki tries khatam! Sahi tha: ${guessTarget}`}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── QUIZ ── */}
      {openGame === 'quiz' && (
        <div className="game-overlay">
          <div className="game-modal">
            <button className="game-close-btn" onClick={() => { setOpenGame(null); setQuizPicked(null); setQuizDone(false); }}>✕</button>
            <div className="game-modal-title">❓ Quiz</div>
            <div className="game-plays-left">{QUIZ_LIMIT - getUsed('quiz')} questions bacha aaj ke liye</div>

            {getUsed('quiz') >= QUIZ_LIMIT ? (
              <div className="game-done-msg">✅ Aaj ke {QUIZ_LIMIT} quiz khatam!</div>
            ) : (
              <>
                <div className="quiz-question">{QUIZ_QUESTIONS[quizIdx].q}</div>
                <div className="quiz-options">
                  {QUIZ_QUESTIONS[quizIdx].opts.map((opt, i) => {
                    let bg = 'rgba(255,255,255,0.06)';
                    let border = 'rgba(255,255,255,0.1)';
                    if (quizDone) {
                      if (i === QUIZ_QUESTIONS[quizIdx].ans) { bg = 'rgba(34,197,94,0.2)'; border = '#22c55e'; }
                      else if (i === quizPicked && i !== QUIZ_QUESTIONS[quizIdx].ans) { bg = 'rgba(255,68,68,0.2)'; border = '#ff4444'; }
                    } else if (quizPicked === i) { bg = 'rgba(0,136,204,0.2)'; border = '#0088cc'; }
                    return (
                      <button key={i} className="quiz-opt-btn"
                        style={{ background: bg, border: `1.5px solid ${border}` }}
                        onClick={() => handleQuizAnswer(i)} disabled={quizDone}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {quizDone && getUsed('quiz') < QUIZ_LIMIT && (
                  <button className="game-play-btn" onClick={nextQuiz}
                    style={{ background: 'linear-gradient(135deg,#0088cc,#005fa3)' }}>
                    ➡️ Next Question
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {toast && <div className="games-toast">{toast}</div>}
    </div>
  );
}
