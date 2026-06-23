import { createContext, useContext, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AppContext = createContext(null);

// localStorage backup key — unlimited check-in ke against triple protection
const CHECKIN_BACKUP_KEY = 'smb_checkin_ist';

export function AppProvider({ children }) {
  const [user,           setUser]           = useState(null);
  const [balance,        setBalance]        = useState(0);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [referrals]                         = useState(0);
  const [streak,         setStreak]         = useState(0);
  const [loading,        setLoading]        = useState(false);

  // ─── useRef: stale closure ka permanent fix ───
  // React state async hota hai — ref hamesha latest userId rakhta hai
  // Bina ref ke: setUser() ke baad bhi 'user' purana value show karta hai (closure trap)
  const userIdRef = useRef(null);

  // Safe setter — state + ref dono ek saath update karo
  const _setUser = (data) => {
    userIdRef.current = data?.id ?? null;
    setUser(data);
  };

  // ─────────────────────────────────────────────
  // loadUser — Supabase se real data lo, localStorage sync karo
  // ─────────────────────────────────────────────
  const loadUser = async (tgUser, mobile = null) => {
    setLoading(true);
    try {
      const { data: existing, error: fetchErr } = await supabase
        .from('users')
        .select('*')
        .eq('id', tgUser.id)
        .maybeSingle();

      if (fetchErr) throw fetchErr;

      if (existing) {
        // ── Purana user: profile update + full data wapas lo ──
        const updatePayload = {
          name:      tgUser.name,
          username:  tgUser.username  ?? null,
          photo_url: tgUser.photo_url ?? null,
        };
        if (mobile) updatePayload.mobile = mobile;

        const { data: updated, error: updateErr } = await supabase
          .from('users')
          .update(updatePayload)
          .eq('id', existing.id)
          .select()
          .single();

        if (updateErr) throw updateErr;

        _setUser(updated);
        setBalance(updated.balance         || 0);
        setStreak(updated.streak           || 0);
        setTasksCompleted(updated.tasks_completed || 0);

        // ── localStorage se Supabase ka last_checkin_date sync karo ──
        // Yeh tab important hai jab app reload ho — Supabase ka data ground truth hai
        if (updated.last_checkin_date) {
          localStorage.setItem(CHECKIN_BACKUP_KEY, updated.last_checkin_date);
        } else {
          localStorage.removeItem(CHECKIN_BACKUP_KEY);
        }

      } else {
        // ── Naya user: INSERT — Welcome Bonus 50 coins ──
        const WELCOME_BONUS = 50;
        const { data: inserted, error: insertErr } = await supabase
          .from('users')
          .insert({
            id:                tgUser.id,
            name:              tgUser.name,
            username:          tgUser.username  ?? null,
            photo_url:         tgUser.photo_url ?? null,
            mobile:            mobile           ?? null,
            balance:           WELCOME_BONUS,
            streak:            0,
            total_checkins:    0,
            tasks_completed:   0,
            last_checkin_date: null,
          })
          .select()
          .single();

        if (insertErr) throw insertErr;

        _setUser(inserted);
        setBalance(WELCOME_BONUS);
        setStreak(0);
        setTasksCompleted(0);
        localStorage.removeItem(CHECKIN_BACKUP_KEY);
        // Welcome bonus marker — ek baar hi dikhana
        localStorage.setItem('smb_welcome_shown', '1');
      }

    } catch (err) {
      console.error('loadUser error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // saveMobile
  // ─────────────────────────────────────────────
  const saveMobile = async (mobile) => {
    if (!userIdRef.current || !mobile) return;
    const { data, error } = await supabase
      .from('users')
      .update({ mobile })
      .eq('id', userIdRef.current)
      .select()
      .single();
    if (!error && data) _setUser(data);
  };

  // ─────────────────────────────────────────────
  // addCoins — ref use karo, stale closure nahi
  // ─────────────────────────────────────────────
  const addCoins = async (amount) => {
    const newBalance = balance + amount;
    setBalance(newBalance);
    setUser(prev => prev ? { ...prev, balance: newBalance } : prev);

    if (userIdRef.current) {
      await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', userIdRef.current);
    }
  };

  // ─────────────────────────────────────────────
  // deductCoins — ref use karo
  // ─────────────────────────────────────────────
  const deductCoins = async (amount) => {
    const newBalance = Math.max(0, balance - amount);
    setBalance(newBalance);
    setUser(prev => prev ? { ...prev, balance: newBalance } : prev);

    if (userIdRef.current) {
      await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', userIdRef.current);
    }
  };

  // ─────────────────────────────────────────────
  // completeTask — coins + tasks_completed Supabase mein save
  // ─────────────────────────────────────────────
  const completeTask = async (coins) => {
    const newCount   = tasksCompleted + 1;
    const newBalance = balance + coins;
    setBalance(newBalance);
    setTasksCompleted(newCount);
    setUser(prev => prev ? { ...prev, balance: newBalance, tasks_completed: newCount } : prev);

    if (userIdRef.current) {
      await supabase
        .from('users')
        .update({ balance: newBalance, tasks_completed: newCount })
        .eq('id', userIdRef.current);
    }
  };

  // ─────────────────────────────────────────────
  // updateCheckIn — DEEP FIX
  //
  // 3-layer protection against unlimited check-in:
  //  Layer 1: State mein last_checkin_date update hoti hai (Home.jsx check karta hai)
  //  Layer 2: localStorage mein backup save hota hai (Supabase fail hone pe bhi kaam kare)
  //  Layer 3: Supabase mein persist hota hai (next session ke liye)
  //
  // Pehle ka bug: user null hone pe state update nahi hoti thi + if(user) false tha
  // Iska matlab: check-in unlimited baar ho sakta tha bina kuch save hue
  // ─────────────────────────────────────────────
  const updateCheckIn = async (newStreak, totalDays, lastDate, coinsEarned) => {
    const newBalance = balance + coinsEarned;

    // Layer 1: State update — user null ho toh bhi last_checkin_date set karo
    setBalance(newBalance);
    setStreak(newStreak);
    setUser(prev => {
      const base = prev ?? {};
      return {
        ...base,
        balance:           newBalance,
        streak:            newStreak,
        total_checkins:    totalDays,
        last_checkin_date: lastDate,
      };
    });

    // Layer 2: localStorage backup — SABSE ZAROORI
    // Agar Supabase fail ho ya user null ho — yeh backup check-in rok dega
    localStorage.setItem(CHECKIN_BACKUP_KEY, lastDate);

    // Layer 3: Supabase mein save — userIdRef use karo (stale closure nahi)
    if (userIdRef.current) {
      const { error } = await supabase
        .from('users')
        .update({
          balance:           newBalance,
          streak:            newStreak,
          total_checkins:    totalDays,
          last_checkin_date: lastDate,
        })
        .eq('id', userIdRef.current);

      if (error) {
        console.error('Check-in Supabase save failed:', error);
        // localStorage backup already set — user protected hai
      }
    } else {
      console.warn('Check-in: No user ID — localStorage backup active, will sync on next login');
    }
  };

  return (
    <AppContext.Provider value={{
      user,
      balance,
      streak,
      tasksCompleted,
      referrals,
      loading,
      loadUser,
      saveMobile,
      addCoins,
      deductCoins,
      completeTask,
      updateCheckIn,
      CHECKIN_BACKUP_KEY,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
