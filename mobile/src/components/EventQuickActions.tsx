import { useState } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/colors";
import { supabase } from "../lib/supabase";
import { haptic } from "../lib/haptics";
import { format } from "date-fns";

interface Props {
  visible: boolean;
  event: { id: string; title: string; start_time: string; end_time: string } | null;
  onClose: () => void;
  onDone: () => void;
  onEdit: () => void;
}

/**
 * Quick actions menu for events - long-press to reveal.
 * Faster than full edit modal for simple time moves.
 */
export function EventQuickActions({ visible, event, onClose, onDone, onEdit }: Props) {
  const [moving, setMoving] = useState(false);
  const [newStart, setNewStart] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  if (!event) return null;

  async function handleDelete() {
    if (!event) return;
    Alert.alert("Delete event?", event.title, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        haptic.warning();
        await supabase.from("events").delete().eq("id", event.id);
        haptic.success();
        onDone();
        onClose();
      }},
    ]);
  }

  async function handleMove() {
    if (!event || !newStart) return;
    setMoving(true);
    try {
      const duration = new Date(event.end_time).getTime() - new Date(event.start_time).getTime();
      const newEnd = new Date(newStart.getTime() + duration);
      await supabase.from("events").update({
        start_time: newStart.toISOString(),
        end_time: newEnd.toISOString(),
      }).eq("id", event.id);
      haptic.success();
      onDone();
      onClose();
    } catch {
      haptic.error();
    } finally {
      setMoving(false);
      setNewStart(null);
    }
  }

  async function handleDuplicate() {
    if (!event) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: original } = await supabase.from("events").select("*").eq("id", event.id).single();
    if (!original) return;
    const { id, created_at, updated_at, ...rest } = original;
    await supabase.from("events").insert({ ...rest, title: `${original.title} (copy)` });
    haptic.success();
    onDone();
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <View style={s.sheet}>
          <View style={s.handle} />
          <Text style={s.title} numberOfLines={1}>{event.title}</Text>
          <Text style={s.subtitle}>{format(new Date(event.start_time), "EEE MMM d · HH:mm")}</Text>

          {newStart ? (
            <View style={s.moveSection}>
              <Text style={s.moveLabel}>Move to:</Text>
              <TouchableOpacity style={s.moveBtn} onPress={() => setShowPicker(true)}>
                <Text style={s.moveBtnText}>{format(newStart, "EEE MMM d · HH:mm")}</Text>
              </TouchableOpacity>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setNewStart(null)}>
                  <Text style={s.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.confirmBtn} onPress={handleMove} disabled={moving}>
                  {moving ? <ActivityIndicator color={colors.primaryForeground} size="small" /> : <Text style={s.confirmText}>Confirm move</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={s.actions}>
              <ActionButton icon="create-outline" label="Edit" onPress={() => { onClose(); onEdit(); }} color={colors.blue} />
              <ActionButton icon="arrow-forward" label="Move" onPress={() => { setNewStart(new Date(event.start_time)); setShowPicker(true); }} color={colors.primary} />
              <ActionButton icon="copy-outline" label="Duplicate" onPress={handleDuplicate} color={colors.green} />
              <ActionButton icon="trash-outline" label="Delete" onPress={handleDelete} color={colors.destructive} />
            </View>
          )}

          {showPicker && newStart && (
            <DateTimePicker
              value={newStart}
              mode={Platform.OS === "ios" ? "datetime" : "date"}
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={(_, date) => {
                setShowPicker(Platform.OS === "ios");
                if (date) setNewStart(date);
              }}
            />
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function ActionButton({ icon, label, onPress, color }: { icon: any; label: string; onPress: () => void; color: string }) {
  return (
    <TouchableOpacity style={s.actionBtn} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.actionIcon, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={s.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: "800", color: colors.foreground },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 2, marginBottom: 20 },
  actions: { flexDirection: "row", justifyContent: "space-around" },
  actionBtn: { alignItems: "center", gap: 8 },
  actionIcon: { width: 56, height: 56, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  actionLabel: { fontSize: 11, fontWeight: "700", color: colors.foreground },
  moveSection: { gap: 4 },
  moveLabel: { fontSize: 12, fontWeight: "700", color: colors.muted, letterSpacing: 0.5, textTransform: "uppercase" },
  moveBtn: { backgroundColor: colors.accent, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14 },
  moveBtnText: { fontSize: 15, fontWeight: "700", color: colors.foreground },
  cancelBtn: { flex: 1, backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  cancelText: { fontSize: 14, fontWeight: "600", color: colors.muted },
  confirmBtn: { flex: 2, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  confirmText: { fontSize: 14, fontWeight: "800", color: colors.primaryForeground },
});
