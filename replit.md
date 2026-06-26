# Sabka Masti Bazaar — Complete Project Guide

Yeh ek **desi earning web app** hai jiska naam hai "Sabka Masti Bazaar".
Website pe bana hai lekin interface bilkul **mobile app jaisa** hai.

---

## App ke baare mein
- **App Name:** Sabka Masti Bazaar
- **Tagline:** Khelo • Jeeto • Kamao
- **Type:** Earning app (desi style)
- **Interface:** Website hai lekin mobile app jaisa dikhta hai

---

## Tech Stack

### Frontend
- **React + Vite** — component-based modern framework
- **React Router DOM** — pages ke beech navigation ke liye
- Vanilla HTML/CSS directly use NAHI karna — sab React components mein likhna

### Backend — Main (Supabase)
- **Supabase** hi primary backend hai
- Database, Authentication, Storage — sab Supabase se lena
- Agar koi feature Supabase mein free mein milta hai toh **sirf Supabase use karo**
- Firebase pe tabhi jana jab wo feature Supabase mein free mein available NA ho

### Backend — Secondary (Firebase)
- **Firebase** sirf tab use karna jab Supabase mein wo feature free mein na mile
- Example: Agar koi feature dono mein free hai (jaise Authentication) → **Supabase use karo**, Firebase wala mat lena
- **Firebase Hosting** — final app yahan deploy hoga

---

## Folder Structure — Hamesha isi structure mein kaam karo

```
src/
  pages/        → Har page ka alag JSX file  (Loading.jsx, Login.jsx, Home.jsx...)
  components/   → Shared/reusable components (buttons, cards, modals...)
  styles/       → Har page ka alag CSS file  (loading.css, login.css, home.css...)
                  + global.css (sab pages mein common styles)
  assets/       → Images, icons, fonts
  App.jsx       → Routing setup — naye pages yahan add karo
  main.jsx      → Entry point — mat chhedo
```

### Important Rules for Files:
- Har **page** ke liye alag `.jsx` file — `src/pages/` mein
- Har **page ke CSS** ke liye alag `.css` file — `src/styles/` mein
- File name se samajh aana chahiye ki andar kya hai
  - ✅ `Loading.jsx`, `Login.jsx`, `Home.jsx`, `DailyCheckIn.jsx`
  - ❌ `page1.jsx`, `comp.jsx`, `style1.css`

---

## Mobile App Jaisa UI — Yeh rules hamesha follow karo

```css
/* Mobile container — global.css mein hai, har page pe automatically lagta hai */
#app-root {
  max-width: 430px;      /* Mobile width */
  margin: 0 auto;        /* Center mein */
  min-height: 100vh;
  background: #fff;
  box-shadow: 0 0 40px rgba(0,0,0,0.2);
}
body {
  background: #d0d0d0;   /* Baaki screen grey */
}
```

- Koi bhi page `max-width: 430px` ke bahar nahi jaana chahiye
- Sab pages `#app-root` ke andar render hote hain (App.jsx mein set hai)
- Design hamesha **mobile-first** sochke banana

---

## Pages — Sab ban chuke hain ✅

| Page | File | Status |
|------|------|--------|
| Loading / Splash Screen | `src/pages/Loading.jsx` | ✅ Done |
| Login Page | `src/pages/Login.jsx` | ✅ Done |
| Home Page | `src/pages/Home.jsx` | ✅ Done |
| Daily Check-in | `src/pages/DailyCheckIn.jsx` | ✅ Done |
| Games Hub | `src/pages/games/index.jsx` | ✅ Done |
| Wallet | `src/pages/Wallet.jsx` | ✅ Done |
| Profile | `src/pages/Profile.jsx` | ✅ Done |
| Store | `src/pages/store/index.jsx` | ✅ Done |
| Referral | `src/pages/Referral.jsx` | ✅ Done |
| Bonus Code | `src/pages/BonusCode.jsx` | ✅ Done |
| Notifications | `src/pages/Notifications.jsx` | ✅ Done |
| FAQ / Help | `src/pages/FAQ.jsx` | ✅ Done |

---

## 🎮 Games — 5-Network Ad System (Developer Reference)

Games page pe **5 Ad Network Zones** hain. UI pe sirf short codes dikhte hain — full name sirf developer ke reference ke liye hai.

| UI Label | Code | Full Network Name | Website |
|----------|------|-------------------|---------|
| 🔥 MG | `mg` | **Monetag** | monetag.com |
| 💎 AS | `as` | **Adsterra** | adsterra.com |
| 💰 PC | `pc` | **PopCash** | popcash.net |
| ⚡ CK | `ck` | **Clickadu** | clickadu.com |
| 🏔️ HT | `ht` | **HilltopAds** | hilltopads.com |

> **Important:** User ko sirf MG / AS / PC / CK / HT dikhta hai — full network name intentionally hidden hai.

