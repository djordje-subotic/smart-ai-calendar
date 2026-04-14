import { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { colors } from "../../constants/colors";

// Based on chronobiology: peak 9-12, dip 13-15, recovery 15-17
function getEnergyForHour(hour: number): number {
  if (hour < 6) return 10;
  if (hour < 8) return 30;
  if (hour < 9) return 60;
  if (hour < 12) return 95;
  if (hour < 13) return 80;
  if (hour < 15) return 40;
  if (hour < 17) return 70;
  if (hour < 19) return 60;
  if (hour < 22) return 40;
  return 20;
}

function getEnergyLabel(energy: number): { label: string; color: string } {
  if (energy >= 80) return { label: "Peak focus", color: colors.green };
  if (energy >= 60) return { label: "High energy", color: colors.primary };
  if (energy >= 40) return { label: "Steady", color: colors.blue };
  if (energy >= 20) return { label: "Low energy", color: colors.orange };
  return { label: "Rest time", color: colors.muted };
}

export function EnergyIndicator() {
  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  useEffect(() => {
    const interval = setInterval(() => setCurrentHour(new Date().getHours()), 60000);
    return () => clearInterval(interval);
  }, []);

  const energy = getEnergyForHour(currentHour);
  const { label, color } = getEnergyLabel(energy);
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (energy / 100) * circumference;

  // Generate timeline for 6-21h
  const hours = Array.from({ length: 16 }, (_, i) => i + 6);
  const maxBar = 28;

  return (
    <View style={s.card}>
      <View style={s.main}>
        <View style={s.scoreWrap}>
          <Svg width={72} height={72} viewBox="0 0 72 72">
            <Circle cx="36" cy="36" r={radius} stroke={colors.accent} strokeWidth="5" fill="none" />
            <Circle
              cx="36" cy="36" r={radius}
              stroke={color}
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 36 36)"
            />
          </Svg>
          <View style={s.scoreCenter}>
            <Text style={[s.score, { color }]}>{energy}</Text>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Energy</Text>
          <Text style={[s.label, { color }]}>{label}</Text>
          <Text style={s.sub}>{currentHour.toString().padStart(2, "0")}:00</Text>
        </View>
      </View>

      {/* Timeline */}
      <View style={s.timeline}>
        {hours.map((h) => {
          const e = getEnergyForHour(h);
          const isCurrent = h === currentHour;
          const barColor = getEnergyLabel(e).color;
          return (
            <View key={h} style={s.timelineCol}>
              <View style={[s.bar, { height: (e / 100) * maxBar, backgroundColor: isCurrent ? barColor : barColor + "50" }]} />
              {isCurrent && <View style={[s.dot, { backgroundColor: barColor }]} />}
            </View>
          );
        })}
      </View>
      <View style={s.timelineLabels}>
        <Text style={s.timeLabel}>6</Text>
        <Text style={s.timeLabel}>12</Text>
        <Text style={s.timeLabel}>18</Text>
        <Text style={s.timeLabel}>21</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border },
  main: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 12 },
  scoreWrap: { width: 72, height: 72, justifyContent: "center", alignItems: "center" },
  scoreCenter: { position: "absolute", justifyContent: "center", alignItems: "center" },
  score: { fontSize: 20, fontWeight: "900" },
  title: { fontSize: 11, color: colors.muted, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },
  label: { fontSize: 15, fontWeight: "800", marginTop: 3 },
  sub: { fontSize: 11, color: colors.muted, marginTop: 2, fontVariant: ["tabular-nums"] },
  timeline: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 36, paddingHorizontal: 4, marginTop: 6 },
  timelineCol: { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 2 },
  bar: { width: 5, borderRadius: 2.5 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  timelineLabels: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 2, marginTop: 4 },
  timeLabel: { fontSize: 9, color: colors.muted, fontWeight: "600" },
});
