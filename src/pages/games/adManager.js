/**
 * ============================================================
 *  SABKA MASTI BAZAAR — AD MANAGER
 * ============================================================
 *
 *  Yahan sab ad platforms ka config hai.
 *  Naya platform add karna ho toh sirf AD_PLATFORMS array
 *  mein ek naya object add karo — baaki sab automatic hoga.
 *
 *  Har platform ke liye:
 *   id      → short badge name (e.g. 'MG')
 *   name    → full name (e.g. 'Monetag')
 *   color   → badge color
 *   enabled → true/false (false karo toh selector mein nahi dikhega)
 *   show()  → async function jo actual ad trigger karta hai
 *
 * ============================================================
 */

// ══════════════════════════════════════════════════════════════
//  TELEGRAM WEBVIEW — PERMANENT window.open PATCH
//
//  Problem: Adsterra (aur doosre popunder networks) internally
//  window.open(url) call karte hain. Telegram Mini App WebView
//  is call ko BLOCK karta hai ya "Open with" dialog dikhata hai.
//
//  Fix: Module load hote hi window.open ko permanently patch
//  karo. Jab bhi koi script window.open(url) call kare,
//  hum use Telegram.WebApp.openLink(url) se redirect karenge —
//  jo Telegram ke built-in browser mein sahi se khulta hai.
//
//  Yeh patch sirf ek baar lagta hai, aur Adsterra script load
//  hone se PEHLE hona chahiye (isliye module level pe hai).
// ══════════════════════════════════════════════════════════════
(function patchWindowOpenForTelegram() {
  const _orig = window.open;
  window.open = function (url, target, features) {
    const tg = window.Telegram?.WebApp;
    if (url && tg && typeof tg.openLink === 'function') {
      try {
        tg.openLink(String(url), { try_instant_view: false });
      } catch (_) {}
      return { focus: () => {}, blur: () => {}, closed: false, location: { href: url } };
    }
    return _orig.call(this, url, target, features);
  };
})();


// ══════════════════════════════════════════════════════════════
//  ADSTERRA PRE-LOADER
//
//  Adsterra ka popunder flow:
//    1. Script load hoti hai → document pe click listener lagta hai
//    2. User ka TRUSTED click → listener fire → window.open(adUrl)
//    3. Hamaara patched window.open → Telegram.WebApp.openLink(adUrl)
//
//  Isliye script PEHLE se load karni chahiye, user ke click se
//  PEHLE. Jab user "Ad Dekho" button click kare, woh trusted
//  click Adsterra ka listener trigger karega.
// ══════════════════════════════════════════════════════════════
const ADSTERRA_SRC = 'https://pl29909881.effectivecpmnetwork.com/a3/74/5f/a3745fdb026064330f6742dc41eb565c.js';
let _adsterraState = 'idle'; // 'idle' | 'loading' | 'ready'

export function preloadAdsterra() {
  if (_adsterraState !== 'idle') return;
  if (document.querySelector('script[data-adt="1"]')) {
    _adsterraState = 'ready';
    return;
  }
  _adsterraState = 'loading';
  const s = document.createElement('script');
  s.src = ADSTERRA_SRC;
  s.setAttribute('data-adt', '1');
  s.async = true;
  s.onload  = () => { _adsterraState = 'ready'; };
  s.onerror = () => { _adsterraState = 'idle'; };
  document.head.appendChild(s);
}

export function isAdsterraReady() {
  return _adsterraState === 'ready';
}


