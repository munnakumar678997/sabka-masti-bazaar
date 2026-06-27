// 😊 React entry point — yahan se poora app start hota hai 😊
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// 😊 Version check — naya build deploy hua toh hi reload karo 😊
// Background se wapas aane pe reload NAHI hoga — sirf version change pe
function checkVersion() {
  fetch('/version.json?_=' + Date.now(), { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var stored = localStorage.getItem('smb_bv');
      if (stored && stored !== data.v) {
        // Naya version mila — ab reload karo (session intact rakhne ki koshish)
        localStorage.setItem('smb_bv', data.v);
        window.location.reload();
      } else if (!stored) {
        localStorage.setItem('smb_bv', data.v);
      }
    })
    .catch(function () {
      // Dev mode mein version.json nahi hoga — ignore karo
    });
}

// 😊 Tab switch ya screen on hone pe sirf version check karo — reload nahi 😊
document.addEventListener('visibilitychange', function () {
  if (document.visibilityState === 'visible') {
    checkVersion();
  }
});

// 😊 Telegram WebApp events — sirf version check, reload nahi 😊
function setupTelegramEvents() {
  var tg = window.Telegram && window.Telegram.WebApp;
  if (!tg) return;
  try {
    tg.onEvent('activated', function () {
      checkVersion();
    });
  } catch (_) {}
}

// 😊 Telegram SDK load hone ka wait karo 😊
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupTelegramEvents);
} else {
  setupTelegramEvents();
}

// 😊 React app ko DOM mein mount karo 😊
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
