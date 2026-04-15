import { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { getCached, setCached } from "../../src/lib/offlineCache";
import { syncEventReminders } from "../../src/lib/notifications";
import { colors } from "../../src/constants/colors";
import { KrownaLogo } from "../../src/components/KrownaLogo";
import { NotificationBell } from "../../src/components/NotificationBell";
import { EventModal, EditableEvent } from "../../src/components/EventModal";
import { EventQuickActions } from "../../src/components/EventQuickActions";
import { haptic } from "../../src/lib/haptics";
import { ScheduleScore } from "../../src/components/widgets/ScheduleScore";
import { UpcomingEvents } from "../../src/components/widgets/UpcomingEvents";
import { DailyBriefing } from "../../src/components/widgets/DailyBriefing";
import { NudgeBanner } from "../../src/components/widgets/NudgeBanner";
import { ReplanButton } from "../../src/components/widgets/ReplanButton";
import { InvitePanel } from "../../src/components/InvitePanel";
import { format } from "date-fns";

interface Event {
  id: string; title: string; description: string | null; start_time: string; end_time: string;
  color: string; location: string | null; meeting_url: string | null; source: string;
  recurrence_rule?: any;
}

export default function TodayScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Array<{ id: string; title: string; status: string; priority: string }>>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EditableEvent | null>(null);
  const [quickActionsEvent, setQuickActionsEvent] = useState<Event | null>(null);
  const today = new Date();

  const loadToday = useCallback(async () => {
    const cacheKey = `today:${today.toISOString().split("T")[0]}`;

    // Show cached data first so the UI never blocks on the network.
    const cached = await getCached<{ events: Event[]; tasks: typeof tasks }>(cacheKey);
    if (cached) {
      setEvents(cached.events);
      setTasks(cached.tasks);
    }

    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();
    try {
      const [eventsRes, tasksRes] = await Promise.all([
        supabase.from("events").select("*").gte("start_time", start).lte("start_time", end).order("start_time"),
        supabase.from("tasks").select("id, title, status, priority").eq("due_date", today.toISOString().split("T")[0]).neq("status", "done"),
      ]);
      const fresh = { events: eventsRes.data || [], tasks: tasksRes.data || [] };
      setEvents(fresh.events);
      setTasks(fresh.tasks);
      // 6h TTL — we only use it as a fallback while offline
      await setCached(cacheKey, fresh, { ttl: 6 * 60 * 60 * 1000 });
      // Replace pending local notifications with fresh reminders
      syncEventReminders(fresh.events).catch(() => {});
    } catch {
      // Network failed — leave whatever cached values we already painted.
    }
  }, []);

  useFocusEffect(useCallback(() => { loadToday(); }, [loadToday]));
  useEffect(() => { loadToday(); }, []);

  const now = new Date();
  const upcoming = events.filter((e) => new Date(e.start_time) > now);

  function openNew() { setEditingEvent(null); setModalVisible(true); }
  function openEdit(event: Event) {
    setEditingEvent({
      id: event.id, title: event.title, description: event.description, location: event.location,
      start_time: event.start_time, end_time: event.end_time, color: event.color,
      meeting_url: event.meeting_url, recurrence_rule: event.recurrence_rule,
    });
    setModalVisible(true);
  }

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <KrownaLogo size="sm" showText={false} />
        <View style={{ flex: 1 }}>
          <Text style={s.greeting}>Today</Text>
          <Text style={s.date}>{format(today, "EEEE, MMMM d")}</Text>
        </View>
        <NotificationBell />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Stats + Replan */}
        <View style={s.topRow}>
          <View style={s.statsCol}>
            <View style={s.statsRow}>
              {[
                { value: events.length, label: "Events", color: colors.blue },
                { value: tasks.length, label: "Tasks", color: colors.violet },
                { value: upcoming.length, label: "Coming up", color: colors.primary },
              ].map((stat) => (
                <View key={stat.label} style={s.statCard}>
                  <Text style={[s.statValue, { color: stat.color }]}>{stat.value}</Text>
                  <Text style={s.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Schedule score + Replan */}
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <ScheduleScore events={events} />
          </View>
        </View>
        <ReplanButton />

        {/* Daily Briefing */}
        <DailyBriefing />

        {/* Nudges */}
        <NudgeBanner events={events} />

        {/* Event Invites */}
        <InvitePanel />

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <UpcomingEvents events={upcoming} onEventPress={openEdit} />
        )}

        {/* All events */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>All events today</Text>
          <TouchableOpacity onPress={openNew} style={s.newBtn} activeOpacity={0.8}>
            <Ionicons name="add" size={16} color={colors.primaryForeground} />
            <Text style={s.newBtnText}>New</Text>
          </TouchableOpacity>
        </View>

        {events.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="sunny-outline" size={32} color={colors.primary + "60"} />
            <Text style={s.emptyTitle}>Your day is open</Text>
            <Text style={s.emptyHint}>Ask Krowna AI or tap New to plan</Text>
          </View>
        ) : (
          events.map((item) => {
            const startTime = new Date(item.start_time);
            const isPast = startTime < now;
            return (
              <TouchableOpacity
                key={item.id}
                style={[s.eventCard, { borderLeftColor: item.color, opacity: isPast ? 0.5 : 1 }]}
                onPress={() => openEdit(item)}
                onLongPress={() => { haptic.medium(); setQuickActionsEvent(item); }}
                delayLongPress={400}
                activeOpacity={0.7}
              >
                <View style={[s.eventTimeBox, { backgroundColor: item.color + "12" }]}>
                  <Text style={[s.eventTimeText, { color: item.color }]}>{format(startTime, "HH:mm")}</Text>
                </View>
                <View style={s.eventContent}>
                  <View style={s.eventTitleRow}>
                    <Text style={s.eventTitle} numberOfLines={1}>{item.title}</Text>
                    {item.source === "ai" && <Ionicons name="sparkles" size={10} color={colors.primary} />}
                  </View>
                  {item.location && <Text style={s.eventLocation}>📍 {item.location}</Text>}
                  <Text style={s.eventEndTime}>until {format(new Date(item.end_time), "HH:mm")}</Text>
                </View>
                {item.meeting_url && (
                  <TouchableOpacity
                    style={s.joinBtn}
                    onPress={() => Linking.openURL(item.meeting_url!).catch(() => {})}
                  >
                    <Ionicons name="videocam" size={14} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      <EventModal
        visible={modalVisible}
        event={editingEvent}
        onClose={() => setModalVisible(false)}
        onSaved={loadToday}
      />

      <EventQuickActions
        visible={quickActionsEvent !== null}
        event={quickActionsEvent}
        onClose={() => setQuickActionsEvent(null)}
        onDone={loadToday}
        onEdit={() => { if (quickActionsEvent) openEdit(quickActionsEvent); }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  greeting: { fontSize: 24, fontWeight: "900", color: colors.foreground },
  date: { fontSize: 12, color: colors.muted, marginTop: 1 },
  scroll: { padding: 16, gap: 12 },
  topRow: {},
  statsCol: {},
  statsRow: { flexDirection: "row", gap: 8 },
  statCard: { flex: 1, backgroundColor: colors.card, borderRadius: 14, padding: 12, alignItems: "center", borderWidth: 1, borderColor: colors.border },
  statValue: { fontSize: 22, fontWeight: "900" },
  statLabel: { fontSize: 10, color: colors.muted, fontWeight: "600", marginTop: 2, letterSpacing: 0.5 },
  row: { flexDirection: "row", gap: 8 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8, marginBottom: 4 },
  sectionTitle: { fontSize: 11, color: colors.muted, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  newBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  newBtnText: { fontSize: 12, fontWeight: "800", color: colors.primaryForeground },
  emptyState: { alignItems: "center", paddingVertical: 30, gap: 4 },
  emptyTitle: { fontSize: 14, fontWeight: "700", color: colors.foreground, marginTop: 6 },
  emptyHint: { fontSize: 11, color: colors.muted },
  eventCard: { flexDirection: "row", alignItems: "stretch", backgroundColor: colors.card, borderRadius: 14, borderLeftWidth: 3, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  eventTimeBox: { paddingVertical: 12, paddingHorizontal: 12, justifyContent: "center", alignItems: "center", minWidth: 58 },
  eventTimeText: { fontSize: 13, fontWeight: "800", fontVariant: ["tabular-nums"] },
  eventContent: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, justifyContent: "center" },
  eventTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  eventTitle: { fontSize: 14, fontWeight: "600", color: colors.foreground, flex: 1 },
  eventLocation: { fontSize: 11, color: colors.muted, marginTop: 3 },
  eventEndTime: { fontSize: 10, color: colors.muted, marginTop: 2 },
  joinBtn: { paddingHorizontal: 14, justifyContent: "center", alignItems: "center", backgroundColor: colors.primary + "10" },
});
