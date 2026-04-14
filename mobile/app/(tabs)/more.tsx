import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { useAuthStore } from "../../src/stores/authStore";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../src/constants/colors";
import { KronLogo } from "../../src/components/KronLogo";

type IoniconsName = keyof typeof Ionicons.glyphMap;
const MENU: Array<{ icon: IoniconsName; label: string; desc: string; route: string; color: string }> = [
  { icon: "person-outline", label: "Profile", desc: "Goals, habits, preferences", route: "/(tabs)/profile", color: colors.primary },
  { icon: "checkbox-outline", label: "Tasks", desc: "To-do list with priorities", route: "/(tabs)/tasks", color: colors.violet },
  { icon: "people-outline", label: "Friends", desc: "Social scheduling", route: "/(tabs)/friends", color: colors.cyan },
  { icon: "flash-outline", label: "AI Tools", desc: "Focus, templates, reports", route: "/(tabs)/tools", color: colors.blue },
  { icon: "settings-outline", label: "Settings", desc: "Plan, credits, integrations", route: "/(tabs)/settings", color: colors.muted },
];

export default function MoreScreen() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      supabase.from("profiles")
        .select("display_name, occupation, avatar_preset, plan, ai_credits_used, bonus_credits")
        .eq("id", user.id).single()
        .then(({ data }) => { if (data) setProfile(data); });
    }
  }, [user]);

  const plan = profile?.plan || "free";
  const limits: Record<string, number> = { free: 50, pro: 1000, ultra: 5000 };
  const used = profile?.ai_credits_used || 0;
  const limit = limits[plan] || 50;

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>More</Text>
          <KronLogo size="sm" />
        </View>

        {/* User card */}
        <TouchableOpacity style={s.userCard} onPress={() => router.push("/(tabs)/profile")} activeOpacity={0.7}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{(profile?.display_name || user?.user_metadata?.full_name || "K")[0]?.toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.userName}>{profile?.display_name || user?.user_metadata?.full_name || "User"}</Text>
            <Text style={s.userSub}>{profile?.occupation || user?.email}</Text>
          </View>
          <View style={s.planBadge}><Text style={s.planText}>{plan.toUpperCase()}</Text></View>
        </TouchableOpacity>

        {/* AI Usage */}
        <View style={s.usageCard}>
          <View style={s.usageHeader}>
            <Text style={s.usageTitle}>AI Usage</Text>
            <Text style={s.usageCount}>{used}/{limit}{(profile?.bonus_credits || 0) > 0 && ` +${profile.bonus_credits}`}</Text>
          </View>
          <View style={s.progressBg}>
            <View style={[s.progressFill, { width: `${Math.min((used / limit) * 100, 100)}%` }]} />
          </View>
        </View>

        {/* Menu */}
        <View style={s.menuList}>
          {MENU.map((item) => (
            <TouchableOpacity key={item.label} style={s.menuItem} onPress={() => router.push(item.route as any)} activeOpacity={0.7}>
              <View style={[s.menuIcon, { backgroundColor: item.color + "12" }]}>
                <Ionicons name={item.icon} size={22} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.menuLabel}>{item.label}</Text>
                <Text style={s.menuDesc}>{item.desc}</Text>
              </View>
              <Text style={s.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign out */}
        <TouchableOpacity style={s.signOutBtn} onPress={async () => { try { await useAuthStore.getState().signOut(); } catch {} router.replace("/(auth)/login"); }} activeOpacity={0.8}>
          <Text style={s.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: "900", color: colors.foreground },
  logo: { fontSize: 20, fontWeight: "900", color: colors.primary, letterSpacing: -1 },
  userCard: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.card, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  avatar: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 20, fontWeight: "800", color: colors.primaryForeground },
  userName: { fontSize: 16, fontWeight: "700", color: colors.foreground },
  userSub: { fontSize: 12, color: colors.muted, marginTop: 1 },
  planBadge: { backgroundColor: colors.primary + "15", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: colors.primary + "25" },
  planText: { fontSize: 10, fontWeight: "800", color: colors.primary },
  usageCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
  usageHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  usageTitle: { fontSize: 13, fontWeight: "700", color: colors.foreground },
  usageCount: { fontSize: 12, color: colors.muted },
  progressBg: { height: 6, borderRadius: 3, backgroundColor: colors.accent, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3, backgroundColor: colors.primary },
  menuList: { gap: 6 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  menuIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  menuLabel: { fontSize: 15, fontWeight: "700", color: colors.foreground },
  menuDesc: { fontSize: 11, color: colors.muted, marginTop: 2 },
  menuArrow: { fontSize: 20, color: colors.muted + "50", fontWeight: "300" },
  signOutBtn: { marginTop: 24, padding: 16, borderRadius: 14, alignItems: "center", backgroundColor: colors.destructive + "10", borderWidth: 1, borderColor: colors.destructive + "20" },
  signOutText: { fontSize: 15, fontWeight: "600", color: colors.destructive },
});
