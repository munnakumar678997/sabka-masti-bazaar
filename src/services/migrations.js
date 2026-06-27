/**
 * ============================================================
 *  SABKA MASTI BAZAAR — FIRESTORE USER SCHEMA MIGRATIONS
 * ============================================================
 *
 *  YEH FILE PERMANENT HAI — DELETE MAT KARNA
 *
 *  Kab use karna hai:
 *  Jab bhi Firebase ke 'users' collection mein koi NAYA FIELD add
 *  karna ho, to bas yahan ek naya migration entry likhdo aur
 *  SCHEMA_VERSION ko +1 kar do. Baaki sab automatic hoga.
 *
 *  Kaise kaam karta hai:
 *  - Har user document mein ek `schema_version` number hoga
 *  - Jab user login karta hai, uski version check hoti hai
 *  - Agar version purani hai, toh missing migrations automatically
 *    apply ho jaati hain (sirf wahi jo abhi tak apply nahi hui)
 *  - User ko pata bhi nahi chalta — silently update hota hai
 *
 *  ============================================================
 *  NAYA MIGRATION KAISE ADD KAREIN  (3 steps):
 *  ============================================================
 *
 *  Step 1: SCHEMA_VERSION ko +1 karo
 *            (neeche wali line mein sirf number badhao)
 *
 *  Step 2: MIGRATIONS array mein ek naya object add karo:
 *  {
 *    version:     <SCHEMA_VERSION ka naya number>,
 *    description: 'Kya add kiya — briefly',
 *    apply: (userData) => {
 *      const fields = {};
 *      // Sirf wo fields add karo jo is version mein nayi hain
 *      // userData = purana user document (jo Firebase mein hai)
 *      // Return karo sirf wo fields jo missing hain
 *      if (userData.naya_field === undefined)
 *        fields.naya_field = defaultValue;
 *      return fields;
 *    },
 *  }
 *
 *  Step 3: AppContext.jsx mein kuch NAHI karna — automatic chalega
 *
 *  ============================================================
 */

// ✅ CURRENT VERSION — jab bhi naya migration add karo, yahan +1 karo
export const SCHEMA_VERSION = 1;

/**
 * Migrations list — version ascending order mein honi chahiye
 *
 * apply(userData) — purana user data milega
 * Return karo object jisme sirf naye / missing fields ho
 * Agar koi field already hai toh usse touch mat karo
 */
export const MIGRATIONS = [

  // ─────────────────────────────────────────────────────────
  //  v0 → v1
  //  Added: created_at, last_active_at, total_coins_earned,
  //         total_coins_spent
  //  Date:  June 2026
  // ─────────────────────────────────────────────────────────
  {
    version:     1,
    description: 'User activity timestamps + lifetime coin tracking',
    apply: (userData) => {
      const fields = {};
      const now    = new Date().toISOString();

      if (!userData.created_at)
        fields.created_at         = now;

      if (!userData.last_active_at)
        fields.last_active_at     = now;

      if (userData.total_coins_earned === undefined)
        fields.total_coins_earned = userData.balance || 0;

      if (userData.total_coins_spent === undefined)
        fields.total_coins_spent  = 0;

      return fields;
    },
  },

  // ─────────────────────────────────────────────────────────
  //  YAHAN NAYA MIGRATION ADD KARO jab zarurat ho
  //  Example (ye sirf template hai, uncomment mat karna):
  //
  // {
  //   version:     2,
  //   description: 'Add XYZ field — brief reason',
  //   apply: (userData) => {
  //     const fields = {};
  //     if (userData.xyz_field === undefined)
  //       fields.xyz_field = 0;
  //     return fields;
  //   },
  // },
  // ─────────────────────────────────────────────────────────

];

/**
 * applyPendingMigrations
 *
 * Yeh function AppContext.jsx call karta hai — seedha use mat karna
 *
 * @param {object} userData   — Firebase se aaya existing user object
 * @returns {object|null}     — Sirf wo fields jo update karni hain,
 *                              ya null agar koi migration pending nahi
 */
export function applyPendingMigrations(userData) {
  const currentVersion = userData.schema_version || 0;
  if (currentVersion >= SCHEMA_VERSION) return null;

  const pendingMigrations = MIGRATIONS.filter(m => m.version > currentVersion);
  if (pendingMigrations.length === 0) return null;

  const fieldsToUpdate = {};
  for (const migration of pendingMigrations) {
    const newFields = migration.apply(userData);
    Object.assign(fieldsToUpdate, newFields);
  }

  fieldsToUpdate.schema_version = SCHEMA_VERSION;
  return fieldsToUpdate;
}
