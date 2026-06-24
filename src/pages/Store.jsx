import { useState } from 'react';
import { useApp } from '../context/AppContext';
import BottomNav from '../components/BottomNav';
import '../styles/store.css';

const TELEGRAM_AGENT = 'Munnapm70045';

const TYPE_COLORS = {
  APKMOD:     '#ff6600',
  ROOT:       '#ff2200',
  iOS:        '#aaaaaa',
  PC:         '#ffcc00',
  'APK+ROOT': '#ff6600',
  'ROOT/PC':  '#ffcc00',
  'PC+BYPASS':'#ff9900',
  BLUE:       '#0099ff',
  ORANGE:     '#ff8800',
};

const PRODUCTS = [
  {
    id: 'drip-client', name: 'DRIP CLIENT', icon: '🔥', color: '#ff6600', badge: null,
    types: {
      APKMOD: [
        { label: '1 Day',   price: 36  },
        { label: '3 Days',  price: 67  },
        { label: '7 Days',  price: 135 },
        { label: '15 Days', price: 225 },
        { label: '30 Days', price: 315 },
      ],
      ROOT: [
        { label: '1 Day',   price: 45  },
        { label: '7 Days',  price: 135 },
        { label: '30 Days', price: 315 },
      ],
    },
  },
  {
    id: 'hg-cheats', name: 'HG CHEATS', icon: '🎮', color: '#00cc44', badge: null,
    types: {
      'APK+ROOT': [
        { label: '1 Day',   price: 67  },
        { label: '7 Days',  price: 112 },
        { label: '10 Days', price: 135 },
        { label: '30 Days', price: 270 },
      ],
    },
  },
  {
    id: 'prime-mods', name: 'PRIME MODS', icon: '💜', color: '#9933ff', badge: null,
    types: {
      APKMOD: [
        { label: '1 Day',  price: 34  },
        { label: '3 Days', price: 68  },
        { label: '7 Days', price: 135 },
      ],
    },
  },
  {
    id: 'pato-teem', name: 'PATO TEEM', icon: '💎', color: '#0099ff', badge: 'PREMIUM',
    colorByType: { BLUE: '#0099ff', ORANGE: '#ff8800' },
    types: {
      BLUE: [
        { label: '3 Days',  price: 90  },
        { label: '7 Days',  price: 180 },
        { label: '15 Days', price: 225 },
        { label: '30 Days', price: 360 },
      ],
      ORANGE: [
        { label: '1 Day',   price: 90  },
        { label: '3 Days',  price: 135 },
        { label: '7 Days',  price: 180 },
        { label: '15 Days', price: 270 },
        { label: '30 Days', price: 450 },
      ],
    },
  },
  {
    id: 'br-mods', name: 'BR MODS', icon: '💎', color: '#ff00aa', badge: 'PREMIUM',
    types: {
      ROOT: [
        { label: '1 Day',   price: 32  },
        { label: '7 Days',  price: 68  },
        { label: '15 Days', price: 135 },
        { label: '30 Days', price: 270 },
      ],
      PC: [
        { label: '1 Day',   price: 54  },
        { label: '10 Days', price: 225 },
        { label: '30 Days', price: 360 },
      ],
      'PC+BYPASS': [
        { label: '1 Day',   price: 81  },
        { label: '10 Days', price: 360 },
        { label: '30 Days', price: 450 },
      ],
    },
  },
  {
    id: 'haxx-cker', name: 'HAXX CKER PRO', icon: '🔒', color: '#ff2200', badge: null,
    types: {
      ROOT: [
        { label: '10 Days', price: 360  },
        { label: '20 Days', price: 720  },
        { label: '30 Days', price: 1080 },
      ],
    },
  },
  {
    id: 'lk-team', name: 'LK TEAM', icon: '💻', color: '#ffcc00', badge: null,
    types: {
      'ROOT/PC': [
        { label: '1 Day',   price: 36  },
        { label: '5 Days',  price: 56  },
        { label: '10 Days', price: 90  },
        { label: '30 Days', price: 225 },
      ],
    },
  },
  {
    id: 'stricks-br', name: 'STRICKS BR', icon: '🎯', color: '#00ff66', badge: null,
    types: {
      ROOT: [
        { label: '1 Day',   price: 22  },
        { label: '5 Days',  price: 45  },
        { label: '7 Days',  price: 90  },
        { label: '15 Days', price: 180 },
        { label: '30 Days', price: 270 },
      ],
    },
  },
  {
    id: 'spotify-ff', name: 'SPOTIFY FF', icon: '🎵', color: '#1db954', badge: null,
    types: {
      ROOT: [
        { label: '7 Days',  price: 135 },
        { label: '15 Days', price: 225 },
        { label: '30 Days', price: 315 },
        { label: '60 Days', price: 540 },
      ],
    },
  },
  {
    id: 'drip-aimkill', name: 'DRIP AIMKILL X86', icon: '🖥️', color: '#ff4400', badge: null,
    types: {
      PC: [
        { label: '1 Day',   price: 112 },
        { label: '7 Days',  price: 270 },
        { label: '15 Days', price: 360 },
        { label: '30 Days', price: 630 },
      ],
    },
  },
  {
    id: 'esign-cert', name: 'iOS / ESIGN CERT', icon: '🍎', color: '#aaaaaa', badge: null,
    types: {
      iOS: [
        { label: '30 Days', price: 270 },
        { label: '60 Days', price: 360 },
        { label: '90 Days', price: 450 },
      ],
    },
  },
  {
    id: 'fluorite-ff', name: 'FLUORITE FF', icon: '🍎', color: '#ff4488', badge: 'HOT',
    types: {
      iOS: [
        { label: '1 Day',   price: 225  },
        { label: '7 Days',  price: 540  },
        { label: '31 Days', price: 1125 },
      ],
    },
  },
];

