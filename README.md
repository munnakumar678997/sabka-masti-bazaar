# 🎪 Sabka Masti Bazaar

> **Khelo • Jeeto • Kamao** — Desh ka sabse mast earning app! 🇮🇳

## 📱 App ke baare mein

**Sabka Masti Bazaar** ek desi earning web app hai jo bilkul mobile app jaisa dikhta aur feel karta hai. Yeh app Telegram ke saath tightly integrated hai — Telegram Mini App ke andar kaam karta hai. Users daily tasks karke, games khelke, aur referrals se coins kamate hain jo UPI pe withdraw kar sakte hain.

**100 Coins = ₹1 | Minimum Withdrawal: 500 Coins (₹5)**

---

## ✨ Pages / Features

| Page | File | Status | Kaam kya karta hai |
|------|------|--------|-------------------|
| 🎪 Loading / Splash | `Loading.jsx` | ✅ Done | Animated splash screen, user auth check, session setup |
| 🔐 Login | `Login.jsx` | ✅ Done | Telegram Mini App auto-login + mobile number verify |
| 🏠 Home | `Home.jsx` | ✅ Done | Balance, daily tasks (action-gated), quick actions, check-in |
| 📅 Daily Check-in | `DailyCheckIn.jsx` | ✅ Done | 7-day streak system, roz coins, IST midnight reset |
| 🎮 Games | `games/index.jsx` | ✅ Done | Spin Wheel, Scratch Card, Coin Flip — 4-network ad system |
| 💰 Wallet | `Wallet.jsx` | ✅ Done | Balance, UPI withdrawal request, withdrawal history |
| 👤 Profile | `Profile.jsx` | ✅ Done | User info, referral stats, settings, FAQ link |
| 🛒 Store | `store/index.jsx` | ✅ Done | Coins se products/recharge kharido |
| 👥 Referral | `Referral.jsx` | ✅ Done | Referral link share karo, +50 coins per referral |
| 🎁 Bonus Code | `BonusCode.jsx` | ✅ Done | Special codes redeem karo — Firestore anti-cheat |
| 🔔 Notifications | `Notifications.jsx` | ✅ Done | App notifications, read/unread, mark all read |
| ❓ FAQ / Help | `FAQ.jsx` | ✅ Done | Search + category filter ke saath help center |

---

## 🎮 Games — 4-Network Ad System

Games page pe **4 Ad Network Zones** hain. Har zone pe alag-alag 3 plays milte hain, 4 ghante ka cooldown hota hai.

### Ad Network Codes (Developer Reference)

| UI Label | Code | Full Name | Description |
|----------|------|-----------|-------------|
| 🔥 MG | `mg` | **Monetag** | High CPM push + interstitial network |
| ⚡ PA | `pa` | **PropellerAds** | Global push + pop-under network |
| 💎 AS | `as` | **Adsterra** | Premium display + native ad network |
| 🌟 EZ | `ez` | **Ezoic** | AI-powered optimization ad platform |

> **Note:** UI pe sirf short codes (MG, PA, AS, EZ) dikhte hain — users ko full network name pata nahi chalta. Yeh intentional hai. Developer aur owner ko reference ke liye yeh table hai.

### Ad Slot Integration

Jab tumhara ad network account ready ho, `src/pages/games/AdWatchOverlay.jsx` mein yeh jagah pe real ad script daalna hai:

```jsx
{/* ══ AD SLOT ══ Real ad script yahaan replace karna ══ */}
<div className="ad-slot-box" id={`ad-slot-${network.id}`}>
  {/* network.id = "mg" | "pa" | "as" | "ez" */}
  {/* Yahan apna ad network script/component paste karo */}
</div>
```

### Game Limits

```
Har network zone mein:
  - Spin Wheel:   3 plays / 4 hours
  - Scratch Card: 3 plays / 4 hours (har card ke liye alag ad)
  - Coin Flip:    3 plays / 4 hours

Total plays per zone: 9 plays
Total zones: 4 (MG + PA + AS + EZ)
Total max plays: 36 plays per 4 hours
```

---

## ⚡ Earning Tasks — Action-Gated System

Home page pe 5 tasks hain. Ab har task mein **actual action required** hai — sirf button dabane se coins nahi milenge.

| Task | Action Required | Wait Time | Coins |
|------|----------------|-----------|-------|
| 📺 Video dekho | 10-second timer dekho | 10s | +5 🪙 |
| 📲 App install karo | App link kholo + wait | 15s | +20 🪙 |
| 🔗 Link share karo | Web Share / Clipboard copy | — | +10 🪙 |
| 📝 Survey bharo | Survey kholo + wait | 30s | +15 🪙 |
| 👥 Friend ko refer karo | Referral page pe jao | — | +50 🪙 |

