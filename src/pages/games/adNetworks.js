/*
 * ══════════════════════════════════════════════════════════
 *  AD NETWORKS CONFIG
 *
 *  UI pe sirf short codes dikhte hain — full names yahan:
 *  🔥 MG  = Monetag        (monetag.com)
 *  💎 AS  = Adsterra       (adsterra.com)
 *  💰 PC  = PopCash        (popcash.net)
 *  ⚡ CK  = Clickadu       (clickadu.com)
 *  🏔️ HT  = HilltopAds    (hilltopads.com)
 * ══════════════════════════════════════════════════════════
 */
export const AD_NETWORKS = [
  { id: 'mg', label: '🔥 MG', color: '#ff6a00', grad: 'linear-gradient(135deg,#ff6a00,#ee0979)' },
  { id: 'as', label: '💎 AS', color: '#22c55e', grad: 'linear-gradient(135deg,#22c55e,#15803d)' },
  { id: 'pc', label: '💰 PC', color: '#a855f7', grad: 'linear-gradient(135deg,#a855f7,#7c3aed)' },
  { id: 'ck', label: '⚡ CK', color: '#0ea5e9', grad: 'linear-gradient(135deg,#0ea5e9,#0055aa)' },
  { id: 'ht', label: '🏔️ HT', color: '#f59e0b', grad: 'linear-gradient(135deg,#f59e0b,#b45309)' },
];

export const NET_LIMIT       = 3;
export const NET_COOLDOWN_MS = 4 * 60 * 60 * 1000;
