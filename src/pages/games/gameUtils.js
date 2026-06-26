import { NET_COOLDOWN_MS } from './adNetworks';

/* ── LEGACY daily-reset helpers (still used by AppContext sync) ── */
function getTodayKey() {
  const istMs = Date.now() + 5.5 * 60 * 60 * 1000;
  return new Date(istMs).toISOString().split('T')[0];
}
function getUsed(k)  { return parseInt(localStorage.getItem(`smb_game_${k}_${getTodayKey()}`) || '0'); }
function incUsed(k)  { localStorage.setItem(`smb_game_${k}_${getTodayKey()}`, String(getUsed(k) + 1)); }

/* ── NETWORK-BASED 4-HOUR system ── */
function _nk(netId, gameType) { return `smb_net_${netId}_${gameType}`; }

function _getNS(netId, gameType) {
  try { return JSON.parse(localStorage.getItem(_nk(netId, gameType)) || '{}'); }
  catch { return {}; }
}

function getNetUsed(netId, gameType) {
  const { count = 0, startTs = 0 } = _getNS(netId, gameType);
  return Date.now() - startTs >= NET_COOLDOWN_MS ? 0 : count;
}

function incNetUsed(netId, gameType) {
  const { count = 0, startTs = 0 } = _getNS(netId, gameType);
  const now     = Date.now();
  const expired = now - startTs >= NET_COOLDOWN_MS;
  localStorage.setItem(_nk(netId, gameType),
    JSON.stringify({ count: expired ? 1 : count + 1, startTs: expired ? now : startTs }));
}

function getNetTimeLeft(netId, gameType) {
  const { count = 0, startTs = 0 } = _getNS(netId, gameType);
  if (!count) return 0;
  const left = NET_COOLDOWN_MS - (Date.now() - startTs);
  return left > 0 ? left : 0;
}

function fmtMs(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

export { getTodayKey, getUsed, incUsed, getNetUsed, incNetUsed, getNetTimeLeft, fmtMs };
