# 🎯 Sabka Masti Bazaar — Team Master Prompt

> **Yeh prompt copy karke Replit Agent ko send karo jab bhi naya account pe project import karo.**

---

## 📋 MASTER PROMPT (Copy-Paste Karo)

```
Namaste! Main ek naya developer hoon jo "Sabka Masti Bazaar" project pe kaam karne aa raha hoon.

Pehle poore project ko deeply analyze karo:
1. Sari files padho — src/pages/, src/components/, src/styles/, src/context/, src/lib/
2. App.jsx mein routes dekho
3. replit.md padho — project ke complete rules hain wahan
4. package.json dekho — dependencies samjho
5. .github/workflows/firebase-deploy.yml padho — deployment pipeline samjho

Is project ke baare mein kuch important cheezein:

**PROJECT:**
- Naam: Sabka Masti Bazaar
- Tagline: Khelo • Jeeto • Kamao
- Type: Desi earning web app (website hai lekin mobile app jaisa UI hai)
- Live URL: https://sabka-masti-bazaar-71333.web.app

**TECH STACK:**
- Frontend: React + Vite (TypeScript nahi, simple JSX)
- Backend (Primary): Supabase — free tier only
- Hosting: Firebase Hosting — free tier only
- CI/CD: GitHub Actions → Firebase auto-deploy

**BACKEND RULES (BAHUT ZAROORI):**
- Supabase = primary backend (DB, Auth, Storage sab Supabase se)
- Firebase = sirf hosting ke liye
- Agar koi feature Supabase mein FREE mein milta hai → SIRF Supabase use karo
- Agar feature Supabase mein free mein NA mile lekin Firebase mein free mile → Firebase wala use karo
- Koi bhi PAID subscription mat lena — sirf free tier

**DEPLOYMENT RULES:**
- Replit = sirf local testing/development ke liye
- Production = Firebase Hosting pe hai
- Deploy karne ka tarika: GitHub pe push karo → GitHub Actions auto-trigger → Firebase live
- Replit pe KABHI deploy mat karo (suggest_deploy tool use mat karna)

**UI RULES:**
- Hamesha mobile-first design — max-width: 430px
- Website hai lekin mobile app jaisa feel hona chahiye
- #app-root container mein sab kuch render hota hai

**FILE STRUCTURE (Hamesha follow karo):**
- src/pages/ → har page ka alag .jsx file
- src/styles/ → har page ka alag .css file
- src/components/ → shared/reusable components
- src/assets/ → images, icons

**KAAM KARNE KA TARIKA:**
- User ek ek page batayega — ek ek page banao, poora app ek saath mat banao
- Jab tak user na bole agle page pe mat jao
- Har kaam ke baad screenshot lo aur dikhao

**BHASHA / LANGUAGE (SABSE IMPORTANT):**
- HAMESHA Hinglish mein baat karo — Hindi + English mix
- Technical words (database, API, server, route) English mein reh sakte hain
- Pure English mein KABHI jawab mat do
- Suggestions ka format: **Aage, main X kar sakta hoon. Kya tum chahte ho?**

Ab project ko completely samjho, sab rules yaad kar lo, aur bolo — "Haan bhai, project samajh gaya! Kya karna hai?" 🚀
```

---

## 📌 Yeh Bhi Karo (Project Import ke Baad):

1. **Replit Secrets setup karo** — `api-setup.txt` file dekho (WhatsApp group mein shared hai)
2. **Workflow start karo** — "Start application" workflow run karo
3. **Test karo** — `https://<replit-preview-url>` pe splash screen dikhni chahiye
4. Tab prompt bhejo aur kaam shuru karo!
