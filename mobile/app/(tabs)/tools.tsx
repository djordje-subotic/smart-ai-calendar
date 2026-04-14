import { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { colors } from "../../src/constants/colors";
import { EnergyIndicator } from "../../src/components/widgets/EnergyIndicator";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

const FOCUS_DURATIONS = [
  { min: 25, label: "25m", desc: "Pomodoro" },
  { min: 45, label: "45m", desc: "Short" },
  { min: 90, label: "90m", desc: "Deep" },
  { min: 120, label: "2h", desc: "Marathon" },
];

const TEMPLATES = [
  { id: "productive_week", name: "Productive Week", desc: "Deep work + meetings", icon: "briefcase-outline" },
  { id: "study_week", name: "Study Week", desc: "Study + revision", icon: "book-outline" },
  { id: "balanced_week", name: "Balanced Life", desc: "Work, rest, hobbies", icon: "heart-outline" },
  { id: "sprint_week", name: "Sprint Week", desc: "Maximum productivity", icon: "rocket-outline" },
  { id: "vacation_mode", name: "Vacation Mode", desc: "Relax, explore", icon: "sunny-outline" },
] as const;

interface WeeklyReport {
  summary: string;
  stats: { total_events: number; total_hours: number; busiest_day: string; emptiest_day: string };
  insights: string[];
  suggestions: string[];
}

export default function ToolsScreen() {
  const [focusDuration, setFocusDuration] = useState(90);
  const [startingFocus, setStartingFocus] = useState(false);
  const [focusStarted, setFocusStarted] = useState(false);

  const [applyingTemplate, setApplyingTemplate] = useState<string | null>(null);
  const [templateApplied, setTemplateApplied] = useState<string | null>(null);

  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const [heatmapData, setHeatmapData] = useState<Array<{ date: string; count: number; hours: number }>>([]);

  useEffect(() => { loadHeatmap(); }, []);

  async function loadHeatmap() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const now = new Date();
    const start = startOfMonth(now).toISOString();
    const end = endOfMonth(now).toISOString();
    const { data } = await supabase.from("events").select("start_time, end_time").eq("user_id", user.id).gte("start_time", start).lte("start_time", end);
    const byDate: Record<string, { count: number; hours: number }> = {};
    for (const e of data || []) {
      const d = e.start_time.split("T")[0];
      const h = (new Date(e.end_time).getTime() - new Date(e.start_time).getTime()) / 3600000;
      if (!byDate[d]) byDate[d] = { count: 0, hours: 0 };
      byDate[d].count++;
      byDate[d].hours += h;
    }
    setHeatmapData(Object.entries(byDate).map(([date, d]) => ({ date, ...d })));
  }

  async function handleStartFocus() {
    setStartingFocus(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const now = new Date();
      const end = new Date(now.getTime() + focusDuration * 60000);
      await supabase.from("events").insert({
        user_id: user.id, title: "Focus Block", description: "Focus session — do not disturb",
        start_time: now.toISOString(), end_time: end.toISOString(),
        all_day: false, color: colors.violet, source: "ai", status: "confirmed", reminder_minutes: [0],
      });
      setFocusStarted(true);
    } finally { setStartingFocus(false); }
  }

  async function generateReport() {
    setLoadingReport(true);
    try {
      const res = await fetch(`${API_URL}/api/ai/weekly-report`, { method: "POST" });
      const data = await res.json();
      setReport(data);
    } catch {
      setReport({ summary: "Could not generate report", stats: { total_events: 0, total_hours: 0, busiest_day: "N/A", emptiest_day: "N/A" }, insights: [], suggestions: [] });
    } finally { setLoadingReport(false); }
  }

  async function handleApplyTemplate(id: string) {
    setApplyingTemplate(id);
    try {
      const startDate = new Date();
      const dayOfWeek = startDate.getDay();
      const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
      startDate.setDate(startDate.getDate() + daysUntilMonday);

      const templates: Record<string, string> = {
        productive_week: "Plan a highly productive week. Deep work mornings, meetings afternoon.",
        study_week: "Plan a study-focused week with 3-4h study blocks.",
        balanced_week: "Plan a balanced week mixing work, exercise, hobbies.",
        sprint_week: "Plan an intense sprint week with minimal distractions.",
        vacation_mode: "Plan a relaxing vacation week with no work.",
      };

      const res = await fetch(`${API_URL}/api/ai/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: `${templates[id]} Start: ${startDate.toISOString().split("T")[0]}. Generate events.` }],
          timezone: "Europe/Belgrade",
        }),
      });
      const result = await res.json();
      if (result.events?.length) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          for (const event of result.events) {
            await supabase.from("events").insert({
              user_id: user.id, title: event.title, start_time: event.start_time, end_time: event.end_time,
              color: event.color || "#3B82F6", source: "ai", status: "confirmed", all_day: false, reminder_minutes: [15],
            });
          }
        }
        setTemplateApplied(id);
      }
    } finally { setApplyingTemplate(null); }
  }

  // Heatmap calc
  const now = new Date();
  const monthDays = eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) });

  function getIntensity(date: string): number {
    const d = heatmapData.find((x) => x.date === date);
    if (!d) return 0;
    if (d.hours >= 8) return 4;
    if (d.hours >= 5) return 3;
    if (d.hours >= 2) return 2;
    return 1;
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="chevron-back" size={22} color={colors.foreground} /></TouchableOpacity>
        <Text style={s.headerTitle}>AI Tools</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Energy */}
        <EnergyIndicator />

        {/* Focus Mode */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <View style={[s.iconBox, { backgroundColor: colors.violet + "15" }]}><Ionicons name="flash" size={18} color={colors.violet} /></View>
            <View><Text style={s.cardTitle}>Focus Mode</Text><Text style={s.cardDesc}>Block distraction-free time</Text></View>
          </View>
          {focusStarted ? (
            <View style={s.successBadge}><Ionicons name="checkmark-circle" size={18} color={colors.green} /><Text style={s.successText}>Focus block active — {focusDuration}min</Text></View>
          ) : (
            <>
              <View style={s.durationRow}>
                {FOCUS_DURATIONS.map((d) => (
                  <TouchableOpacity key={d.min} style={[s.durationBtn, focusDuration === d.min && s.durationBtnActive]} onPress={() => setFocusDuration(d.min)}>
                    <Text style={[s.durationLabel, focusDuration === d.min && { color: colors.violet }]}>{d.label}</Text>
                    <Text style={s.durationDesc}>{d.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={[s.primaryBtn, { backgroundColor: colors.violet }]} onPress={handleStartFocus} disabled={startingFocus}>
                {startingFocus ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.primaryBtnText}>Start focus session</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Smart Templates */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <View style={[s.iconBox, { backgroundColor: colors.primary + "15" }]}><Ionicons name="albums-outline" size={18} color={colors.primary} /></View>
            <View><Text style={s.cardTitle}>Smart Templates</Text><Text style={s.cardDesc}>One-click schedule for next week</Text></View>
          </View>
          {TEMPLATES.map((t) => {
            const applied = templateApplied === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                style={[s.templateRow, applied && { borderColor: colors.green + "40", backgroundColor: colors.green + "08" }]}
                onPress={() => !applied && handleApplyTemplate(t.id)}
                disabled={applyingTemplate !== null}
                activeOpacity={0.7}
              >
                <Ionicons name={t.icon as any} size={20} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={s.templateName}>{t.name}</Text>
                  <Text style={s.templateDesc}>{t.desc}</Text>
                </View>
                {applyingTemplate === t.id ? <ActivityIndicator size="small" color={colors.primary} /> :
                 applied ? <Ionicons name="checkmark-circle" size={18} color={colors.green} /> :
                 <Ionicons name="chevron-forward" size={16} color={colors.muted + "60"} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Weekly Report */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <View style={[s.iconBox, { backgroundColor: colors.blue + "15" }]}><Ionicons name="stats-chart" size={18} color={colors.blue} /></View>
            <View><Text style={s.cardTitle}>Weekly Report</Text><Text style={s.cardDesc}>AI summary of past 7 days</Text></View>
          </View>
          {report ? (
            <View style={{ gap: 10 }}>
              <Text style={s.reportSummary}>{report.summary}</Text>
              <View style={s.reportStats}>
                <View style={s.reportStat}><Text style={s.reportStatVal}>{report.stats.total_events}</Text><Text style={s.reportStatLabel}>events</Text></View>
                <View style={s.reportStat}><Text style={s.reportStatVal}>{Math.round(report.stats.total_hours)}h</Text><Text style={s.reportStatLabel}>scheduled</Text></View>
              </View>
              {report.insights.length > 0 && (
                <View style={s.insightBox}>
                  <Text style={s.insightLabel}>INSIGHTS</Text>
                  {report.insights.slice(0, 3).map((i, idx) => <Text key={idx} style={s.insightText}>• {i}</Text>)}
                </View>
              )}
              {report.suggestions.length > 0 && (
                <View style={s.insightBox}>
                  <Text style={s.insightLabel}>SUGGESTIONS</Text>
                  {report.suggestions.slice(0, 3).map((i, idx) => <Text key={idx} style={s.insightText}>• {i}</Text>)}
                </View>
              )}
            </View>
          ) : (
            <TouchableOpacity style={s.primaryBtn} onPress={generateReport} disabled={loadingReport}>
              {loadingReport ? <ActivityIndicator color={colors.primaryForeground} size="small" /> : <Text style={s.primaryBtnText}>Generate report</Text>}
            </TouchableOpacity>
          )}
        </View>

        {/* Calendar Heatmap */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <View style={[s.iconBox, { backgroundColor: colors.green + "15" }]}><Ionicons name="grid-outline" size={18} color={colors.green} /></View>
            <View><Text style={s.cardTitle}>Activity Heatmap</Text><Text style={s.cardDesc}>{format(now, "MMMM yyyy")}</Text></View>
          </View>
          <View style={s.heatmapGrid}>
            {monthDays.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const intensity = getIntensity(dateStr);
              const bgColors = [colors.accent, colors.primary + "25", colors.primary + "50", colors.primary + "75", colors.primary];
              return (
                <View key={dateStr} style={[s.heatmapDay, { backgroundColor: bgColors[intensity] }]}>
                  <Text style={[s.heatmapDayNum, intensity >= 3 && { color: colors.primaryForeground, fontWeight: "700" }]}>{format(day, "d")}</Text>
                </View>
              );
            })}
          </View>
          <View style={s.heatmapLegend}>
            <Text style={s.legendText}>Less</Text>
            {[colors.accent, colors.primary + "25", colors.primary + "50", colors.primary + "75", colors.primary].map((c, i) => (
              <View key={i} style={[s.legendDot, { backgroundColor: c }]} />
            ))}
            <Text style={s.legendText}>More</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "800", color: colors.foreground },
  scroll: { padding: 16, gap: 12 },
  card: { backgroundColor: colors.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  cardTitle: { fontSize: 15, fontWeight: "800", color: colors.foreground },
  cardDesc: { fontSize: 11, color: colors.muted, marginTop: 1 },

  durationRow: { flexDirection: "row", gap: 6, marginBottom: 12 },
  durationBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  durationBtnActive: { borderColor: colors.violet + "50", backgroundColor: colors.violet + "10" },
  durationLabel: { fontSize: 13, fontWeight: "700", color: colors.foreground },
  durationDesc: { fontSize: 9, color: colors.muted, marginTop: 1 },

  primaryBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  primaryBtnText: { color: colors.primaryForeground, fontSize: 14, fontWeight: "800" },

  successBadge: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.green + "12", borderWidth: 1, borderColor: colors.green + "25", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, justifyContent: "center" },
  successText: { color: colors.green, fontSize: 13, fontWeight: "600" },

  templateRow: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, marginTop: 6 },
  templateName: { fontSize: 13, fontWeight: "700", color: colors.foreground },
  templateDesc: { fontSize: 11, color: colors.muted, marginTop: 1 },

  reportSummary: { fontSize: 13, color: colors.foreground, lineHeight: 19 },
  reportStats: { flexDirection: "row", gap: 10 },
  reportStat: { flex: 1, backgroundColor: colors.accent, borderRadius: 10, padding: 10, alignItems: "center" },
  reportStatVal: { fontSize: 18, fontWeight: "900", color: colors.blue },
  reportStatLabel: { fontSize: 10, color: colors.muted, marginTop: 2 },
  insightBox: { backgroundColor: colors.accent, borderRadius: 10, padding: 10, gap: 4 },
  insightLabel: { fontSize: 9, fontWeight: "800", color: colors.muted, letterSpacing: 1 },
  insightText: { fontSize: 12, color: colors.foreground, lineHeight: 17 },

  heatmapGrid: { flexDirection: "row", flexWrap: "wrap", gap: 3 },
  heatmapDay: { width: 28, height: 28, borderRadius: 6, justifyContent: "center", alignItems: "center" },
  heatmapDayNum: { fontSize: 10, color: colors.muted, fontWeight: "600" },
  heatmapLegend: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 3, marginTop: 10 },
  legendDot: { width: 12, height: 12, borderRadius: 3 },
  legendText: { fontSize: 9, color: colors.muted },
});
