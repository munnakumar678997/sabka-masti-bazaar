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
  // Zone ID yahan add karo jab Adsterra se milega:
  // window['adsterraShow'] ya unka specific function
  {
    id:      'ADT',
    name:    'Adsterra',
    color:   '#0ea5e9',
    bg:      'rgba(14,165,233,0.15)',
    border:  'rgba(14,165,233,0.45)',
    enabled: true,
    show: async () => {
      // TODO: Adsterra zone ID milne pe yahan function add karo
      // Example: const fn = window['adsterraZoneXXXXX'];
      // if (typeof fn === 'function') await fn();
      await new Promise(res => setTimeout(res, 800));
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
