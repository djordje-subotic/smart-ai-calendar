// Rebrand Krowna → Krowna shipped with renamed localStorage keys.
// migrateLocalStorageKey reads the new key first; if absent it copies the old
// key value into the new key and clears the old. Safe to remove this helper
// (and its callers) one release after rollout.
export function migrateLocalStorageKey(oldKey: string, newKey: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const current = localStorage.getItem(newKey);
    if (current !== null) return current;
    const legacy = localStorage.getItem(oldKey);
    if (legacy !== null) {
      localStorage.setItem(newKey, legacy);
      localStorage.removeItem(oldKey);
      return legacy;
    }
  } catch {}
  return null;
}
