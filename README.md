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
| 🏠 Home | `Home.jsx` | ✅ Done | Balance, daily tasks, quick actions, check-in section |
| 📅 Daily Check-in | `DailyCheckIn.jsx` | ✅ Done | 7-day streak system, roz coins, IST midnight reset |
| 🎮 Games | `Games.jsx` | ✅ Done | Spin Wheel (5x/day), Scratch Card (3x/day), Coin Flip (10x/day) |
| 💰 Wallet | `Wallet.jsx` | ✅ Done | Balance, UPI withdrawal request, withdrawal history |
| 👤 Profile | `Profile.jsx` | ✅ Done | User info, referral stats, settings, FAQ link |
| 🛒 Store | `Store.jsx` | ✅ Done | Coins se products/recharge kharido |
| 👥 Referral | `Referral.jsx` | ✅ Done | Referral link share karo, +50 coins per referral |
| 🎁 Bonus Code | `BonusCode.jsx` | ✅ Done | Special codes redeem karo — Firestore anti-cheat |
| 🔔 Notifications | `Notifications.jsx` | ✅ Done | App notifications, read/unread, mark all read |
| ❓ FAQ / Help | `FAQ.jsx` | ✅ Done | Search + category filter ke saath help center |

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
│   ├── pages/          → Har page ka alag JSX file (12 pages)
│   ├── components/     → Shared components (BottomNav)
│   ├── styles/         → Har page ka alag CSS file + global.css
│   ├── context/        → AppContext.jsx — global state (user, balance, streak)
│   ├── lib/            → firebase.js — Firestore connection
│   ├── App.jsx         → Routes setup + SessionGuard
│   └── main.jsx        → Entry point + bfcache fix
├── public/             → favicon.svg, icons.svg
├── .github/workflows/  → Firebase auto-deploy CI/CD
├── .firebaserc         → Firebase project ID
├── firebase.json       → Hosting config (rewrites, cache headers)
├── vite.config.js      → Vite config (port 5000, version plugin)
├── package.json        → Dependencies
└── pnpm-lock.yaml      → Exact versions locked
```

---

## 🚀 Local mein run karo (Testing)

```bash
# Packages install karo
pnpm install

# Dev server start karo (port 5000)
pnpm run dev
```

> App chal raha hai: `http://localhost:5000`

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

## 💡 Key Features

- **Anti-Cheat:** Bonus codes aur referrals Firestore mein track hote hain — localStorage se bypass nahi ho sakta
- **bfcache Fix:** Telegram WebView back button bug ke liye 3-layer fix (pageshow + version.json + activated event)
- **IST Timezone:** Sab daily resets Indian Standard Time ke hisab se hote hain (midnight 12:00 IST)
- **Mobile-First UI:** Max 430px width — website hai lekin bilkul app jaisa dikhta hai

---

Made with ❤️ in India 🇮🇳
