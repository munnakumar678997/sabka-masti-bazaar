import { createContext, useContext, useState, useRef } from 'react';
import { db } from '../lib/firebase';
import {
  doc, getDoc, setDoc, updateDoc, collection, addDoc, increment,
  getDocs, query, where, orderBy, arrayUnion, runTransaction,
} from 'firebase/firestore';

const AppContext = createContext(null);

const CHECKIN_BACKUP_KEY = 'smb_checkin_ist';
const SESSION_KEY        = 'smb_session';

export function AppProvider({ children }) {
  const [user,           setUser]           = useState(null);
  const [balance,        setBalance]        = useState(0);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [referrals,      setReferrals]      = useState(0);
  const [streak,         setStreak]         = useState(0);
  const [loading,        setLoading]        = useState(false);
  const [redeemedCodes,  setRedeemedCodes]  = useState([]);

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
        setReferrals(updated.referral_count  || 0);
        setRedeemedCodes(updated.redeemed_codes || []);

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
          referral_count:    0,
          redeemed_codes:    [],
        };

        await setDoc(userRef, newUser);

        _setUser(newUser);
        _setBalance(WELCOME_BONUS);
        setStreak(0);
        _setTasks(0);
        setReferrals(0);
        setRedeemedCodes([]);
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
    setUser(prev => prev ? { ...prev, mobile } : prev);
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
  // deductCoins — Firestore transaction (negative balance prevent, race-condition safe)
  // ─────────────────────────────────────────────
  const deductCoins = async (amount) => {
    if (!userIdRef.current) return;

    try {
      const userRef = doc(db, 'users', String(userIdRef.current));
      let actualDeducted = 0;

      await runTransaction(db, async (txn) => {
        const snap = await txn.get(userRef);
        if (!snap.exists()) throw new Error('User not found');
        const currentBalance = snap.data().balance || 0;
        // Kabhi bhi negative nahi hoga — max 0
        const newBalance = Math.max(0, currentBalance - amount);
        actualDeducted  = currentBalance - newBalance;
        txn.update(userRef, { balance: newBalance });
      });

      // Transaction ke baad UI update karo (confirmed value)
      setBalance(prev => {
        const n = Math.max(0, prev - actualDeducted);
        balanceRef.current = n;
        return n;
      });
      setUser(prev => prev ? { ...prev, balance: balanceRef.current } : prev);

    } catch (e) {
      console.error('deductCoins Firestore err:', e);
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
  // saveOrder — Store order Firestore mein save karo
  // ─────────────────────────────────────────────
  const saveOrder = async (orderData) => {
    if (!userIdRef.current) return;
    try {
      await addDoc(collection(db, 'orders'), {
        ...orderData,
        userId:    String(userIdRef.current),
        userName:  user?.name     || null,
        userPhone: user?.mobile   || null,
        status:    'pending',
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error('saveOrder Firestore err:', e);
    }
  };

  // ─────────────────────────────────────────────
  // updateUserName — name update karo (state + Firestore)
  // ─────────────────────────────────────────────
  const updateUserName = async (newName) => {
    if (!userIdRef.current || !newName) return;
    await updateDoc(doc(db, 'users', String(userIdRef.current)), { name: newName });
    setUser(prev => prev ? { ...prev, name: newName } : prev);
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

  // ─────────────────────────────────────────────
  // markCodeRedeemed — Firestore mein code track karo (multi-device safe)
  // ─────────────────────────────────────────────
  const markCodeRedeemed = async (code) => {
    if (!userIdRef.current) return;
    try {
      await updateDoc(doc(db, 'users', String(userIdRef.current)), {
        redeemed_codes: arrayUnion(code),
      });
      setRedeemedCodes(prev => [...prev, code]);
    } catch (e) {
      console.error('markCodeRedeemed err:', e);
    }
  };

  // ─────────────────────────────────────────────
  // fetchWithdrawals — Firestore se user ki history lo
  // ─────────────────────────────────────────────
  const fetchWithdrawals = async () => {
    if (!userIdRef.current) return [];
    try {
      // orderBy hata diya — composite index ki zaroorat nahi
      // Client-side sort karo createdAt se
      const q = query(
        collection(db, 'withdrawals'),
        where('userId', '==', String(userIdRef.current)),
      );
      const snap = await getDocs(q);
      const results = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
      // Newest first — client-side sort
      results.sort((a, b) => {
        const ta = a.createdAt || '';
        const tb = b.createdAt || '';
        return tb.localeCompare(ta);
      });
      return results;
    } catch (e) {
      console.error('fetchWithdrawals err:', e);
      return [];
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
      updateUserName,
      saveOrder,
      saveWithdrawal,
      fetchWithdrawals,
      redeemedCodes,
      markCodeRedeemed,
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
