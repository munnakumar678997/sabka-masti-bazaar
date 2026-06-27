import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// Version check — naya build deploy hua toh reload karo
// Reload se pehle smb_session clear karo taaki /loading se re-auth ho
function checkVersion() {
  fetch('/version.json?_=' + Date.now(), { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var stored = localStorage.getItem('smb_bv');
      if (stored && stored !== data.v) {
        // Naya version mila — session clear karo aur reload karo
        // Session clear hoga taaki /loading pe re-auth ho (Telegram data fresh milega)
        localStorage.setItem('smb_bv', data.v);
        sessionStorage.removeItem('smb_session');
        window.location.href = window.location.origin + '/loading';
      } else if (!stored) {
        localStorage.setItem('smb_bv', data.v);
      }
    })
    .catch(function () {
      // Dev mode mein version.json nahi hoga — ignore karo
    });
}

// bfcache fix — Telegram Mini App kabhi kabhi cached page restore karta hai
// Agar page restored hua aur session active hai, toh /loading pe bhejna zaruri hai
// taaki Telegram data fresh mile
window.addEventListener('pageshow', function (event) {
  if (event.persisted) {
    // bfcache se restore hua — /loading pe le jao taaki re-auth ho
    sessionStorage.removeItem('smb_session');
    window.location.href = window.location.origin + '/loading';
  }
});

// Tab switch ya screen on hone pe sirf version check karo
document.addEventListener('visibilitychange', function () {
  if (document.visibilityState === 'visible') {
    checkVersion();
  }
});

// Telegram WebApp activated event — version check
function setupTelegramEvents() {
  var tg = window.Telegram && window.Telegram.WebApp;
  if (!tg) return;
  try {
    tg.onEvent('activated', function () {
      checkVersion();
    });
  } catch (_) {}
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupTelegramEvents);
} else {
  setupTelegramEvents();
}

// React app ko DOM mein mount karo
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
