import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/colors";

interface Event { id: string; start_time: string; end_time: string; title: string; }
type IoniconName = keyof typeof Ionicons.glyphMap;

interface Nudge {
  id: string;
  title: string;
  message: string;
  icon: IoniconName;
  color: string;
}

export function NudgeBanner({ events }: { events: Event[] }) {
  const [dismissed, setDismissed] = useState<string[]>([]);

  const nudges: Nudge[] = [];
  const now = new Date();
  const hour = now.getHours();

  // Empty day
  if (events.length === 0 && hour < 20) {
    nudges.push({ id: "empty", title: "Your day is open", message: "Ready to plan? Ask Kron AI.", icon: "partly-sunny-outline", color: colors.blue });
  }

  // Check missed
  const pastMissed = events.filter((e) => new Date(e.end_time) < now).length;
  if (pastMissed >= 2 && hour > 10) {
    nudges.push({ id: "missed", title: `${pastMissed} events passed`, message: "Review what was accomplished", icon: "time-outline", color: colors.primary });
  }

  // Overloaded
  if (events.length >= 8) {
    nudges.push({ id: "overload", title: "Busy day ahead", message: `${events.length} events — consider moving some`, icon: "warning-outline", color: colors.destructive });
  }

  // No lunch
  const hasLunch = events.some((e) => {
    const h = new Date(e.start_time).getHours();
    return h >= 11 && h <= 14 && e.title.toLowerCase().includes("lunch");
  });
  if (!hasLunch && events.length > 3 && hour < 14) {
    nudges.push({ id: "lunch", title: "No lunch break", message: "Take care of yourself!", icon: "restaurant-outline", color: colors.orange });
  }

  const visible = nudges.filter((n) => !dismissed.includes(n.id)).slice(0, 2);
  if (visible.length === 0) return null;

  return (
    <View style={{ gap: 6 }}>
      {visible.map((nudge) => (
        <View key={nudge.id} style={[s.card, { borderColor: nudge.color + "30", backgroundColor: nudge.color + "10" }]}>
          <Ionicons name={nudge.icon} size={18} color={nudge.color} />
          <View style={{ flex: 1 }}>
            <Text style={s.title}>{nudge.title}</Text>
            <Text style={s.message}>{nudge.message}</Text>
          </View>
          <TouchableOpacity onPress={() => setDismissed([...dismissed, nudge.id])}>
            <Ionicons name="close" size={16} color={colors.muted} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  title: { fontSize: 13, fontWeight: "700", color: colors.foreground },
  message: { fontSize: 11, color: colors.muted, marginTop: 2 },
});
