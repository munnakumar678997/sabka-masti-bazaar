import { createContext, useContext, useState, useRef } from 'react';
import { db } from '../lib/firebase';
import {
  doc, getDoc, setDoc, updateDoc, collection,
  increment, getDocs, query, where, arrayUnion,
} from 'firebase/firestore';
import {
  addNotifToDb, fetchUnreadCountFromDb,
  fetchNotifsFromDb, markNotifReadInDb, markAllNotifsReadInDb,
} from './services/notifService';
import { saveOrderToDb, saveWithdrawalToDb, fetchWithdrawalsFromDb } from './services/walletService';
import { redeemCodeTransaction } from './services/bonusService';

const AppContext          = createContext(null);
const CHECKIN_BACKUP_KEY = 'smb_checkin_ist';
const SESSION_KEY        = 'smb_session';

export function AppProvider({ children }) {
  const [user,             setUser]             = useState(null);
  const [balance,          setBalance]          = useState(0);
  const [tasksCompleted,   setTasksCompleted]   = useState(0);
  const [referrals,        setReferrals]        = useState(0);
  const [streak,           setStreak]           = useState(0);
  const [loading,          setLoading]          = useState(false);
  const [redeemedCodes,    setRedeemedCodes]    = useState([]);
  const [notifUnreadCount, setNotifUnreadCount] = useState(0);

  const userIdRef  = useRef(null);
  const balanceRef = useRef(0);
  const tasksRef   = useRef(0);

  // ─── Notification helper — DB write + local badge update ─────────────────
  const _addNotification = async (userId, data) => {
    try {
      await addNotifToDb(userId, data);
      if (String(userId) === String(userIdRef.current)) {
        setNotifUnreadCount(prev => prev + 1);
      }
    } catch (e) { console.error('_addNotification err:', e); }
  };

  // ─── loadUser ─────────────────────────────────────────────────────────────
  const loadUser = async (tgUser, mobile = null, referredBy = null) => {
    setLoading(true);
    try {
      const userRef  = doc(db, 'users', String(tgUser.id));
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const existing       = userSnap.data();
        const updatePayload  = { username: tgUser.username ?? null, photo_url: tgUser.photo_url ?? null };
        if (mobile) updatePayload.mobile = mobile;
        await updateDoc(userRef, updatePayload);

        const updated = { id: String(tgUser.id), ...existing, ...updatePayload };
        userIdRef.current  = updated.id;
        balanceRef.current = updated.balance || 0;
        tasksRef.current   = updated.tasks_completed || 0;

        setUser(updated);
        setBalance(updated.balance       || 0);
        setStreak(updated.streak          || 0);
        setTasksCompleted(updated.tasks_completed || 0);
        setReferrals(updated.referral_count || 0);
        setRedeemedCodes(updated.redeemed_codes || []);

        try {
          const count = await fetchUnreadCountFromDb(tgUser.id);
          setNotifUnreadCount(count);
        } catch (_) {}

        if (updated.last_checkin_date) {
          localStorage.setItem(CHECKIN_BACKUP_KEY, updated.last_checkin_date);
        } else {
          localStorage.removeItem(CHECKIN_BACKUP_KEY);
        }

      } else {
        // ── Naya user ──
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

        _addNotification(newUser.id, {
          title: '🎉 Sabka Masti Bazaar mein Swagat!',
          desc:  '+50 welcome coins tumhare wallet mein aa gaye! Games khelo, tasks karo aur aur kamao!',
          icon:  '🎉',
          type:  'welcome',
        });

        if (referredBy) {
          _handleReferral(referredBy, tgUser).catch(e => console.error('Referral error:', e));
        }
      }
    } catch (err) {
      console.error('loadUser error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Referral logic — extracted from loadUser ─────────────────────────────
  const _handleReferral = async (referredBy, tgUser) => {
    const referrerId = String(referredBy).replace(/^SMB/i, '');
    if (!referrerId || referrerId === String(tgUser.id)) return;

    const referrerRef  = doc(db, 'users', referrerId);
    const referrerSnap = await getDoc(referrerRef);
    if (!referrerSnap.exists()) return;

    const referrerData      = referrerSnap.data();
    const newRefCount       = (referrerData.referral_count || 0) + 1;
    const awardedMilestones = referrerData.awarded_milestones || [];
    const MILESTONE_COINS   = { 1: 50, 3: 200, 5: 500, 10: 1200, 25: 3500, 50: 8000 };
    const milestoneBonus    = (MILESTONE_COINS[newRefCount] && !awardedMilestones.includes(newRefCount))
      ? MILESTONE_COINS[newRefCount] : 0;

    const updatePayload = { referral_count: increment(1), balance: increment(50 + milestoneBonus) };
    if (milestoneBonus > 0) updatePayload.awarded_milestones = arrayUnion(newRefCount);
    await updateDoc(referrerRef, updatePayload);

    _addNotification(referrerId, {
      title: '👥 Naya Referral!',
      desc:  `${tgUser.name || 'Ek dost'} ne tumhare link se join kiya! +50 coins mile.`,
      icon:  '👥',
      type:  'referral',
    });
    if (milestoneBonus > 0) {
      _addNotification(referrerId, {
        title: `🏆 Milestone! ${newRefCount} Referrals Complete!`,
        desc:  `${newRefCount} referrals ho gaye! +${milestoneBonus} bonus coins tumhare wallet mein!`,
        icon:  '🏆',
        type:  'milestone',
      });
    }
  };

  // ─── saveMobile ───────────────────────────────────────────────────────────
  const saveMobile = async (mobile) => {
    if (!userIdRef.current || !mobile) return;
    await updateDoc(doc(db, 'users', String(userIdRef.current)), { mobile });
    setUser(prev => prev ? { ...prev, mobile } : prev);
  };

  // ─── addCoins — optimistic update + Firestore ─────────────────────────────
  const addCoins = async (amount) => {
    const newBalance   = balanceRef.current + amount;
    balanceRef.current = newBalance;
    setBalance(newBalance);
    setUser(prev => prev ? { ...prev, balance: newBalance } : prev);
    if (userIdRef.current) {
      try {
        await updateDoc(doc(db, 'users', String(userIdRef.current)), { balance: increment(amount) });
      } catch (e) { console.error('addCoins err:', e); }
    }
  };

  // ─── deductCoins — transaction (race-condition safe) ─────────────────────
  const deductCoins = async (amount) => {
    if (!userIdRef.current) return false;
    try {
      const { runTransaction } = await import('firebase/firestore');
      const userRef = doc(db, 'users', String(userIdRef.current));
      let actualDeducted = 0;
      let success        = false;

      await runTransaction(db, async (txn) => {
        const snap = await txn.get(userRef);
        if (!snap.exists()) throw new Error('User not found');
        const currentBalance = snap.data().balance || 0;
        if (currentBalance < amount) return;
        const newBalance = currentBalance - amount;
        actualDeducted   = amount;
        success          = true;
        txn.update(userRef, { balance: newBalance });
      });

      if (!success) return false;
      const newBalance   = Math.max(0, balanceRef.current - actualDeducted);
      balanceRef.current = newBalance;
      setBalance(newBalance);
      setUser(prev => prev ? { ...prev, balance: newBalance } : prev);
      return true;
    } catch (e) {
      console.error('deductCoins err:', e);
      return false;
    }
  };

  // ─── completeTask ─────────────────────────────────────────────────────────
  const completeTask = async (coins) => {
    const newBalance   = balanceRef.current + coins;
    const newTasks     = tasksRef.current   + 1;
    balanceRef.current = newBalance;
    tasksRef.current   = newTasks;
    setBalance(newBalance);
    setTasksCompleted(newTasks);
    setUser(prev => prev ? { ...prev, balance: newBalance, tasks_completed: newTasks } : prev);
    if (userIdRef.current) {
      try {
        await updateDoc(doc(db, 'users', String(userIdRef.current)), {
          balance:         increment(coins),
          tasks_completed: increment(1),
        });
      } catch (e) { console.error('completeTask err:', e); }
    }
  };

  // ─── updateCheckIn ────────────────────────────────────────────────────────
  const updateCheckIn = async (newStreak, totalDays, lastDate, coinsEarned) => {
    const newBalance   = balanceRef.current + coinsEarned;
    balanceRef.current = newBalance;
    setBalance(newBalance);
    setStreak(newStreak);
    setUser(prev => prev ? { ...prev, balance: newBalance, streak: newStreak, total_checkins: totalDays, last_checkin_date: lastDate } : prev);
    localStorage.setItem(CHECKIN_BACKUP_KEY, lastDate);
    if (userIdRef.current) {
      try {
        await updateDoc(doc(db, 'users', String(userIdRef.current)), {
          balance: increment(coinsEarned), streak: newStreak, total_checkins: totalDays, last_checkin_date: lastDate,
        });
        _addNotification(userIdRef.current, {
          title: `🎁 Daily Check-in Bonus!`,
          desc:  `+${coinsEarned} coins mile! ${newStreak} din ki streak — Keep it up! 🔥`,
          icon:  '🎁',
          type:  'checkin',
        });
      } catch (e) { console.error('updateCheckIn err:', e); }
    }
  };

  // ─── updateUserName ───────────────────────────────────────────────────────
  const updateUserName = async (newName) => {
    if (!userIdRef.current || !newName) return;
    await updateDoc(doc(db, 'users', String(userIdRef.current)), { name: newName });
    setUser(prev => prev ? { ...prev, name: newName } : prev);
  };

  // ─── saveOrder — via walletService ───────────────────────────────────────
  const saveOrder = async (orderData) => {
    if (!userIdRef.current) return;
    try {
      await saveOrderToDb({
        ...orderData,
        userId:    String(userIdRef.current),
        userName:  user?.name   || null,
        userPhone: user?.mobile || null,
        status:    'pending',
      });
    } catch (e) { console.error('saveOrder err:', e); }
  };

  // ─── saveWithdrawal — via walletService ──────────────────────────────────
  const saveWithdrawal = async (entry) => {
    if (!userIdRef.current) return;
    await saveWithdrawalToDb({
      ...entry,
      userId:    String(userIdRef.current),
      userName:  user?.name   || null,
      userPhone: user?.mobile || null,
    });
  };

  // ─── fetchWithdrawals — via walletService ────────────────────────────────
  const fetchWithdrawals = async () => fetchWithdrawalsFromDb(userIdRef.current);

  // ─── markCodeRedeemed ─────────────────────────────────────────────────────
  const markCodeRedeemed = async (code) => {
    if (!userIdRef.current) return;
    try {
      await updateDoc(doc(db, 'users', String(userIdRef.current)), { redeemed_codes: arrayUnion(code) });
      setRedeemedCodes(prev => [...prev, code]);
    } catch (e) { console.error('markCodeRedeemed err:', e); }
  };

  // ─── redeemBonusCode — via bonusService ──────────────────────────────────
  const redeemBonusCode = async (code) => {
    if (!userIdRef.current) throw new Error('NOT_LOGGED_IN');
    const { coinsEarned, codeDesc } = await redeemCodeTransaction(userIdRef.current, code);
    const newBalance   = balanceRef.current + coinsEarned;
    balanceRef.current = newBalance;
    setBalance(newBalance);
    setUser(prev => prev ? { ...prev, balance: newBalance } : prev);
    setRedeemedCodes(prev => [...prev, code]);
    return { coins: coinsEarned, desc: codeDesc };
  };

  // ─── fetchNotifications — via notifService ───────────────────────────────
  const fetchNotifications = async () => fetchNotifsFromDb(userIdRef.current);

  // ─── markNotifRead — via notifService ────────────────────────────────────
  const markNotifRead = async (notifId) => {
    try {
      await markNotifReadInDb(notifId);
      setNotifUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) { console.error('markNotifRead err:', e); }
  };

  // ─── markAllNotifsRead — via notifService ────────────────────────────────
  const markAllNotifsRead = async (notifIds) => {
    try {
      await markAllNotifsReadInDb(notifIds);
      setNotifUnreadCount(0);
    } catch (e) { console.error('markAllNotifsRead err:', e); }
  };

  return (
    <AppContext.Provider value={{
      user, balance, streak, tasksCompleted, referrals, loading,
      loadUser, saveMobile, addCoins, deductCoins,
      completeTask, updateCheckIn, updateUserName,
      saveOrder, saveWithdrawal, fetchWithdrawals,
      redeemedCodes, markCodeRedeemed, redeemBonusCode,
      notifUnreadCount, fetchNotifications, markNotifRead, markAllNotifsRead,
      CHECKIN_BACKUP_KEY, SESSION_KEY,
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
