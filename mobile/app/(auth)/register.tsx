import { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../../src/stores/authStore";
import { router } from "expo-router";
import { colors } from "../../src/constants/colors";

const BENEFITS = [
  { emoji: "✨", title: "AI-Powered", desc: "AI creates your schedule" },
  { emoji: "🎯", title: "Personalized", desc: "Adapts to your lifestyle" },
  { emoji: "🎙️", title: "Voice Ready", desc: "Hands-free scheduling" },
  { emoji: "👥", title: "Social", desc: "Schedule with friends" },
];

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuthStore();

  async function handleRegister() {
    if (!fullName.trim() || !email.trim() || !password.trim()) { setError("Please fill in all fields"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    setError(null);
    try {
      const err = await signUp(email.trim(), password, fullName.trim());
      if (err) {
        setError(err);
        return;
      }
      router.replace("/(tabs)/calendar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <Text style={s.logo}>krowna</Text>
          <Text style={s.tagline}>YOUR AI TIME MANAGER</Text>

          {/* Benefits grid */}
          <View style={s.benefitGrid}>
            {BENEFITS.map((b) => (
              <View key={b.title} style={s.benefitCard}>
                <Text style={s.benefitEmoji}>{b.emoji}</Text>
                <Text style={s.benefitTitle}>{b.title}</Text>
                <Text style={s.benefitDesc}>{b.desc}</Text>
              </View>
            ))}
          </View>

          {/* Form */}
          <View style={s.formCard}>
            <Text style={s.formTitle}>Create your account</Text>
            <Text style={s.formSubtitle}>Free forever · No credit card</Text>

            {error && (
              <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View>
            )}

            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Full name</Text>
              <TextInput style={s.input} value={fullName} onChangeText={(t) => { setFullName(t); setError(null); }} placeholder="Your name" placeholderTextColor={colors.muted + "60"} autoComplete="name" />
            </View>

            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Email</Text>
              <TextInput style={s.input} value={email} onChangeText={(t) => { setEmail(t); setError(null); }} placeholder="your@email.com" placeholderTextColor={colors.muted + "60"} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
            </View>

            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Password</Text>
              <TextInput style={s.input} value={password} onChangeText={(t) => { setPassword(t); setError(null); }} placeholder="6+ characters" placeholderTextColor={colors.muted + "60"} secureTextEntry autoComplete="new-password" />
            </View>

            <TouchableOpacity style={[s.submitBtn, loading && { opacity: 0.7 }]} onPress={handleRegister} disabled={loading} activeOpacity={0.8}>
              {loading ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={s.submitText}>Start for free</Text>}
            </TouchableOpacity>

            {/* Includes */}
            <View style={s.includes}>
              {["30 AI requests/mo", "Calendar + Tasks + Habits", "Voice & social scheduling"].map((f) => (
                <View key={f} style={s.includeRow}>
                  <Text style={s.includeCheck}>✓</Text>
                  <Text style={s.includeText}>{f}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={s.footer}>
            <Text style={s.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
              <Text style={s.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 28, paddingVertical: 30 },

  logo: { fontSize: 44, fontWeight: "900", color: colors.primary, textAlign: "center", letterSpacing: -3 },
  tagline: { fontSize: 11, fontWeight: "700", color: colors.muted, textAlign: "center", letterSpacing: 3, marginTop: 4, marginBottom: 20 },

  benefitGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
  benefitCard: { width: "48%", backgroundColor: colors.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  benefitEmoji: { fontSize: 22, marginBottom: 6 },
  benefitTitle: { fontSize: 12, fontWeight: "700", color: colors.foreground },
  benefitDesc: { fontSize: 10, color: colors.muted, marginTop: 2, textAlign: "center" },

  formCard: { backgroundColor: colors.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: colors.border },
  formTitle: { fontSize: 22, fontWeight: "800", color: colors.foreground },
  formSubtitle: { fontSize: 13, color: colors.muted, marginTop: 4, marginBottom: 20 },

  errorBox: { backgroundColor: colors.destructive + "12", borderWidth: 1, borderColor: colors.destructive + "25", borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { fontSize: 13, color: colors.destructive, textAlign: "center" },

  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 12, fontWeight: "600", color: colors.mutedLight, marginBottom: 6, marginLeft: 2 },
  input: { backgroundColor: colors.accent, borderWidth: 1.5, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: colors.foreground },

  submitBtn: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 8, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  submitText: { fontSize: 16, fontWeight: "800", color: colors.primaryForeground },

  includes: { marginTop: 16, paddingTop: 16, borderTopWidth: 0.5, borderTopColor: colors.border, gap: 6 },
  includeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  includeCheck: { fontSize: 12, color: colors.primary, fontWeight: "700" },
  includeText: { fontSize: 12, color: colors.muted },

  footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  footerText: { fontSize: 14, color: colors.muted },
  footerLink: { fontSize: 14, color: colors.primary, fontWeight: "700" },
});
