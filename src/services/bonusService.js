import { db } from '../lib/firebase';
import { doc, runTransaction, arrayUnion, updateDoc } from 'firebase/firestore';

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

export async function redeemCodeTransaction(userId, code) {
  const userRef = doc(db, 'users', String(userId));
  const codeRef = doc(db, 'bonus_codes', code);
  let coinsEarned = 0;
  let codeDesc    = '';

  await runTransaction(db, async (txn) => {
    const userSnap = await txn.get(userRef);
    if (!userSnap.exists()) throw new Error('USER_NOT_FOUND');

    const userRedeemed = userSnap.data().redeemed_codes || [];
    if (userRedeemed.includes(code)) throw new Error('ALREADY_USED');

    let coins = 0, desc = '';
    const fsCodeSnap = await txn.get(codeRef);
    if (fsCodeSnap.exists()) {
      coins = fsCodeSnap.data().coins || 0;
      desc  = fsCodeSnap.data().desc  || '';
    } else {
      const fallback = VALID_CODES_FALLBACK[code];
      if (!fallback) throw new Error('INVALID_CODE');
      coins = fallback.coins;
      desc  = fallback.desc;
    }

    coinsEarned = coins;
    codeDesc    = desc;

    const currentBalance = userSnap.data().balance || 0;
    txn.update(userRef, {
      balance:        currentBalance + coins,
      redeemed_codes: arrayUnion(code),
    });
  });

  return { coinsEarned, codeDesc };
}

// ─── Bonus code redemption history Firebase mein save karo ───────────────────
// Har successful redemption ka record — cross-device visible hoga
export async function saveBonusHistoryToDb(userId, entry) {
  if (!userId) return;
  try {
    await updateDoc(doc(db, 'users', String(userId)), {
      bonus_history: arrayUnion(entry),
    });
  } catch (e) {
    console.error('saveBonusHistoryToDb err:', e);
  }
}
