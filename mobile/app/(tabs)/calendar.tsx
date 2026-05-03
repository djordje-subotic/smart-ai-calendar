import { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { getCached, setCached } from "../../src/lib/offlineCache";
import { useAuthStore } from "../../src/stores/authStore";
import { colors } from "../../src/constants/colors";
import { NotificationBell } from "../../src/components/NotificationBell";
import { EventModal, EditableEvent } from "../../src/components/EventModal";
import { EventQuickActions } from "../../src/components/EventQuickActions";
import { CalendarDrawer, CalendarView } from "../../src/components/CalendarDrawer";
import { MonthPicker } from "../../src/components/MonthPicker";
import { MonthView } from "../../src/components/calendar-views/MonthView";
import { DayView } from "../../src/components/calendar-views/DayView";
import { ScheduleView } from "../../src/components/calendar-views/ScheduleView";
import { MultiDayView } from "../../src/components/calendar-views/MultiDayView";
import { haptic } from "../../src/lib/haptics";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths } from "date-fns";

interface CalendarEvent {
  id: string; title: string; description: string | null; start_time: string; end_time: string;
  color: string; location: string | null; meeting_url: string | null; source: string;
  recurrence_rule?: any;
}

export default function CalendarScreen() {
  const { user } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EditableEvent | null>(null);
  const [quickActionsEvent, setQuickActionsEvent] = useState<CalendarEvent | null>(null);
  const [view, setView] = useState<CalendarView>("month");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadEvents = useCallback(async () => {
    const monthKey = `cal:${selectedDate.getFullYear()}-${selectedDate.getMonth()}`;

    // Paint cached first so the grid never looks empty while offline
    const cached = await getCached<CalendarEvent[]>(monthKey);
    if (cached) setEvents(cached);

    const start = startOfWeek(startOfMonth(subMonths(selectedDate, 1)));
    const end = endOfWeek(endOfMonth(addMonths(selectedDate, 1)));
    try {
      const { data } = await supabase.from("events").select("*")
        .lte("start_time", end.toISOString()).gte("end_time", start.toISOString())
        .order("start_time");
      const fresh = data || [];
      setEvents(fresh);
      await setCached(monthKey, fresh, { ttl: 6 * 60 * 60 * 1000 });
    } catch {
      // Offline — keep cached value
    }
  }, [selectedDate]);

  useEffect(() => { loadEvents(); }, [loadEvents]);
  useFocusEffect(useCallback(() => { loadEvents(); }, [loadEvents]));

  function openEdit(event: CalendarEvent) {
    setEditingEvent({
      id: event.id, title: event.title, description: event.description, location: event.location,
      start_time: event.start_time, end_time: event.end_time, color: event.color,
      meeting_url: event.meeting_url, recurrence_rule: event.recurrence_rule,
    });
    setModalVisible(true);
  }

  function openNewAt(day: Date, hour: number = 9) {
    const start = new Date(day);
    start.setHours(hour, 0, 0, 0);
    setEditingEvent({
      title: "", description: null, location: null,
      start_time: start.toISOString(),
      end_time: new Date(start.getTime() + 3600000).toISOString(),
      color: "#3B82F6", meeting_url: null,
    });
    setModalVisible(true);
  }

  async function handleEventMove(eventId: string, newStart: Date) {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;
    const duration = new Date(event.end_time).getTime() - new Date(event.start_time).getTime();
    const newEnd = new Date(newStart.getTime() + duration);

    // Optimistic update
    setEvents(events.map((e) => e.id === eventId ? { ...e, start_time: newStart.toISOString(), end_time: newEnd.toISOString() } : e));
    try {
      await supabase.from("events").update({
        start_time: newStart.toISOString(),
        end_time: newEnd.toISOString(),
      }).eq("id", eventId);
      haptic.success();
    } catch {
      haptic.error();
      loadEvents(); // revert
    }
  }

  // Title based on view
  const title = view === "month" ? format(selectedDate, "MMMM") :
                view === "day" ? format(selectedDate, "MMM d") :
                view === "schedule" ? "Schedule" :
                format(selectedDate, "MMM");

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => setDrawerOpen(true)} style={s.iconBtn} activeOpacity={0.6}>
          <Ionicons name="menu" size={24} color={colors.foreground} />
        </TouchableOpacity>

        <TouchableOpacity style={s.titleBtn} activeOpacity={0.7} onPress={() => setSelectedDate(new Date())}>
          <Text style={s.title}>{title}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.muted} />
        </TouchableOpacity>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <NotificationBell />
          <TouchableOpacity style={s.iconBtn} activeOpacity={0.6} onPress={() => setSelectedDate(new Date())}>
            <View style={s.todayIcon}>
              <Text style={s.todayIconText}>{format(new Date(), "d")}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Month picker (horizontal scroll) */}
      {view !== "schedule" && (
        <MonthPicker selected={selectedDate} onSelect={setSelectedDate} />
      )}

      {/* Content */}
      <View style={{ flex: 1 }}>
        {view === "month" && (
          <MonthView date={selectedDate} events={events} onDayPress={(day) => { setSelectedDate(day); setView("day"); }} />
        )}
        {view === "day" && (
          <DayView
            date={selectedDate}
            events={events}
            onEventPress={openEdit}
            onEventMove={handleEventMove}
            onEmptyPress={(hour) => openNewAt(selectedDate, hour)}
          />
        )}
        {view === "schedule" && (
          <ScheduleView date={selectedDate} events={events} onEventPress={openEdit} />
        )}
        {view === "3day" && (
          <MultiDayView
            date={selectedDate}
            days={3}
            events={events}
            onEventPress={openEdit}
            onEmptyPress={(day, hour) => openNewAt(day, hour)}
          />
        )}
        {view === "week" && (
          <MultiDayView
            date={selectedDate}
            days={7}
            events={events}
            onEventPress={openEdit}
            onEmptyPress={(day, hour) => openNewAt(day, hour)}
          />
        )}
      </View>

      {/* FAB */}
      <TouchableOpacity
        style={s.fab}
        onPress={() => { haptic.light(); openNewAt(selectedDate, new Date().getHours() + 1); }}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={colors.primaryForeground} />
      </TouchableOpacity>

      <EventModal
        visible={modalVisible}
        event={editingEvent}
        onClose={() => setModalVisible(false)}
        onSaved={loadEvents}
      />

      <EventQuickActions
        visible={quickActionsEvent !== null}
        event={quickActionsEvent}
        onClose={() => setQuickActionsEvent(null)}
        onDone={loadEvents}
        onEdit={() => { if (quickActionsEvent) openEdit(quickActionsEvent); }}
      />

      <CalendarDrawer
        visible={drawerOpen}
        view={view}
        onSelectView={setView}
        onClose={() => setDrawerOpen(false)}
        userEmail={user?.email}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 8, paddingVertical: 6 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  titleBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 8 },
  title: { fontSize: 22, fontWeight: "700", color: colors.foreground },
  todayIcon: {
    width: 28, height: 28, borderRadius: 6,
    borderWidth: 2, borderColor: colors.foreground,
    justifyContent: "center", alignItems: "center",
  },
  todayIconText: { fontSize: 10, fontWeight: "900", color: colors.foreground },
  fab: {
    position: "absolute",
    right: 20, bottom: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: "center", alignItems: "center",
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 12,
  },
});
