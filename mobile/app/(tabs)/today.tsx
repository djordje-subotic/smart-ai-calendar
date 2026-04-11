import { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../src/lib/supabase";
import { colors } from "../../src/constants/colors";
import { format } from "date-fns";

interface Event {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  color: string;
  location: string | null;
}

export default function TodayScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const today = new Date();

  useEffect(() => {
    loadToday();
  }, []);

  async function loadToday() {
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

    const { data } = await supabase
      .from("events")
      .select("id, title, start_time, end_time, color, location")
      .gte("start_time", start)
      .lte("start_time", end)
      .order("start_time");

    setEvents(data || []);
  }

  const now = new Date();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Today</Text>
        <Text style={styles.date}>{format(today, "EEEE, MMMM d")}</Text>
      </View>

      {events.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>✨</Text>
          <Text style={styles.emptyTitle}>Nothing planned</Text>
          <Text style={styles.emptyText}>Use AI to fill your day</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => {
            const startTime = new Date(item.start_time);
            const isPast = startTime < now;

            return (
              <View style={[styles.eventCard, { borderLeftColor: item.color, opacity: isPast ? 0.5 : 1 }]}>
                <View style={styles.eventRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.eventTitle}>{item.title}</Text>
                    {item.location && <Text style={styles.eventLocation}>📍 {item.location}</Text>}
                  </View>
                  <View style={styles.timeBadge}>
                    <Text style={styles.timeText}>{format(startTime, "HH:mm")}</Text>
                    <Text style={styles.timeSep}>–</Text>
                    <Text style={styles.timeText}>{format(new Date(item.end_time), "HH:mm")}</Text>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  greeting: { fontSize: 28, fontWeight: "800", color: colors.foreground },
  date: { fontSize: 14, color: colors.muted, marginTop: 2 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: colors.foreground },
  emptyText: { fontSize: 13, color: colors.muted, marginTop: 4 },
  eventCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 10, borderLeftWidth: 3 },
  eventRow: { flexDirection: "row", alignItems: "center" },
  eventTitle: { fontSize: 15, fontWeight: "600", color: colors.foreground },
  eventLocation: { fontSize: 12, color: colors.muted, marginTop: 3 },
  timeBadge: { backgroundColor: colors.accent, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignItems: "center" },
  timeText: { fontSize: 13, fontWeight: "600", color: colors.foreground, fontVariant: ["tabular-nums"] },
  timeSep: { fontSize: 10, color: colors.muted },
});
