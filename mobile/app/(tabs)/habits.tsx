import { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../src/lib/supabase";
import { colors } from "../../src/constants/colors";
import { SwipeableRow } from "../../src/components/SwipeableRow";
import { getCached, setCached } from "../../src/lib/offlineCache";
import { format, subDays, isSameDay } from "date-fns";

interface Habit {
  id: string;
  name: string;
  color: string;
  streak_current: number;
  streak_best: number;
  frequency: string;
}

interface Completion {
  habit_id: string;
  completed_date: string;
}

export default function HabitsScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    // Paint from cache first
    const cached = await getCached<{ habits: Habit[]; completions: Completion[] }>("habits:snap");
    if (cached) {
      setHabits(cached.habits);
      setCompletions(cached.completions);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const [habitsRes, completionsRes] = await Promise.all([
        supabase.from("habits").select("*").eq("user_id", user.id).eq("is_active", true),
        supabase.from("habit_completions").select("habit_id, completed_date").eq("user_id", user.id)
          .gte("completed_date", format(subDays(new Date(), 7), "yyyy-MM-dd")),
      ]);

      const fresh = {
        habits: habitsRes.data || [],
        completions: completionsRes.data || [],
      };
      setHabits(fresh.habits);
      setCompletions(fresh.completions);
      await setCached("habits:snap", fresh, { ttl: 6 * 60 * 60 * 1000 });
    } catch {
      // Offline — keep cached values
    }
  }

  async function handleArchive(habitId: string) {
    const prev = habits;
    setHabits(habits.filter((h) => h.id !== habitId));
    try {
      await supabase.from("habits").update({ is_active: false }).eq("id", habitId);
    } catch {
      setHabits(prev);
    }
  }

  async function handleAdd() {
    if (!newName.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("habits").insert({
      user_id: user.id,
      name: newName.trim(),
      color: colors.primary,
      frequency: "daily",
    });
    setNewName("");
    setShowAdd(false);
    await load();
  }

  async function toggleToday(habitId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const today = format(new Date(), "yyyy-MM-dd");
    const existing = completions.find((c) => c.habit_id === habitId && c.completed_date === today);

    // Optimistic update
    const prevCompletions = completions;
    if (existing) {
      setCompletions(completions.filter((c) => !(c.habit_id === habitId && c.completed_date === today)));
    } else {
      setCompletions([...completions, { habit_id: habitId, completed_date: today }]);
    }

    try {
      if (existing) {
        const { error } = await supabase.from("habit_completions").delete().eq("habit_id", habitId).eq("completed_date", today);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("habit_completions").insert({ habit_id: habitId, user_id: user.id, completed_date: today });
        if (error) throw error;
      }

      // Streaks are recomputed server-side by the habit_completions trigger
      // (migration 019). Pull the new value back so the flame/best icons stay
      // in sync with reality.
      const { data: refreshed } = await supabase
        .from("habits")
        .select("streak_current, streak_best")
        .eq("id", habitId)
        .single();
      if (refreshed) {
        setHabits((prev) => prev.map((h) =>
          h.id === habitId
            ? { ...h, streak_current: refreshed.streak_current, streak_best: refreshed.streak_best }
            : h
        ));
      }
    } catch {
      setCompletions(prevCompletions); // Revert on error
    }
  }

  function isCompletedOnDay(habitId: string, date: Date): boolean {
    return completions.some((c) => c.habit_id === habitId && c.completed_date === format(date, "yyyy-MM-dd"));
  }

  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Habits</Text>
          <Text style={s.subtitle}>{habits.length} active habit{habits.length !== 1 ? "s" : ""}</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(!showAdd)}>
          <Text style={s.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {showAdd && (
        <View style={s.addForm}>
          <TextInput
            style={s.addInput}
            value={newName}
            onChangeText={setNewName}
            placeholder="Habit name..."
            placeholderTextColor={colors.muted + "80"}
            autoFocus
            onSubmitEditing={handleAdd}
          />
          <TouchableOpacity style={s.addSubmit} onPress={handleAdd}>
            <Text style={s.addSubmitText}>Add</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🎯</Text>
            <Text style={s.emptyTitle}>No habits yet</Text>
            <Text style={s.emptyText}>Build consistency with daily habits</Text>
          </View>
        }
        renderItem={({ item }) => {
          const todayCompleted = isCompletedOnDay(item.id, today);
          return (
            <View style={{ marginBottom: 10 }}>
              <SwipeableRow
                onComplete={() => toggleToday(item.id)}
                onDelete={() => handleArchive(item.id)}
                completeLabel={todayCompleted ? "Undo" : "Done"}
                deleteLabel="Archive"
              >
                <View style={s.habitCard}>
                  <View style={s.habitHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.habitName}>{item.name}</Text>
                      <View style={s.streakRow}>
                        <Text style={s.streakText}>🔥 {item.streak_current || 0}</Text>
                        <Text style={s.streakBest}>🏆 {item.streak_best || 0}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[s.todayCheck, todayCompleted && { backgroundColor: colors.green, borderColor: colors.green }]}
                      onPress={() => toggleToday(item.id)}
                    >
                      {todayCompleted && <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>✓</Text>}
                    </TouchableOpacity>
                  </View>

                  {/* 7-day heatmap */}
                  <View style={s.heatmap}>
                    {last7Days.map((day) => {
                      const completed = isCompletedOnDay(item.id, day);
                      const isToday = isSameDay(day, today);
                      return (
                        <View key={day.toISOString()} style={s.heatmapDay}>
                          <View style={[
                            s.heatmapDot,
                            completed && { backgroundColor: item.color || colors.green },
                            isToday && { borderWidth: 2, borderColor: colors.primary },
                          ]} />
                          <Text style={s.heatmapLabel}>{format(day, "EEE").slice(0, 2)}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </SwipeableRow>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: "800", color: colors.foreground },
  subtitle: { fontSize: 12, color: colors.muted, marginTop: 2 },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center" },
  addBtnText: { fontSize: 22, fontWeight: "600", color: colors.primaryForeground, marginTop: -1 },
  addForm: { flexDirection: "row", paddingHorizontal: 16, gap: 10, marginBottom: 8 },
  addInput: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: colors.foreground, fontSize: 14 },
  addSubmit: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 16, justifyContent: "center" },
  addSubmitText: { fontSize: 14, fontWeight: "600", color: colors.primaryForeground },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: colors.foreground },
  emptyText: { fontSize: 13, color: colors.muted, marginTop: 4 },
  habitCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  habitHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  habitName: { fontSize: 15, fontWeight: "600", color: colors.foreground },
  streakRow: { flexDirection: "row", gap: 12, marginTop: 4 },
  streakText: { fontSize: 12, color: colors.foreground },
  streakBest: { fontSize: 12, color: colors.muted },
  todayCheck: { width: 36, height: 36, borderRadius: 12, borderWidth: 2, borderColor: colors.border, justifyContent: "center", alignItems: "center" },
  heatmap: { flexDirection: "row", justifyContent: "space-between" },
  heatmapDay: { alignItems: "center", gap: 4 },
  heatmapDot: { width: 24, height: 24, borderRadius: 6, backgroundColor: colors.accent },
  heatmapLabel: { fontSize: 9, color: colors.muted, fontWeight: "500" },
});
