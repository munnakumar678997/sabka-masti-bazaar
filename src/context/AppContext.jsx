import { createContext, useContext, useState } from 'react';
import { supabase } from '../lib/supabase';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user,           setUser]           = useState(null);
  const [balance,        setBalance]        = useState(0);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [referrals]                         = useState(0);
  const [streak,         setStreak]         = useState(0);
  const [loading,        setLoading]        = useState(false);

  // ─────────────────────────────────────────────
  // loadUser — naye user ko INSERT, purane ko sirf SELECT
  // mobile: optional — jab user share kare tab save hoga
  // ─────────────────────────────────────────────
  const loadUser = async (tgUser, mobile = null) => {
    setLoading(true);
    try {
      // Step 1: User pehle se hai ya nahi?
      const { data: existing, error: fetchErr } = await supabase
        .from('users')
        .select('*')
        .eq('id', tgUser.id)
        .maybeSingle();

      if (fetchErr) throw fetchErr;

      if (existing) {
        // ── Purana user: profile + mobile (agar diya) update karo ──
        const updatePayload = {
          name:      tgUser.name,
          username:  tgUser.username  || null,
          photo_url: tgUser.photo_url || null,
        };
        // Mobile sirf tab update karo jab user ne share kiya ho
        if (mobile) updatePayload.mobile = mobile;

        const { data: updated, error: updateErr } = await supabase
          .from('users')
          .update(updatePayload)
          .eq('id', existing.id)
          .select()
          .single();

        if (updateErr) throw updateErr;

        setUser(updated);
        setBalance(updated.balance || 0);
        setStreak(updated.streak   || 0);

      } else {
        // ── Naya user: pehli baar INSERT karo ──
        const { data: inserted, error: insertErr } = await supabase
          .from('users')
          .insert({
            id:                tgUser.id,
            name:              tgUser.name,
            username:          tgUser.username  || null,
            photo_url:         tgUser.photo_url || null,
            mobile:            mobile            || null,
            balance:           0,
            streak:            0,
            total_checkins:    0,
            last_checkin_date: null,
          })
          .select()
          .single();

        if (insertErr) throw insertErr;

        setUser(inserted);
        setBalance(0);
        setStreak(0);
      }

    } catch (err) {
      console.error('Supabase user load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // saveMobile — baad mein bhi mobile save kar sako
  // ─────────────────────────────────────────────
  const saveMobile = async (mobile) => {
    if (!user || !mobile) return;
    const { data, error } = await supabase
      .from('users')
      .update({ mobile })
      .eq('id', user.id)
      .select()
      .single();
    if (!error && data) setUser(data);
  };

  // ─────────────────────────────────────────────
  // addCoins — balance badhaao + Supabase sync
  // ─────────────────────────────────────────────
  const addCoins = async (amount) => {
    const newBalance = balance + amount;
    setBalance(newBalance);
    setUser(prev => prev ? { ...prev, balance: newBalance } : prev);
    if (user) {
      await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', user.id);
    }
  };

  // ─────────────────────────────────────────────
  // deductCoins — coins kaato + Supabase sync
  // ─────────────────────────────────────────────
  const deductCoins = async (amount) => {
    const newBalance = Math.max(0, balance - amount);
    setBalance(newBalance);
    setUser(prev => prev ? { ...prev, balance: newBalance } : prev);
    if (user) {
      await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', user.id);
    }
  };

  // ─────────────────────────────────────────────
  // completeTask — task karo + coins lo
  // ─────────────────────────────────────────────
  const completeTask = (coins) => {
    addCoins(coins);
    setTasksCompleted(t => t + 1);
  };

  // ─────────────────────────────────────────────
  // updateCheckIn — ek din mein ek baar, Supabase mein save
  // ─────────────────────────────────────────────
  const updateCheckIn = async (newStreak, totalDays, lastDate, coinsEarned) => {
    const newBalance = balance + coinsEarned;

    setBalance(newBalance);
    setStreak(newStreak);
    setUser(prev => prev ? {
      ...prev,
      balance:           newBalance,
      streak:            newStreak,
      total_checkins:    totalDays,
      last_checkin_date: lastDate,
    } : prev);

    if (user) {
      await supabase
        .from('users')
        .update({
          balance:           newBalance,
          streak:            newStreak,
          total_checkins:    totalDays,
          last_checkin_date: lastDate,
        })
        .eq('id', user.id);
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
