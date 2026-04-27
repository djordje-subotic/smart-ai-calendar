import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/colors";
import { apiFetch } from "../../lib/api";

export function DailyBriefing() {
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/ai/briefing`, { method: "POST" });
      const data = await res.json();
      setBriefing(data.briefing || "Ready to rule your day!");
    } catch {
      setBriefing("Couldn't connect. Your day is what you make of it.");
    } finally { setLoading(false); }
  }

  if (briefing) {
    return (
      <View style={s.card}>
        <View style={s.header}>
          <Ionicons name="sparkles" size={14} color={colors.primary} />
          <Text style={s.title}>Daily Briefing</Text>
        </View>
        <Text style={s.text}>{briefing}</Text>
        <TouchableOpacity onPress={generate} style={s.refresh}>
          <Ionicons name="refresh" size={12} color={colors.muted} />
          <Text style={s.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity style={s.cardEmpty} onPress={generate} disabled={loading} activeOpacity={0.7}>
      <View style={s.header}>
        <Ionicons name="sparkles" size={14} color={colors.primary} />
        <Text style={s.title}>Daily Briefing</Text>
      </View>
      {loading ? (
        <View style={s.loadingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={s.loadingText}>Generating...</Text>
        </View>
      ) : (
        <Text style={s.cta}>Tap to get your AI briefing</Text>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.primary + "08", borderWidth: 1, borderColor: colors.primary + "20", borderRadius: 14, padding: 14 },
  cardEmpty: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14 },
  header: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  title: { fontSize: 11, fontWeight: "700", color: colors.primary, letterSpacing: 0.5, textTransform: "uppercase" },
  text: { fontSize: 13, color: colors.foreground, lineHeight: 19 },
  cta: { fontSize: 12, color: colors.muted },
  refresh: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", marginTop: 8 },
  refreshText: { fontSize: 10, color: colors.muted, fontWeight: "500" },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  loadingText: { fontSize: 12, color: colors.muted },
});
