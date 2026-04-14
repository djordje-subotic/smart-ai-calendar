import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, ScrollView, Platform, ActivityIndicator, Alert, Linking } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { colors, EVENT_COLORS } from "../constants/colors";
import { supabase } from "../lib/supabase";
import { haptic } from "../lib/haptics";
import { format } from "date-fns";

export interface EditableEvent {
  id?: string;
  title: string;
  description: string | null;
  location: string | null;
  start_time: string;
  end_time: string;
  color: string;
  meeting_url: string | null;
  recurrence_rule?: any;
}

interface EventModalProps {
  visible: boolean;
  event?: EditableEvent | null;
  onClose: () => void;
  onSaved: () => void;
}

const RECURRENCE_OPTIONS = [
  { value: "none", label: "No repeat" },
  { value: "daily", label: "Every day" },
  { value: "weekly", label: "Every week" },
  { value: "monthly", label: "Every month" },
];

export function EventModal({ visible, event, onClose, onSaved }: EventModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 3600000));
  const [color, setColor] = useState(EVENT_COLORS[0]);
  const [recurrence, setRecurrence] = useState("none");
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || "");
      setLocation(event.location || "");
      setMeetingUrl(event.meeting_url || "");
      setStartDate(new Date(event.start_time));
      setEndDate(new Date(event.end_time));
      setColor(event.color);
      setRecurrence(event.recurrence_rule?.freq || "none");
    } else {
      resetForm();
    }
  }, [event, visible]);

  function resetForm() {
    setTitle("");
    setDescription("");
    setLocation("");
    setMeetingUrl("");
    const now = new Date();
    now.setMinutes(0, 0, 0);
    setStartDate(now);
    setEndDate(new Date(now.getTime() + 3600000));
    setColor(EVENT_COLORS[0]);
    setRecurrence("none");
  }

  async function handleSave() {
    if (!title.trim()) { Alert.alert("Error", "Title is required"); return; }
    if (endDate <= startDate) { Alert.alert("Error", "End time must be after start time"); return; }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const recurrenceRule = recurrence === "none" ? null : { freq: recurrence, interval: 1 };
      const payload: any = {
        title: title.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        color,
        recurrence_rule: recurrenceRule,
        meeting_url: meetingUrl.trim() || null,
        all_day: false,
        status: "confirmed",
        reminder_minutes: [15],
      };

      if (event?.id) {
        await supabase.from("events").update(payload).eq("id", event.id).eq("user_id", user.id);
      } else {
        await supabase.from("events").insert({ ...payload, user_id: user.id, source: "manual" });
      }

      haptic.success();
      onSaved();
      onClose();
    } catch (err: any) {
      haptic.error();
      Alert.alert("Error", err?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!event?.id) return;
    Alert.alert("Delete event?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await supabase.from("events").delete().eq("id", event.id).eq("user_id", user.id);
        onSaved();
        onClose();
      } },
    ]);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={onClose}><Text style={s.cancel}>Cancel</Text></TouchableOpacity>
          <Text style={s.title}>{event?.id ? "Edit Event" : "New Event"}</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving || !title.trim()}>
            {saving ? <ActivityIndicator color={colors.primary} size="small" /> : <Text style={[s.save, !title.trim() && { opacity: 0.4 }]}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {/* Title */}
          <TextInput
            style={s.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Event title"
            placeholderTextColor={colors.muted + "60"}
            autoFocus={!event?.id}
          />

          {/* Time block */}
          <View style={s.section}>
            <TouchableOpacity style={s.row} onPress={() => setShowStartPicker(true)}>
              <Ionicons name="calendar-outline" size={18} color={colors.muted} />
              <View style={{ flex: 1 }}>
                <Text style={s.rowLabel}>Starts</Text>
                <Text style={s.rowValue}>{format(startDate, "EEE, MMM d · HH:mm")}</Text>
              </View>
            </TouchableOpacity>
            <View style={s.divider} />
            <TouchableOpacity style={s.row} onPress={() => setShowEndPicker(true)}>
              <Ionicons name="time-outline" size={18} color={colors.muted} />
              <View style={{ flex: 1 }}>
                <Text style={s.rowLabel}>Ends</Text>
                <Text style={s.rowValue}>{format(endDate, "EEE, MMM d · HH:mm")}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Recurrence */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Ionicons name="repeat-outline" size={16} color={colors.muted} />
              <Text style={s.sectionTitle}>Repeat</Text>
            </View>
            <View style={s.chipRow}>
              {RECURRENCE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[s.chip, recurrence === opt.value && s.chipActive]}
                  onPress={() => setRecurrence(opt.value)}
                >
                  <Text style={[s.chipText, recurrence === opt.value && { color: colors.primary }]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Location */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Ionicons name="location-outline" size={16} color={colors.muted} />
              <Text style={s.sectionTitle}>Location</Text>
            </View>
            <TextInput style={s.input} value={location} onChangeText={setLocation} placeholder="Add location" placeholderTextColor={colors.muted + "60"} />
          </View>

          {/* Meeting URL */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Ionicons name="videocam-outline" size={16} color={colors.muted} />
              <Text style={s.sectionTitle}>Video call</Text>
            </View>
            <TextInput style={s.input} value={meetingUrl} onChangeText={setMeetingUrl} placeholder="Zoom, Meet, Teams link..." placeholderTextColor={colors.muted + "60"} autoCapitalize="none" />
            {meetingUrl ? (
              <TouchableOpacity style={s.joinBtn} onPress={() => Linking.openURL(meetingUrl).catch(() => Alert.alert("Invalid URL"))}>
                <Ionicons name="videocam" size={14} color={colors.primary} />
                <Text style={s.joinText}>Join call</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Description */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Ionicons name="reader-outline" size={16} color={colors.muted} />
              <Text style={s.sectionTitle}>Description</Text>
            </View>
            <TextInput
              style={[s.input, { height: 80, textAlignVertical: "top" }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Notes or agenda..."
              placeholderTextColor={colors.muted + "60"}
              multiline
            />
          </View>

          {/* Color */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Ionicons name="color-palette-outline" size={16} color={colors.muted} />
              <Text style={s.sectionTitle}>Color</Text>
            </View>
            <View style={s.colorRow}>
              {EVENT_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[s.colorDot, { backgroundColor: c }, color === c && s.colorDotActive]}
                  onPress={() => setColor(c)}
                />
              ))}
            </View>
          </View>

          {/* Delete */}
          {event?.id && (
            <TouchableOpacity style={s.deleteBtn} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={16} color={colors.destructive} />
              <Text style={s.deleteText}>Delete event</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode={Platform.OS === "ios" ? "datetime" : "date"}
            display={Platform.OS === "ios" ? "inline" : "default"}
            onChange={(event, date) => {
              setShowStartPicker(Platform.OS === "ios");
              if (date) {
                setStartDate(date);
                if (date >= endDate) setEndDate(new Date(date.getTime() + 3600000));
              }
            }}
          />
        )}
        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode={Platform.OS === "ios" ? "datetime" : "date"}
            display={Platform.OS === "ios" ? "inline" : "default"}
            minimumDate={startDate}
            onChange={(event, date) => {
              setShowEndPicker(Platform.OS === "ios");
              if (date) setEndDate(date);
            }}
          />
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  cancel: { fontSize: 15, color: colors.muted, fontWeight: "500" },
  title: { fontSize: 16, fontWeight: "800", color: colors.foreground },
  save: { fontSize: 15, color: colors.primary, fontWeight: "700" },
  content: { padding: 20, paddingBottom: 40 },
  titleInput: { fontSize: 22, fontWeight: "700", color: colors.foreground, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: colors.border, marginBottom: 20 },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  sectionTitle: { fontSize: 12, fontWeight: "700", color: colors.muted, letterSpacing: 0.5, textTransform: "uppercase" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  rowLabel: { fontSize: 11, color: colors.muted, fontWeight: "600" },
  rowValue: { fontSize: 15, color: colors.foreground, fontWeight: "600", marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 30 },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.foreground },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  chipActive: { borderColor: colors.primary + "50", backgroundColor: colors.primary + "12" },
  chipText: { fontSize: 12, color: colors.muted, fontWeight: "600" },
  colorRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotActive: { transform: [{ scale: 1.2 }], borderWidth: 2, borderColor: colors.foreground },
  joinBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.primary + "12", borderWidth: 1, borderColor: colors.primary + "25", borderRadius: 10, paddingVertical: 10, justifyContent: "center", marginTop: 8 },
  joinText: { fontSize: 13, color: colors.primary, fontWeight: "700" },
  deleteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.destructive + "10", borderWidth: 1, borderColor: colors.destructive + "20", borderRadius: 14, paddingVertical: 14, marginTop: 10 },
  deleteText: { fontSize: 14, color: colors.destructive, fontWeight: "600" },
});
