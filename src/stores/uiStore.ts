import { create } from "zustand";

interface UIState {
  isEventModalOpen: boolean;
  editingEventId: string | null;
  isSidebarOpen: boolean;
  isCommandPaletteOpen: boolean;
  openEventModal: (eventId?: string) => void;
  closeEventModal: () => void;
  toggleSidebar: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isEventModalOpen: false,
  editingEventId: null,
  isSidebarOpen: true,
  isCommandPaletteOpen: false,
  openEventModal: (eventId) =>
    set({ isEventModalOpen: true, editingEventId: eventId ?? null }),
  closeEventModal: () =>
    set({ isEventModalOpen: false, editingEventId: null }),
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
}));