function Toast({ msg, onClose }) {
  return (
    <div className="toast-box" onClick={onClose}>
      <span>{msg}</span>
    </div>
  );
}

export default function Store() {
  const { balance, deductCoins, user, saveOrder } = useApp();

  const [openProduct,    setOpenProduct]    = useState(null);
  const [activeType,     setActiveType]     = useState(null);
  const [selectedPlan,   setSelectedPlan]   = useState(null);
  const [qty,            setQty]            = useState(1);
  const [confirmPending, setConfirmPending] = useState(false);
  const [toast,          setToast]          = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3200);
  };

  const openModal = (product) => {
    const firstType = Object.keys(product.types)[0];
    setOpenProduct(product);
    setActiveType(firstType);
    setSelectedPlan(null);
    setQty(1);
    setConfirmPending(false);
  };

  const closeModal = () => {
    setOpenProduct(null);
    setSelectedPlan(null);
    setQty(1);
    setConfirmPending(false);
  };

  const handleTypeChange = (type) => {
    setActiveType(type);
    setSelectedPlan(null);
    setQty(1);
  };

  const effectiveColor = openProduct?.colorByType?.[activeType] || openProduct?.color || '#ff6600';
  const typeKeys       = openProduct ? Object.keys(openProduct.types) : [];
  const currentPlans   = openProduct ? openProduct.types[activeType] : [];
  const currentPlan    = selectedPlan !== null ? currentPlans[selectedPlan] : null;
  const total          = currentPlan ? currentPlan.price * qty : 0;
  const coinsRequired  = total * 100;
  const canAfford      = balance >= coinsRequired;

  const handleOrder = () => {
    if (!currentPlan) return;
    if (!canAfford) {
      showToast(`❌ Coins kam hain! Chahiye: ${coinsRequired.toLocaleString()}, tumhare paas: ${balance.toLocaleString()}`);
      return;
    }
    setConfirmPending(true);
  };

  const handleConfirmOrder = async () => {
    // User info for Telegram message
    const userName   = user?.name     || 'Unknown';
    const userHandle = user?.username ? `@${user.username}` : 'No username';
    const userId     = user?.id       || 'Unknown';
    const replyLink  = user?.username
      ? `https://t.me/${user.username}`
      : `tg://user?id=${userId}`;

    const tgMsg = encodeURIComponent(
      `🛒 NEW ORDER\n\n` +
      `Product: ${openProduct.name}\n` +
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

    // Coins deduct karo — Firestore transaction se (race-condition safe)
    const deducted = await deductCoins(coinsRequired);
    if (!deducted) {
      setConfirmPending(false);
      showToast(`❌ Balance kam hai! Order cancel ho gaya. Pehle coins kamao.`);
      return;
    }

    // Firestore mein order save karo (admin tracking ke liye)
    saveOrder({
      product:  openProduct.name,
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
    showToast(`✅ ${coinsRequired.toLocaleString()} coins deduct ho gaye! Order process ho raha hai...`);
    closeModal();
  };


  return (
    <div className="store-page">

      {/* ── TOPBAR ── */}
      <div className="store-topbar">
        <div className="store-topbar-title">🛒 Store</div>
        <div className="store-balance-chip">
          🪙 <span>{balance.toLocaleString()}</span>
        </div>
      </div>

      {/* ── SCROLL ── */}
      <div className="store-scroll">
        <div className="store-sub">
          {PRODUCTS.length} PRODUCTS · TAP TO ORDER
        </div>

        {/* ── PRODUCT GRID ── */}
        <div className="product-grid">
          {PRODUCTS.map(product => {
            const tKeys = Object.keys(product.types);
            return (
              <div
                key={product.id}
                className="product-card"
                style={{
                  background: `linear-gradient(145deg, ${product.color}18, #0a0f1e)`,
                  border: `1.5px solid ${product.color}55`,
                  boxShadow: `0 4px 20px ${product.color}22`,
                }}
                onClick={() => openModal(product)}
              >
                {product.badge && (
                  <div
                    className="product-badge"
                    style={{
                      background: product.badge === 'HOT' ? '#ff2200' : '#ffd700',
                      color: product.badge === 'HOT' ? '#fff' : '#000',
                    }}
                  >{product.badge}</div>
                )}

                <div
                  className="product-icon-wrap"
                  style={{
                    background: `linear-gradient(135deg, ${product.color}33, ${product.color}11)`,
                    border: `1.5px solid ${product.color}55`,
                    boxShadow: `0 0 16px ${product.color}44`,
                  }}
                >{product.icon}</div>

                <div className="product-name">{product.name}</div>

                <div className="product-type-tags">
                  {tKeys.map(t => (
                    <span
                      key={t}
                      className="type-tag"
                      style={{
                        background: `${TYPE_COLORS[t] || product.color}22`,
                        border: `1px solid ${TYPE_COLORS[t] || product.color}55`,
                        color: TYPE_COLORS[t] || product.color,
                      }}
                    >{t}</span>
                  ))}
                </div>

                <button
                  className="product-order-btn"
                  style={{
                    background: `linear-gradient(135deg, ${product.color}, ${product.color}cc)`,
                    boxShadow: `0 4px 14px ${product.color}55`,
                  }}
                >
                  <div className="order-btn-text">⚡ ORDER NOW</div>
                  <div className="order-btn-sub">BY MUNNA AGENT</div>
                </button>
              </div>
            );
          })}
        </div>
        <div style={{ height: 90 }} />
      </div>

      <BottomNav />

      {/* ── PRODUCT DETAIL MODAL ── */}
      {openProduct && (
        <div className="modal-page" style={{ background: '#0d1117' }}>

          <div className="modal-header" style={{ borderBottom: `1px solid ${effectiveColor}33` }}>
            <div
              className="modal-product-icon"
              style={{
                background: `linear-gradient(135deg, ${effectiveColor}44, ${effectiveColor}11)`,
                border: `1.5px solid ${effectiveColor}88`,
                boxShadow: `0 0 18px ${effectiveColor}55`,
              }}
            >{openProduct.icon}</div>
            <div className="modal-product-info">
              <div className="modal-product-name">{openProduct.name}</div>
              <div className="modal-product-sub">Telegram pe order · BY MUNNA AGENT</div>
            </div>
            <button className="modal-close-btn" onClick={closeModal}>✕</button>
          </div>

          <div className="modal-scroll">

            {typeKeys.length > 1 && (
              <div className="modal-section">
                <div className="modal-section-label">DEVICE TYPE</div>
                <div className="type-tabs">
                  {typeKeys.map(t => (
                    <button
                      key={t}
                      className={`type-tab-btn ${activeType === t ? 'active' : ''}`}
                      style={activeType === t ? {
                        background: `linear-gradient(135deg, ${TYPE_COLORS[t] || effectiveColor}, ${TYPE_COLORS[t] || effectiveColor}bb)`,
                        boxShadow: `0 3px 10px ${TYPE_COLORS[t] || effectiveColor}55`,
                      } : {}}
                      onClick={() => handleTypeChange(t)}
                    >{t}</button>
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
                    <div
                      key={i}
                      className={`plan-row ${isSelected ? 'selected' : ''}`}
                      style={isSelected ? {
                        background: `${effectiveColor}15`,
                        border: `1.5px solid ${effectiveColor}`,
                        boxShadow: `0 0 12px ${effectiveColor}33`,
                      } : {}}
                      onClick={() => { setSelectedPlan(i); setQty(1); }}
                    >
                      <div className="plan-row-left">
                        <span className="plan-label">{plan.label}</span>
                        <span
                          className="plan-type-tag"
                          style={{
                            background: `${TYPE_COLORS[activeType] || openProduct.color}22`,
                            border: `1px solid ${TYPE_COLORS[activeType] || openProduct.color}44`,
                            color: TYPE_COLORS[activeType] || openProduct.color,
                          }}
                        >{activeType}</span>
                      </div>

                      <div className="plan-row-right">
                        {isSelected && (
                          <div className="qty-controls">
                            <button
                              className="qty-btn"
                              style={{
                                background: `${effectiveColor}33`,
                                border: `1.5px solid ${effectiveColor}66`,
                                color: effectiveColor,
                              }}
                              onClick={e => { e.stopPropagation(); setQty(q => Math.max(1, q - 1)); }}
                            >−</button>
                            <span className="qty-num">{qty}</span>
                            <button
                              className="qty-btn"
                              style={{
                                background: `${effectiveColor}33`,
                                border: `1.5px solid ${effectiveColor}66`,
                                color: effectiveColor,
                              }}
                              onClick={e => { e.stopPropagation(); setQty(q => Math.min(10, q + 1)); }}
                            >+</button>
                          </div>
                        )}
                        <div className="plan-price-wrap">
                          <div
                            className="plan-price"
                            style={{ color: isSelected ? effectiveColor : '#bbb' }}
                          >₹{plan.price}</div>
                          <div className="plan-coins">{(plan.price * 100).toLocaleString()} coins</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ height: 8 }} />
          </div>

          {/* Sticky Bottom */}
          <div className="modal-footer">
            {currentPlan && (
              <div className="order-summary">
                <div className="order-summary-top">
                  <span className="order-summary-lbl">ORDER SUMMARY</span>
                  <span className="order-summary-lbl">TOTAL (INR)</span>
                </div>
                <div className="order-summary-body">
                  <div>
                    <div className="order-summary-name">{openProduct.name} · {activeType}</div>
                    <div className="order-summary-sub">Plan: {currentPlan.label} · Qty: {qty}</div>
                    <div
                      className="order-summary-coins"
                      style={{ color: canAfford ? '#00ff88' : '#ff4444' }}
                    >
                      🪙 {canAfford
                        ? `${coinsRequired.toLocaleString()} coins ✓`
                        : `${(coinsRequired - balance).toLocaleString()} coins aur chahiye`}
                    </div>
                  </div>
                  <div
                    className="order-total-price"
                    style={{ color: effectiveColor, textShadow: `0 0 16px ${effectiveColor}88` }}
                  >₹{total}</div>
                </div>
              </div>
            )}

            <button
              className="order-cta-btn"
              style={{
                background: !currentPlan
                  ? '#1a1e2a'
                  : canAfford
                    ? `linear-gradient(135deg, ${effectiveColor}, ${effectiveColor}bb)`
                    : 'linear-gradient(135deg, #ff4444, #cc2222)',
                cursor: currentPlan ? 'pointer' : 'not-allowed',
                color: currentPlan ? '#fff' : '#444',
                boxShadow: currentPlan
                  ? canAfford ? `0 6px 28px ${effectiveColor}77` : '0 6px 28px #ff444477'
                  : 'none',
              }}
              onClick={handleOrder}
            >
              {!currentPlan
                ? '⬆️ PLAN CHUNNO'
                : canAfford
                  ? '✈️ TELEGRAM PE ORDER KARO'
                  : `❌ ${(coinsRequired - balance).toLocaleString()} COINS AUR CHAHIYE`}
            </button>
          </div>

          {/* Step 1 — Confirm */}
          {confirmPending && currentPlan && (
            <div className="confirm-overlay">
              <div className="confirm-box" style={{ border: `1.5px solid ${effectiveColor}66`, boxShadow: `0 8px 40px ${effectiveColor}33` }}>
                <div className="confirm-emoji">🛒</div>
                <div className="confirm-title">Order Confirm Karo</div>
                <div className="confirm-sub">{openProduct.name} · {activeType} · {currentPlan.label} × {qty}</div>
                <div className="confirm-deduct-box" style={{ border: `1px solid ${effectiveColor}33` }}>
                  <div className="confirm-deduct-lbl">DEDUCT HOGA</div>
                  <div className="confirm-deduct-coins" style={{ color: effectiveColor }}>
                    🪙 {coinsRequired.toLocaleString()} coins
                  </div>
                  <div className="confirm-deduct-sub">
                    Baaki bachega: {Math.max(0, balance - coinsRequired).toLocaleString()} coins
                  </div>
                </div>
                <div className="confirm-note">⚠️ Coins tabhi deduct honge jab tum Telegram pe order bhejne ki confirm karoge</div>
                <div className="confirm-btns">
                  <button className="confirm-cancel-btn" onClick={() => setConfirmPending(false)}>Cancel</button>
                  <button
                    className="confirm-go-btn"
                    style={{ background: `linear-gradient(135deg, ${effectiveColor}, ${effectiveColor}bb)`, boxShadow: `0 4px 16px ${effectiveColor}55` }}
                    onClick={handleConfirmOrder}
                  >📲 Telegram Kholo</button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
    </div>
  );
}
