import { createContext, useContext, useState, useRef } from 'react';
import { db } from '../lib/firebase';
import {
  doc, getDoc, setDoc, updateDoc, collection, addDoc, increment
} from 'firebase/firestore';

const AppContext = createContext(null);

const CHECKIN_BACKUP_KEY = 'smb_checkin_ist';
const SESSION_KEY        = 'smb_session';

export function AppProvider({ children }) {
  const [user,           setUser]           = useState(null);
  const [balance,        setBalance]        = useState(0);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [referrals]                         = useState(0);
  const [streak,         setStreak]         = useState(0);
  const [loading,        setLoading]        = useState(false);

  const userIdRef  = useRef(null);
  const balanceRef = useRef(0);
  const tasksRef   = useRef(0);

  const _setUser = (data) => {
    userIdRef.current = data?.id ?? null;
    setUser(data);
  };

  const _setBalance = (val) => {
    balanceRef.current = val;
    setBalance(val);
  };

  const _setTasks = (val) => {
    tasksRef.current = val;
    setTasksCompleted(val);
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
        _setBalance(updated.balance          || 0);
        setStreak(updated.streak             || 0);
        _setTasks(updated.tasks_completed    || 0);

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
        _setBalance(WELCOME_BONUS);
        setStreak(0);
        _setTasks(0);
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
  // addCoins — functional update + Firestore increment (atomic, no race condition)
  // ─────────────────────────────────────────────
  const addCoins = async (amount) => {
    setBalance(prev => {
      const n = prev + amount;
      balanceRef.current = n;
      return n;
    });
    setUser(prev => prev ? { ...prev, balance: balanceRef.current } : prev);

    if (userIdRef.current) {
      try {
        await updateDoc(doc(db, 'users', String(userIdRef.current)), {
          balance: increment(amount),
        });
      } catch (e) { console.error('addCoins Firestore err:', e); }
    }
  };

  // ─────────────────────────────────────────────
  // deductCoins — functional update + Firestore increment (atomic)
  // ─────────────────────────────────────────────
  const deductCoins = async (amount) => {
    setBalance(prev => {
      const n = Math.max(0, prev - amount);
      balanceRef.current = n;
      return n;
    });
    setUser(prev => prev ? { ...prev, balance: balanceRef.current } : prev);

    if (userIdRef.current) {
      try {
        await updateDoc(doc(db, 'users', String(userIdRef.current)), {
          balance: increment(-amount),
        });
      } catch (e) { console.error('deductCoins Firestore err:', e); }
    }
  };

  // ─────────────────────────────────────────────
  // completeTask — functional update, no stale closure
  // ─────────────────────────────────────────────
  const completeTask = async (coins) => {
    setBalance(prev => {
      const n = prev + coins;
      balanceRef.current = n;
      return n;
    });
    setTasksCompleted(prev => {
      const n = prev + 1;
      tasksRef.current = n;
      return n;
    });
    setUser(prev => prev ? {
      ...prev,
      balance:         balanceRef.current,
      tasks_completed: tasksRef.current,
    } : prev);

    if (userIdRef.current) {
      try {
        await updateDoc(doc(db, 'users', String(userIdRef.current)), {
          balance:         increment(coins),
          tasks_completed: increment(1),
        });
      } catch (e) { console.error('completeTask Firestore err:', e); }
    }
  };

  // ─────────────────────────────────────────────
  // updateCheckIn — 3-layer protection, functional update
  // ─────────────────────────────────────────────
  const updateCheckIn = async (newStreak, totalDays, lastDate, coinsEarned) => {
    setBalance(prev => {
      const n = prev + coinsEarned;
      balanceRef.current = n;
      return n;
    });
    setStreak(newStreak);
    setUser(prev => {
      const base = prev ?? {};
      return {
        ...base,
        balance:           balanceRef.current,
        streak:            newStreak,
        total_checkins:    totalDays,
        last_checkin_date: lastDate,
      };
    });

    localStorage.setItem(CHECKIN_BACKUP_KEY, lastDate);

    if (userIdRef.current) {
      try {
        await updateDoc(doc(db, 'users', String(userIdRef.current)), {
          balance:           increment(coinsEarned),
          streak:            newStreak,
          total_checkins:    totalDays,
          last_checkin_date: lastDate,
        });
      } catch (error) {
        console.error('Check-in Firestore save failed:', error);
      }
    }
  };

  // ─────────────────────────────────────────────
  // saveWithdrawal — Firestore mein save karo
  // ─────────────────────────────────────────────
  const saveWithdrawal = async (entry) => {
    if (!userIdRef.current) return;
    try {
      await addDoc(collection(db, 'withdrawals'), {
        ...entry,
        userId:    String(userIdRef.current),
        userName:  user?.name     || null,
        userPhone: user?.mobile   || null,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error('saveWithdrawal Firestore err:', e);
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
      saveWithdrawal,
      CHECKIN_BACKUP_KEY,
      SESSION_KEY,
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
