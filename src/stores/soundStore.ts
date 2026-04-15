import { create } from "zustand";
import { migrateLocalStorageKey } from "@/src/lib/storageMigration";

interface SoundState {
  soundEnabled: boolean;
  toggleSound: () => void;
  setSoundEnabled: (enabled: boolean) => void;
}

export const useSoundStore = create<SoundState>((set) => ({
  soundEnabled: typeof window !== "undefined" ? migrateLocalStorageKey("krowna-sounds", "krowna-sounds") !== "false" : true,
  toggleSound: () => set((s) => {
    const next = !s.soundEnabled;
    localStorage.setItem("krowna-sounds", String(next));
    return { soundEnabled: next };
  }),
  setSoundEnabled: (enabled) => {
    localStorage.setItem("krowna-sounds", String(enabled));
    set({ soundEnabled: enabled });
  },
}));
