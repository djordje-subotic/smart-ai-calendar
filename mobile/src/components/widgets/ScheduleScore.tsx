import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors } from "../../constants/colors";

interface Event { start_time: string; end_time: string; }

export function ScheduleScore({ events }: { events: Event[] }) {
  const score = useMemo(() => {
    if (events.length === 0) return 50;
    let s = 100;
    // Penalty for too many events
    if (events.length > 8) s -= 30;
    else if (events.length > 6) s -= 15;
    // Check back-to-back
    const sorted = [...events].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    let backToBack = 0;
    for (let i = 1; i < sorted.length; i++) {
      const gap = new Date(sorted[i].start_time).getTime() - new Date(sorted[i-1].end_time).getTime();
      if (gap < 15 * 60000) backToBack++;
    }
    s -= backToBack * 5;
    return Math.max(0, Math.min(100, s));
  }, [events]);

  const scoreColor = score >= 80 ? colors.green : score >= 50 ? colors.primary : colors.destructive;
  const label = score >= 80 ? "Great day" : score >= 50 ? "Getting busy" : "Overloaded";
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <View style={s.card}>
      <View style={s.scoreWrap}>
        <Svg width={80} height={80} viewBox="0 0 80 80">
          <Circle cx="40" cy="40" r={radius} stroke={colors.accent} strokeWidth="6" fill="none" />
          <Circle
            cx="40" cy="40" r={radius}
            stroke={scoreColor}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 40 40)"
          />
        </Svg>
        <View style={s.scoreCenter}>
          <Text style={[s.scoreNum, { color: scoreColor }]}>{score}</Text>
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.title}>Schedule Score</Text>
        <Text style={[s.label, { color: scoreColor }]}>{label}</Text>
        <Text style={s.sub}>{events.length} event{events.length !== 1 ? "s" : ""} today</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border },
  scoreWrap: { width: 80, height: 80, justifyContent: "center", alignItems: "center" },
  scoreCenter: { position: "absolute", justifyContent: "center", alignItems: "center" },
  scoreNum: { fontSize: 22, fontWeight: "900" },
  title: { fontSize: 11, color: colors.muted, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },
  label: { fontSize: 16, fontWeight: "800", marginTop: 4 },
  sub: { fontSize: 11, color: colors.muted, marginTop: 2 },
});
