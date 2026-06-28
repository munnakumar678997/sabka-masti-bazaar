/**
 * ============================================================
 *  AD OVERLAY — In-App Fullscreen Ad Viewer
 * ============================================================
 *
 *  Social Bar format ke liye DIRECT page injection approach:
 *  - Script seedha document <head> mein inject hota hai
 *  - Social Bar ke floating notifications PAGE pe appear hote hain
 *  - Fullscreen overlay pe timer dikhta hai
 *  - Ads overlay ke UPAR float karte hain (natural Social Bar behavior)
 *  - Ad immediately load hona shuru hota hai — timer ke saath
 *
 * ============================================================
 */

// Already injected scripts track karne ke liye
const _injectedSrcs = new Set();

/**
 * Script seedha document head mein inject karo.
 * Ek baar inject ho toh dobara nahi hoga.
 */
function injectScript(src) {
  if (!src || _injectedSrcs.has(src)) return;
  _injectedSrcs.add(src);
  const s = document.createElement('script');
  s.src   = src;
  s.async = true;
  document.head.appendChild(s);
}

/**
 * Fullscreen in-app ad overlay dikhao.
 *
 * - Script TURANT inject hota hai (delay nahi)
 * - Social Bar ads page pe float karte hain overlay ke upar
 * - Timer ke baad "Continue" button enable hota hai
 *
 * @param {Object} opts
 * @param {string} opts.scriptSrc  - Social Bar script URL
 * @param {number} opts.timerSecs  - Countdown (default: 15)
 * @param {string} opts.title      - Overlay ka title
 */
export function showAdOverlay({
  scriptSrc  = '',
  timerSecs  = 15,
  title      = 'Ad Dekho, Reward Pao!',
} = {}) {
  return new Promise((resolve) => {

    // ── STEP 1: Script TURANT inject karo ─────────────────────
    // Pehle inject, baad mein overlay dikhao
    // Isse script network se load hona shuru ho jaata hai immediately
    if (scriptSrc) injectScript(scriptSrc);

    // ── STEP 2: Fullscreen overlay banao ──────────────────────
    const overlay = document.createElement('div');
    overlay.id = 'smb-ad-overlay';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 9000;
      background: rgba(5, 5, 15, 0.93);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 0;
      box-sizing: border-box;
      font-family: "Segoe UI", system-ui, sans-serif;
      overflow: hidden;
    `;

    // ── Header section ─────────────────────────────────────────
    const headerWrap = document.createElement('div');
    headerWrap.style.cssText = `
      width: 100%;
      padding: 18px 20px 14px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      background: rgba(255,255,255,0.04);
      border-bottom: 1px solid rgba(255,255,255,0.07);
      flex-shrink: 0;
    `;

    const titleEl = document.createElement('div');
    titleEl.textContent = title;
    titleEl.style.cssText = `
      color: #fff;
      font-size: 17px;
      font-weight: 800;
      letter-spacing: 0.2px;
    `;

    const subEl = document.createElement('div');
    subEl.textContent = 'Ad dekho aur reward lo!';
    subEl.style.cssText = `
      color: rgba(255,255,255,0.45);
      font-size: 12px;
    `;

    headerWrap.appendChild(titleEl);
    headerWrap.appendChild(subEl);

    // ── Middle section — timer + ad area ──────────────────────
    const middleWrap = document.createElement('div');
    middleWrap.style.cssText = `
      flex: 1;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 24px;
      padding: 24px 20px;
      box-sizing: border-box;
    `;

    // Ad loading message
    const adInfoEl = document.createElement('div');
    adInfoEl.style.cssText = `
      text-align: center;
      color: rgba(255,255,255,0.35);
      font-size: 12px;
      letter-spacing: 0.3px;
      line-height: 1.5;
    `;
    adInfoEl.innerHTML = `
      <div style="font-size:28px; margin-bottom:8px;">📱</div>
      <div>Ads oopar floating karenge</div>
      <div style="margin-top:3px; color:rgba(255,255,255,0.2);">Inhe dismiss mat karo</div>
    `;

    // Timer circle
    let remaining = timerSecs;
    const timerCircle = document.createElement('div');
    timerCircle.style.cssText = `
      width: 90px;
      height: 90px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0ea5e9, #0284c7);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 32px rgba(14,165,233,0.4), inset 0 1px 0 rgba(255,255,255,0.2);
      flex-shrink: 0;
    `;

    const timerNum = document.createElement('div');
    timerNum.textContent = remaining;
    timerNum.style.cssText = `
      font-size: 32px;
      font-weight: 900;
      color: #fff;
      line-height: 1;
    `;

    const timerLabel = document.createElement('div');
    timerLabel.textContent = 'sec';
    timerLabel.style.cssText = `
      font-size: 10px;
      font-weight: 600;
      color: rgba(255,255,255,0.7);
      letter-spacing: 1px;
      text-transform: uppercase;
    `;

    timerCircle.appendChild(timerNum);
    timerCircle.appendChild(timerLabel);

    middleWrap.appendChild(adInfoEl);
    middleWrap.appendChild(timerCircle);

    // ── Bottom section — continue button ──────────────────────
    const bottomWrap = document.createElement('div');
    bottomWrap.style.cssText = `
      width: 100%;
      padding: 16px 20px 24px;
      box-sizing: border-box;
      flex-shrink: 0;
    `;

    const continueBtn = document.createElement('button');
    continueBtn.style.cssText = `
      width: 100%;
      padding: 16px 24px;
      border-radius: 14px;
      border: none;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s ease;
      letter-spacing: 0.2px;
    `;

    const setBtnLocked = (secs) => {
      continueBtn.textContent = `⏳ ${secs}s mein continue karo`;
      continueBtn.style.background = 'rgba(255,255,255,0.08)';
      continueBtn.style.color = 'rgba(255,255,255,0.35)';
      continueBtn.style.pointerEvents = 'none';
      continueBtn.style.boxShadow = 'none';
    };

    const setBtnUnlocked = () => {
      continueBtn.textContent = '✅ Continue & Reward Lo!';
      continueBtn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
      continueBtn.style.color = '#fff';
      continueBtn.style.pointerEvents = 'auto';
      continueBtn.style.boxShadow = '0 4px 20px rgba(34,197,94,0.5)';
    };

    setBtnLocked(remaining);

    const done = () => {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.25s';
      setTimeout(() => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        resolve();
      }, 260);
    };

    continueBtn.addEventListener('click', done);
    bottomWrap.appendChild(continueBtn);

    // ── Assemble overlay ───────────────────────────────────────
    overlay.appendChild(headerWrap);
    overlay.appendChild(middleWrap);
    overlay.appendChild(bottomWrap);
    document.body.appendChild(overlay);

    // ── Countdown ──────────────────────────────────────────────
    const tick = setInterval(() => {
      remaining -= 1;
      timerNum.textContent = Math.max(0, remaining);

      if (remaining <= 0) {
        clearInterval(tick);
        timerNum.textContent = '✓';
        timerLabel.textContent = '';
        timerCircle.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
        timerCircle.style.boxShadow  = '0 0 32px rgba(34,197,94,0.5)';
        setBtnUnlocked();
      } else {
        setBtnLocked(remaining);
      }
    }, 1000);

    // Safety: 45s pe auto-resolve
    setTimeout(() => {
      clearInterval(tick);
      remaining = 0;
      done();
    }, 45_000);
  });
}
