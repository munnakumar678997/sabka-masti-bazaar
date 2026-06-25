import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import BottomNav from '../../components/BottomNav';
import { PRODUCTS, TYPE_COLORS } from './storeData';
import ProductModal from './ProductModal';
import '../../styles/store.css';

export default function Store() {
  const { balance } = useApp();
  const [openProduct, setOpenProduct] = useState(null);

  return (
    <div className="store-page">

      <div className="store-topbar">
        <div className="store-topbar-title">🛒 Store</div>
        <div className="store-balance-chip">
          ₹<span>{(balance / 100).toFixed(2)}</span>
        </div>
      </div>

      <div className="store-scroll">
        <div className="store-sub">
          {PRODUCTS.length} PRODUCTS · TAP TO ORDER
        </div>

        <div className="product-grid">
          {PRODUCTS.map(product => {
            const tKeys = Object.keys(product.types);
            return (
              <div key={product.id}
                className="product-card"
                style={{
                  background: `linear-gradient(145deg, ${product.color}18, #0a0f1e)`,
                  border:     `1.5px solid ${product.color}55`,
                  boxShadow:  `0 4px 20px ${product.color}22`,
                }}
                onClick={() => setOpenProduct(product)}>

                {product.badge && (
                  <div className="product-badge"
                    style={{
                      background: product.badge === 'HOT' ? '#ff2200' : '#ffd700',
                      color:      product.badge === 'HOT' ? '#fff' : '#000',
                    }}>
                    {product.badge}
                  </div>
                )}

                <div className="product-icon-wrap"
                  style={{
                    background: `linear-gradient(135deg, ${product.color}33, ${product.color}11)`,
                    border:     `1.5px solid ${product.color}55`,
                    boxShadow:  `0 0 16px ${product.color}44`,
                  }}>
                  {product.icon}
                </div>

                <div className="product-name">{product.name}</div>

                <div className="product-type-tags">
                  {tKeys.map(t => (
                    <span key={t} className="type-tag"
                      style={{
                        background: `${TYPE_COLORS[t] || product.color}22`,
                        border:     `1px solid ${TYPE_COLORS[t] || product.color}55`,
                        color:       TYPE_COLORS[t] || product.color,
                      }}>
                      {t}
                    </span>
                  ))}
                </div>

                <button className="product-order-btn"
                  style={{
                    background: `linear-gradient(135deg, ${product.color}, ${product.color}cc)`,
                    boxShadow:  `0 4px 14px ${product.color}55`,
                  }}>
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

      {openProduct && (
        <ProductModal product={openProduct} onClose={() => setOpenProduct(null)} />
      )}
    </div>
  );
}
