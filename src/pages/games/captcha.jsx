import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import './captcha.css';

const MAX_ATTEMPTS = 10;
const COINS_MIN    = 5;
const COINS_MAX    = 10;

function getHourKey()        { return Math.floor(Date.now() / 3600000); }
function getSecsLeftInHour() { const ms = Date.now() % 3600000; return Math.ceil((3600000 - ms) / 1000); }
function fmtMmSs(secs)       { const m = Math.floor(secs / 60), s = secs % 60; return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; }
function randCoins()         { return Math.floor(Math.random() * (COINS_MAX - COINS_MIN + 1)) + COINS_MIN; }

const API_KEY   = import.meta.env.VITE_CAPTCHA_API_KEY || '';
const PROXY     = 'https://corsproxy.io/?';

function proxyUrl(url) {
  return `${PROXY}${encodeURIComponent(url)}`;
}

export default function CaptchaGame() {
  const { user, captchaClaim } = useApp();
  const navigate = useNavigate();

  const hourKey        = getHourKey();
  const savedCount     = (user?.captcha_hour_key === hourKey) ? (user?.captcha_hour_count ?? 0) : 0;
  const attemptsLeft   = Math.max(0, MAX_ATTEMPTS - savedCount);

  const [phase,        setPhase]        = useState('idle');   // idle | loading | playing | submitting | result
  const [captchaImg,   setCaptchaImg]   = useState('');
  const [taskId,       setTaskId]       = useState('');
  const [answer,       setAnswer]       = useState('');
  const [result,       setResult]       = useState(null);     // { correct, coins }
  const [error,        setError]        = useState('');
  const [timeLeft,     setTimeLeft]     = useState(getSecsLeftInHour());
  const [localCount,   setLocalCount]   = useState(savedCount);

  const localLeft = Math.max(0, MAX_ATTEMPTS - localCount);

  // Countdown when no attempts left
  useEffect(() => {
    if (localLeft > 0) return;
    setTimeLeft(getSecsLeftInHour());
    const id = setInterval(() => {
      const s = getSecsLeftInHour();
      setTimeLeft(s);
      if (s <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [localLeft]);

  // ── Fetch captcha from 2Captcha ─────────────────────────────
  const fetchCaptcha = useCallback(async () => {
    setPhase('loading');
    setError('');
    setAnswer('');
    setResult(null);

    try {
      // 2Captcha Worker API — getimage endpoint (via CORS proxy)
      const rawUrl = `https://2captcha.com/res.php?key=${API_KEY}&action=getimage&json=1`;
      const res    = await fetch(proxyUrl(rawUrl));
      const text   = await res.text();

      // Try JSON parse first, fallback to text parsing
      let data;
      try { data = JSON.parse(text); } catch { data = {}; }

      if (!data.status && !data.captchaImg) {
        // Text format: "OK|TASK_ID|BASE64" or error
        if (text.startsWith('OK|')) {
          const parts = text.split('|');
          data = { status: 1, request: parts[1], captchaImg: parts[2] || '' };
        } else {
          throw new Error('Captcha server se jawab nahi mila — baad mein try karo');
        }
      }

      if (data.status !== 1 && !data.captchaImg) {
        throw new Error(data.request || 'Captcha load nahi ho raha');
      }

      const tid = data.request || String(Date.now());
      setTaskId(tid);

      // Build image src — base64 or URL
      let imgSrc = data.captchaImg || data.image || '';
      if (imgSrc && !imgSrc.startsWith('data:') && !imgSrc.startsWith('http')) {
        imgSrc = `data:image/png;base64,${imgSrc}`;
      }
      if (imgSrc.startsWith('http')) {
        imgSrc = proxyUrl(imgSrc); // also proxy the image if it's an external URL
      }
      setCaptchaImg(imgSrc);
      setPhase('playing');

    } catch (e) {
      setError(e.message || 'Network error — internet check karo');
      setPhase('idle');
    }
  }, []);

  // ── Submit answer ───────────────────────────────────────────
  const handleSubmit = async () => {
    if (!answer.trim() || phase === 'submitting') return;
    setPhase('submitting');

    const coins = randCoins();
    const newCount = localCount + 1;

    try {
      // Report answer to 2Captcha (via CORS proxy)
      const rawUrl = `https://2captcha.com/res.php?key=${API_KEY}&action=reportgood&id=${taskId}&text=${encodeURIComponent(answer.trim())}&json=1`;
      const res    = await fetch(proxyUrl(rawUrl));
      const text   = await res.text();

      let data;
      try { data = JSON.parse(text); } catch { data = {}; }

      const isCorrect = data.status === 1 || data.request === 'OK' || text.startsWith('OK');

      setLocalCount(newCount);

      if (isCorrect) {
        await captchaClaim(coins);
        setResult({ correct: true, coins });
      } else {
        // Wrong — count attempt but no coins
        try {
          const { doc, updateDoc, increment } = await import('firebase/firestore');
          const { db } = await import('../../lib/firebase');
          await updateDoc(doc(db, 'users', String(user.id)), {
            captcha_hour_key:   getHourKey(),
            captcha_hour_count: increment(1),
          });
        } catch (_) {}
        setResult({ correct: false, coins: 0 });
      }

    } catch (e) {
      // Network fail — coins as fallback
      setLocalCount(newCount);
      await captchaClaim(coins);
      setResult({ correct: true, coins });
    }

    setPhase('result');
  };

  // ── Next captcha ────────────────────────────────────────────
  const handleNext = () => {
    if (localLeft - 1 <= 0) {
      setPhase('idle');
    } else {
      fetchCaptcha();
    }
  };

  return (
    <div className="cg-page">
      <div className="cg-glow cg-glow1" />
      <div className="cg-glow cg-glow2" />

      {/* ── Header ── */}
      <div className="cg-header">
        <button className="cg-back-btn" onClick={() => navigate('/games')}>
          ← Back
        </button>
        <div className="cg-title">🔤 Captcha Game</div>
        <div className="cg-balance-chip">
          <span>🪙</span>
          <span>{(user?.balance ?? 0).toLocaleString()}</span>
        </div>
      </div>

      {/* ── Attempts dots ── */}
      <div className="cg-dots-row">
        {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
          <div
            key={i}
            className={`cg-dot ${i < localCount ? 'cg-dot-used' : 'cg-dot-free'}`}
          />
        ))}
      </div>

      {/* ── Main content area ── */}
      <div className="cg-body">

        {/* No attempts left */}
        {localLeft === 0 && phase !== 'result' && (
          <div className="cg-empty-box">
            <div className="cg-empty-icon">⏳</div>
            <div className="cg-empty-title">Attempts Khatam!</div>
            <div className="cg-empty-sub">Agle ghante mein wapas aao</div>
            <div className="cg-timer-display">{fmtMmSs(timeLeft)}</div>
            <div className="cg-empty-hint">Nayi captchas milenge</div>
          </div>
        )}

        {/* Idle — start button */}
        {phase === 'idle' && localLeft > 0 && (
          <div className="cg-start-box">
            <div className="cg-start-icon">🔤</div>
            <div className="cg-start-title">Captcha Solve Karo</div>
            <div className="cg-start-sub">
              {localLeft} attempt{localLeft !== 1 ? 's' : ''} bacha hai is ghante mein
            </div>
            <div className="cg-reward-badge">+{COINS_MIN}–{COINS_MAX} 🪙 per captcha</div>
            {error && <div className="cg-error-msg">⚠️ {error}</div>}
            <button className="cg-start-btn" onClick={fetchCaptcha}>
              ▶ Shuru Karo
            </button>
          </div>
        )}

        {/* Loading */}
        {phase === 'loading' && (
          <div className="cg-loading-box">
            <div className="cg-spinner" />
            <div className="cg-loading-text">Captcha load ho raha hai...</div>
          </div>
        )}

        {/* Playing */}
        {(phase === 'playing' || phase === 'submitting') && captchaImg && (
          <div className="cg-play-box">
            <div className="cg-attempts-badge">
              {localLeft} attempt{localLeft !== 1 ? 's' : ''} left
            </div>

            <div className="cg-img-wrap">
              <img
                src={captchaImg}
                alt="captcha"
                className="cg-captcha-img"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>

            <div className="cg-input-label">Jo dikh raha hai woh type karo:</div>
            <input
              className="cg-input"
              type="text"
              placeholder="Type what you see..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              disabled={phase === 'submitting'}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />

            <button
              className={`cg-submit-btn ${phase === 'submitting' ? 'cg-btn-loading' : ''}`}
              onClick={handleSubmit}
              disabled={phase === 'submitting' || !answer.trim()}
            >
              {phase === 'submitting' ? '⏳ Check ho raha hai...' : '✅ Submit'}
            </button>
          </div>
        )}

        {/* Result */}
        {phase === 'result' && result && (
          <div className="cg-result-box">
            <div className={`cg-result-icon ${result.correct ? 'cg-correct' : 'cg-wrong'}`}>
              {result.correct ? '🎉' : '❌'}
            </div>
            <div className={`cg-result-title ${result.correct ? 'cg-correct' : 'cg-wrong'}`}>
              {result.correct ? 'Sahi Jawab!' : 'Galat Jawab!'}
            </div>
            {result.correct ? (
              <div className="cg-coins-earned">+{result.coins} 🪙 Coins!</div>
            ) : (
              <div className="cg-wrong-sub">Koi baat nahi, agli baar sahi hoga!</div>
            )}
            <div className="cg-attempts-left">
              {localLeft - 1 > 0
                ? `${localLeft - 1} attempt${localLeft - 1 !== 1 ? 's' : ''} bacha hai`
                : 'Is ghante ke saare attempts khatam!'}
            </div>

            {localLeft - 1 > 0 ? (
              <button className="cg-next-btn" onClick={handleNext}>
                ▶ Agle Captcha Karo
              </button>
            ) : (
              <button className="cg-back-game-btn" onClick={() => navigate('/games')}>
                ← Games pe Wapas
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
