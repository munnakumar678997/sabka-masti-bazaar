function getTodayKey() {
  const istMs = Date.now() + 5.5 * 60 * 60 * 1000;
  return new Date(istMs).toISOString().split('T')[0];
}
function getUsed(k)  { return parseInt(localStorage.getItem(`smb_game_${k}_${getTodayKey()}`) || '0'); }
function incUsed(k)  { localStorage.setItem(`smb_game_${k}_${getTodayKey()}`, String(getUsed(k) + 1)); }

export { getTodayKey, getUsed, incUsed };
