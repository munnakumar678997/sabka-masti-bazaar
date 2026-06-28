/**
 * ============================================================
 *  AD OVERLAY — In-App Fullscreen Ad Viewer
 * ============================================================
 *
 *  Yeh Monetag jaisa in-app ad overlay banata hai.
 *  Ad same page ke andar dikhta hai — koi naya tab nahi.
 *
 *  Usage:
 *    import { showAdOverlay } from './adOverlay';
 *    await showAdOverlay({ scriptSrc: 'https://...', timerSecs: 8 });
 *
 * ============================================================
 */

/**
 * In-app ad overlay dikhao.
 * Promise resolve hota hai jab:
 *   - Timer khatam ho (timerSecs seconds)
 *   - Ya user "Continue" button dabaaye
 *
 * @param {Object} opts
 * @param {string} opts.scriptSrc  - Ad script ka URL (e.g. Adsterra Social Bar)
 * @param {string} opts.scriptHtml - Raw HTML/script tags (alternative to scriptSrc)
 * @param {number} opts.timerSecs  - Countdown timer (default: 8)
 * @param {string} opts.title      - Overlay ka title
 */
export function showAdOverlay({
  scriptSrc  = '',
  scriptHtml = '',
  timerSecs  = 8,
  title      = 'Ad Dekho, Reward Pao!',
} = {}) {
  return new Promise((resolve) => {

    // ── Overlay backdrop ──────────────────────────────────────
    const overlay = document.createElement('div');
    overlay.id = 'smb-ad-overlay';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 99999;
      background: rgba(0,0,0,0.92);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: 20px 16px 24px;
      box-sizing: border-box;
      overflow: hidden;
      font-family: "Segoe UI", system-ui, sans-serif;
    `;

    // ── Header ───────────────────────────────────────────────
    const header = document.createElement('div');
    header.style.cssText = `
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      margin-bottom: 14px;
    `;

    const titleEl = document.createElement('div');
    titleEl.textContent = title;
    titleEl.style.cssText = `
      color: #fff;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.3px;
    `;

    const subEl = document.createElement('div');
    subEl.textContent = 'Neeche ka ad dekho, reward milega!';
    subEl.style.cssText = `
      color: rgba(255,255,255,0.55);
      font-size: 12px;
    `;

    header.appendChild(titleEl);
    header.appendChild(subEl);

    // ── Timer badge ───────────────────────────────────────────
    let remaining = timerSecs;

    const timerWrap = document.createElement('div');
    timerWrap.style.cssText = `
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0ea5e9, #0284c7);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 800;
      color: #fff;
      margin-bottom: 14px;
      box-shadow: 0 0 18px rgba(14,165,233,0.5);
      flex-shrink: 0;
    `;
    timerWrap.textContent = remaining;

    // ── Ad iframe container ───────────────────────────────────
    const iframeWrap = document.createElement('div');
    iframeWrap.style.cssText = `
      width: 100%;
      flex: 1;
      min-height: 200px;
      max-height: 420px;
      border-radius: 12px;
      overflow: hidden;
      background: #fff;
      position: relative;
    `;

    // Build iframe srcdoc with ad script injected
    const adScriptTag = scriptSrc
      ? `<script src="${scriptSrc}" async><\/script>`
      : scriptHtml || '';

    const iframeSrcdoc = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <base target="_blank">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html, body {
            width: 100%;
            min-height: 100%;
            background: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            padding: 12px;
            font-family: system-ui, sans-serif;
          }
          .ad-label {
            font-size: 11px;
            color: #94a3b8;
            margin-bottom: 10px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
        </style>
        ${adScriptTag}
      </head>
      <body>
        <div class="ad-label">Advertisement</div>
      </body>
      </html>
    `.trim();

    const iframe = document.createElement('iframe');
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowfullscreen', '');
    iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      display: block;
    `;

    // Loading placeholder
    const loadingDiv = document.createElement('div');
    loadingDiv.style.cssText = `
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 10px;
      background: #f8fafc;
      color: #64748b;
      font-size: 13px;
    `;
    loadingDiv.innerHTML = `
      <div style="width:28px;height:28px;border:3px solid #e2e8f0;border-top-color:#0ea5e9;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
      <span>Ad load ho raha hai...</span>
      <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
    `;

    iframeWrap.appendChild(loadingDiv);
    iframeWrap.appendChild(iframe);

    // Hide loading once iframe loads
    iframe.onload = () => {
      loadingDiv.style.opacity = '0';
      setTimeout(() => loadingDiv.remove(), 300);
    };

    // Set srcdoc after appending to DOM
    setTimeout(() => {
      iframe.srcdoc = iframeSrcdoc;
    }, 100);

    // ── Continue / Skip button ────────────────────────────────
    const continueBtn = document.createElement('button');
    continueBtn.style.cssText = `
      margin-top: 16px;
      padding: 14px 32px;
      border-radius: 12px;
      border: none;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      width: 100%;
      max-width: 320px;
      opacity: 0;
      pointer-events: none;
    `;

    const updateBtn = (secs) => {
      if (secs > 0) {
        continueBtn.textContent = `⏳ ${secs}s mein continue karo`;
        continueBtn.style.background = '#1e293b';
        continueBtn.style.color = 'rgba(255,255,255,0.5)';
        continueBtn.style.opacity = '1';
        continueBtn.style.pointerEvents = 'none';
      } else {
        continueBtn.textContent = '✅ Continue & Reward Lo!';
        continueBtn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
        continueBtn.style.color = '#fff';
        continueBtn.style.pointerEvents = 'auto';
        continueBtn.style.boxShadow = '0 4px 16px rgba(34,197,94,0.45)';
      }
    };

    updateBtn(remaining);

    const done = () => {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.25s';
      setTimeout(() => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        resolve();
      }, 260);
    };

    continueBtn.addEventListener('click', done);

    // ── Assemble overlay ──────────────────────────────────────
    overlay.appendChild(header);
    overlay.appendChild(timerWrap);
    overlay.appendChild(iframeWrap);
    overlay.appendChild(continueBtn);
    document.body.appendChild(overlay);

    // ── Countdown ─────────────────────────────────────────────
    const tick = setInterval(() => {
      remaining -= 1;
      timerWrap.textContent = Math.max(0, remaining);
      updateBtn(remaining);
      if (remaining <= 0) {
        clearInterval(tick);
        timerWrap.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
        timerWrap.style.boxShadow  = '0 0 18px rgba(34,197,94,0.5)';
        timerWrap.textContent = '✓';
      }
    }, 1000);

    // Safety timeout: 30s pe auto-resolve (ad blocker cases)
    setTimeout(() => {
      clearInterval(tick);
      remaining = 0;
      done();
    }, 30_000);
  });
}
