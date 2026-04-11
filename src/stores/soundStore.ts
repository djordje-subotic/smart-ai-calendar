import { create } from "zustand";

interface SoundState {
  soundEnabled: boolean;
  toggleSound: () => void;
  setSoundEnabled: (enabled: boolean) => void;
}

export const useSoundStore = create<SoundState>((set) => ({
  soundEnabled: typeof window !== "undefined" ? localStorage.getItem("kron-sounds") !== "false" : true,
  toggleSound: () => set((s) => {
    const next = !s.soundEnabled;
    localStorage.setItem("kron-sounds", String(next));
    return { soundEnabled: next };
  }),
  setSoundEnabled: (enabled) => {
    localStorage.setItem("kron-sounds", String(enabled));
    set({ soundEnabled: enabled });
  },
}));
