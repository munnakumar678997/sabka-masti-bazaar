# Sabka Masti Bazaar — Complete Project Guide

Yeh ek **desi earning web app** hai jiska naam hai "Sabka Masti Bazaar".
Website pe bana hai lekin interface bilkul **mobile app jaisa** hai.

---

## App ke baare mein

| Field | Detail |
|-------|--------|
| **App Name** | Sabka Masti Bazaar |
| **Tagline** | Khelo • Jeeto • Kamao |
| **Type** | Earning app (desi style) |
| **Interface** | Website hai lekin mobile app jaisa dikhta hai |
| **Coin Rate** | 100 Coins = ₹1 |
| **Min Withdrawal** | 500 Coins (₹5) |
| **Live URL** | https://sabka-masti-bazaar-71333.web.app |
| **GitHub** | https://github.com/munnakumar678997/sabka-masti-bazaar |

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React + Vite | React 18.3, Vite 5.4 |
| **Routing** | React Router DOM | 6.30.4 |
| **Database** | Firebase Firestore | 10.14.1 |
| **Hosting** | Firebase Hosting | — |
| **Auth** | Telegram Mini App / OAuth Widget | — |
| **Package Manager** | pnpm | 10.x |

> **Backend = Firebase only.** Supabase use nahi ho raha. Firebase Firestore hi primary database hai.

---

## Folder Structure

```
src/
  pages/        → Har page ka alag JSX file
    games/      → Games folder (abhi Coming Soon placeholder)
    store/      → Store page + ProductModal + storeData
    tasks/      → TaskSection + TaskActionModal
  components/   → Shared components (BottomNav.jsx)
  styles/       → Har page ka alag CSS file
    global.css  → Body + #app-root mobile frame
    shared.css  → Common @keyframes animations + utility classes
  context/
    AppContext.jsx       → Global state (user, balance, streak, tasks)
    services/
      bonusService.js    → Bonus code Firestore logic
      notifService.js    → Notification CRUD
      walletService.js   → Orders + withdrawals
  lib/
    firebase.js → Firestore connection
  App.jsx       → Routing setup + SessionGuard
  main.jsx      → Entry point + 4-layer bfcache fix
```

### File Rules:
- Har **page** ke liye alag `.jsx` file — `src/pages/` mein
- Har **page ke CSS** ke liye alag `.css` file — `src/styles/` mein
- Games folder ke liye CSS: `src/pages/games/games.css` (alag folder-level CSS)

---

## Mobile App Jaisa UI

```css
#app-root {
  max-width: 430px;   /* Mobile width */
  margin: 0 auto;     /* Center mein */
  min-height: 100vh;
}
body {
  background: #d0d0d0; /* Baaki screen grey */
}
```

- Koi bhi page `max-width: 430px` ke bahar nahi jaana chahiye
- Sab pages `#app-root` ke andar render hote hain (App.jsx mein set hai)

---

## Pages — Current Status

| Page | File | Status | Notes |
|------|------|--------|-------|
| 🎪 Splash Screen | `pages/Loading.jsx` | ✅ Live | Session check + Telegram auth |
| 🔐 Login | `pages/Login.jsx` | ✅ Live | Mini App + Web widget |
| 🏠 Home | `pages/Home.jsx` | ✅ Live | Balance + tasks + check-in |
| 📅 Daily Check-in | `pages/DailyCheckIn.jsx` | ✅ Live | 7-day streak, IST midnight reset |
| 🎮 Games | `pages/games/index.jsx` | 🔜 Coming Soon | Countdown timer placeholder |
| 💰 Wallet | `pages/Wallet.jsx` | ✅ Live | UPI withdrawal + history |
| 👤 Profile | `pages/Profile.jsx` | ✅ Live | User info + referral code |
| 🛒 Store | `pages/store/index.jsx` | ✅ Live | Coins se products kharido |
| 👥 Referral | `pages/Referral.jsx` | ✅ Live | +50 coins/referral + milestones |
| 🎟️ Bonus Code | `pages/BonusCode.jsx` | ✅ Live | Firestore anti-cheat codes |
| 🔔 Notifications | `pages/Notifications.jsx` | ✅ Live | Read/unread + mark all |
| ❓ FAQ / Help | `pages/FAQ.jsx` | ✅ Live | Search + category filter |