// ══════════════════════════════════════════════════════════════
//  AD PLATFORMS CONFIG
// ══════════════════════════════════════════════════════════════
export const AD_PLATFORMS = [

  // ── 1. MONETAG ────────────────────────────────────────────
  // SDK already loaded hai index.html mein:
  // <script src='//libtl.com/sdk.js' data-zone='11204152' data-sdk='show_11204152'></script>
  // Monetag ka apna Telegram-compatible SDK hai, koi fix nahi chahiye.
  {
    id:      'MG',
    name:    'Monetag',
    color:   '#f97316',
    bg:      'rgba(249,115,22,0.15)',
    border:  'rgba(249,115,22,0.45)',
    enabled: true,
    show: async () => {
      const fn = window['show_11204152'];
      if (typeof fn === 'function') await fn();
    },
  },

  // ── 2. ADSTERRA ───────────────────────────────────────────
  // Script Games page mount pe pre-load hoti hai (preloadAdsterra()).
  // User ka "Ad Dekho" click Adsterra ka listener trigger karta hai.
  // window.open patch (upar) use ko Telegram browser mein redirect karta hai.
  {
    id:      'ADT',
    name:    'Adsterra',
    color:   '#0ea5e9',
    bg:      'rgba(14,165,233,0.15)',
    border:  'rgba(14,165,233,0.45)',
    enabled: true,
    show: async () => {
      // Script ready nahi hai toh pehle load karo aur wait karo
      if (_adsterraState === 'idle') {
        preloadAdsterra();
      }
      if (_adsterraState === 'loading') {
        // Script load hone ka wait karo (max 4 seconds)
        await new Promise((resolve) => {
          const check = setInterval(() => {
            if (_adsterraState !== 'loading') {
              clearInterval(check);
              resolve();
            }
          }, 200);
          setTimeout(() => { clearInterval(check); resolve(); }, 4000);
        });
      }

      // Script ready hai — user ka click (jo is show() ko trigger kiya)
      // Adsterra ka document click listener already fire kar chuka hai.
      // Telegram.WebApp.openLink ne ad URL already open kar diya hoga.
      // Bas thoda wait karo taaki Telegram browser open ho sake.
      await new Promise(res => setTimeout(res, 1200));
    },
  },

  // ── 3. POPADS / POPCASH ───────────────────────────────────
  // PopCash verification tag pehle se index.html mein hai
  // Zone ID milne pe show() mein add karo
  {
    id:      'PKS',
    name:    'Popads',
    color:   '#a855f7',
    bg:      'rgba(168,85,247,0.15)',
    border:  'rgba(168,85,247,0.45)',
    enabled: true,
    show: async () => {
      await new Promise(res => setTimeout(res, 800));
    },
  },

  // ── 4. HILLTOPADS ─────────────────────────────────────────
  // HilltopAds verification tag pehle se index.html mein hai
  {
    id:      'HTA',
    name:    'HilltopAds',
    color:   '#22c55e',
    bg:      'rgba(34,197,94,0.15)',
    border:  'rgba(34,197,94,0.45)',
    enabled: true,
    show: async () => {
      await new Promise(res => setTimeout(res, 800));
    },
  },

  // ── 5. CLICKADU ───────────────────────────────────────────
  // Clickadu verification tag pehle se index.html mein hai
  {
    id:      'CKD',
    name:    'Clickadu',
    color:   '#eab308',
    bg:      'rgba(234,179,8,0.15)',
    border:  'rgba(234,179,8,0.45)',
    enabled: true,
    show: async () => {
      await new Promise(res => setTimeout(res, 800));
    },
  },

  // ──────────────────────────────────────────────────────────
  //  NAYI PLATFORM KAISE ADD KAREIN:
  //
  //  {
  //    id:      'XYZ',           ← short badge (2-3 chars)
  //    name:    'Network Name',  ← full name
  //    color:   '#hex',          ← badge color
  //    bg:      'rgba(...)',      ← light background
  //    border:  'rgba(...)',      ← border color
  //    enabled: true,
  //    show: async () => {
  //      const fn = window['yourNetworkFunction'];
  //      if (typeof fn === 'function') await fn();
  //    },
  //  },
  // ──────────────────────────────────────────────────────────
];

// ── Storage key ──────────────────────────────────────────────
const STORAGE_KEY = 'smb_ad_platform';

// ── Sirf enabled platforms ────────────────────────────────────
export const enabledPlatforms = AD_PLATFORMS.filter(p => p.enabled);

// ── Selected platform get karo (localStorage se) ─────────────
export function getSelectedPlatform() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && enabledPlatforms.find(p => p.id === saved)) return saved;
  } catch (_) {}
  return enabledPlatforms[0]?.id || 'MG';
}

// ── Selected platform save karo ───────────────────────────────
export function setSelectedPlatform(id) {
  try { localStorage.setItem(STORAGE_KEY, id); } catch (_) {}
}

// ── Ad show karo — selected platform ke hisab se ─────────────
// Agar platform ka ad fail ho toh bhi game unlock ho jaata hai (try/catch)
export async function showAdByPlatform(platformId) {
  const platform = enabledPlatforms.find(p => p.id === platformId)
    || enabledPlatforms[0];
  if (!platform) return;
  try {
    await platform.show();
  } catch (_) {
    // Network error ya ad blocker — silently pass, game unlock hoga
  }
}
