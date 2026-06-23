---
name: Project Rules & Deployment Setup
description: Sabka Masti Bazaar ke permanent rules — tech stack decisions, deployment pipeline, aur user preferences
---

## Stack Rules
- **Backend:** Supabase (free tier only) — DB, Auth, Storage
- **Hosting:** Firebase Hosting (free tier only)
- **Rule:** Agar koi feature dono mein free ho → Supabase use karo
- **Rule:** Agar feature Supabase mein free NA ho lekin Firebase mein free ho → Firebase use karo
- **Paid subscriptions:** Kabhi nahi — sirf free tier

**Why:** User ne explicitly kaha hai koi paid subscription nahi chahiye.

## Deployment Pipeline (Already Working)
- Replit → sirf development/testing ke liye
- Production: Firebase Hosting
- CI/CD: GitHub Actions (`.github/workflows/firebase-deploy.yml`)
- Flow: code change → GitHub push → Actions trigger → Firebase live

**Why:** User ne kaha Replit pe deploy nahi karna, sirf Firebase pe.

## Firebase Details
- Project ID: `sabka-masti-bazaar-71333`
- Live URL: `https://sabka-masti-bazaar-71333.web.app`
- GitHub Repo: `munnakumar678997/sabka-masti-bazaar`

## GitHub Secrets (All Set)
- FIREBASE_SERVICE_ACCOUNT ✅
- FIREBASE_PROJECT_ID ✅
- VITE_SUPABASE_URL ✅
- VITE_SUPABASE_ANON_KEY ✅

## Communication Rules
- Hamesha Hinglish mein reply karo
- Suggestions format: `**Aage, main X kar sakta hoon. Kya tum chahte ho?**`
- Ek ek page banao — poora app ek saath mat banao
