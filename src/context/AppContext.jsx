import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user,           setUser]           = useState(null);
  const [balance,        setBalance]        = useState(0);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [referrals]                         = useState(0);
  const [streak,         setStreak]         = useState(0);
  const [loading,        setLoading]        = useState(false);

  const loadUser = async (tgUser) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .upsert({
          id:         tgUser.id,
          name:       tgUser.name,
          username:   tgUser.username || null,
          photo_url:  tgUser.photo_url || null,
        }, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;

      setUser(data);
      setBalance(data.balance || 0);
      setStreak(data.streak || 0);
    } catch (err) {
      console.error('Supabase user load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const addCoins = async (amount) => {
    const newBalance = balance + amount;
    setBalance(newBalance);
    if (user) {
      await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', user.id);
    }
  };

  const deductCoins = async (amount) => {
    const newBalance = Math.max(0, balance - amount);
    setBalance(newBalance);
    if (user) {
      await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', user.id);
    }
  };

  const completeTask = (coins) => {
    addCoins(coins);
    setTasksCompleted(t => t + 1);
  };

  const updateCheckIn = async (newStreak, totalDays, lastDate, coinsEarned) => {
    const newBalance = balance + coinsEarned;
    setBalance(newBalance);
    setStreak(newStreak);
    // Local user state bhi turant update karo — button dobara na chale
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
