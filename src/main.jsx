import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// ══════════════════════════════════════════════════════════════
// CACHE BUST — 4-Layer Fix for Telegram WebView
//
// Layer 1: pageshow + e.persisted  (index.html inline script)
// Layer 2: visibilitychange + hidden-time tracking (dev + prod)
// Layer 3: Telegram 'deactivated' + 'activated' events
// Layer 4: version.json check (production builds only)
//
// ROOT CAUSE FIX: version.json sirf production build mein hota
// hai. Dev mode mein fetch fail hoti thi silently — reload nahi
// hota tha. Ab time-based tracking se dev+prod dono mein kaam
// karta hai.
// ══════════════════════════════════════════════════════════════

// Background jaane ka time track karo (module-level — page life tak rahe)
var _hiddenAt = 0;

// Kitne seconds baad force reload karna hai (8 seconds)
var RELOAD_THRESHOLD_MS = 8000;

// ── Force reload helper ──
// IMPORTANT: window.location.reload() browser cache se serve karta hai
// isliye hum cache-busting URL use karte hain — ?_r=timestamp
// Yeh browser ko force karta hai fresh index.html + fresh JS/CSS fetch karne ke liye
function forceReload() {
  try { sessionStorage.removeItem('smb_session'); } catch (_) {}
  var freshUrl = window.location.origin + window.location.pathname + '?_r=' + Date.now();
  window.location.replace(freshUrl);
}

// ── Version check (production only — version.json sirf build mein hota hai) ──
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
      // version.json nahi mila (dev mode) — kuch mat karo
      // Time-based reload Layer 2/3 handle karega
    });
}

// ── Layer 1: bfcache fix index.html ke inline script mein hai ──
// (duplicate listener add nahi karenge)

// ── Layer 2: visibilitychange — time-based + version check ──
document.addEventListener('visibilitychange', function () {
  if (document.visibilityState === 'hidden') {
    // App background mein gaya — time save karo
    _hiddenAt = Date.now();
  } else if (document.visibilityState === 'visible') {
    if (_hiddenAt > 0 && Date.now() - _hiddenAt >= RELOAD_THRESHOLD_MS) {
      // App 8+ seconds background mein tha — fresh reload karo
      // Yeh dev + production dono mein kaam karta hai
      _hiddenAt = 0;
      forceReload();
    } else {
      // Short switch — sirf version check karo (production mein kaam karega)
      _hiddenAt = 0;
      checkVersion();
    }
  }
});

// ── Layer 3: Telegram WebApp events ──
function setupTelegramActivated() {
  var tg = window.Telegram && window.Telegram.WebApp;
  if (!tg) return;
  try {
    // App background mein gaya
    tg.onEvent('deactivated', function () {
      _hiddenAt = Date.now();
    });

    // App foreground mein aaya
    tg.onEvent('activated', function () {
      if (_hiddenAt > 0 && Date.now() - _hiddenAt >= RELOAD_THRESHOLD_MS) {
        // 8+ seconds background — force reload (dev + prod)
        _hiddenAt = 0;
        forceReload();
      } else {
        // Short switch — version check (prod only)
        _hiddenAt = 0;
        checkVersion();
      }
    });
  } catch (_) {}
}

// Telegram SDK load hone ka wait karo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupTelegramActivated);
} else {
  setupTelegramActivated();
}

// ── Manual refresh pe session clear karo ──
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
