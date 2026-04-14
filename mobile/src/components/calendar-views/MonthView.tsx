import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { colors } from "../../constants/colors";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, isToday } from "date-fns";

interface MonthEvent {
  id: string; title: string; start_time: string; end_time: string; color: string;
}

interface Props<T extends MonthEvent> {
  date: Date;
  events: T[];
  onDayPress: (day: Date) => void;
}

export function MonthView<T extends MonthEvent>({ date, events, onDayPress }: Props<T>) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(date)),
    end: endOfWeek(endOfMonth(date)),
  });

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <View style={s.container}>
      {/* Day headers */}
      <View style={s.headers}>
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <Text key={i} style={[s.header, i >= 5 && { color: colors.primary + "60" }]}>{d}</Text>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {weeks.map((week, wi) => (
          <View key={wi} style={s.weekRow}>
            {week.map((day) => {
              const dayEvts = events.filter((e) => isSameDay(new Date(e.start_time), day));
              const inMonth = isSameMonth(day, date);
              const today = isToday(day);
              return (
                <TouchableOpacity
                  key={day.toISOString()}
                  style={s.dayCell}
                  onPress={() => onDayPress(day)}
                  activeOpacity={0.6}
                >
                  <View style={s.dayHeader}>
                    {today ? (
                      <View style={s.todayBadge}>
                        <Text style={s.todayText}>{format(day, "d")}</Text>
                      </View>
                    ) : (
                      <Text style={[s.dayNum, !inMonth && { color: colors.muted + "40" }]}>
                        {format(day, "d")}
                      </Text>
                    )}
                  </View>
                  <View style={s.eventList}>
                    {dayEvts.slice(0, 4).map((e) => (
                      <View key={e.id} style={[s.eventBlock, { backgroundColor: e.color + "30", borderLeftColor: e.color }]}>
                        <Text style={s.eventTitle} numberOfLines={1}>{e.title}</Text>
                      </View>
                    ))}
                    {dayEvts.length > 4 && (
                      <Text style={s.moreText}>+{dayEvts.length - 4}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  headers: { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  header: { flex: 1, textAlign: "center", fontSize: 11, fontWeight: "700", color: colors.muted, letterSpacing: 0.5 },
  weekRow: { flexDirection: "row", flex: 1, minHeight: 96, borderBottomWidth: 0.5, borderBottomColor: colors.border + "50" },
  dayCell: { flex: 1, borderRightWidth: 0.5, borderRightColor: colors.border + "40", paddingHorizontal: 2, paddingTop: 4 },
  dayHeader: { alignItems: "center", marginBottom: 2 },
  dayNum: { fontSize: 12, fontWeight: "500", color: colors.foreground, paddingVertical: 2 },
  todayBadge: { backgroundColor: colors.primary, width: 22, height: 22, borderRadius: 11, justifyContent: "center", alignItems: "center" },
  todayText: { fontSize: 11, fontWeight: "800", color: colors.primaryForeground },
  eventList: { flex: 1, gap: 2 },
  eventBlock: { borderLeftWidth: 2, borderRadius: 3, paddingHorizontal: 3, paddingVertical: 2 },
  eventTitle: { fontSize: 9, fontWeight: "600", color: colors.foreground },
  moreText: { fontSize: 9, color: colors.muted, paddingHorizontal: 3, fontWeight: "600" },
});
