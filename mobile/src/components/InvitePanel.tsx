import { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/colors";
import { supabase } from "../lib/supabase";
import { format } from "date-fns";

interface Invite {
  id: string;
  proposed_title: string;
  proposed_start: string;
  proposed_end: string;
  proposed_location: string | null;
  counter_message: string | null;
  counter_start: string | null;
  counter_end: string | null;
  status: string;
  organizer_id: string;
  invitee_id: string;
  otherName: string;
  otherTimezone: string;
  myTimezone: string;
  isOrganizer: boolean;
}

export function InvitePanel() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [counterForId, setCounterForId] = useState<string | null>(null);
  const [counterTime, setCounterTime] = useState("");
  const [counterMsg, setCounterMsg] = useState("");

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: myProfile } = await supabase.from("profiles").select("timezone").eq("id", user.id).single();

    const { data } = await supabase
      .from("event_invites")
      .select("*")
      .or(`organizer_id.eq.${user.id},invitee_id.eq.${user.id}`)
      .neq("status", "declined")
      .order("created_at", { ascending: false });

    if (!data) return;

    const enriched: Invite[] = [];
    for (const inv of data) {
      const otherId = inv.organizer_id === user.id ? inv.invitee_id : inv.organizer_id;
      const { data: profile } = await supabase.from("profiles").select("full_name, timezone").eq("id", otherId).single();
      enriched.push({
        ...inv,
        otherName: profile?.full_name || "User",
        otherTimezone: profile?.timezone || "Europe/Belgrade",
        myTimezone: myProfile?.timezone || "Europe/Belgrade",
        isOrganizer: inv.organizer_id === user.id,
      });
    }
    setInvites(enriched);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  async function handleAccept(inv: Invite) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const start = inv.counter_start || inv.proposed_start;
    const end = inv.counter_end || inv.proposed_end;

    const base = {
      title: inv.proposed_title,
      start_time: start,
      end_time: end,
      location: inv.proposed_location,
      all_day: false,
      color: "#06B6D4",
      source: "manual" as const,
      status: "confirmed" as const,
      reminder_minutes: [15],
    };

    await supabase.from("events").insert({ ...base, user_id: inv.organizer_id });
    await supabase.from("events").insert({ ...base, user_id: inv.invitee_id });
    await supabase.from("event_invites").update({ status: "accepted", updated_at: new Date().toISOString() }).eq("id", inv.id);

    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
    await supabase.from("notifications").insert({
      user_id: inv.organizer_id,
      type: "invite_accepted",
      title: "Invite accepted!",
      message: `${profile?.full_name || "Someone"} accepted "${inv.proposed_title}"`,
      data: { invite_id: inv.id },
    });

    await load();
  }

  async function handleDecline(inv: Invite) {
    await supabase.from("event_invites").update({ status: "declined" }).eq("id", inv.id);
    await load();
  }

  async function handleCounter(inv: Invite) {
    if (!counterTime) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date();
    const [h, m] = counterTime.split(":").map(Number);
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m || 0);
    const end = new Date(start.getTime() + 60 * 60000);

    await supabase.from("event_invites").update({
      status: "negotiating",
      counter_start: start.toISOString(),
      counter_end: end.toISOString(),
      counter_message: counterMsg || "How about this time?",
      updated_at: new Date().toISOString(),
    }).eq("id", inv.id);

    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
    await supabase.from("notifications").insert({
      user_id: inv.organizer_id,
      type: "counter_proposal",
      title: "New time suggested",
      message: `${profile?.full_name || "Someone"} suggested a different time for "${inv.proposed_title}"`,
      data: { invite_id: inv.id },
    });

    setCounterForId(null);
    setCounterTime("");
    setCounterMsg("");
    await load();
  }

  const pendingInvites = invites.filter((i) => !i.isOrganizer && (i.status === "pending" || i.status === "negotiating"));

  if (pendingInvites.length === 0) return null;

  return (
    <View style={s.wrap}>
      <Text style={s.title}>Event Invites ({pendingInvites.length})</Text>
      {pendingInvites.map((inv) => {
        const isCountering = counterForId === inv.id;
        return (
          <View key={inv.id} style={s.card}>
            <View style={s.cardHeader}>
              <Ionicons name="calendar" size={16} color={colors.cyan} />
              <View style={{ flex: 1 }}>
                <Text style={s.inviteTitle}>{inv.proposed_title}</Text>
                <Text style={s.inviteFrom}>From {inv.otherName}</Text>
              </View>
            </View>

            <View style={s.timeRow}>
              <Ionicons name="time-outline" size={12} color={colors.muted} />
              <Text style={s.timeText}>
                {format(new Date(inv.proposed_start), "EEE MMM d · HH:mm")} – {format(new Date(inv.proposed_end), "HH:mm")}
              </Text>
            </View>

            {inv.proposed_location && (
              <View style={s.timeRow}>
                <Ionicons name="location-outline" size={12} color={colors.muted} />
                <Text style={s.timeText}>{inv.proposed_location}</Text>
              </View>
            )}

            {inv.myTimezone !== inv.otherTimezone && (
              <View style={s.tzWarning}>
                <Ionicons name="globe-outline" size={11} color={colors.primary} />
                <Text style={s.tzText}>{inv.otherName} is in {inv.otherTimezone?.split("/")[1]?.replace(/_/g, " ")}</Text>
              </View>
            )}

            {inv.counter_message && (
              <View style={s.counterMsg}>
                <Ionicons name="chatbubble-outline" size={11} color={colors.cyan} />
                <Text style={s.counterText}>{inv.counter_message}</Text>
              </View>
            )}

            {isCountering ? (
              <View style={s.counterForm}>
                <TextInput
                  style={s.input}
                  value={counterTime}
                  onChangeText={setCounterTime}
                  placeholder="HH:MM"
                  placeholderTextColor={colors.muted + "60"}
                />
                <TextInput
                  style={s.input}
                  value={counterMsg}
                  onChangeText={setCounterMsg}
                  placeholder="Message (optional)"
                  placeholderTextColor={colors.muted + "60"}
                />
                <View style={s.actions}>
                  <TouchableOpacity style={s.secondaryBtn} onPress={() => setCounterForId(null)}>
                    <Text style={s.secondaryBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.primaryBtn, { backgroundColor: colors.cyan }]} onPress={() => handleCounter(inv)}>
                    <Text style={s.primaryBtnText}>Send</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={s.actions}>
                <TouchableOpacity style={s.primaryBtn} onPress={() => handleAccept(inv)}>
                  <Ionicons name="checkmark" size={14} color={colors.primaryForeground} />
                  <Text style={s.primaryBtnText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.secondaryBtn} onPress={() => setCounterForId(inv.id)}>
                  <Ionicons name="time" size={12} color={colors.muted} />
                  <Text style={s.secondaryBtnText}>Suggest</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.ghostBtn} onPress={() => handleDecline(inv)}>
                  <Ionicons name="close" size={14} color={colors.muted} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 6 },
  title: { fontSize: 11, color: colors.muted, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginLeft: 4, marginBottom: 4 },
  card: { backgroundColor: colors.cyan + "08", borderWidth: 1, borderColor: colors.cyan + "25", borderRadius: 14, padding: 12, gap: 8 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  inviteTitle: { fontSize: 14, fontWeight: "700", color: colors.foreground },
  inviteFrom: { fontSize: 11, color: colors.muted, marginTop: 1 },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  timeText: { fontSize: 12, color: colors.muted },
  tzWarning: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.primary + "10", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  tzText: { fontSize: 11, color: colors.primary, fontWeight: "500" },
  counterMsg: { flexDirection: "row", alignItems: "center", gap: 5 },
  counterText: { fontSize: 11, color: colors.cyan, fontStyle: "italic" },
  actions: { flexDirection: "row", gap: 6, marginTop: 4 },
  primaryBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 10 },
  primaryBtnText: { fontSize: 12, fontWeight: "700", color: colors.primaryForeground },
  secondaryBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 10 },
  secondaryBtnText: { fontSize: 12, fontWeight: "600", color: colors.muted },
  ghostBtn: { width: 40, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: 10 },
  counterForm: { gap: 6, marginTop: 4 },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, color: colors.foreground },
});