> **Note:** Task links (App install URL, Survey URL) `src/pages/Home.jsx` ke `TASKS` array mein update karo jab real links available ho.

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Framework | React | 18.3.1 |
| Build Tool | Vite | 5.4.21 |
| Routing | React Router DOM | 6.30.4 |
| Backend / Database | Firebase (Firestore) | 10.14.1 |
| Hosting | Firebase Hosting | — |
| Package Manager | pnpm | 10.x |

---

## 📂 Folder Structure

```
sabka-masti-bazaar/
├── src/
│   ├── pages/
│   │   ├── games/
│   │   │   ├── index.jsx         → Games Hub — 4-network zone selector + game grid
│   │   │   ├── adNetworks.js     → Ad network config (MG/PA/AS/EZ codes, limits, colors)
│   │   │   ├── gameUtils.js      → Per-network play tracking + cooldown timers
│   │   │   ├── AdWatchOverlay.jsx → Ad-watching overlay (5s timer + ad slot placeholder)
│   │   │   ├── SpinWheel.jsx     → Spin wheel game (3 plays/network)
│   │   │   ├── ScratchCard.jsx   → Scratch card game (3 individual cards/network)
│   │   │   └── CoinFlip.jsx      → Coin flip game (3 flips/network)
│   │   ├── store/
│   │   │   ├── index.jsx         → Store page
│   │   │   └── ProductModal.jsx  → Product detail modal
│   │   ├── Home.jsx              → Home + Earning Tasks (action-gated)
│   │   ├── DailyCheckIn.jsx      → 7-day streak check-in
│   │   ├── Wallet.jsx            → Wallet + withdrawal
│   │   ├── Profile.jsx           → User profile
│   │   ├── Referral.jsx          → Referral system
│   │   ├── BonusCode.jsx         → Bonus code redemption
│   │   ├── Notifications.jsx     → Notification center
│   │   ├── FAQ.jsx               → Help / FAQ
│   │   ├── Login.jsx             → Auth page
│   │   └── Loading.jsx           → Splash screen
│   ├── components/
│   │   └── BottomNav.jsx         → Bottom navigation bar
│   ├── styles/                   → Har page ka alag CSS file + global.css
│   ├── context/
│   │   └── AppContext.jsx        → Global state (user, balance, streak, tasks)
│   ├── lib/
│   │   └── firebase.js           → Firestore connection
│   ├── App.jsx                   → Routes setup + SessionGuard
│   └── main.jsx                  → Entry point + bfcache fix
├── public/                       → favicon.svg, icons.svg
├── .github/workflows/            → Firebase auto-deploy CI/CD
├── .firebaserc                   → Firebase project ID
├── firebase.json                 → Hosting config (rewrites, cache headers)
├── vite.config.js                → Vite config (port 5000, version plugin)
├── package.json                  → Dependencies
└── pnpm-lock.yaml                → Exact versions locked
```

---

## 🚀 Naye Developer ke liye — Quick Setup

Agar tum is repo ko apne Replit account mein import kar rahe ho:

### 1. Packages install karo
```bash
pnpm install
```

### 2. Firebase setup karo
`src/lib/firebase.js` mein apna Firebase config daalo:
```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  // ...
};
```

### 3. Dev server start karo
```bash
pnpm run dev
# App: http://localhost:5000
```

### 4. Ad Networks setup karo
- **Monetag** (MG): [monetag.com](https://monetag.com) — Account banao, ad zone ID lo
- **PropellerAds** (PA): [propellerads.com](https://propellerads.com) — Publisher account, zone setup
- **Adsterra** (AS): [adsterra.com](https://adsterra.com) — Publisher signup, ad code lo
- **Ezoic** (EZ): [ezoic.com](https://ezoic.com) — Site verification + ad setup

Real ad script `src/pages/games/AdWatchOverlay.jsx` mein `ad-slot-{network.id}` div ke andar daalo.

---

## 🔧 Production build karo

```bash
pnpm run build
# dist/ folder ban jaayega — Firebase pe yahi upload hota hai
```

---

## 🚀 Deploy Pipeline (Auto)

```
Replit mein code change karo
        ↓
GitHub pe push karo (git push)
        ↓
GitHub Actions automatically trigger hoga
        ↓
pnpm install → vite build → Firebase deploy
        ↓
Live: https://sabka-masti-bazaar-71333.web.app ✅
```

---

## 💡 Key Technical Details

- **Anti-Cheat:** Bonus codes aur referrals Firestore mein track hote hain — localStorage se bypass nahi ho sakta
- **bfcache Fix:** Telegram WebView back button bug ke liye 3-layer fix (pageshow + version.json + activated event)
- **IST Timezone:** Sab daily resets Indian Standard Time ke hisab se hote hain (midnight 12:00 IST)
- **Mobile-First UI:** Max 430px width — website hai lekin bilkul app jaisa dikhta hai
- **Ad Network Cooldown:** LocalStorage-based per-network, per-game, per-device tracking (4-hour reset)
- **Task Action Gates:** Har task mein actual action required hai — timer/share/link — sirf click se coins nahi milte

---

Made with ❤️ in India 🇮🇳
