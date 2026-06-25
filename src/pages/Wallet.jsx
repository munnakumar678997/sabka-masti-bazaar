import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import BottomNav from '../components/BottomNav';
import '../styles/wallet.css';

const MIN_WITHDRAW = 500;

function getLocalWithdrawals(key) {
  if (!key) return [];
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function saveLocalWithdrawals(key, list) {
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(list));
}

export default function Wallet() {
  const { balance, addCoins, deductCoins, saveWithdrawal, fetchWithdrawals, user } = useApp();
  const withdrawKey = user?.id ? `smb_withdrawals_${user.id}` : null;

  const [tab,         setTab]         = useState('withdraw');
  const [amount,      setAmount]      = useState('');
  const [upiId,       setUpiId]       = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [withdrawals, setWithdrawals] = useState(() => getLocalWithdrawals(withdrawKey));
  const [histLoading, setHistLoading] = useState(true);
  const [toast,       setToast]       = useState('');
  const [toastType,   setToastType]   = useState('success');

  const toastTimerRef = useRef(null);
  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  useEffect(() => {
    let cancelled = false;
    fetchWithdrawals().then(fsData => {
      if (cancelled) return;
      if (fsData && fsData.length > 0) {
        const mapped = fsData.map(d => ({
          id:     d.id     || d.firestoreId || Date.now(),
          coins:  d.coins  || 0,
          inr:    d.inr    || (d.coins / 100).toFixed(2),
          upi:    d.upi    || '—',
          date:   d.date   || (d.createdAt ? d.createdAt.split('T')[0] : '—'),
          time:   d.time   || '—',
          status: d.status || 'pending',
        }));
        setWithdrawals(mapped);
        saveLocalWithdrawals(withdrawKey, mapped);
      } else {
        setWithdrawals(getLocalWithdrawals(withdrawKey));
      }
      setHistLoading(false);
    }).catch(() => {
      setWithdrawals(getLocalWithdrawals(withdrawKey));
      setHistLoading(false);
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const showToast = (msg, type = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    setToastType(type);
    toastTimerRef.current = setTimeout(() => setToast(''), 3200);
  };

  const amountNum  = parseInt(amount) || 0;
  const inrValue   = (amountNum / 100).toFixed(2);
  // BUG FIX B3: UPI validation — '@' start ya end pe nahi hona chahiye (jaise '@abcd' ya 'abc@' invalid hai)
  const upiTrimmed = upiId.trim();
  const atIdx      = upiTrimmed.indexOf('@');
  const validUpi   = atIdx > 0 && atIdx < upiTrimmed.length - 1;
  const canSubmit  = amountNum >= MIN_WITHDRAW && validUpi && balance >= amountNum;

  // Progress toward minimum withdrawal
  const progressPct = Math.min(100, Math.round((balance / MIN_WITHDRAW) * 100));
  const needMore    = Math.max(0, MIN_WITHDRAW - balance);

  // Stats
  const totalWithdrawn  = withdrawals.reduce((s, w) => s + (w.coins || 0), 0);
  const pendingCount    = withdrawals.filter(w => w.status === 'pending').length;
  const completedCount  = withdrawals.filter(w => w.status === 'completed').length;

  const handleWithdraw = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    const deducted = await deductCoins(amountNum);
    if (!deducted) {
      showToast('❌ Balance nahi hai! Refresh karke dobara try karo.', 'error');
      setSubmitting(false);
      return;
    }
    const entry = {
      id:     Date.now(),
      coins:  amountNum,
      inr:    (amountNum / 100).toFixed(2),
      upi:    upiId.trim(),
      date:   new Date().toLocaleDateString('en-IN'),
      time:   new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      status: 'pending',
    };
    try {
      await saveWithdrawal(entry);
      const updated = [entry, ...withdrawals];
      saveLocalWithdrawals(withdrawKey, updated);
      setWithdrawals(updated);
      setAmount('');
      setUpiId('');
      showToast('✅ Withdrawal request submit ho gaya!', 'success');
      setTab('history');
    } catch (e) {
      try { await addCoins(amountNum); } catch { /* ignore */ }
      showToast('❌ Server error! Coins wapas kar diye gaye.', 'error');
      console.error('Withdrawal failed, coins refunded:', e);
    }
    setSubmitting(false);
  };

  const statusInfo = (s) => {
    if (s === 'completed') return { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)', label: 'Completed', icon: '✅' };
    if (s === 'rejected')  return { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)', label: 'Rejected',  icon: '❌' };
    return                        { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.25)',  label: 'Pending',   icon: '⏳' };
  };

  return (
    <div className="wlt-page">

      {/* ══ TOPBAR ══ */}
      <div className="wlt-topbar">
        <div className="wlt-topbar-left">
          <div className="wlt-topbar-icon">💰</div>
          <div className="wlt-topbar-title">Wallet</div>
        </div>
        <div className="wlt-topbar-chip">
          <span className="wlt-chip-coin">🪙</span>
          <span className="wlt-chip-val">{balance.toLocaleString()}</span>
        </div>
      </div>

      <div className="wlt-scroll">

        {/* ══ HERO BALANCE CARD ══ */}
        <div className="wlt-hero">
          <div className="wlt-hero-glow" />
          <div className="wlt-hero-orb wlt-orb-1" />
          <div className="wlt-hero-orb wlt-orb-2" />

          <div className="wlt-hero-top">
            <div className="wlt-hero-label">Tumhara Balance</div>
            <div className="wlt-hero-inr-pill">₹{(balance / 100).toFixed(2)} INR</div>
          </div>

          <div className="wlt-hero-amount">
            <div className="wlt-hero-coin-wrap">
              <span className="wlt-hero-coin-emoji">🪙</span>
              <div className="wlt-hero-coin-ring" />
            </div>
            <div className="wlt-hero-num">{balance.toLocaleString()}</div>
            <div className="wlt-hero-unit">Coins</div>
          </div>

          {/* Progress bar */}
          <div className="wlt-progress-wrap">
            <div className="wlt-progress-label">
              <span>{balance >= MIN_WITHDRAW ? '🎉 Withdraw karne layak!' : `${MIN_WITHDRAW - balance} coins aur chahiye`}</span>
              <span>{progressPct}%</span>
            </div>
            <div className="wlt-progress-track">
              <div className="wlt-progress-fill" style={{ width: `${progressPct}%` }} />
              <div className="wlt-progress-glow" style={{ left: `${progressPct}%` }} />
            </div>
            <div className="wlt-progress-sub">Min {MIN_WITHDRAW} coins = ₹5 withdraw</div>
          </div>
        </div>

        {/* ══ STATS ROW ══ */}
        <div className="wlt-stats-row">
          <div className="wlt-stat-card wlt-stat-green">
            <div className="wlt-stat-icon">💸</div>
            <div className="wlt-stat-val">{totalWithdrawn.toLocaleString()}</div>
            <div className="wlt-stat-lbl">Total Withdraw</div>
          </div>
          <div className="wlt-stat-card wlt-stat-yellow">
            <div className="wlt-stat-icon">⏳</div>
            <div className="wlt-stat-val">{pendingCount}</div>
            <div className="wlt-stat-lbl">Pending</div>
          </div>
          <div className="wlt-stat-card wlt-stat-blue">
            <div className="wlt-stat-icon">✅</div>
            <div className="wlt-stat-val">{completedCount}</div>
            <div className="wlt-stat-lbl">Completed</div>
          </div>
        </div>

        {/* ══ TOTAL EARNED CARD ══ */}
        <div className="wlt-earned-card">
          <div className="wlt-earned-left">
            <div className="wlt-earned-icon">📈</div>
            <div>
              <div className="wlt-earned-label">Lifetime Total Kamaya</div>
              <div className="wlt-earned-sub">Balance + Withdrawn = Total Earning</div>
            </div>
          </div>
          <div className="wlt-earned-right">
            <div className="wlt-earned-coins">🪙 {(balance + totalWithdrawn).toLocaleString()}</div>
            <div className="wlt-earned-inr">≈ ₹{((balance + totalWithdrawn) / 100).toFixed(2)}</div>
          </div>
        </div>

        {/* ══ TABS ══ */}
        <div className="wlt-tabs">
          <button
            className={`wlt-tab ${tab === 'withdraw' ? 'active' : ''}`}
            onClick={() => setTab('withdraw')}
          >
            <span className="wlt-tab-icon">💸</span>
            <span>Withdraw</span>
          </button>
          <button
            className={`wlt-tab ${tab === 'history' ? 'active' : ''}`}
            onClick={() => setTab('history')}
          >
            <span className="wlt-tab-icon">📋</span>
            <span>History</span>
            {withdrawals.length > 0 && (
              <span className="wlt-tab-badge">{withdrawals.length}</span>
            )}
          </button>
        </div>

        {/* ══ WITHDRAW FORM ══ */}
        {tab === 'withdraw' && (
          <div className="wlt-form">


            {/* Coins Input */}
            <div className="wlt-field">
              <div className="wlt-field-label">
                <span className="wlt-field-icon">🪙</span>
                Coins Amount
              </div>
              <div className="wlt-input-wrap">
                <input
                  className="wlt-input"
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder={`Minimum ${MIN_WITHDRAW} coins`}
                  min={MIN_WITHDRAW}
                />
                {amountNum > 0 && (
                  <div className={`wlt-input-badge ${amountNum > balance ? 'error' : 'ok'}`}>
                    {amountNum > balance ? '❌' : `₹${inrValue}`}
                  </div>
                )}
              </div>
              {amountNum > 0 && (
                <div className={`wlt-field-hint ${amountNum > balance ? 'error' : amountNum < MIN_WITHDRAW ? 'warn' : 'ok'}`}>
                  {amountNum > balance
                    ? `❌ Sirf ${balance.toLocaleString()} coins available hain`
                    : amountNum < MIN_WITHDRAW
                    ? `⚠️ Minimum ${MIN_WITHDRAW} coins chahiye`
                    : `✅ ₹${inrValue} tumhare UPI pe aayega`}
                </div>
              )}
            </div>

            {/* Quick chips */}
            <div className="wlt-quick-label">⚡ Quick Select</div>
            <div className="wlt-quick-row">
              {[500, 1000, 2000, 5000].map(v => (
                <button
                  key={v}
                  className={`wlt-quick-chip ${parseInt(amount) === v ? 'selected' : ''} ${balance < v ? 'disabled' : ''}`}
                  onClick={() => balance >= v && setAmount(String(v))}
                >
                  <span className="wlt-chip-label">{v >= 1000 ? `${v/1000}K` : v}</span>
                  <span className="wlt-chip-inr">₹{(v/100).toFixed(0)}</span>
                </button>
              ))}
            </div>

            {/* UPI Input */}
            <div className="wlt-field">
              <div className="wlt-field-label">
                <span className="wlt-field-icon">📱</span>
                UPI ID
              </div>
              <div className="wlt-input-wrap">
                <input
                  className="wlt-input"
                  type="text"
                  value={upiId}
                  onChange={e => setUpiId(e.target.value)}
                  placeholder="example@upi · 9876543210@paytm"
                />
                {upiId.length > 4 && validUpi && (
                  <div className="wlt-input-badge ok">✓</div>
                )}
                {upiId.length > 4 && !validUpi && (
                  <div className="wlt-input-badge error">✗</div>
                )}
              </div>
              <div className="wlt-field-hint neutral">
                💡 Galat UPI ID pe coins wapas nahi honge — dhyan se likhna
              </div>
            </div>

            {/* Submit */}
            <button
              className={`wlt-submit ${canSubmit ? 'active' : ''} ${submitting ? 'loading' : ''}`}
              onClick={handleWithdraw}
              disabled={!canSubmit || submitting}
            >
              {submitting ? (
                <>
                  <span className="wlt-submit-spinner" />
                  Processing...
                </>
              ) : (
                <>
                  <span>💸</span>
                  Withdraw Request Bhejo
                </>
              )}
            </button>

            {/* Info cards */}
            <div className="wlt-info-grid">
              <div className="wlt-info-card">
                <div className="wlt-info-icon">⏰</div>
                <div className="wlt-info-text">24-48 ghante mein process hota hai</div>
              </div>
              <div className="wlt-info-card">
                <div className="wlt-info-icon">🎯</div>
                <div className="wlt-info-text">100 Coins = ₹1 — koi hidden charges nahi</div>
              </div>
            </div>
          </div>
        )}

        {/* ══ HISTORY ══ */}
        {tab === 'history' && (
          <div className="wlt-history">
            {histLoading ? (
              <div className="wlt-empty">
                <div className="wlt-empty-anim">
                  <div className="wlt-empty-ring" />
                  <span className="wlt-empty-ico">⏳</span>
                </div>
                <div className="wlt-empty-title">Load ho raha hai...</div>
              </div>
            ) : withdrawals.length === 0 ? (
              <div className="wlt-empty">
                <div className="wlt-empty-anim">
                  <div className="wlt-empty-ring" />
                  <span className="wlt-empty-ico">📋</span>
                </div>
                <div className="wlt-empty-title">Koi withdrawal nahi abhi tak</div>
                <div className="wlt-empty-sub">Coins kamao aur pehla withdraw karo!</div>
                <button className="wlt-empty-btn" onClick={() => setTab('withdraw')}>
                  💸 Withdraw Karo
                </button>
              </div>
            ) : (
              <div className="wlt-hist-list">
                {withdrawals.map((w, idx) => {
                  const si = statusInfo(w.status);
                  return (
                    <div key={w.id} className="wlt-hist-card" style={{ animationDelay: `${idx * 0.05}s` }}>
                      <div className="wlt-hist-left">
                        <div className="wlt-hist-status-icon" style={{ background: si.bg, border: `1px solid ${si.border}` }}>
                          {si.icon}
                        </div>
                        <div className="wlt-hist-divider" />
                      </div>
                      <div className="wlt-hist-body">
                        <div className="wlt-hist-row1">
                          <div className="wlt-hist-coins">🪙 {w.coins.toLocaleString()} Coins</div>
                          <div className="wlt-hist-inr">₹{w.inr}</div>
                        </div>
                        <div className="wlt-hist-upi">📱 {w.upi}</div>
                        <div className="wlt-hist-row2">
                          <div
                            className="wlt-hist-badge"
                            style={{ color: si.color, background: si.bg, border: `1px solid ${si.border}` }}
                          >
                            {si.label}
                          </div>
                          <div className="wlt-hist-date">{w.date} · {w.time}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div style={{ height: 100 }} />
      </div>

      <BottomNav />

      {/* ══ TOAST ══ */}
      {toast && (
        <div className={`wlt-toast wlt-toast-${toastType}`}>
          {toast}
        </div>
      )}
    </div>
  );
}
