import { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../../src/stores/authStore";
import { router } from "expo-router";
import { colors } from "../../src/constants/colors";
import { KrownaLogo } from "../../src/components/KrownaLogo";

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuthStore();

  async function handleLogin() {
    if (!email.trim() || !password.trim()) { setError("Please fill in all fields"); return; }
    setLoading(true);
    setError(null);
    try {
      const err = await signIn(email.trim(), password);
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

          {/* Brand */}
          <View style={s.brandContainer}>
            <View style={s.glowOuter} />
            <KrownaLogo size="xl" showText={false} />
          </View>
          <Text style={s.logo}>krowna</Text>
          <Text style={s.tagline}>RULE YOUR TIME</Text>

          {/* Feature pills */}
          <View style={s.pills}>
            {["AI Calendar", "Voice Assistant", "Smart Scheduling"].map((f) => (
              <View key={f} style={s.pill}>
                <Text style={s.pillText}>{f}</Text>
              </View>
            ))}
          </View>

          {/* Form card */}
          <View style={s.formCard}>
            <Text style={s.formTitle}>Welcome back</Text>
            <Text style={s.formSubtitle}>Sign in to continue</Text>

            {error && (
              <View style={s.errorBox}>
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Email</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={(t) => { setEmail(t); setError(null); }}
                placeholder="your@email.com"
                placeholderTextColor={colors.muted + "60"}
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
              />
            </View>

            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Password</Text>
              <TextInput
                style={s.input}
                value={password}
                onChangeText={(t) => { setPassword(t); setError(null); }}
                placeholder="Enter your password"
                placeholderTextColor={colors.muted + "60"}
                secureTextEntry
                textContentType="password"
                autoComplete="password"
              />
            </View>

            <TouchableOpacity
              style={[s.submitBtn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text style={s.submitText}>Sign in</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={s.footer}>
            <Text style={s.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
              <Text style={s.footerLink}>Create one free →</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 28, paddingVertical: 40 },

  brandContainer: { alignItems: "center", marginBottom: 8, height: 80, justifyContent: "center" },
  glowOuter: { position: "absolute", width: 120, height: 120, borderRadius: 60, backgroundColor: colors.primary + "08" },

  logo: { fontSize: 48, fontWeight: "900", color: colors.primary, textAlign: "center", letterSpacing: -3 },
  tagline: { fontSize: 11, fontWeight: "700", color: colors.muted, textAlign: "center", letterSpacing: 4, marginTop: 4 },

  pills: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 20, marginBottom: 28 },
  pill: { borderWidth: 1, borderColor: colors.primary + "25", backgroundColor: colors.primary + "08", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  pillText: { fontSize: 10, color: colors.primary, fontWeight: "600" },

  formCard: { backgroundColor: colors.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: colors.border },

  formTitle: { fontSize: 22, fontWeight: "800", color: colors.foreground },
  formSubtitle: { fontSize: 13, color: colors.muted, marginTop: 4, marginBottom: 24 },

  errorBox: { backgroundColor: colors.destructive + "12", borderWidth: 1, borderColor: colors.destructive + "25", borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { fontSize: 13, color: colors.destructive, textAlign: "center" },

  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 12, fontWeight: "600", color: colors.mutedLight, marginBottom: 6, marginLeft: 2 },
  input: {
    backgroundColor: colors.accent,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    color: colors.foreground,
  },

  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  submitText: { fontSize: 16, fontWeight: "800", color: colors.primaryForeground },

  footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  footerText: { fontSize: 14, color: colors.muted },
  footerLink: { fontSize: 14, color: colors.primary, fontWeight: "700" },
});
