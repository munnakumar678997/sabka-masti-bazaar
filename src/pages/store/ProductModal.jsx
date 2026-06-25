import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TELEGRAM_AGENT, TYPE_COLORS } from './storeData';

function Toast({ msg, onClose }) {
  return (
    <div className="toast-box" onClick={onClose}>
      <span>{msg}</span>
    </div>
  );
}

export default function ProductModal({ product, onClose }) {
  const { balance, deductCoins, user, saveOrder } = useApp();

  const firstType = Object.keys(product.types)[0];
  const [activeType,     setActiveType]     = useState(firstType);
  const [selectedPlan,   setSelectedPlan]   = useState(null);
  const [qty,            setQty]            = useState(1);
  const [confirmPending, setConfirmPending] = useState(false);
  const [confirming,     setConfirming]     = useState(false);
  const [toast,          setToast]          = useState('');

  const toastTimerRef = useRef(null);
  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  const showToast = (msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(''), 3200);
  };

  const handleTypeChange = (type) => {
    setActiveType(type);
    setSelectedPlan(null);
    setQty(1);
  };

  const effectiveColor = product.colorByType?.[activeType] || product.color || '#ff6600';
  const typeKeys       = Object.keys(product.types);
  const currentPlans   = product.types[activeType];
  const currentPlan    = selectedPlan !== null ? currentPlans[selectedPlan] : null;
  const total          = currentPlan ? currentPlan.price * qty : 0;
  const coinsRequired  = total * 100;
  const canAfford      = balance >= coinsRequired;

  const handleOrder = () => {
    if (!currentPlan) return;
    if (!canAfford) { showToast('❌ Balance kam hai! Pehle coins kamao.'); return; }
    setConfirmPending(true);
  };

  const handleConfirmOrder = async () => {
    if (confirming) return;
    setConfirming(true);

    const userName   = user?.name     || 'Unknown';
    const userHandle = user?.username ? `@${user.username}` : 'No username';
    const userId     = user?.id       || 'Unknown';
    const replyLink  = user?.username
      ? `https://t.me/${user.username}`
      : `tg://user?id=${userId}`;

    const tgMsg = encodeURIComponent(
      `🛒 NEW ORDER\n\n` +
      `Product: ${product.name}\n` +
      `Type: ${activeType}\n` +
      `Plan: ${currentPlan.label}\n` +
      `Qty: ${qty}\n` +
      `Total: ₹${total}\n` +
      `Coins Deducted: ${coinsRequired.toLocaleString()}\n\n` +
      `👤 ORDER BY:\n` +
      `Name: ${userName}\n` +
      `Username: ${userHandle}\n` +
      `Telegram ID: ${userId}\n` +
      `Reply Link: ${replyLink}\n\n` +
      `— SABKA MASTI BAZAAR`
    );
    const url = `https://t.me/${TELEGRAM_AGENT}?text=${tgMsg}`;

    const deducted = await deductCoins(coinsRequired);
    if (!deducted) {
      setConfirmPending(false);
      setConfirming(false);
      showToast('❌ Balance kam hai! Order cancel ho gaya. Pehle coins kamao.');
      return;
    }

    await saveOrder({
      product:  product.name,
      type:     activeType,
      plan:     currentPlan.label,
      qty,
      totalINR: total,
      coins:    coinsRequired,
    });

    if (window.Telegram?.WebApp?.openLink) {
      window.Telegram.WebApp.openLink(url);
    } else {
      window.open(url, '_blank');
    }

    setConfirmPending(false);
    setConfirming(false);
    showToast(`✅ ₹${total} ka order place ho gaya! Telegram pe confirm karo.`);
    onClose();
  };

  return (
    <div className="modal-page" style={{ background: '#0d1117' }}>

      <div className="modal-header" style={{ borderBottom: `1px solid ${effectiveColor}33` }}>
        <div className="modal-product-icon"
          style={{
            background: `linear-gradient(135deg, ${effectiveColor}44, ${effectiveColor}11)`,
            border:     `1.5px solid ${effectiveColor}88`,
            boxShadow:  `0 0 18px ${effectiveColor}55`,
          }}>
          {product.icon}
        </div>
        <div className="modal-product-info">
          <div className="modal-product-name">{product.name}</div>
          <div className="modal-product-sub">Telegram pe order · BY MUNNA AGENT</div>
        </div>
        <button className="modal-close-btn" onClick={onClose}
          disabled={confirming}
          style={{ opacity: confirming ? 0.4 : 1, cursor: confirming ? 'not-allowed' : 'pointer' }}>
          ✕
        </button>
      </div>

      <div className="modal-scroll">
        {typeKeys.length > 1 && (
          <div className="modal-section">
            <div className="modal-section-label">DEVICE TYPE</div>
            <div className="type-tabs">
              {typeKeys.map(t => (
                <button key={t}
                  className={`type-tab-btn ${activeType === t ? 'active' : ''}`}
                  style={activeType === t ? {
                    background: `linear-gradient(135deg, ${TYPE_COLORS[t] || effectiveColor}, ${TYPE_COLORS[t] || effectiveColor}bb)`,
                    boxShadow:  `0 3px 10px ${TYPE_COLORS[t] || effectiveColor}55`,
                  } : {}}
                  onClick={() => handleTypeChange(t)}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="modal-section">
          <div className="modal-section-label">PLAN CHUNNO</div>
          <div className="plans-list">
            {currentPlans.map((plan, i) => {
              const isSelected = selectedPlan === i;
              return (
                <div key={i}
                  className={`plan-row ${isSelected ? 'selected' : ''}`}
                  style={isSelected ? {
                    background: `${effectiveColor}15`,
                    border:     `1.5px solid ${effectiveColor}`,
                    boxShadow:  `0 0 12px ${effectiveColor}33`,
                  } : {}}
                  onClick={() => { setSelectedPlan(i); setQty(1); }}>

                  <div className="plan-row-left">
                    <span className="plan-label">{plan.label}</span>
                    <span className="plan-type-tag"
                      style={{
                        background: `${TYPE_COLORS[activeType] || product.color}22`,
                        border:     `1px solid ${TYPE_COLORS[activeType] || product.color}44`,
                        color:       TYPE_COLORS[activeType] || product.color,
                      }}>
                      {activeType}
                    </span>
                  </div>

                  <div className="plan-row-right">
                    {isSelected && (
                      <div className="qty-controls">
                        <button className="qty-btn"
                          style={{
                            background: `${effectiveColor}33`,
                            border:     `1.5px solid ${effectiveColor}66`,
                            color:       effectiveColor,
                          }}
                          onClick={e => { e.stopPropagation(); setQty(q => Math.max(1, q - 1)); }}>
                          −
                        </button>
                        <span className="qty-num">{qty}</span>
                        <button className="qty-btn"
                          style={{
                            background: `${effectiveColor}33`,
                            border:     `1.5px solid ${effectiveColor}66`,
                            color:       effectiveColor,
                          }}
                          onClick={e => { e.stopPropagation(); setQty(q => Math.min(10, q + 1)); }}>
                          +
                        </button>
                      </div>
                    )}
                    <div className="plan-price-wrap">
                      <div className="plan-price"
                        style={{ color: isSelected ? effectiveColor : '#bbb' }}>
                        ₹{plan.price}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ height: 8 }} />
      </div>

      {/* Sticky Footer */}
      <div className="modal-footer">
        {currentPlan && (
          <div className="order-summary">
            <div className="order-summary-top">
              <span className="order-summary-lbl">ORDER SUMMARY</span>
              <span className="order-summary-lbl">TOTAL (INR)</span>
            </div>
            <div className="order-summary-body">
              <div>
                <div className="order-summary-name">{product.name} · {activeType}</div>
                <div className="order-summary-sub">Plan: {currentPlan.label} · Qty: {qty}</div>
              </div>
              <div className="order-total-price"
                style={{ color: effectiveColor, textShadow: `0 0 16px ${effectiveColor}88` }}>
                ₹{total}
              </div>
            </div>
          </div>
        )}

        <button className="order-cta-btn"
          style={{
            background: !currentPlan
              ? '#1a1e2a'
              : canAfford
                ? `linear-gradient(135deg, ${effectiveColor}, ${effectiveColor}bb)`
                : 'linear-gradient(135deg, #ff4444, #cc2222)',
            cursor:     currentPlan ? 'pointer' : 'not-allowed',
            color:      currentPlan ? '#fff' : '#444',
            boxShadow:  currentPlan
              ? canAfford ? `0 6px 28px ${effectiveColor}77` : '0 6px 28px #ff444477'
              : 'none',
          }}
          onClick={handleOrder}>
          {!currentPlan
            ? '⬆️ PLAN CHUNNO'
            : canAfford
              ? '✈️ TELEGRAM PE ORDER KARO'
              : '❌ BALANCE KAM HAI — PEHLE KAMAO'}
        </button>
      </div>

      {/* Confirm Overlay */}
      {confirmPending && currentPlan && (
        <div className="confirm-overlay">
          <div className="confirm-box"
            style={{ border: `1.5px solid ${effectiveColor}66`, boxShadow: `0 8px 40px ${effectiveColor}33` }}>
            <div className="confirm-emoji">🛒</div>
            <div className="confirm-title">Order Confirm Karo</div>
            <div className="confirm-sub">{product.name} · {activeType} · {currentPlan.label} × {qty}</div>
            <div className="confirm-deduct-box" style={{ border: `1px solid ${effectiveColor}33` }}>
              <div className="confirm-deduct-lbl">TOTAL AMOUNT</div>
              <div className="confirm-deduct-coins" style={{ color: effectiveColor }}>₹{total}</div>
              <div className="confirm-deduct-sub">{product.name} · {currentPlan.label} × {qty}</div>
            </div>
            <div className="confirm-note">⚠️ "Telegram Kholo" dabate hi order Munna Agent ko Telegram pe bheja jaayega</div>
            <div className="confirm-btns">
              <button className="confirm-cancel-btn" onClick={() => setConfirmPending(false)}>Cancel</button>
              <button className="confirm-go-btn"
                style={{
                  background: `linear-gradient(135deg, ${effectiveColor}, ${effectiveColor}bb)`,
                  boxShadow:  `0 4px 16px ${effectiveColor}55`,
                  opacity:    confirming ? 0.6 : 1,
                }}
                onClick={handleConfirmOrder}
                disabled={confirming}>
                {confirming ? '⏳ Processing...' : '📲 Telegram Kholo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
    </div>
  );
}
