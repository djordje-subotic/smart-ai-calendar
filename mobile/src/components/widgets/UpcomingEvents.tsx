import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/colors";
import { SwipeableRow } from "../SwipeableRow";
import { format } from "date-fns";

interface UpcomingEventItem {
  id: string; title: string; start_time: string; end_time: string; color: string;
  location: string | null; meeting_url: string | null;
}

export function UpcomingEvents<T extends UpcomingEventItem>({
  events,
  onEventPress,
  onEventDelete,
}: {
  events: T[];
  onEventPress?: (event: T) => void;
  onEventDelete?: (event: T) => void;
}) {
  const now = new Date();
  const upcoming = events
    .filter((e) => new Date(e.start_time) > now)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 3);

  if (upcoming.length === 0) return null;

  return (
    <View style={s.wrap}>
      <Text style={s.title}>Coming up</Text>
      {upcoming.map((event) => {
        const start = new Date(event.start_time);
        const minsUntil = Math.round((start.getTime() - now.getTime()) / 60000);
        const timeLabel = minsUntil < 60 ? `in ${minsUntil}m` : `in ${Math.round(minsUntil / 60)}h`;

        return (
          <SwipeableRow
            key={event.id}
            onDelete={onEventDelete ? () => onEventDelete(event) : undefined}
            deleteLabel="Delete"
          >
            <TouchableOpacity
              style={s.card}
              onPress={() => onEventPress?.(event)}
              activeOpacity={0.7}
            >
              <View style={[s.dot, { backgroundColor: event.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.eventTitle} numberOfLines={1}>{event.title}</Text>
                <View style={s.metaRow}>
                  <Text style={s.time}>{format(start, "HH:mm")}</Text>
                  <Text style={s.timeLabel}>{timeLabel}</Text>
                </View>
              </View>
              {event.meeting_url && (
                <TouchableOpacity
                  style={s.joinBtn}
                  onPress={(e) => { e.stopPropagation(); Linking.openURL(event.meeting_url!).catch(() => {}); }}
                >
                  <Ionicons name="videocam" size={12} color={colors.primary} />
                  <Text style={s.joinText}>Join</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </SwipeableRow>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 6 },
  title: { fontSize: 11, color: colors.muted, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 2, marginLeft: 4 },
  card: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.card, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: colors.border },
  dot: { width: 8, height: 8, borderRadius: 4 },
  eventTitle: { fontSize: 13, fontWeight: "600", color: colors.foreground },
  metaRow: { flexDirection: "row", gap: 8, marginTop: 3 },
  time: { fontSize: 11, color: colors.muted, fontVariant: ["tabular-nums"] },
  timeLabel: { fontSize: 11, color: colors.primary, fontWeight: "600" },
  joinBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.primary + "15", borderWidth: 1, borderColor: colors.primary + "25", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  joinText: { fontSize: 10, color: colors.primary, fontWeight: "700" },
});
