import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/colors";
import { format, isToday, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";

interface ScheduleEvent {
  id: string; title: string; start_time: string; end_time: string; color: string;
  location: string | null; meeting_url: string | null; source: string;
}

interface Props<T extends ScheduleEvent> {
  date: Date;
  events: T[];
  onEventPress: (event: T) => void;
}

export function ScheduleView<T extends ScheduleEvent>({ date, events, onEventPress }: Props<T>) {
  // Group events by day
  const days = eachDayOfInterval({ start: startOfMonth(date), end: endOfMonth(date) });
  const sections = days
    .map((day) => ({
      day,
      events: events.filter((e) => isSameDay(new Date(e.start_time), day)).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()),
    }))
    .filter((sec) => sec.events.length > 0);

  if (sections.length === 0) {
    return (
      <View style={s.empty}>
        <Ionicons name="calendar-outline" size={40} color={colors.muted + "50"} />
        <Text style={s.emptyTitle}>No events this month</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={sections}
      keyExtractor={(sec) => sec.day.toISOString()}
      contentContainerStyle={{ paddingVertical: 8 }}
      showsVerticalScrollIndicator={false}
      renderItem={({ item: sec }) => {
        const today = isToday(sec.day);
        return (
          <View style={s.daySection}>
            <View style={s.dayLabel}>
              <Text style={[s.dayOfWeek, today && { color: colors.primary }]}>{format(sec.day, "EEE").toUpperCase()}</Text>
              {today ? (
                <View style={s.todayBadge}><Text style={s.todayText}>{format(sec.day, "d")}</Text></View>
              ) : (
                <Text style={s.dayNum}>{format(sec.day, "d")}</Text>
              )}
              <Text style={s.monthText}>{format(sec.day, "MMM")}</Text>
            </View>
            <View style={s.events}>
              {sec.events.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  style={[s.eventCard, { borderLeftColor: event.color }]}
                  onPress={() => onEventPress(event)}
                  activeOpacity={0.7}
                >
                  <View style={[s.colorBlock, { backgroundColor: event.color + "20" }]}>
                    <Text style={[s.eventStart, { color: event.color }]}>{format(new Date(event.start_time), "HH:mm")}</Text>
                  </View>
                  <View style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={s.eventTitle} numberOfLines={1}>{event.title}</Text>
                      {event.source === "ai" && <Ionicons name="sparkles" size={10} color={colors.primary} />}
                      {event.meeting_url && <Ionicons name="videocam" size={10} color={colors.primary} />}
                    </View>
                    {event.location && (
                      <Text style={s.eventLocation} numberOfLines={1}>{event.location}</Text>
                    )}
                    <Text style={s.eventTime}>until {format(new Date(event.end_time), "HH:mm")}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      }}
    />
  );
}

const s = StyleSheet.create({
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  emptyTitle: { fontSize: 15, color: colors.muted, fontWeight: "600" },
  daySection: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 8, gap: 14 },
  dayLabel: { width: 52, alignItems: "center", paddingTop: 8 },
  dayOfWeek: { fontSize: 10, fontWeight: "700", color: colors.muted, letterSpacing: 0.5 },
  dayNum: { fontSize: 22, fontWeight: "800", color: colors.foreground, marginTop: 2 },
  todayBadge: { backgroundColor: colors.primary, width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center", marginTop: 2 },
  todayText: { fontSize: 15, fontWeight: "900", color: colors.primaryForeground },
  monthText: { fontSize: 9, color: colors.muted, fontWeight: "600", marginTop: 2 },
  events: { flex: 1, gap: 4 },
  eventCard: { flexDirection: "row", backgroundColor: colors.card, borderRadius: 12, borderLeftWidth: 3, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  colorBlock: { minWidth: 52, paddingHorizontal: 8, justifyContent: "center", alignItems: "center" },
  eventStart: { fontSize: 12, fontWeight: "800", fontVariant: ["tabular-nums"] },
  eventTitle: { fontSize: 14, fontWeight: "600", color: colors.foreground, flex: 1 },
  eventLocation: { fontSize: 11, color: colors.muted, marginTop: 2 },
  eventTime: { fontSize: 10, color: colors.muted, marginTop: 2 },
});