### Ad Script Kahan Daalen?
File: `src/pages/games/AdWatchOverlay.jsx`
```jsx
<div className="ad-slot-box" id={`ad-slot-${network.id}`}>
  {/* network.id = "mg" | "as" | "pc" | "ck" | "ht" */}
  {/* Apna real ad network script yahaan paste karo */}
</div>
```

### Game Limits per Zone
- Spin Wheel: 3 plays / 4 hours
- Scratch Card: 3 plays / 4 hours (har card ke liye alag ad)
- Coin Flip: 3 plays / 4 hours
- **Total: 9 plays × 5 zones = 45 plays per 4 hours**

---

## ⚡ Earning Tasks — Action-Gated

Har task ke liye **actual action required** hai — sirf click se coins nahi milte:

| Task | Action | Wait |
|------|--------|------|
| 📺 Video dekho | 10s timer | 10s |
| 📲 App install karo | App link kholo + wait | 15s |
| 🔗 Link share karo | Web Share / Clipboard | — |
| 📝 Survey bharo | Survey link + wait | 30s |
| 👥 Friend refer karo | Referral page pe jao | — |

> Task links update karne ke liye: `src/pages/Home.jsx` → `TASKS` array → `link` field

### Page banate waqt:
1. `src/pages/PageName.jsx` banao
2. `src/styles/pageName.css` banao (us page ka CSS)
3. `src/App.jsx` mein route add karo

---

## App.jsx mein Routes kaise add kare

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Loading from './pages/Loading';
import Login from './pages/Login';   // naya page add karte waqt

export default function App() {
  return (
    <BrowserRouter>
      <div id="app-root">
        <Routes>
          <Route path="/" element={<Navigate to="/loading" replace />} />
          <Route path="/loading" element={<Loading />} />
          <Route path="/login" element={<Login />} />   {/* naya route */}
        </Routes>
      </div>
    </BrowserRouter>
  );
}
```

---

## AI Agent ke liye Rules (Bahut Zaroori)

### Bhasha / Language
- **Hamesha Hinglish mein baat karo** — Hindi + English mix, jaise dost baat karte hain
- Technical words (database, API, server, route, component) English mein reh sakte hain
- Kabhi bhi pure English mein jawab mat do, chahe sawaal English mein ho
- Tool use karne se pehle jo description likhte ho — woh bhi Hinglish mein
- Sabse neeche jo suggestion dete ho ("Next, I can...") — woh bhi Hinglish mein likhna
  - Format: `**Aage, main X kar sakta hoon. Kya tum chahte ho?**`

### Kaam karne ka tarika
- User ek ek page batayega — **ek ek page banao**, poora app ek saath mat banao
- Jab tak user na bole tab tak agle page pe mat jao
- Har page ke baad screenshot lo aur dikhao

### Technology Rules
- **React + Vite** use karo — vanilla HTML/CSS directly likhna avoid karo
- Har page alag `.jsx` file mein, har page ka CSS alag `.css` file mein
- `eslint.config.js` aur `vite.config.js` rename mat karna — yeh framework ke fixed files hain
- `index.html` rename mat karna — browser isko dhundhta hai

### Backend Rules
- Supabase pehle check karo — free mein feature milta hai kya
- Sirf tab Firebase use karo jab Supabase mein wo feature free mein NA mile
- Dono mein jo feature free ho → **Supabase wala use karo**

---

## Development Server
- `npm run dev` — local development / testing ke liye
- Port: **5000**
- Workflow name: **"Start application"**
- **Replit sirf testing ke liye hai — live deploy NAHI karna Replit se**

## Deploy — Firebase (Production)
- Code change → GitHub push → GitHub Actions auto-trigger → Firebase pe live
- Firebase URL: **https://sabka-masti-bazaar-71333.web.app**
- GitHub Repo: **https://github.com/munnakumar678997/sabka-masti-bazaar**
- Firebase Project ID: `sabka-masti-bazaar-71333`

## CI/CD Pipeline (Already Setup)
```
Replit mein code change karo
        ↓
GitHub pe push karo (git push)
        ↓
GitHub Actions automatically trigger hoga
        ↓
npm install → vite build → Firebase deploy
        ↓
App live: https://sabka-masti-bazaar-71333.web.app ✅
```

---

## User Preferences
- **Hinglish mein baat karo** (sabse important rule)
- Suggestions bhi Hinglish mein: `**Aage, main X kar sakta hoon. Kya tum chahte ho?**`
- Mobile app jaisa UI hamesha — website hai lekin app feel
- Ek ek page banwata hoon — jaldi mat karo
- File names samajh mein aane wale rakhna
- React + Vite — koi aur framework suggest mat karo jab tak user na bole
- **Sirf free tier use karna hai — koi paid subscription nahi**
- **Replit pe deploy mat karo — sirf test karo**
- Firebase sirf hosting ke liye — backend Supabase hai
