import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/colors";
import { apiFetch } from "../../lib/api";

interface ReplanResult {
  message: string;
  moves: Array<{ event_title: string; from: string; to: string; reason: string }>;
  adds: Array<{ title: string; time: string; reason: string }>;
  removes: Array<{ event_title: string; reason: string }>;
}

export function ReplanButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReplanResult | null>(null);
  const [open, setOpen] = useState(false);

  async function handleReplan() {
    setLoading(true);
    setOpen(true);
    try {
      const res = await apiFetch(`/api/ai/replan`, { method: "POST" });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ message: "Could not replan right now", moves: [], adds: [], removes: [] });
    } finally { setLoading(false); }
  }

  return (
    <>
      <TouchableOpacity style={s.btn} onPress={handleReplan} activeOpacity={0.8}>
        <Ionicons name="refresh-circle-outline" size={16} color={colors.primary} />
        <Text style={s.btnText}>Replan day</Text>
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => setOpen(false)}><Text style={s.close}>Close</Text></TouchableOpacity>
            <Text style={s.modalTitle}>Replan My Day</Text>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {loading ? (
              <View style={s.loadingState}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={s.loadingText}>AI is optimizing your day...</Text>
              </View>
            ) : result ? (
              <>
                <View style={s.summaryCard}>
                  <Ionicons name="sparkles" size={18} color={colors.primary} />
                  <Text style={s.summaryText}>{result.message}</Text>
                </View>

                {result.moves.length > 0 && (
                  <View style={s.section}>
                    <Text style={s.sectionTitle}>↻ Moves</Text>
                    {result.moves.map((m, i) => (
                      <View key={i} style={s.item}>
                        <Text style={s.itemTitle}>{m.event_title}</Text>
                        <Text style={s.itemSub}>{m.from} → {m.to}</Text>
                        <Text style={s.itemReason}>{m.reason}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {result.adds.length > 0 && (
                  <View style={s.section}>
                    <Text style={s.sectionTitle}>+ Add</Text>
                    {result.adds.map((a, i) => (
                      <View key={i} style={s.item}>
                        <Text style={s.itemTitle}>{a.title}</Text>
                        <Text style={s.itemSub}>{a.time}</Text>
                        <Text style={s.itemReason}>{a.reason}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {result.removes.length > 0 && (
                  <View style={s.section}>
                    <Text style={s.sectionTitle}>− Remove</Text>
                    {result.removes.map((r, i) => (
                      <View key={i} style={s.item}>
                        <Text style={s.itemTitle}>{r.event_title}</Text>
                        <Text style={s.itemReason}>{r.reason}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  btn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.primary + "12", borderWidth: 1, borderColor: colors.primary + "25", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  btnText: { fontSize: 12, color: colors.primary, fontWeight: "700" },
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  close: { fontSize: 15, color: colors.muted, width: 50 },
  modalTitle: { fontSize: 16, fontWeight: "800", color: colors.foreground },
  loadingState: { alignItems: "center", paddingVertical: 40, gap: 12 },
  loadingText: { fontSize: 13, color: colors.muted },
  summaryCard: { flexDirection: "row", gap: 10, backgroundColor: colors.primary + "10", borderWidth: 1, borderColor: colors.primary + "20", borderRadius: 14, padding: 14, marginBottom: 20 },
  summaryText: { flex: 1, fontSize: 14, color: colors.foreground, lineHeight: 20 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: "700", color: colors.muted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 },
  item: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, marginBottom: 6 },
  itemTitle: { fontSize: 13, fontWeight: "700", color: colors.foreground },
  itemSub: { fontSize: 12, color: colors.primary, fontWeight: "600", marginTop: 2 },
  itemReason: { fontSize: 11, color: colors.muted, marginTop: 4 },
});
