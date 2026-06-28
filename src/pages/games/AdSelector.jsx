import { useState, useEffect } from 'react';
import { enabledPlatforms, getSelectedPlatform, setSelectedPlatform } from './adManager';
import './adSelector.css';

export default function AdSelector() {
  const [selected, setSelected] = useState(() => getSelectedPlatform());

  useEffect(() => {
    setSelectedPlatform(selected);
    window.__smbAdPlatform = selected;
  }, [selected]);

  useEffect(() => {
    window.__smbAdPlatform = selected;
  }, []);

  const handleSelect = (id) => {
    setSelected(id);
    setSelectedPlatform(id);
    window.__smbAdPlatform = id;
  };

  return (
    <div className="ads-selector-wrap">
      <div className="ads-selector-label">
        <span className="ads-sel-dot" />
        <span>Ad Platform Chuno</span>
      </div>
      <div className="ads-selector-row">
        {enabledPlatforms.map(p => (
          <button
            key={p.id}
            className={`ads-platform-btn ${selected === p.id ? 'ads-platform-active' : ''}`}
            style={{
              '--p-color':  p.color,
              '--p-bg':     p.bg,
              '--p-border': p.border,
            }}
            onClick={() => handleSelect(p.id)}
            title={p.name}
          >
            <span className="ads-platform-id">{p.id}</span>
            {selected === p.id && (
              <span className="ads-platform-check">✓</span>
            )}
          </button>
        ))}
      </div>
      <div className="ads-selector-hint">
        {(() => {
          const p = enabledPlatforms.find(pl => pl.id === selected);
          return p ? `${p.name} ka ad dikhega` : '';
        })()}
      </div>
    </div>
  );
}
