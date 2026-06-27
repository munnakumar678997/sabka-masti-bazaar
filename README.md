# 🎪 Sabka Masti Bazaar

<div align="center">

**Khelo • Jeeto • Kamao** — Desh ka sabse mast earning app! 🇮🇳

[![Live App](https://img.shields.io/badge/🚀_Live_App-Firebase-orange?style=for-the-badge)](https://sabka-masti-bazaar-71333.web.app)
[![React](https://img.shields.io/badge/React-18.3-blue?style=for-the-badge&logo=react)](https://react.dev)
[![Firebase](https://img.shields.io/badge/Firebase-10.14-yellow?style=for-the-badge&logo=firebase)](https://firebase.google.com)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple?style=for-the-badge&logo=vite)](https://vitejs.dev)

</div>

---

## 📱 App Overview

**Sabka Masti Bazaar** ek desi earning web app hai jo bilkul **mobile app** jaisa dikhta aur feel karta hai. Yeh Telegram Mini App ke andar bhi kaam karta hai. Users:

- ✅ **Daily tasks** karke coins kamate hain
- ✅ **Daily check-in** streak se bonus coins paate hain
- ✅ **Referrals** se per-invite earnings kamate hain
- ✅ **Bonus codes** redeem karke extra coins paate hain
- ✅ **UPI / Store** pe coins withdraw / spend karte hain
- 🔜 **Games** — jald aa rahe hain!

> **Conversion Rate:** `100 Coins = ₹1` | **Minimum Withdrawal:** `500 Coins (₹5)`

---

## 🛠️ Tech Stack

| Layer | Technology | Version | Use |
|-------|-----------|---------|-----|
| **Frontend** | React | 18.3.1 | UI components |
| **Build Tool** | Vite | 5.4.21 | Fast dev + prod build |
| **Routing** | React Router DOM | 6.30.4 | Page navigation |
| **Database** | Firebase Firestore | 10.14.1 | Users, coins, history |
| **Hosting** | Firebase Hosting | — | Production deployment |
| **Auth** | Telegram OAuth / Mini App | — | Login system |

---

## 📂 Folder Structure

```
sabka-masti-bazaar/
│
├── 📁 src/
│   ├── 📁 pages/               → Har page ka alag JSX file
│   │   ├── 📁 games/
│   │   │   └── index.jsx       → Games Coming Soon placeholder
│   │   ├── 📁 store/
│   │   │   ├── index.jsx       → Store page
│   │   │   ├── ProductModal.jsx → Product detail modal
│   │   │   └── storeData.js    → Products ka data
│   │   ├── 📁 tasks/
│   │   │   ├── index.jsx       → Earning Tasks section
│   │   │   └── TaskActionModal.jsx → Ad-gated task reward modal
│   │   ├── Home.jsx            → Home + balance + tasks
│   │   ├── DailyCheckIn.jsx    → 7-day streak check-in
│   │   ├── Wallet.jsx          → Balance + UPI withdrawal
│   │   ├── Profile.jsx         → User profile + stats
│   │   ├── Referral.jsx        → Referral system + milestones
│   │   ├── BonusCode.jsx       → Bonus code redemption
│   │   ├── Notifications.jsx   → Notification center
│   │   ├── FAQ.jsx             → Help center + search
│   │   ├── Login.jsx           → Telegram auth page
│   │   └── Loading.jsx         → Splash screen + session check
│   │
│   ├── 📁 components/
│   │   └── BottomNav.jsx       → Bottom navigation (5 tabs)
│   │
│   ├── 📁 styles/              → Har page ka alag CSS file
│   │   ├── global.css          → Body, #app-root, mobile frame
│   │   ├── shared.css          → Shared animations + utilities
│   │   ├── bottomNav.css       → Bottom navigation styles
│   │   ├── home.css            → Home page styles
│   │   ├── loading.css         → Splash screen styles
│   │   ├── wallet.css          → Wallet page styles
│   │   ├── profile.css         → Profile page styles
│   │   ├── store.css           → Store page styles
│   │   ├── tasks.css           → Tasks + modal styles
│   │   ├── dailyCheckIn.css    → Check-in component styles
│   │   ├── bonusCode.css       → Bonus code page styles
│   │   ├── notifications.css   → Notifications page styles
│   │   ├── referral.css        → Referral page styles
│   │   └── faq.css             → FAQ page styles
│   │
│   ├── 📁 context/
│   │   ├── AppContext.jsx      → Global state (user, balance, streak)
│   │   └── 📁 services/
│   │       ├── bonusService.js → Bonus code logic (Firestore)
│   │       ├── notifService.js → Notification CRUD (Firestore)
│   │       └── walletService.js → Orders + withdrawals (Firestore)
│   │
│   ├── 📁 lib/
│   │   └── firebase.js         → Firestore connection
│   │
│   ├── App.jsx                 → Routes + SessionGuard
│   └── main.jsx                → Entry point + bfcache fix
│
├── 📁 public/
│   ├── favicon.svg             → App icon
│   └── manifest.json           → PWA manifest
│
├── 📁 .github/workflows/       → CI/CD pipeline (auto Firebase deploy)
│
├── index.html                  → Root HTML + ad network meta tags
├── vite.config.js              → Port 5000, version plugin
├── firebase.json               → Hosting config + cache headers
├── package.json                → Dependencies
└── pnpm-lock.yaml              → Locked versions
```

---

## 📄 Pages & Features

| # | Page | File | Status | Description |
|---|------|------|--------|-------------|
| 1 | 🎪 Splash Screen | `Loading.jsx` | ✅ Live | Animated splash, session check, Telegram auth |
| 2 | 🔐 Login | `Login.jsx` | ✅ Live | Telegram Mini App + Web widget login |
| 3 | 🏠 Home | `Home.jsx` | ✅ Live | Balance card, quick stats, tasks, check-in |
| 4 | 📅 Daily Check-in | `DailyCheckIn.jsx` | ✅ Live | 7-day streak, IST midnight reset, bonus coins |
| 5 | 🎮 Games | `games/index.jsx` | 🔜 Coming Soon | Placeholder with countdown timer |
| 6 | 💰 Wallet | `Wallet.jsx` | ✅ Live | Balance, UPI withdrawal, history |
| 7 | 👤 Profile | `Profile.jsx` | ✅ Live | User info, stats, referral code, settings |
| 8 | 🛒 Store | `store/index.jsx` | ✅ Live | Coins se products + recharge kharido |
| 9 | 👥 Referral | `Referral.jsx` | ✅ Live | Referral link, +50 coins/invite, milestones |
| 10 | 🎟️ Bonus Code | `BonusCode.jsx` | ✅ Live | Special codes redeem — Firestore anti-cheat |
| 11 | 🔔 Notifications | `Notifications.jsx` | ✅ Live | Real-time notifications, read/unread status |
| 12 | ❓ FAQ / Help | `FAQ.jsx` | ✅ Live | Search + category filter, contact support |

---

## ⚡ Earning Tasks — Action-Gated System

Tasks pe sirf click karne se coins nahi milte — **actual action required** hai.

| Task | Category | Reset | Action Required | Coins |
|------|----------|-------|-----------------|-------|
| 📺 Video Ad dekho | Daily | Midnight IST | 10s timer | +5 🪙 |
| 🎬 Bonus Video dekho | Daily | Midnight IST | 10s timer | +10 🪙 |
| 📝 Survey bharo | Daily | Midnight IST | Survey link + 30s | +15 🪙 |
| 🔗 App share karo | Daily | Midnight IST | Web Share API | +8 🪙 |
| 🔥 Ad Zone 1 | 4-Hour | Every 4h | 10s ad watch | +5 🪙 |
| 💎 Ad Zone 2 | 4-Hour | Every 4h | 10s ad watch | +8 🪙 |
| ⚡ Ad Zone 3 | 4-Hour | Every 4h | 10s ad watch | +6 🪙 |
| 💰 Bonus Ad | 4-Hour | Every 4h | 10s ad watch | +12 🪙 |
| 🎯 Lucky Ad | 4-Hour | Every 4h | 10s ad watch | +10 🪙 |

> **Total daily potential:** `~314 coins/day` from tasks alone

---

## 🔮 Games — Coming Soon

> Games section abhi development mein hai. Placeholder page active hai countdown timer ke saath.

**Planned Games:**

| Game | Type | Reward | Ad Requirement |
|------|------|--------|---------------|
| 🎰 Spin Wheel | Luck-based | 5–50 🪙 | 1 ad per spin |
| 🃏 Scratch Card | Reveal | 3–30 🪙 | 1 ad per card |
| 🪙 Coin Flip | 50/50 | 2x bet | 1 ad per flip |
| 🎯 Lucky Zone | Skill+Luck | 10–100 🪙 | 1 ad per play |

---

## 📣 Ad Networks — Verification Tags

`index.html` mein yeh verification meta tags hain — **delete mat karna**:

| Network | Meta Tag | Status |
|---------|----------|--------|
| 🔥 Monetag | `name="monetag"` | ✅ Verified |
| 💰 PopCash | `name="ppck-ver"` | ✅ Verified |
| ⚡ Clickadu | `name="clckd"` | ✅ Verified |
| 🏔️ HilltopAds | `name="f0eb1f43..."` | ✅ Verified |

> **Monetag SDK** bhi `index.html` mein load hota hai (`//libtl.com/sdk.js`)

---

## 🚀 CI/CD Deploy Pipeline

```
Replit mein code edit karo
        ↓
GitHub pe push karo
        ↓
GitHub Actions auto-trigger → (.github/workflows/)
        ↓
pnpm install → vite build → Firebase deploy
        ↓
✅ Live: https://sabka-masti-bazaar-71333.web.app
```

---

## 💡 Key Technical Features

| Feature | Implementation |
|---------|---------------|
| **Anti-Cheat** | Bonus codes + tasks Firestore mein track — localStorage bypass impossible |
| **bfcache Fix** | 4-layer fix: `pageshow` + `visibilitychange` + Telegram events + `version.json` |
| **IST Timezone** | Sab daily resets Indian Standard Time pe (midnight 12:00 IST = 18:30 UTC) |
| **Mobile-First UI** | Max `430px` width, `min-height: 100dvh`, `#app-root` container |
| **SessionGuard** | Bina login ke koi bhi page direct nahi khulta — `/loading` pe redirect |
| **Optimistic UI** | Coins instantly update (local), Firestore mein async save hota hai |
| **Referral Milestones** | `runTransaction` se race-condition safe: 1→+50, 5→+500, 10→+1200 coins bonus |

---

## ⚙️ Local Development Setup

```bash
# 1. Dependencies install karo
pnpm install

# 2. Dev server start karo (port 5000)
pnpm run dev

# 3. Production build test karo
pnpm run build
```

**Firebase config** → `src/lib/firebase.js` mein apna project ID daalo

---

<div align="center">

Made with ❤️ in India 🇮🇳 | **Sabka Masti Bazaar** © 2026

</div>
