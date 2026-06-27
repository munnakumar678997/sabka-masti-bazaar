import { db } from '../lib/firebase';
import {
  addDoc, collection, getDocs, query, where, updateDoc, doc,
} from 'firebase/firestore';

export async function addNotifToDb(userId, { title, desc, icon, type }) {
  if (!userId) return;
  await addDoc(collection(db, 'notifications'), {
    userId:    String(userId),
    title,
    desc,
    icon,
    type:      type || 'general',
    read:      false,
    createdAt: new Date().toISOString(),
  });
}

export async function fetchUnreadCountFromDb(userId) {
  if (!userId) return 0;
  const q    = query(
    collection(db, 'notifications'),
    where('userId', '==', String(userId)),
    where('read',   '==', false),
  );
  const snap = await getDocs(q);
  return snap.docs.length;
}

export async function fetchNotifsFromDb(userId) {
  if (!userId) return [];
  const q    = query(collection(db, 'notifications'), where('userId', '==', String(userId)));
  const snap = await getDocs(q);
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  results.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return results;
}

export async function markNotifReadInDb(notifId) {
  if (!notifId) return;
  await updateDoc(doc(db, 'notifications', notifId), { read: true });
}

export async function markAllNotifsReadInDb(notifIds) {
  if (!notifIds || notifIds.length === 0) return;
  await Promise.all(notifIds.map(id => updateDoc(doc(db, 'notifications', id), { read: true })));
}
