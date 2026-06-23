---
name: Unlimited check-in bug fix
description: Root cause and fix for the recurring unlimited daily check-in bug in AppContext
---

## The Bug (kept coming back)

In `AppContext.jsx`, `updateCheckIn` used `if (user)` to guard Supabase save. But:
- `user` inside async functions is a stale closure capture
- When `user` is null (Supabase load failed / not in Telegram), `if (user)` = false
- `setUser(prev => prev ? {...prev} : prev)` also does nothing when prev is null
- Result: `last_checkin_date` never updates in state → `checkedIn` stays false → unlimited check-in

**Why:**  The fix was applied before but only partially — localStorage backup was missing, and the `if(user)` stale closure was not addressed with a ref.

**How to apply:**
1. `useRef(null)` for `userIdRef` in AppProvider — updated in `_setUser()` wrapper
2. Replace ALL `if (user)` Supabase guards with `if (userIdRef.current)`
3. In `updateCheckIn`, Layer 2: `localStorage.setItem(CHECKIN_BACKUP_KEY, lastDate)` BEFORE Supabase call
4. In `loadUser`, sync localStorage from Supabase `last_checkin_date` on every login
5. In `Home.jsx`, `checkedIn = checkedInSupabase || checkedInLocal` — both layers checked
6. `CHECKIN_BACKUP_KEY = 'smb_checkin_ist'` — exported from context so Home can use same key
