import { useState, useEffect } from 'react';
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

  // Firestore se history load karo (Firestore > localStorage)
  useEffect(() => {
    let cancelled = false;
    fetchWithdrawals().then(fsData => {
      if (cancelled) return;
      if (fsData && fsData.length > 0) {
        // Firestore data zyada reliable hai — use karo
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
        // Firestore empty → localStorage use karo
        setWithdrawals(getLocalWithdrawals(withdrawKey));
      }
      setHistLoading(false);
    }).catch(() => {
      setWithdrawals(getLocalWithdrawals(withdrawKey));
      setHistLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3200); };

  // 1 coin = ₹0.01 (÷100) — Store + Home ke saath consistent
  const amountNum  = parseInt(amount) || 0;
  const inrValue   = (amountNum / 100).toFixed(2);
  const canSubmit  = amountNum >= MIN_WITHDRAW && upiId.trim().length > 4 && balance >= amountNum;

  const handleWithdraw = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);

    // Pehle Firestore transaction se coins deduct karo
    const deducted = await deductCoins(amountNum);
    if (!deducted) {
      showToast('❌ Balance nahi hai! Refresh karke dobara try karo.');
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

    // Firestore mein save karo — agar fail ho toh coins ACTUALLY wapas do
    try {
      await saveWithdrawal(entry);
      const updated = [entry, ...withdrawals];
      saveLocalWithdrawals(withdrawKey, updated);
      setWithdrawals(updated);
      setAmount('');
      setUpiId('');
      showToast('✅ Withdrawal request submit ho gaya!');
      setTab('history');
    } catch (e) {
      // Firestore save fail — ACTUAL rollback: coins wapas karo
      try { await addCoins(amountNum); } catch { /* ignore */ }
      showToast('❌ Server error! Tumhare coins wapas kar diye gaye. Dobara try karo.');
      console.error('Withdrawal save failed, coins refunded:', e);
    }

    setSubmitting(false);
  };

  const statusColor = (s) => s === 'completed' ? '#22c55e' : s === 'rejected' ? '#ff4444' : '#fbbf24';
  const statusLabel = (s) => s === 'completed' ? '✅ Completed' : s === 'rejected' ? '❌ Rejected' : '⏳ Pending';


  return (
    <div className="wallet-page">

      <div className="wallet-topbar">
        <div className="wallet-topbar-title">💰 Wallet</div>
        <div className="wallet-balance-chip">🪙 {balance.toLocaleString()}</div>
      </div>

      <div className="wallet-scroll">

        {/* ── BALANCE CARD ── */}
        <div className="wallet-balance-card">
          <div className="wallet-balance-label">Tumhara Balance</div>
          <div className="wallet-balance-amount">
            <span className="wallet-coin-icon">🪙</span>
            <span className="wallet-coins">{balance.toLocaleString()}</span>
            <span className="wallet-coins-unit">Coins</span>
          </div>
          <div className="wallet-inr-val">≈ ₹{(balance / 100).toFixed(2)} INR</div>
          <div className="wallet-min-note">Minimum Withdrawal: {MIN_WITHDRAW.toLocaleString()} Coins (₹{(MIN_WITHDRAW / 100).toFixed(0)})</div>
        </div>

        {/* ── TABS ── */}
        <div className="wallet-tabs">
          <button className={`wallet-tab ${tab === 'withdraw' ? 'active' : ''}`} onClick={() => setTab('withdraw')}>
            💸 Withdraw
          </button>
          <button className={`wallet-tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
            📋 History {withdrawals.length > 0 && <span className="wallet-hist-badge">{withdrawals.length}</span>}
          </button>
        </div>

        {/* ── WITHDRAW FORM ── */}
        {tab === 'withdraw' && (
          <div className="wallet-form">

            <div className="wallet-form-group">
              <div className="wallet-form-label">💰 Coins Amount</div>
              <input className="wallet-form-input" type="number" value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder={`Min ${MIN_WITHDRAW} coins`} min={MIN_WITHDRAW} />
              {amountNum > 0 && (
                <div className={`wallet-form-hint ${amountNum > balance ? 'error' : ''}`}>
                  {amountNum > balance
                    ? `❌ Balance nahi hai (tumhare paas: ${balance.toLocaleString()} coins)`
                    : `= ₹${inrValue} INR deduct hoga`}
                </div>
              )}
            </div>

            <div className="wallet-form-group">
              <div className="wallet-form-label">📱 UPI ID</div>
              <input className="wallet-form-input" type="text" value={upiId}
                onChange={e => setUpiId(e.target.value)}
                placeholder="example@upi / 9876543210@paytm" />
            </div>

            {/* Quick amount buttons */}
            <div className="wallet-quick-row">
              {[500, 1000, 2000, 5000].map(v => (
                <button key={v} className="wallet-quick-btn" onClick={() => setAmount(String(v))}>
                  {v.toLocaleString()}
                </button>
              ))}
            </div>

            {balance < MIN_WITHDRAW && (
              <div className="wallet-low-box">
                🪙 Abhi balance kam hai!<br />
                {MIN_WITHDRAW - balance} aur coins kamao phir withdraw karo.
              </div>
            )}

            <button className="wallet-submit-btn" onClick={handleWithdraw}
              disabled={!canSubmit || submitting}
              style={{ opacity: canSubmit ? 1 : 0.45 }}>
              {submitting ? '⏳ Processing...' : '💸 Withdraw Request Bhejo'}
            </button>

            <div className="wallet-note">
              ⚠️ Request submit hone ke baad 24-48 ghante mein process hogi. Galat UPI ID pe coins wapas nahi honge.
            </div>
          </div>
        )}

        {/* ── HISTORY ── */}
        {tab === 'history' && (
          <div className="wallet-history">
            {withdrawals.length === 0 ? (
              <div className="wallet-empty">
                <div className="wallet-empty-icon">📋</div>
                <div className="wallet-empty-text">Abhi koi withdrawal nahi<br />Pehla withdraw karo!</div>
              </div>
            ) : (
              withdrawals.map(w => (
                <div key={w.id} className="wallet-hist-card">
                  <div className="wallet-hist-top">
                    <div className="wallet-hist-coins">🪙 {w.coins.toLocaleString()} coins</div>
                    <div className="wallet-hist-status" style={{ color: statusColor(w.status) }}>
                      {statusLabel(w.status)}
                    </div>
                  </div>
                  <div className="wallet-hist-upi">UPI: {w.upi}</div>
                  <div className="wallet-hist-bottom">
                    <span className="wallet-hist-inr">₹{w.inr}</span>
                    <span className="wallet-hist-date">{w.date} · {w.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div style={{ height: 90 }} />
      </div>

      <BottomNav />

      {toast && <div className="wallet-toast">{toast}</div>}
    </div>
  );
}
