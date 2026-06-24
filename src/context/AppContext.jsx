import { createContext, useContext, useState, useRef } from 'react';
import { db } from '../lib/firebase';
import {
  doc, getDoc, setDoc, updateDoc
} from 'firebase/firestore';

const AppContext = createContext(null);

const CHECKIN_BACKUP_KEY = 'smb_checkin_ist';

export function AppProvider({ children }) {
  const [user,           setUser]           = useState(null);
  const [balance,        setBalance]        = useState(0);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [referrals]                         = useState(0);
  const [streak,         setStreak]         = useState(0);
  const [loading,        setLoading]        = useState(false);

  const userIdRef = useRef(null);

  const _setUser = (data) => {
    userIdRef.current = data?.id ?? null;
    setUser(data);
  };

  // ─────────────────────────────────────────────
  // loadUser — Firestore se real data lo
  // ─────────────────────────────────────────────
  const loadUser = async (tgUser, mobile = null) => {
    setLoading(true);
    try {
      const userRef  = doc(db, 'users', String(tgUser.id));
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const existing = userSnap.data();

        const updatePayload = {
          name:      tgUser.name,
          username:  tgUser.username  ?? null,
          photo_url: tgUser.photo_url ?? null,
        };
        if (mobile) updatePayload.mobile = mobile;

        await updateDoc(userRef, updatePayload);

        const updated = { id: String(tgUser.id), ...existing, ...updatePayload };
        _setUser(updated);
        setBalance(updated.balance          || 0);
        setStreak(updated.streak            || 0);
        setTasksCompleted(updated.tasks_completed || 0);

        if (updated.last_checkin_date) {
          localStorage.setItem(CHECKIN_BACKUP_KEY, updated.last_checkin_date);
        } else {
          localStorage.removeItem(CHECKIN_BACKUP_KEY);
        }

      } else {
        const WELCOME_BONUS = 50;
        const newUser = {
          id:                String(tgUser.id),
          name:              tgUser.name,
          username:          tgUser.username  ?? null,
          photo_url:         tgUser.photo_url ?? null,
          mobile:            mobile           ?? null,
          balance:           WELCOME_BONUS,
          streak:            0,
          total_checkins:    0,
          tasks_completed:   0,
          last_checkin_date: null,
        };

        await setDoc(userRef, newUser);

        _setUser(newUser);
        setBalance(WELCOME_BONUS);
        setStreak(0);
        setTasksCompleted(0);
        localStorage.removeItem(CHECKIN_BACKUP_KEY);
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
    const userRef = doc(db, 'users', String(userIdRef.current));
    await updateDoc(userRef, { mobile });
    _setUser(prev => prev ? { ...prev, mobile } : prev);
  };

  // ─────────────────────────────────────────────
  // addCoins
  // ─────────────────────────────────────────────
  const addCoins = async (amount) => {
    const newBalance = balance + amount;
    setBalance(newBalance);
    setUser(prev => prev ? { ...prev, balance: newBalance } : prev);

    if (userIdRef.current) {
      await updateDoc(doc(db, 'users', String(userIdRef.current)), { balance: newBalance });
    }
  };

  // ─────────────────────────────────────────────
  // deductCoins
  // ─────────────────────────────────────────────
  const deductCoins = async (amount) => {
    const newBalance = Math.max(0, balance - amount);
    setBalance(newBalance);
    setUser(prev => prev ? { ...prev, balance: newBalance } : prev);

    if (userIdRef.current) {
      await updateDoc(doc(db, 'users', String(userIdRef.current)), { balance: newBalance });
    }
  };

  // ─────────────────────────────────────────────
  // completeTask
  // ─────────────────────────────────────────────
  const completeTask = async (coins) => {
    const newCount   = tasksCompleted + 1;
    const newBalance = balance + coins;
    setBalance(newBalance);
    setTasksCompleted(newCount);
    setUser(prev => prev ? { ...prev, balance: newBalance, tasks_completed: newCount } : prev);

    if (userIdRef.current) {
      await updateDoc(doc(db, 'users', String(userIdRef.current)), {
        balance:         newBalance,
        tasks_completed: newCount,
      });
    }
  };

  // ─────────────────────────────────────────────
  // updateCheckIn — 3-layer protection
  // ─────────────────────────────────────────────
  const updateCheckIn = async (newStreak, totalDays, lastDate, coinsEarned) => {
    const newBalance = balance + coinsEarned;

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

    localStorage.setItem(CHECKIN_BACKUP_KEY, lastDate);

    if (userIdRef.current) {
      try {
        await updateDoc(doc(db, 'users', String(userIdRef.current)), {
          balance:           newBalance,
          streak:            newStreak,
          total_checkins:    totalDays,
          last_checkin_date: lastDate,
        });
      } catch (error) {
        console.error('Check-in Firestore save failed:', error);
      }
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
