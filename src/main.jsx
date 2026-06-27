import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// Version check — naya build deploy hua toh reload karo
function checkVersion() {
  fetch('/version.json?_=' + Date.now(), { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var stored = localStorage.getItem('smb_bv');
      if (stored && stored !== data.v) {
        localStorage.setItem('smb_bv', data.v);
        sessionStorage.removeItem('smb_session');
        window.location.href = window.location.origin + '/loading';
      } else if (!stored) {
        localStorage.setItem('smb_bv', data.v);
      }
    })
    .catch(function () {});
}

// PAGE REFRESH FIX — refresh hone se pehle session clear karo
// Taaki next load pe /loading se re-auth ho (localStorage fallback kaam karega)
window.addEventListener('beforeunload', function () {
  sessionStorage.removeItem('smb_session');
});

// bfcache fix — Telegram kabhi kabhi cached page restore karta hai
window.addEventListener('pageshow', function (event) {
  if (event.persisted) {
    sessionStorage.removeItem('smb_session');
    window.location.href = window.location.origin + '/loading';
  }
});

// Tab switch ya screen on hone pe version check karo
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
