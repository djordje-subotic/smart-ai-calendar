import { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, Linking, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useAuthStore } from "../../src/stores/authStore";
import { router } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { colors } from "../../src/constants/colors";
import { CreditPurchaseModal } from "../../src/components/CreditPurchaseModal";
import { useTheme } from "../../src/hooks/useTheme";
import { listNativeCalendars, syncNativeCalendar, clearSyncedNativeEvents } from "../../src/lib/appleCalendar";

export default function SettingsScreen() {
  const { user, signOut } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [usage, setUsage] = useState<{ plan: string; used: number; limit: number; bonus: number } | null>(null);
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [appleSyncing, setAppleSyncing] = useState(false);
  const [appleSyncedCount, setAppleSyncedCount] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles")
      .select("plan, ai_credits_used, bonus_credits, voice_enabled, google_calendar_synced")
      .eq("id", user.id).single();
    if (data) {
      const limits: Record<string, number> = { free: 50, pro: 1000, ultra: 5000 };
      setUsage({
        plan: data.plan || "free",
        used: data.ai_credits_used || 0,
        limit: limits[data.plan || "free"] || 50,
        bonus: data.bonus_credits || 0,
      });
      setVoiceEnabled(data.voice_enabled || false);
      setGoogleConnected(data.google_calendar_synced || false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);
  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  async function toggleVoice(value: boolean) {
    setVoiceEnabled(value);
    if (user) await supabase.from("profiles").update({ voice_enabled: value }).eq("id", user.id);
  }

  async function handleSignOut() {
    Alert.alert("Sign out?", "You'll need to log in again.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: async () => {
        try { await signOut(); } catch {}
        router.replace("/(auth)/login");
      } },
    ]);
  }

  async function handleConnectGoogle() {
    try {
      const WEB_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
      // Get the OAuth URL from web API and open in in-app browser
      const res = await fetch(`${WEB_URL}/api/google/auth-url`);
      const data = await res.json();
      if (data.url) {
        await WebBrowser.openBrowserAsync(data.url);
        // Reload after user returns
        setTimeout(() => loadData(), 3000);
      } else {
        Alert.alert("Error", "Could not start Google Calendar connection.");
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to connect");
    }
  }

  async function handleDisconnectGoogle() {
    Alert.alert("Disconnect Google Calendar?", "Your Google events will be removed.", [
      { text: "Cancel", style: "cancel" },
      { text: "Disconnect", style: "destructive", onPress: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          await supabase.from("profiles").update({
            google_access_token: null,
            google_refresh_token: null,
            google_token_expiry: null,
            google_calendar_synced: false,
          }).eq("id", user.id);
          await supabase.from("events").delete().eq("user_id", user.id).eq("source", "google");
          setGoogleConnected(false);
        } catch {}
      }},
    ]);
  }

  async function handleSyncApple() {
    setAppleSyncing(true);
    try {
      const cals = await listNativeCalendars();
      if (cals.length === 0) {
        Alert.alert(
          "No access",
          "Kron couldn't read your device calendars. Enable calendar permission in Settings."
        );
        return;
      }
      const ids = cals.map((c) => c.id);
      const result = await syncNativeCalendar(ids);
      if (result.ok) {
        setAppleSyncedCount(result.synced);
        Alert.alert("Synced", `${result.synced} events imported from your device.`);
      } else {
        Alert.alert("Sync failed", result.error || "Please try again.");
      }
    } finally {
      setAppleSyncing(false);
    }
  }

  function handleDisconnectApple() {
    Alert.alert("Remove device events?", "This removes events synced from your Apple/Android calendar. Your native calendar is untouched.", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => {
        await clearSyncedNativeEvents();
        setAppleSyncedCount(null);
      }},
    ]);
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.6}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <TouchableOpacity style={s.profileCard} onPress={() => router.push("/(tabs)/profile")} activeOpacity={0.7}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{user?.user_metadata?.full_name?.[0]?.toUpperCase() || "K"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.profileName}>{user?.user_metadata?.full_name || "User"}</Text>
            <Text style={s.profileEmail}>{user?.email}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted + "60"} />
        </TouchableOpacity>

        {/* Usage */}
        {usage && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>AI Usage</Text>
            <View style={s.usageCard}>
              <View style={s.usageHeader}>
                <View style={s.planBadge}><Text style={s.planText}>{usage.plan.toUpperCase()}</Text></View>
                <Text style={s.usageText}>
                  {usage.used}/{usage.limit}
                  {usage.bonus > 0 && <Text style={{ color: colors.primary }}> +{usage.bonus}</Text>}
                </Text>
              </View>
              <View style={s.progressBg}>
                <View style={[s.progressFill, { width: `${Math.min((usage.used / usage.limit) * 100, 100)}%` }]} />
              </View>
              <TouchableOpacity style={s.buyCreditsBtn} onPress={() => setCreditModalOpen(true)} activeOpacity={0.8}>
                <Ionicons name="flash" size={14} color={colors.primary} />
                <Text style={s.buyCreditsText}>Buy extra credits</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Preferences */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Preferences</Text>
          <View style={s.card}>
            <View style={s.switchRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                <Ionicons name="volume-high-outline" size={18} color={colors.muted} />
                <View>
                  <Text style={s.switchLabel}>Sound effects</Text>
                  <Text style={s.switchDesc}>Play sounds on actions</Text>
                </View>
              </View>
              <Switch value={soundEnabled} onValueChange={setSoundEnabled} trackColor={{ false: colors.border, true: colors.primary }} />
            </View>
            <View style={s.divider} />
            <View style={s.switchRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                <Ionicons name="mic-outline" size={18} color={colors.muted} />
                <View>
                  <Text style={s.switchLabel}>Voice mode</Text>
                  <Text style={s.switchDesc}>AI reads responses aloud</Text>
                </View>
              </View>
              <Switch value={voiceEnabled} onValueChange={toggleVoice} trackColor={{ false: colors.border, true: colors.primary }} />
            </View>
            <View style={s.divider} />
            <View style={s.switchRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                <Ionicons name={theme === "dark" ? "moon-outline" : "sunny-outline"} size={18} color={colors.muted} />
                <View>
                  <Text style={s.switchLabel}>Dark theme</Text>
                  <Text style={s.switchDesc}>Tap to switch to {theme === "dark" ? "light" : "dark"}</Text>
                </View>
              </View>
              <Switch
                value={theme === "dark"}
                onValueChange={(isDark) => setTheme(isDark ? "dark" : "light")}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
          </View>
        </View>

        {/* Integrations */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Integrations</Text>
          <TouchableOpacity style={s.integrationRow} onPress={googleConnected ? handleDisconnectGoogle : handleConnectGoogle} activeOpacity={0.7}>
            <View style={[s.integrationIcon, { backgroundColor: colors.blue + "15" }]}>
              <Ionicons name="logo-google" size={20} color={colors.blue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.integrationName}>Google Calendar</Text>
              <Text style={s.integrationDesc}>{googleConnected ? "Connected" : "Sync your events"}</Text>
            </View>
            <View style={[s.connectBtn, googleConnected && { backgroundColor: colors.green + "15", borderColor: colors.green + "30" }]}>
              <Text style={[s.connectText, googleConnected && { color: colors.green }]}>{googleConnected ? "Connected" : "Connect"}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.integrationRow}
            onPress={appleSyncedCount !== null ? handleDisconnectApple : handleSyncApple}
            activeOpacity={0.7}
            disabled={appleSyncing}
          >
            <View style={[s.integrationIcon, { backgroundColor: colors.muted + "15" }]}>
              <Ionicons name={Platform.OS === "ios" ? "logo-apple" : "calendar-outline"} size={20} color={colors.foreground} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.integrationName}>{Platform.OS === "ios" ? "Apple Calendar" : "Device Calendar"}</Text>
              <Text style={s.integrationDesc}>
                {appleSyncing
                  ? "Syncing..."
                  : appleSyncedCount !== null
                  ? `${appleSyncedCount} events synced · tap to remove`
                  : "Import events from your device"}
              </Text>
            </View>
            <View style={[s.connectBtn, appleSyncedCount !== null && { backgroundColor: colors.green + "15", borderColor: colors.green + "30" }]}>
              <Text style={[s.connectText, appleSyncedCount !== null && { color: colors.green }]}>
                {appleSyncedCount !== null ? "Synced" : "Sync"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Plans */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Plans</Text>
          {[
            { name: "Free", price: "$0", desc: "30 AI/mo, basics", limit: 30 },
            { name: "Pro", price: "$9/mo", desc: "500 AI/mo, all features", limit: 500, popular: true },
            { name: "Ultra", price: "$19/mo", desc: "5000 AI/mo, priority support", limit: 5000 },
          ].map((plan) => {
            const isCurrent = usage?.plan === plan.name.toLowerCase();
            return (
              <View key={plan.name} style={[s.planRow, isCurrent && s.planRowActive, plan.popular && !isCurrent && { borderColor: colors.primary + "30" }]}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={s.planName}>{plan.name}</Text>
                    {isCurrent && <Text style={s.currentTag}>CURRENT</Text>}
                    {plan.popular && !isCurrent && <Text style={s.popularTag}>POPULAR</Text>}
                  </View>
                  <Text style={s.planDesc}>{plan.desc}</Text>
                </View>
                <Text style={[s.planPrice, (isCurrent || plan.popular) && { color: colors.primary }]}>{plan.price}</Text>
              </View>
            );
          })}
        </View>

        {/* Sign out */}
        <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={colors.destructive} />
          <Text style={s.signOutText}>Sign out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <CreditPurchaseModal
        visible={creditModalOpen}
        onClose={() => setCreditModalOpen(false)}
        onPurchased={() => loadData()}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "800", color: colors.foreground },
  content: { padding: 16, gap: 20 },
  profileCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.border },
  avatar: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 20, fontWeight: "800", color: colors.primaryForeground },
  profileName: { fontSize: 15, fontWeight: "700", color: colors.foreground },
  profileEmail: { fontSize: 12, color: colors.muted, marginTop: 1 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 11, fontWeight: "800", color: colors.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 },
  card: { backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 4 },
  usageCard: { backgroundColor: colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border },
  usageHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  planBadge: { backgroundColor: colors.primary + "15", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: colors.primary + "25" },
  planText: { fontSize: 10, fontWeight: "800", color: colors.primary, letterSpacing: 0.5 },
  usageText: { fontSize: 13, color: colors.foreground, fontWeight: "700" },
  progressBg: { height: 6, borderRadius: 3, backgroundColor: colors.accent, overflow: "hidden", marginBottom: 10 },
  progressFill: { height: "100%", borderRadius: 3, backgroundColor: colors.primary },
  buyCreditsBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: colors.primary + "12", borderWidth: 1, borderColor: colors.primary + "25", borderRadius: 10, paddingVertical: 9 },
  buyCreditsText: { fontSize: 12, fontWeight: "700", color: colors.primary },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12 },
  switchLabel: { fontSize: 14, fontWeight: "600", color: colors.foreground },
  switchDesc: { fontSize: 11, color: colors.muted, marginTop: 1 },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: 12 },
  integrationRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 6 },
  integrationIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  integrationName: { fontSize: 14, fontWeight: "600", color: colors.foreground },
  integrationDesc: { fontSize: 11, color: colors.muted, marginTop: 1 },
  connectBtn: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.accent, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  connectText: { fontSize: 12, fontWeight: "700", color: colors.muted },
  planRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 6 },
  planRowActive: { borderColor: colors.primary + "40", backgroundColor: colors.primary + "06" },
  planName: { fontSize: 14, fontWeight: "700", color: colors.foreground },
  currentTag: { fontSize: 8, fontWeight: "900", color: colors.primary, backgroundColor: colors.primary + "15", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, letterSpacing: 0.5 },
  popularTag: { fontSize: 8, fontWeight: "900", color: colors.primary, letterSpacing: 0.5 },
  planDesc: { fontSize: 11, color: colors.muted, marginTop: 2 },
  planPrice: { fontSize: 15, fontWeight: "800", color: colors.foreground },
  signOutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 16, borderRadius: 14, backgroundColor: colors.destructive + "10", borderWidth: 1, borderColor: colors.destructive + "20" },
  signOutText: { fontSize: 15, fontWeight: "600", color: colors.destructive },
});
