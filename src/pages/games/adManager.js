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
//  ADSTERRA PRE-LOADER
//
//  Adsterra popunder flow:
//    1. Script load hoti hai → document pe click listener lagta hai
//    2. User ka TRUSTED click → listener fire → window.open(adUrl)
//
//  Script games page mount pe pre-load karein taaki user ke
//  "Watch Ad" click pe instantly fire ho sake.
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
  // SDK already loaded hai index.html mein (Telegram-compatible):
  // <script src='//libtl.com/sdk.js' data-zone='11204152' data-sdk='show_11204152'></script>
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
  //
  //  HOW IT WORKS (Telegram WebView ke saath):
  //
  //  Problem: Adsterra popunder internally window.open(url) call
  //  karta hai. Telegram Mini App WebView is call ko block karta
  //  hai ya "Open with" dialog dikhata hai.
  //
  //  Fix (event timing trick):
  //  - show() ek SYNCHRONOUS patch lagata hai window.open pe
  //    pehle kisi bhi 'await' se pehle.
  //  - Jab show() pehla 'await' hit karta hai, click event DOM
  //    mein bubble karna continue karta hai → document tak
  //    pohunchta hai → Adsterra ka listener fire karta hai.
  //  - Adsterra window.open(url) call karta hai → hamaara patch
  //    us URL ko Telegram.WebApp.openLink() se kholta hai.
  //  - Telegram apna in-app browser kholta hai ✅
  //
  {
    id:      'ADT',
    name:    'Adsterra',
    color:   '#0ea5e9',
    bg:      'rgba(14,165,233,0.15)',
    border:  'rgba(14,165,233,0.45)',
    enabled: true,
    show: async () => {
      // ── STEP 1 (SYNC): window.open ko patch karo ──────────────
      // Yeh synchronously hona chahiye — pehle kisi bhi 'await' se
      // pehle. Is waqt click event abhi button se upar jaa raha hai.
      // Jab hum 'await' hit karein, click event document tak
      // pohunchega aur Adsterra ka listener hamaara patch use karega.
      const _origOpen = window.open;

      window.open = function adsterraTelegramProxy(url, target, features) {
        if (url) {
          try {
            const tg = window.Telegram?.WebApp;
            if (tg && typeof tg.openLink === 'function') {
              // Telegram ka in-app browser mein kholo
              tg.openLink(String(url), { try_instant_view: false });
            } else {
              // Non-Telegram context: normal window.open
              _origOpen.call(window, url, target, features);
            }
          } catch (_) {
            // tg.openLink fail ho toh original try karo
            try { _origOpen.call(window, url, target, features); } catch(_2) {}
          }
        }
        // Fake window object return karo taaki Adsterra script crash na ho
        return {
          focus: () => {},
          blur:  () => {},
          closed: false,
          location: { href: url || '' },
        };
      };

      // ── STEP 2: Script ready nahi hai toh load karo ───────────
      if (_adsterraState === 'idle') preloadAdsterra();

      if (_adsterraState === 'loading') {
        // Script abhi load ho rahi hai — wait karo (max 4s)
        await new Promise((resolve) => {
          const check = setInterval(() => {
            if (_adsterraState !== 'loading') {
              clearInterval(check);
              resolve();
            }
          }, 150);
          setTimeout(() => { clearInterval(check); resolve(); }, 4000);
        });
      }

      // ── STEP 3: YIELD — click event ab document tak pohunchega ──
      // Yahan 'await' se control event loop ko waapas jaata hai.
      // Click event ab document tak bubble karta hai:
      //   document.click listener fires → Adsterra → window.open(url)
      //   → hamaara proxy → Telegram.WebApp.openLink(url) → browser khulta hai ✅
      //
      // 2.5s wait: ad URL fetch + external browser open ka time
      await new Promise(res => setTimeout(res, 2500));

      // ── STEP 4: window.open restore karo ──────────────────────
      window.open = _origOpen;
    },
  },

  // ── 3. POPADS / POPCASH ───────────────────────────────────
  // PopCash verification tag pehle se index.html mein hai
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
  //    id:      'XYZ',
  //    name:    'Network Name',
  //    color:   '#hex',
  //    bg:      'rgba(...)',
  //    border:  'rgba(...)',
  //    enabled: true,
  //    show: async () => { ... },
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
