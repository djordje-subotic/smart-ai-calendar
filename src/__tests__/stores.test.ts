import { describe, it, expect, beforeEach } from "vitest";

type UIStore = typeof import("@/src/stores/uiStore")["useUIStore"];
type CalendarStore = typeof import("@/src/stores/calendarStore")["useCalendarStore"];

describe("UI Store", () => {
  let useUIStore: UIStore;

  beforeEach(async () => {
    const mod = await import("@/src/stores/uiStore");
    useUIStore = mod.useUIStore;
    // Reset state
    useUIStore.setState({
      isEventModalOpen: false,
      editingEventId: null,
      prefillStartTime: null,
      prefillEndTime: null,
      isSidebarOpen: true,
      isMobileMenuOpen: false,
      isCommandPaletteOpen: false,
    });
  });

  it("should start with modal closed", () => {
    const state = useUIStore.getState();
    expect(state.isEventModalOpen).toBe(false);
    expect(state.editingEventId).toBeNull();
  });

  it("should open event modal", () => {
    useUIStore.getState().openEventModal("test-id");
    const state = useUIStore.getState();
    expect(state.isEventModalOpen).toBe(true);
    expect(state.editingEventId).toBe("test-id");
  });

  it("should open event modal without ID for new event", () => {
    useUIStore.getState().openEventModal();
    const state = useUIStore.getState();
    expect(state.isEventModalOpen).toBe(true);
    expect(state.editingEventId).toBeNull();
  });

  it("should close event modal and reset", () => {
    useUIStore.getState().openEventModal("test-id");
    useUIStore.getState().closeEventModal();
    const state = useUIStore.getState();
    expect(state.isEventModalOpen).toBe(false);
    expect(state.editingEventId).toBeNull();
    expect(state.prefillStartTime).toBeNull();
  });

  it("should open modal with prefilled time", () => {
    useUIStore.getState().openEventModalWithTime("09:00", "10:00");
    const state = useUIStore.getState();
    expect(state.isEventModalOpen).toBe(true);
    expect(state.prefillStartTime).toBe("09:00");
    expect(state.prefillEndTime).toBe("10:00");
    expect(state.editingEventId).toBeNull();
  });

  it("should toggle sidebar", () => {
    expect(useUIStore.getState().isSidebarOpen).toBe(true);
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().isSidebarOpen).toBe(false);
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().isSidebarOpen).toBe(true);
  });

  it("should set mobile menu state", () => {
    expect(useUIStore.getState().isMobileMenuOpen).toBe(false);
    useUIStore.getState().setMobileMenuOpen(true);
    expect(useUIStore.getState().isMobileMenuOpen).toBe(true);
    useUIStore.getState().setMobileMenuOpen(false);
    expect(useUIStore.getState().isMobileMenuOpen).toBe(false);
  });

  it("should set command palette state", () => {
    expect(useUIStore.getState().isCommandPaletteOpen).toBe(false);
    useUIStore.getState().setCommandPaletteOpen(true);
    expect(useUIStore.getState().isCommandPaletteOpen).toBe(true);
  });
});

describe("Calendar Store", () => {
  let useCalendarStore: CalendarStore;

  beforeEach(async () => {
    const mod = await import("@/src/stores/calendarStore");
    useCalendarStore = mod.useCalendarStore;
  });

  it("should default to month view", () => {
    const state = useCalendarStore.getState();
    expect(state.view).toBe("month");
  });

  it("should change view", () => {
    useCalendarStore.getState().setView("week");
    expect(useCalendarStore.getState().view).toBe("week");
    useCalendarStore.getState().setView("day");
    expect(useCalendarStore.getState().view).toBe("day");
  });

  it("should set selected date", () => {
    const testDate = new Date(2026, 5, 15);
    useCalendarStore.getState().setSelectedDate(testDate);
    expect(useCalendarStore.getState().selectedDate.getTime()).toBe(testDate.getTime());
  });
});
