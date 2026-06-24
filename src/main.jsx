import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// ══════════════════════════════════════════════════════════════
// BFCACHE FIX — Telegram WebView "background se open" problem
//
// Root cause:
//   e.persisted = true  →  page bfcache se restore hua (frozen snapshot)
//   Iska matlab: React, state, sab kuch purana frozen hai
//   Koi bhi async fix (version.json fetch etc.) yahan kaam nahi karta
//   kyunki page already render ho chuka hota hai bfcache se
//
// Fix: pageshow event mein e.persisted check karo
//   → IMMEDIATE synchronous reload (hard refresh)
//   → e.persisted sirf bfcache restore pe true hota hai
//   → Normal page load pe false hota hai (infinite loop nahi)
// ══════════════════════════════════════════════════════════════
window.addEventListener('pageshow', function (e) {
  if (e.persisted) {
    // bfcache se restore hua — purana frozen version hai
    // Session clear karo + hard reload karo
    try { sessionStorage.removeItem('smb_session'); } catch (_) {}
    window.location.reload(true);
  }
});

// ── visibilitychange bhi rakho as backup ──
// Kuch Telegram versions mein pageshow fire nahi hota properly
document.addEventListener('visibilitychange', function () {
  if (document.visibilityState === 'visible') {
    // Version.json check karo — naya build aya hai to reload
    var ts = Date.now();
    fetch('/version.json?_=' + ts, { cache: 'no-store' })
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
});

// ── Manual reload pe session clear karo (existing fix) ──
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
