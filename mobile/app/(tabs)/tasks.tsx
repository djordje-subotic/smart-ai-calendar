import { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../src/lib/supabase";
import { colors } from "../../src/constants/colors";
import { SwipeableRow } from "../../src/components/SwipeableRow";
import { getCached, setCached } from "../../src/lib/offlineCache";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  color: string;
  due_time: string | null;
}

const PRIORITY_COLORS: Record<string, string> = { urgent: "#EF4444", high: "#F59E0B", medium: "#3B82F6", low: "#6B7280" };

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const loadTasks = useCallback(async () => {
    const cached = await getCached<Task[]>("tasks:open");
    if (cached) setTasks(cached);
    try {
      const { data } = await supabase.from("tasks").select("*").neq("status", "done").order("due_date");
      const fresh = data || [];
      setTasks(fresh);
      await setCached("tasks:open", fresh, { ttl: 6 * 60 * 60 * 1000 });
    } catch {
      // Offline — keep cached
    }
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  async function handleAdd() {
    if (!newTask.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("tasks").insert({ title: newTask.trim(), user_id: user.id, color: "#8B5CF6" });
    setNewTask("");
    setShowAdd(false);
    await loadTasks();
  }

  async function handleToggle(id: string) {
    // Optimistic: remove from list immediately
    const prev = tasks;
    setTasks(tasks.filter((t) => t.id !== id));
    const { error } = await supabase.from("tasks").update({ status: "done" }).eq("id", id);
    if (error) {
      // Revert on error
      setTasks(prev);
    }
  }

  async function handleDelete(id: string) {
    // Optimistic removal
    const prev = tasks;
    setTasks(tasks.filter((t) => t.id !== id));
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      setTasks(prev);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Tasks</Text>
          <Text style={styles.subtitle}>{tasks.length} remaining</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(!showAdd)}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {showAdd && (
        <View style={styles.addForm}>
          <TextInput
            style={styles.addInput}
            value={newTask}
            onChangeText={setNewTask}
            placeholder="Task name..."
            placeholderTextColor={colors.muted}
            autoFocus
            onSubmitEditing={handleAdd}
          />
          <TouchableOpacity style={styles.addSubmit} onPress={handleAdd}>
            <Text style={styles.addSubmitText}>Add</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>✅</Text>
            <Text style={styles.emptyTitle}>All done!</Text>
            <Text style={styles.emptyText}>Add a new task to get started</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ marginBottom: 8 }}>
            <SwipeableRow
              onComplete={() => handleToggle(item.id)}
              onDelete={() => handleDelete(item.id)}
              completeLabel="Done"
              deleteLabel="Delete"
            >
              <View style={styles.taskCard}>
                <TouchableOpacity style={[styles.checkbox, { borderColor: item.color }]} onPress={() => handleToggle(item.id)}>
                  {item.status === "done" && <View style={[styles.checkInner, { backgroundColor: item.color }]} />}
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={styles.taskTitle}>{item.title}</Text>
                  {item.due_time && <Text style={styles.taskTime}>{item.due_time}</Text>}
                </View>
                <Text style={[styles.priorityBadge, { color: PRIORITY_COLORS[item.priority] || colors.muted }]}>
                  {item.priority === "urgent" ? "!!" : item.priority === "high" ? "!" : ""}
                </Text>
              </View>
            </SwipeableRow>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: "800", color: colors.foreground },
  subtitle: { fontSize: 12, color: colors.muted, marginTop: 2 },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center" },
  addBtnText: { fontSize: 22, fontWeight: "600", color: colors.primaryForeground, marginTop: -1 },
  addForm: { flexDirection: "row", paddingHorizontal: 20, gap: 10, marginBottom: 8 },
  addInput: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: colors.foreground, fontSize: 14 },
  addSubmit: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 16, justifyContent: "center" },
  addSubmitText: { fontSize: 14, fontWeight: "600", color: colors.primaryForeground },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: colors.foreground },
  emptyText: { fontSize: 13, color: colors.muted, marginTop: 4 },
  taskCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.card, borderRadius: 14, padding: 14 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, justifyContent: "center", alignItems: "center" },
  checkInner: { width: 12, height: 12, borderRadius: 3 },
  taskTitle: { fontSize: 14, fontWeight: "500", color: colors.foreground },
  taskTime: { fontSize: 11, color: colors.muted, marginTop: 2, fontVariant: ["tabular-nums"] },
  priorityBadge: { fontSize: 14, fontWeight: "800" },
  deleteBtn: { fontSize: 20, color: colors.muted, paddingHorizontal: 4 },
});
