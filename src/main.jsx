import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// ══════════════════════════════════════════════════════════════
// CACHE BUST — 3-Layer Fix for Telegram WebView
//
// Layer 1: pageshow + e.persisted  (standard bfcache browsers)
// Layer 2: visibilitychange + version.json check (backup)
// Layer 3: Telegram WebApp 'activated' event (Telegram-specific)
// ══════════════════════════════════════════════════════════════

// ── Layer 1: bfcache standard fix ──
window.addEventListener('pageshow', function (e) {
  if (e.persisted) {
    try { sessionStorage.removeItem('smb_session'); } catch (_) {}
    window.location.reload(true);
  }
});

// ── Version check helper ──
function checkVersion() {
  fetch('/version.json?_=' + Date.now(), { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var stored = localStorage.getItem('smb_bv');
      if (stored && stored !== data.v) {
        localStorage.setItem('smb_bv', data.v);
        try { sessionStorage.removeItem('smb_session'); } catch (_) {}
        window.location.reload(true);
      } else if (!stored) {
        localStorage.setItem('smb_bv', data.v);
      }
    })
    .catch(function () {});
}

// ── Layer 2: visibilitychange backup ──
document.addEventListener('visibilitychange', function () {
  if (document.visibilityState === 'visible') {
    checkVersion();
  }
});

// ── Layer 3: Telegram WebApp 'activated' event ──
// Telegram Mini App background → foreground pe yeh reliable event fire hota hai
// Yeh standard browser events se zyada trustworthy hai Telegram ke andar
function setupTelegramActivated() {
  var tg = window.Telegram && window.Telegram.WebApp;
  if (!tg) return;
  try {
    tg.onEvent('activated', function () {
      checkVersion();
    });
  } catch (_) {}
}

// Telegram SDK load hone ka wait karo (already in index.html)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupTelegramActivated);
} else {
  setupTelegramActivated();
}

// ── Manual reload pe session clear karo ──
var navEntry = window.performance && window.performance.getEntriesByType
  ? window.performance.getEntriesByType('navigation')[0]
  : null;
if (navEntry && navEntry.type === 'reload') {
  try { sessionStorage.removeItem('smb_session'); } catch (_) {}
}

// ── React render ──
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
