// 😊 React entry point — yahan se poora app start hota hai 😊
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// 😊 Cache bust system — Telegram WebView ke liye 4-layer fix 😊
// Layer 1: pageshow + e.persisted  (index.html inline script)
// Layer 2: visibilitychange + hidden-time tracking (dev + prod)
// Layer 3: Telegram 'deactivated' + 'activated' events
// Layer 4: version.json check (production builds only)

// 😊 Background jaane ka time track karo — page life tak 😊
var _hiddenAt = 0;

// 😊 Kitne seconds baad force reload karna hai 😊
var RELOAD_THRESHOLD_MS = 8000;

// 😊 Force reload — cache-bust URL se fresh index.html load hoga 😊
function forceReload() {
  try { sessionStorage.removeItem('smb_session'); } catch (_) {}
  var freshUrl = window.location.origin + window.location.pathname + '?_r=' + Date.now();
  window.location.replace(freshUrl);
}

// 😊 Version check — production build mein version.json se check karo 😊
function checkVersion() {
  fetch('/version.json?_=' + Date.now(), { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var stored = localStorage.getItem('smb_bv');
      if (stored && stored !== data.v) {
        localStorage.setItem('smb_bv', data.v);
        forceReload();
      } else if (!stored) {
        localStorage.setItem('smb_bv', data.v);
      }
    })
    .catch(function () {
      // 😊 Dev mode mein version.json nahi hoga — ignore karo 😊
    });
}

// 😊 Layer 2 — tab switch detect karo, 8+ sec baad reload 😊
document.addEventListener('visibilitychange', function () {
  if (document.visibilityState === 'hidden') {
    _hiddenAt = Date.now();
  } else if (document.visibilityState === 'visible') {
    if (_hiddenAt > 0 && Date.now() - _hiddenAt >= RELOAD_THRESHOLD_MS) {
      _hiddenAt = 0;
      forceReload();
    } else {
      _hiddenAt = 0;
      checkVersion();
    }
  }
});

// 😊 Layer 3 — Telegram WebApp ke events handle karo 😊
function setupTelegramActivated() {
  var tg = window.Telegram && window.Telegram.WebApp;
  if (!tg) return;
  try {
    tg.onEvent('deactivated', function () {
      _hiddenAt = Date.now();
    });
    tg.onEvent('activated', function () {
      if (_hiddenAt > 0 && Date.now() - _hiddenAt >= RELOAD_THRESHOLD_MS) {
        _hiddenAt = 0;
        forceReload();
      } else {
        _hiddenAt = 0;
        checkVersion();
      }
    });
  } catch (_) {}
}

// 😊 Telegram SDK load hone ka wait karo 😊
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupTelegramActivated);
} else {
  setupTelegramActivated();
}

// 😊 Manual refresh pe session clear karo — loading pe wapas le jao 😊
var navEntry = window.performance && window.performance.getEntriesByType
  ? window.performance.getEntriesByType('navigation')[0]
  : null;
if (navEntry && navEntry.type === 'reload') {
  try { sessionStorage.removeItem('smb_session'); } catch (_) {}
}

// 😊 React app ko DOM mein mount karo 😊
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
