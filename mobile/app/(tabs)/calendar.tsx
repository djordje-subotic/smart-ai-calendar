import { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../src/lib/supabase";
import { colors } from "../../src/constants/colors";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, isToday, addMonths, subMonths } from "date-fns";

interface Event {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  color: string;
}

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    loadEvents();
  }, [selectedDate]);

  async function loadEvents() {
    const start = startOfWeek(startOfMonth(selectedDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(selectedDate), { weekStartsOn: 1 });

    const { data } = await supabase
      .from("events")
      .select("id, title, start_time, end_time, color")
      .lte("start_time", end.toISOString())
      .gte("end_time", start.toISOString())
      .order("start_time");

    setEvents(data || []);
  }

  const monthStart = startOfMonth(selectedDate);
  const days = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(selectedDate), { weekStartsOn: 1 }),
  });

  const dayEvents = events.filter((e) => isSameDay(new Date(e.start_time), selectedDate));

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSelectedDate(subMonths(selectedDate, 1))}>
          <Text style={styles.navBtn}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{format(selectedDate, "MMMM yyyy")}</Text>
        <TouchableOpacity onPress={() => setSelectedDate(addMonths(selectedDate, 1))}>
          <Text style={styles.navBtn}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day headers */}
      <View style={styles.dayHeaders}>
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <Text key={d} style={styles.dayHeader}>{d}</Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.grid}>
        {days.map((day) => {
          const hasEvents = events.some((e) => isSameDay(new Date(e.start_time), day));
          const selected = isSameDay(day, selectedDate);
          const today = isToday(day);
          const currentMonth = isSameMonth(day, selectedDate);

          return (
            <TouchableOpacity
              key={day.toISOString()}
              style={[styles.dayCell, selected && styles.dayCellSelected]}
              onPress={() => setSelectedDate(day)}
            >
              <Text style={[
                styles.dayText,
                !currentMonth && styles.dayTextMuted,
                today && styles.dayTextToday,
                selected && styles.dayTextSelected,
              ]}>
                {format(day, "d")}
              </Text>
              {hasEvents && <View style={[styles.dot, selected && styles.dotSelected]} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Day events */}
      <View style={styles.eventsSection}>
        <Text style={styles.eventsTitle}>
          {format(selectedDate, "EEEE, MMMM d")}
        </Text>
        {dayEvents.length === 0 ? (
          <Text style={styles.emptyText}>No events this day</Text>
        ) : (
          <FlatList
            data={dayEvents}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[styles.eventCard, { borderLeftColor: item.color }]}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventTime}>
                  {format(new Date(item.start_time), "HH:mm")} – {format(new Date(item.end_time), "HH:mm")}
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  navBtn: { fontSize: 28, color: colors.muted, paddingHorizontal: 12 },
  monthTitle: { fontSize: 18, fontWeight: "700", color: colors.foreground },
  dayHeaders: { flexDirection: "row", paddingHorizontal: 8 },
  dayHeader: { flex: 1, textAlign: "center", fontSize: 11, fontWeight: "600", color: colors.muted, paddingVertical: 8, textTransform: "uppercase", letterSpacing: 1 },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 8 },
  dayCell: { width: "14.28%", alignItems: "center", paddingVertical: 8 },
  dayCellSelected: { backgroundColor: colors.accent, borderRadius: 12 },
  dayText: { fontSize: 15, fontWeight: "500", color: colors.foreground },
  dayTextMuted: { color: `${colors.muted}50` },
  dayTextToday: { color: colors.primary, fontWeight: "800" },
  dayTextSelected: { color: colors.primary, fontWeight: "700" },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary, marginTop: 3, opacity: 0.6 },
  dotSelected: { backgroundColor: colors.primary, opacity: 1 },
  eventsSection: { flex: 1, paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 0.5, borderTopColor: colors.border, marginTop: 8 },
  eventsTitle: { fontSize: 15, fontWeight: "600", color: colors.foreground, marginBottom: 12 },
  emptyText: { fontSize: 13, color: colors.muted, textAlign: "center", paddingTop: 24 },
  eventCard: { backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 8, borderLeftWidth: 3 },
  eventTitle: { fontSize: 14, fontWeight: "600", color: colors.foreground },
  eventTime: { fontSize: 12, color: colors.muted, marginTop: 3, fontVariant: ["tabular-nums"] },
});
