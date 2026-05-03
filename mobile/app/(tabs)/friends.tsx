import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { colors } from "../../src/constants/colors";
import { getDiceBearUrl, parseAvatarPreset } from "../../src/components/AvatarPicker";
import { format } from "date-fns";

interface Friend {
  id: string; name: string; display_name: string | null; city: string | null;
  occupation: string | null; date_of_birth: string | null; motto: string | null;
  avatar_preset: string | null;
}

function getBirthdayLabel(dob: string | null): string | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  const thisYear = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  let diff = Math.round((thisYear.getTime() - today.getTime()) / 86400000);
  if (diff < 0) {
    const nextYear = new Date(today.getFullYear() + 1, birth.getMonth(), birth.getDate());
    diff = Math.round((nextYear.getTime() - today.getTime()) / 86400000);
  }
  if (diff === 0) return "Birthday today!";
  if (diff === 1) return "Birthday tomorrow!";
  if (diff <= 7) return `Birthday in ${diff} days`;
  return null;
}

export default function FriendsScreen() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: friendships } = await supabase.from("friends")
      .select("id, user_id, friend_id, status")
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq("status", "accepted");
    if (!friendships) { setLoading(false); return; }
    const enriched: Friend[] = [];
    for (const f of friendships) {
      const friendId = f.user_id === user.id ? f.friend_id : f.user_id;
      const { data: profile } = await supabase.from("profiles")
        .select("full_name, display_name, city, occupation, date_of_birth, motto, avatar_preset")
        .eq("id", friendId).single();
      enriched.push({
        id: friendId,
        name: profile?.full_name || "User",
        display_name: profile?.display_name || null,
        city: profile?.city || null,
        occupation: profile?.occupation || null,
        date_of_birth: profile?.date_of_birth || null,
        motto: profile?.motto || null,
        avatar_preset: profile?.avatar_preset || null,
      });
    }
    setFriends(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd() {
    if (!email.trim()) return;
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: targetUser } = await supabase.rpc("find_user_by_email", { target_email: email.trim() });
      if (!targetUser) { setError("User not found"); return; }
      if (targetUser === user.id) { setError("Can't add yourself"); return; }
      const { error: insertErr } = await supabase.from("friends").insert({ user_id: user.id, friend_id: targetUser, status: "pending" });
      if (insertErr) { setError("Already friends or request pending"); return; }
      setSuccess(true);
      setEmail("");
      setTimeout(() => { setSuccess(false); setShowAdd(false); }, 2000);
    } catch { setError("Failed to send request"); }
  }

  const filtered = search
    ? friends.filter((f) =>
        (f.display_name || f.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (f.city || "").toLowerCase().includes(search.toLowerCase()) ||
        (f.occupation || "").toLowerCase().includes(search.toLowerCase())
      )
    : friends;

  const upcomingBirthdays = friends.filter((f) => getBirthdayLabel(f.date_of_birth));

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="chevron-back" size={22} color={colors.foreground} /></TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Friends</Text>
          <Text style={s.headerSub}>{friends.length} friend{friends.length !== 1 ? "s" : ""}</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(!showAdd)} activeOpacity={0.7}>
          <Ionicons name={showAdd ? "close" : "person-add"} size={18} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>

      {showAdd && (
        <View style={s.addForm}>
          <TextInput
            style={s.addInput}
            value={email}
            onChangeText={(t) => { setEmail(t); setError(null); }}
            placeholder="Friend's email..."
            placeholderTextColor={colors.muted + "60"}
            autoCapitalize="none"
            keyboardType="email-address"
            onSubmitEditing={handleAdd}
          />
          <TouchableOpacity style={s.addSubmit} onPress={handleAdd}>
            <Text style={s.addSubmitText}>Send</Text>
          </TouchableOpacity>
        </View>
      )}
      {error && <Text style={s.errorMsg}>{error}</Text>}
      {success && <Text style={s.successMsg}>Request sent!</Text>}

      {/* Upcoming Birthdays */}
      {upcomingBirthdays.length > 0 && (
        <View style={s.birthdayBox}>
          <Text style={s.birthdayTitle}>🎂 Upcoming Birthdays</Text>
          {upcomingBirthdays.map((f) => (
            <View key={f.id} style={s.birthdayRow}>
              <Text style={s.birthdayName}>{f.display_name || f.name}</Text>
              <Text style={s.birthdayLabel}>{getBirthdayLabel(f.date_of_birth)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Search */}
      {friends.length > 2 && (
        <View style={s.searchBar}>
          <Ionicons name="search" size={16} color={colors.muted} />
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, city, occupation..."
            placeholderTextColor={colors.muted + "60"}
          />
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? <Text style={s.loadingText}>Loading...</Text> : (
            <View style={s.empty}>
              <Ionicons name="people-outline" size={40} color={colors.muted + "50"} />
              <Text style={s.emptyTitle}>{friends.length === 0 ? "No friends yet" : "No results"}</Text>
              <Text style={s.emptyHint}>{friends.length === 0 ? "Add friends by email" : "Try a different search"}</Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const preset = parseAvatarPreset(item.avatar_preset);
          const avatarUrl = preset ? getDiceBearUrl(preset.style, preset.seed, 100) : null;
          return (
            <View style={s.friendCard}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={s.friendAvatar} />
              ) : (
                <View style={s.friendAvatarFallback}><Text style={s.friendAvatarText}>{(item.display_name || item.name)[0]?.toUpperCase()}</Text></View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={s.friendName}>{item.display_name || item.name}</Text>
                <View style={s.friendMeta}>
                  {item.occupation && <Text style={s.metaText}>💼 {item.occupation}</Text>}
                  {item.city && <Text style={s.metaText}>📍 {item.city}</Text>}
                  {item.date_of_birth && <Text style={s.metaText}>🎂 {format(new Date(item.date_of_birth), "MMM d")}</Text>}
                </View>
                {item.motto && <Text style={s.motto}>&ldquo;{item.motto}&rdquo;</Text>}
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  backBtn: { width: 36, height: 36, justifyContent: "center", alignItems: "flex-start" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: colors.foreground },
  headerSub: { fontSize: 11, color: colors.muted, marginTop: 1 },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center" },
  addForm: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  addInput: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, color: colors.foreground, fontSize: 14 },
  addSubmit: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 18, justifyContent: "center" },
  addSubmitText: { fontSize: 13, fontWeight: "700", color: colors.primaryForeground },
  errorMsg: { fontSize: 12, color: colors.destructive, paddingHorizontal: 20, marginTop: 8 },
  successMsg: { fontSize: 12, color: colors.green, paddingHorizontal: 20, marginTop: 8 },
  birthdayBox: { margin: 16, marginBottom: 0, backgroundColor: colors.pink + "10", borderWidth: 1, borderColor: colors.pink + "25", borderRadius: 14, padding: 14 },
  birthdayTitle: { fontSize: 12, fontWeight: "800", color: colors.pink, marginBottom: 8 },
  birthdayRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  birthdayName: { fontSize: 13, color: colors.foreground, fontWeight: "600" },
  birthdayLabel: { fontSize: 12, color: colors.pink, fontWeight: "700" },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14 },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 14, color: colors.foreground },
  loadingText: { fontSize: 13, color: colors.muted, textAlign: "center", paddingTop: 40 },
  empty: { alignItems: "center", paddingVertical: 50, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: colors.foreground, marginTop: 8 },
  emptyHint: { fontSize: 12, color: colors.muted },
  friendCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: colors.card, borderRadius: 16, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  friendAvatar: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.accent },
  friendAvatarFallback: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.primary + "15", justifyContent: "center", alignItems: "center" },
  friendAvatarText: { fontSize: 18, fontWeight: "800", color: colors.primary },
  friendName: { fontSize: 15, fontWeight: "700", color: colors.foreground },
  friendMeta: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  metaText: { fontSize: 11, color: colors.muted },
  motto: { fontSize: 11, color: colors.muted, fontStyle: "italic", marginTop: 4 },
});
