import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../../src/stores/authStore";
import { router } from "expo-router";
import { colors } from "../../src/constants/colors";

export default function SettingsScreen() {
  const { user, signOut } = useAuthStore();

  async function handleSignOut() {
    await signOut();
    router.replace("/(auth)/login");
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.email?.[0]?.toUpperCase() || "K"}</Text>
          </View>
          <View>
            <Text style={styles.profileName}>{user?.user_metadata?.full_name || "User"}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Plan</Text>
        <View style={styles.planCard}>
          <Text style={styles.planName}>Free</Text>
          <Text style={styles.planDesc}>20 AI requests/month</Text>
          <TouchableOpacity style={styles.upgradeBtn}>
            <Text style={styles.upgradeBtnText}>Upgrade to Pro — $7/mo</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Integrations</Text>
        {["Google Calendar", "Apple Calendar", "Outlook"].map((cal) => (
          <View key={cal} style={styles.integrationRow}>
            <Text style={styles.integrationName}>{cal}</Text>
            <TouchableOpacity style={styles.connectBtn}>
              <Text style={styles.connectBtnText}>Connect</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: "800", color: colors.foreground },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontWeight: "700", color: colors.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  profileCard: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 18, fontWeight: "700", color: colors.primaryForeground },
  profileName: { fontSize: 15, fontWeight: "600", color: colors.foreground },
  profileEmail: { fontSize: 12, color: colors.muted, marginTop: 2 },
  planCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  planName: { fontSize: 16, fontWeight: "700", color: colors.foreground },
  planDesc: { fontSize: 12, color: colors.muted, marginTop: 2 },
  upgradeBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 10, alignItems: "center", marginTop: 12 },
  upgradeBtnText: { fontSize: 13, fontWeight: "600", color: colors.primaryForeground },
  integrationRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 6, borderWidth: 1, borderColor: colors.border },
  integrationName: { fontSize: 14, fontWeight: "500", color: colors.foreground },
  connectBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  connectBtnText: { fontSize: 12, color: colors.muted },
  signOutBtn: { marginHorizontal: 20, marginTop: 8, padding: 14, borderRadius: 12, alignItems: "center", backgroundColor: `${colors.destructive}15` },
  signOutText: { fontSize: 14, fontWeight: "500", color: colors.destructive },
});
