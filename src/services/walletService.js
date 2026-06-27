import { db } from '../lib/firebase';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';

export async function saveOrderToDb(orderData) {
  await addDoc(collection(db, 'orders'), {
    ...orderData,
    createdAt: new Date().toISOString(),
  });
}

export async function saveWithdrawalToDb(withdrawalData) {
  await addDoc(collection(db, 'withdrawals'), {
    ...withdrawalData,
    createdAt: new Date().toISOString(),
  });
}

export async function fetchWithdrawalsFromDb(userId) {
  if (!userId) return [];
  const q    = query(collection(db, 'withdrawals'), where('userId', '==', String(userId)));
  const snap = await getDocs(q);
  const results = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
  results.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return results;
}
