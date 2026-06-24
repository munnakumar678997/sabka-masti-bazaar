import { createContext, useContext, useState, useRef } from 'react';
import { db } from '../lib/firebase';
import {
  doc, getDoc, setDoc, updateDoc, collection, addDoc, increment,
  getDocs, query, where, arrayUnion, runTransaction,
} from 'firebase/firestore';

const AppContext = createContext(null);

// Component ke bahar — sirf ek baar create hoga (har render pe nahi)
const VALID_CODES_FALLBACK = {
  'MASTI50':    { coins: 50,   desc: 'Masti Bonus'        },
  'WELCOME100': { coins: 100,  desc: 'Welcome Special'    },
  'SABKA200':   { coins: 200,  desc: 'Sabka Bazaar Bonus' },
  'LUCKY25':    { coins: 25,   desc: 'Lucky Coins'        },
  'DIWALI500':  { coins: 500,  desc: 'Diwali Special 🪔'  },
  'EARN75':     { coins: 75,   desc: 'Earning Reward'     },
  'BONUS150':   { coins: 150,  desc: 'Special Bonus'      },
  'SUPER300':   { coins: 300,  desc: 'Super Reward'       },
};

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

  // ─────────────────────────────────────────────
  // loadUser — Firestore se real data lo
  // referredBy: optional — jis user ne refer kiya uska code (e.g. "SMB12345")
  // ─────────────────────────────────────────────
  const loadUser = async (tgUser, mobile = null, referredBy = null) => {
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
        userIdRef.current  = updated.id;
        balanceRef.current = updated.balance || 0;
        tasksRef.current   = updated.tasks_completed || 0;

        setUser(updated);
        setBalance(updated.balance          || 0);
        setStreak(updated.streak             || 0);
        setTasksCompleted(updated.tasks_completed || 0);
        setReferrals(updated.referral_count  || 0);
        setRedeemedCodes(updated.redeemed_codes || []);

        if (updated.last_checkin_date) {
          localStorage.setItem(CHECKIN_BACKUP_KEY, updated.last_checkin_date);
        } else {
          localStorage.removeItem(CHECKIN_BACKUP_KEY);
        }

      } else {
        // ── NAYA USER ──
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
          referred_by:       referredBy       ?? null,
        };

        await setDoc(userRef, newUser);

        userIdRef.current  = newUser.id;
        balanceRef.current = WELCOME_BONUS;
        tasksRef.current   = 0;

        setUser(newUser);
        setBalance(WELCOME_BONUS);
        setStreak(0);
        setTasksCompleted(0);
        setReferrals(0);
        setRedeemedCodes([]);
        localStorage.removeItem(CHECKIN_BACKUP_KEY);
        localStorage.setItem('smb_welcome_shown', '1');

        // ── Referrer ko coins, count, aur milestone bonus update karo ──
        if (referredBy) {
          try {
            // referredBy format: "SMB<userId>" — pehle validate karo
            const referrerId = String(referredBy).replace(/^SMB/i, '');
            if (referrerId && referrerId !== String(tgUser.id)) {
              const referrerRef  = doc(db, 'users', referrerId);
              const referrerSnap = await getDoc(referrerRef);
              if (referrerSnap.exists()) {
                const referrerData    = referrerSnap.data();
                const newRefCount     = (referrerData.referral_count || 0) + 1;
                const awardedMilestones = referrerData.awarded_milestones || [];

                // Milestone bonuses — sirf ek baar award hote hain
                const MILESTONE_COINS = { 1: 50, 3: 200, 5: 500, 10: 1200, 25: 3500, 50: 8000 };
                const milestoneBonus  = (MILESTONE_COINS[newRefCount] && !awardedMilestones.includes(newRefCount))
                  ? MILESTONE_COINS[newRefCount]
                  : 0;

                const updatePayload = {
                  referral_count: increment(1),
                  balance:        increment(50 + milestoneBonus), // base 50 + milestone (agar ho)
                };
                if (milestoneBonus > 0) {
                  updatePayload.awarded_milestones = arrayUnion(newRefCount);
                }

                await updateDoc(referrerRef, updatePayload);
              }
            }
          } catch (refErr) {
            console.error('Referral update error:', refErr);
          }
        }
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
  // addCoins — synchronous ref update (no stale closure)
  // ─────────────────────────────────────────────
  const addCoins = async (amount) => {
    const newBalance       = balanceRef.current + amount;
    balanceRef.current     = newBalance;
    setBalance(newBalance);
    setUser(prev => prev ? { ...prev, balance: newBalance } : prev);

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
    if (!userIdRef.current) return false;

    try {
      const userRef = doc(db, 'users', String(userIdRef.current));
      let actualDeducted = 0;
      let success = false;

      await runTransaction(db, async (txn) => {
        const snap = await txn.get(userRef);
        if (!snap.exists()) throw new Error('User not found');
        const currentBalance = snap.data().balance || 0;
        if (currentBalance < amount) {
          // Balance nahi hai — transaction cancel karo
          return;
        }
        const newBalance = currentBalance - amount;
        actualDeducted   = amount;
        success          = true;
        txn.update(userRef, { balance: newBalance });
      });

      if (!success) return false;

      // Transaction ke baad UI update karo (confirmed value)
      const newBalance       = Math.max(0, balanceRef.current - actualDeducted);
      balanceRef.current     = newBalance;
      setBalance(newBalance);
      setUser(prev => prev ? { ...prev, balance: newBalance } : prev);
      return true;

    } catch (e) {
      console.error('deductCoins Firestore err:', e);
      return false;
    }
  };

  // ─────────────────────────────────────────────
  // completeTask — synchronous ref update (no stale closure)
  // ─────────────────────────────────────────────
  const completeTask = async (coins) => {
    const newBalance       = balanceRef.current + coins;
    const newTasks         = tasksRef.current + 1;
    balanceRef.current     = newBalance;
    tasksRef.current       = newTasks;
    setBalance(newBalance);
    setTasksCompleted(newTasks);
    setUser(prev => prev ? {
      ...prev,
      balance:         newBalance,
      tasks_completed: newTasks,
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
  // updateCheckIn — synchronous ref update (no stale closure)
  // ─────────────────────────────────────────────
  const updateCheckIn = async (newStreak, totalDays, lastDate, coinsEarned) => {
    const newBalance       = balanceRef.current + coinsEarned;
    balanceRef.current     = newBalance;
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
      throw e; // Caller ko pata chale ki save fail hua
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
  // redeemBonusCode — ATOMIC: validate + mark + add coins ek hi transaction mein
  // Codes Firestore `bonus_codes/{CODE}` collection mein hone chahiye
  // VALID_CODES_FALLBACK (file ke upar) sirf backup hai
  // ─────────────────────────────────────────────
  const redeemBonusCode = async (code) => {
    if (!userIdRef.current) throw new Error('NOT_LOGGED_IN');

    const userRef = doc(db, 'users', String(userIdRef.current));
    const codeRef = doc(db, 'bonus_codes', code);

    let coinsEarned = 0;
    let codeDesc    = '';

    await runTransaction(db, async (txn) => {
      const userSnap = await txn.get(userRef);
      if (!userSnap.exists()) throw new Error('USER_NOT_FOUND');

      // Already redeemed check (Firestore se — multi-device safe)
      const userRedeemed = userSnap.data().redeemed_codes || [];
      if (userRedeemed.includes(code)) throw new Error('ALREADY_USED');

      // Pehle Firestore bonus_codes collection check karo (admin-defined codes)
      let coins = 0, desc = '';
      const fsCodeSnap = await txn.get(codeRef);
      if (fsCodeSnap.exists()) {
        coins = fsCodeSnap.data().coins  || 0;
        desc  = fsCodeSnap.data().desc   || '';
      } else {
        // Firestore mein code nahi — fallback VALID_CODES check
        const fallback = VALID_CODES_FALLBACK[code];
        if (!fallback) throw new Error('INVALID_CODE');
        coins = fallback.coins;
        desc  = fallback.desc;
      }

      coinsEarned = coins;
      codeDesc    = desc;

      const currentBalance = userSnap.data().balance || 0;
      // Atomically: mark code + add coins — dono fail ya dono success
      txn.update(userRef, {
        balance:        currentBalance + coins,
        redeemed_codes: arrayUnion(code),
      });
    });

    // Transaction success — local state update karo
    const newBalance   = balanceRef.current + coinsEarned;
    balanceRef.current = newBalance;
    setBalance(newBalance);
    setUser(prev => prev ? { ...prev, balance: newBalance } : prev);
    setRedeemedCodes(prev => [...prev, code]);

    return { coins: coinsEarned, desc: codeDesc };
  };

  // ─────────────────────────────────────────────
  // fetchWithdrawals — Firestore se user ki history lo
  // ─────────────────────────────────────────────
  const fetchWithdrawals = async () => {
    if (!userIdRef.current) return [];
    try {
      const q = query(
        collection(db, 'withdrawals'),
        where('userId', '==', String(userIdRef.current)),
      );
      const snap = await getDocs(q);
      const results = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
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
      redeemBonusCode,
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
