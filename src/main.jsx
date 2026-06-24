import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// ══════════════════════════════════════════════════════════════
// DEEP CACHE FIX — Telegram WebView bfcache problem ka permanent solution
//
// Problem kya hai:
//   Telegram WebView jab app background mein jaata hai toh page ko
//   memory mein "freeze" kar deta hai (bfcache).
//   Wapas aane pe network request nahi hoti — frozen snapshot serve hota hai.
//   Firebase headers, Cache-Control sab bypass ho jaate hain.
//
// Solution:
//   1. Har build pe ek unique `version.json` generate hoti hai (vite.config.js mein)
//   2. App start pe current version localStorage mein save hoti hai
//   3. Jab user wapas aata hai (visibilitychange = visible), version.json fetch karo
//   4. Agar version mismatch hai → force reload karo (hard refresh)
//   5. PerformanceNavigation 'reload' pe sessionStorage clear karo (existing fix)
// ══════════════════════════════════════════════════════════════

const VERSION_KEY  = 'smb_build_ver';
const CHECK_COOLDOWN_MS = 5000; // 5 sec se jyada baar check mat karo
let lastCheckTime  = 0;
let isReloading    = false;

async function checkVersion() {
  if (isReloading) return;
  const now = Date.now();
  if (now - lastCheckTime < CHECK_COOLDOWN_MS) return;
  lastCheckTime = now;

  try {
    // Cache bypass ke liye timestamp query param
    const res = await fetch(`/version.json?_=${now}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
    });
    if (!res.ok) return;

    const { v } = await res.json();
    const stored = localStorage.getItem(VERSION_KEY);

    if (!stored) {
      // Pehli baar — bas save karo
      localStorage.setItem(VERSION_KEY, v);
    } else if (stored !== v) {
      // Naya version aaya! Reload karo
      console.log(`[SMB] New version detected: ${stored} → ${v}. Reloading...`);
      isReloading = true;
      localStorage.setItem(VERSION_KEY, v);
      // sessionStorage bhi clear karo taaki Loading screen fresh chale
      sessionStorage.removeItem('smb_session');
      window.location.reload(true);
    }
  } catch {
    // Network fail — silently ignore, next check mein try hoga
  }
}

// ── App start hone pe pehla version check ──
checkVersion();

// ── Jab bhi user wapas aata hai (background → foreground) ──
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    checkVersion();
  }
});

// ── pageshow event — bfcache se wapas aane pe bhi fire hota hai ──
window.addEventListener('pageshow', (e) => {
  if (e.persisted) {
    // Page bfcache se restore hua — yeh exact case jo problem cause karta tha
    console.log('[SMB] Page restored from bfcache — checking version...');
    lastCheckTime = 0; // cooldown reset karo forced check ke liye
    checkVersion();
  }
});

// ── Existing fix: manual reload pe session clear karo ──
const navEntry = window.performance?.getEntriesByType?.('navigation')?.[0];
if (navEntry?.type === 'reload') {
  sessionStorage.removeItem('smb_session');
}

// ── App render ──
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
