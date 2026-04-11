import { create } from "zustand";

interface UIState {
  isEventModalOpen: boolean;
  editingEventId: string | null;
  prefillStartTime: string | null;
  prefillEndTime: string | null;
  isSidebarOpen: boolean;
  isCommandPaletteOpen: boolean;
  openEventModal: (eventId?: string) => void;
  openEventModalWithTime: (startTime: string, endTime: string) => void;
  closeEventModal: () => void;
  toggleSidebar: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isEventModalOpen: false,
  editingEventId: null,
  prefillStartTime: null,
  prefillEndTime: null,
  isSidebarOpen: true,
  isCommandPaletteOpen: false,
  openEventModal: (eventId) =>
    set({ isEventModalOpen: true, editingEventId: eventId ?? null, prefillStartTime: null, prefillEndTime: null }),
  openEventModalWithTime: (startTime, endTime) =>
    set({ isEventModalOpen: true, editingEventId: null, prefillStartTime: startTime, prefillEndTime: endTime }),
  closeEventModal: () =>
    set({ isEventModalOpen: false, editingEventId: null, prefillStartTime: null, prefillEndTime: null }),
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
}));
