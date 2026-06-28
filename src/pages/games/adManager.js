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

export const AD_PLATFORMS = [

  // ── 1. MONETAG ────────────────────────────────────────────
  // SDK already loaded hai index.html mein:
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
  // Popunder script dynamically inject hota hai click pe:
  // <script src="https://pl29909881.effectivecpmnetwork.com/a3/74/5f/a3745fdb026064330f6742dc41eb565c.js"></script>
  {
    id:      'ADT',
    name:    'Adsterra',
    color:   '#0ea5e9',
    bg:      'rgba(14,165,233,0.15)',
    border:  'rgba(14,165,233,0.45)',
    enabled: true,
    show: async () => {
      /**
       * Adsterra Popunder — Telegram WebView Fix
       *
       * Problem: Adsterra popunder internally calls window.open(url).
       * Telegram Mini App WebView window.open() ko block karta hai ya
       * "Open with" dialog dikhata hai — ad kabhi load nahi hota.
       *
       * Fix: window.open ko temporarily override karo.
       * Jab Adsterra us URL ko open karna chahega, hum us URL ko
       * Telegram.WebApp.openLink() se khol denge — jo Telegram ke
       * built-in browser mein properly open hota hai.
       */
      const ADSTERRA_SRC = 'https://pl29909881.effectivecpmnetwork.com/a3/74/5f/a3745fdb026064330f6742dc41eb565c.js';

      await new Promise((resolve) => {
        // ── Step 1: window.open override — Telegram ke saath compatible ──
        const originalOpen = window.open;
        let adOpened = false;

        window.open = function (url, ...args) {
          if (url && !adOpened) {
            adOpened = true;
            try {
              // Telegram WebApp ka official method — built-in browser mein kholega
              const tg = window.Telegram?.WebApp;
              if (tg && typeof tg.openLink === 'function') {
                tg.openLink(url, { try_instant_view: false });
              } else {
                // Fallback: normal open (non-Telegram browsers ke liye)
                originalOpen.call(window, url, ...args);
              }
            } catch (_) {}
          }
          // Koi bhi fake window object return karo taaki script crash na ho
          return { focus: () => {}, blur: () => {}, closed: false };
        };

        // ── Step 2: Restore original window.open after 5 seconds ──
        const restoreTimer = setTimeout(() => {
          window.open = originalOpen;
          resolve();
        }, 5000);

        // ── Step 3: Script load karo ──
        const alreadyLoaded = document.querySelector(`script[data-adt="1"]`);

        const onScriptDone = () => {
          // Script load ho gaya — thodi der baad resolve (ad trigger hone ka time do)
          setTimeout(() => {
            clearTimeout(restoreTimer);
            window.open = originalOpen;
            resolve();
          }, 1500);
        };

        if (alreadyLoaded) {
          // Script pehle se hai — sirf click simulate karo taaki popunder re-fire ho
          // Adsterra popunder click event pe trigger hota hai
          document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          setTimeout(() => {
            clearTimeout(restoreTimer);
            window.open = originalOpen;
            resolve();
          }, 1500);
          return;
        }

        const script = document.createElement('script');
        script.src = ADSTERRA_SRC;
        script.setAttribute('data-adt', '1');
        script.async = true;
        script.onload = onScriptDone;
        script.onerror = () => {
          clearTimeout(restoreTimer);
          window.open = originalOpen;
          resolve();
        };
        document.head.appendChild(script);
      });
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
      // TODO: Popads/PopCash zone ID milne pe yahan function add karo
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
      // TODO: HilltopAds zone ID milne pe yahan function add karo
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
      // TODO: Clickadu zone ID milne pe yahan function add karo
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
