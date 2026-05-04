import { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/colors";
import { supabase } from "../lib/supabase";
import { format } from "date-fns";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setNotifications(data || []);
    setUnread((data || []).filter((n) => !n.read).length);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) return;
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (cancelled) return;
      setNotifications(data || []);
      setUnread((data || []).filter((n) => !n.read).length);
    })();
    const interval = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [load]);

  async function markRead(id: string) {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    load();
  }

  async function markAllRead() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    load();
  }

  return (
    <>
      <TouchableOpacity style={s.bell} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Ionicons name="notifications-outline" size={20} color={colors.foreground} />
        {unread > 0 && (
          <View style={s.badge}>
            <Text style={s.badgeText}>{unread > 9 ? "9+" : unread}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => setOpen(false)}><Text style={s.cancel}>Close</Text></TouchableOpacity>
            <Text style={s.modalTitle}>Notifications</Text>
            {unread > 0 ? (
              <TouchableOpacity onPress={markAllRead}><Text style={s.markAll}>Mark all read</Text></TouchableOpacity>
            ) : <View style={{ width: 80 }} />}
          </View>

          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={
              <View style={s.empty}>
                <Ionicons name="notifications-off-outline" size={40} color={colors.muted + "60"} />
                <Text style={s.emptyText}>No notifications yet</Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[s.notifCard, !item.read && s.notifUnread]}
                onPress={() => !item.read && markRead(item.id)}
              >
                <View style={s.notifIcon}>
                  <Ionicons
                    name={item.type === "friend_request" ? "person-add-outline" : item.type.includes("invite") ? "calendar-outline" : "information-circle-outline"}
                    size={18}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.notifTitle, !item.read && { fontWeight: "800" }]}>{item.title}</Text>
                  <Text style={s.notifMsg}>{item.message}</Text>
                  <Text style={s.notifTime}>{format(new Date(item.created_at), "MMM d · HH:mm")}</Text>
                </View>
                {!item.read && <View style={s.unreadDot} />}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  bell: { position: "relative", padding: 8 },
  badge: { position: "absolute", top: 4, right: 4, backgroundColor: colors.destructive, minWidth: 16, height: 16, borderRadius: 8, justifyContent: "center", alignItems: "center", paddingHorizontal: 4 },
  badgeText: { fontSize: 9, fontWeight: "800", color: "#fff" },
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  cancel: { fontSize: 15, color: colors.muted, width: 80 },
  modalTitle: { fontSize: 16, fontWeight: "800", color: colors.foreground },
  markAll: { fontSize: 12, color: colors.primary, fontWeight: "700", width: 80, textAlign: "right" },
  empty: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 13, color: colors.muted },
  notifCard: { flexDirection: "row", gap: 12, backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  notifUnread: { borderColor: colors.primary + "30", backgroundColor: colors.primary + "05" },
  notifIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.primary + "12", justifyContent: "center", alignItems: "center" },
  notifTitle: { fontSize: 14, fontWeight: "600", color: colors.foreground },
  notifMsg: { fontSize: 12, color: colors.muted, marginTop: 3, lineHeight: 17 },
  notifTime: { fontSize: 10, color: colors.muted, marginTop: 4, fontWeight: "500" },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 4 },
});