---

## 🎮 Games — Coming Soon

Games section abhi development mein hai. `games/index.jsx` mein countdown timer placeholder hai.

**Planned games:**
- 🎰 Spin Wheel
- 🃏 Scratch Card
- 🪙 Coin Flip
- 🎯 Lucky Zone

**Launch date:** `LAUNCH_DATE` variable `src/pages/games/index.jsx` mein update karo.

---

## 📣 Ad Networks — Verification Tags (index.html)

Yeh tags `index.html` ke `<head>` mein hain — **delete mat karna** — websites verified hain:

| Network | Status |
|---------|--------|
| 🔥 Monetag (`name="monetag"`) | ✅ Verified |
| 💰 PopCash (`name="ppck-ver"`) | ✅ Verified |
| ⚡ Clickadu (`name="clckd"`) | ✅ Verified |
| 🏔️ HilltopAds (`name="f0eb1f43..."`) | ✅ Verified |

Monetag SDK bhi load hota hai: `<script src='//libtl.com/sdk.js' data-zone='11204152'>`

---

## ⚡ Earning Tasks — Action-Gated System

Sirf click se coins nahi milte — **actual action required**:

| Task | Reset | Action | Coins |
|------|-------|--------|-------|
| 📺 Video Ad dekho | Daily (midnight IST) | 10s timer | +5 🪙 |
| 🎬 Bonus Video | Daily (midnight IST) | 10s timer | +10 🪙 |
| 📝 Survey bharo | Daily (midnight IST) | Survey + 30s wait | +15 🪙 |
| 🔗 App share | Daily (midnight IST) | Web Share API | +8 🪙 |
| 🔥 Ad Zone 1 | Every 4 hours | 10s ad watch | +5 🪙 |
| 💎 Ad Zone 2 | Every 4 hours | 10s ad watch | +8 🪙 |
| ⚡ Ad Zone 3 | Every 4 hours | 10s ad watch | +6 🪙 |
| 💰 Bonus Ad | Every 4 hours | 10s ad watch | +12 🪙 |
| 🎯 Lucky Ad | Every 4 hours | 10s ad watch | +10 🪙 |

> Tasks config update karne ke liye: `src/pages/tasks/index.jsx` → `TASK_CATEGORIES` array

---

## Naya Page Kaise Add Karein

```
1. src/pages/PageName.jsx  banao
2. src/styles/pageName.css banao
3. src/App.jsx mein route add karo:
   <Route path="/page-name" element={<PageName />} />
```

---

## Development Server

```bash
npm run dev    # Port 5000 pe start hoga
npm run build  # Production build (dist/ folder)
```

- Workflow name: **"Start application"**
- **Replit sirf testing ke liye — live deploy Replit se NAHI karna**

---

## CI/CD Deploy Pipeline

```
Replit mein code change karo
        ↓
GitHub pe push karo
        ↓
GitHub Actions auto-trigger
        ↓
pnpm install → vite build → Firebase deploy
        ↓
Live: https://sabka-masti-bazaar-71333.web.app ✅
```

---

## User Preferences

- **Hinglish mein baat karo** (sabse important rule — hamesha)
- Suggestions bhi Hinglish mein: `**Aage, main X kar sakta hoon. Kya tum chahte ho?**`
- Mobile app jaisa UI hamesha — website hai lekin app feel
- Ek ek page banwata hoon — jaldi mat karo, user batayega
- File names samajh mein aane wale rakhna
- React + Vite — koi aur framework suggest mat karo jab tak user na bole
- **Sirf free tier use karna hai — koi paid subscription nahi**
- **Replit pe deploy mat karo — sirf test karo**
- Firebase = database + hosting. Supabase use nahi ho raha is project mein.
