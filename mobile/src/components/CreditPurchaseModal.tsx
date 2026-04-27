import { useState } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/colors";
import { supabase } from "../lib/supabase";
import { apiFetch } from "../lib/api";
import { haptic } from "../lib/haptics";

const PACKAGES = [
  { id: "pack_150", credits: 150, priceCents: 299, price: "$2.99", perCredit: "$0.02" },
  { id: "pack_500", credits: 500, priceCents: 599, price: "$5.99", perCredit: "$0.012", popular: true },
  { id: "pack_1500", credits: 1500, priceCents: 1499, price: "$14.99", perCredit: "$0.01" },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onPurchased?: (newBalance: number) => void;
}

export function CreditPurchaseModal({ visible, onClose, onPurchased }: Props) {
  const [buying, setBuying] = useState<string | null>(null);
  const [purchased, setPurchased] = useState<{ credits: number; balance: number } | null>(null);

  async function handleBuy(pack: typeof PACKAGES[number]) {
    setBuying(pack.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { Alert.alert("Error", "Not signed in"); return; }

      // Try Stripe checkout first
      const checkoutRes = await apiFetch(`/api/credits/checkout`, {
        method: "POST",
        body: JSON.stringify({ packageId: pack.id }),
      });
      const checkoutData = await checkoutRes.json();

      if ((checkoutData.mode === "lemonsqueezy" || checkoutData.mode === "stripe") && checkoutData.url) {
        // Real payment - open hosted checkout in browser
        await WebBrowser.openBrowserAsync(checkoutData.url);
        // User returns; webhook handles credit addition server-side
        onClose();
        return;
      }

      // Simulated (dev mode) - add credits directly
      const { data: profile } = await supabase.from("profiles").select("bonus_credits").eq("id", user.id).single();
      const current = profile?.bonus_credits || 0;
      const newBalance = current + pack.credits;

      const { error } = await supabase.from("profiles").update({ bonus_credits: newBalance }).eq("id", user.id);
      if (error) { haptic.error(); Alert.alert("Error", error.message); return; }

      await supabase.from("credit_purchases").insert({
        user_id: user.id, credits: pack.credits, price_cents: pack.priceCents, package_id: pack.id,
      });

      haptic.success();
      setPurchased({ credits: pack.credits, balance: newBalance });
      onPurchased?.(newBalance);
      setTimeout(() => { setPurchased(null); onClose(); }, 2500);
    } catch (err: any) {
      haptic.error();
      Alert.alert("Purchase failed", err?.message || "Unknown error");
    } finally { setBuying(null); }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={onClose}><Text style={s.close}>Cancel</Text></TouchableOpacity>
          <Text style={s.title}>Buy AI Credits</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={s.content}>
          {purchased ? (
            <View style={s.successState}>
              <View style={s.successIcon}><Ionicons name="checkmark" size={40} color={colors.primaryForeground} /></View>
              <Text style={s.successTitle}>{purchased.credits} credits added!</Text>
              <Text style={s.successSub}>You now have {purchased.balance} bonus credits</Text>
            </View>
          ) : (
            <>
              <View style={s.intro}>
                <Ionicons name="flash" size={32} color={colors.primary} />
                <Text style={s.introTitle}>Need more AI?</Text>
                <Text style={s.introDesc}>Buy credits on demand. No subscription. Credits never expire.</Text>
              </View>

              <View style={s.packages}>
                {PACKAGES.map((pack) => (
                  <TouchableOpacity
                    key={pack.id}
                    style={[s.packCard, pack.popular && s.packCardPopular]}
                    onPress={() => handleBuy(pack)}
                    disabled={buying !== null}
                    activeOpacity={0.8}
                  >
                    {pack.popular && <View style={s.popularBadge}><Text style={s.popularText}>BEST VALUE</Text></View>}
                    <Text style={s.packCredits}>{pack.credits}</Text>
                    <Text style={s.packLabel}>credits</Text>
                    <Text style={[s.packPrice, pack.popular && { color: colors.primary }]}>{pack.price}</Text>
                    <Text style={s.packPerCredit}>{pack.perCredit}/req</Text>
                    <View style={[s.buyBtn, pack.popular && { backgroundColor: colors.primary }]}>
                      {buying === pack.id ? (
                        <ActivityIndicator size="small" color={pack.popular ? colors.primaryForeground : colors.foreground} />
                      ) : (
                        <Text style={[s.buyBtnText, pack.popular && { color: colors.primaryForeground }]}>Buy</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={s.footer}>
                <Ionicons name="shield-checkmark-outline" size={14} color={colors.muted} />
                <Text style={s.footerText}>Secure payment · Credits added instantly</Text>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  close: { fontSize: 15, color: colors.muted, width: 60 },
  title: { fontSize: 16, fontWeight: "800", color: colors.foreground },
  content: { flex: 1, padding: 20 },
  intro: { alignItems: "center", paddingVertical: 20, gap: 8 },
  introTitle: { fontSize: 22, fontWeight: "800", color: colors.foreground },
  introDesc: { fontSize: 13, color: colors.muted, textAlign: "center", maxWidth: 280 },
  packages: { gap: 10, marginTop: 20 },
  packCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 20, alignItems: "center", position: "relative" },
  packCardPopular: { borderColor: colors.primary + "40", backgroundColor: colors.primary + "05" },
  popularBadge: { position: "absolute", top: -10, backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  popularText: { fontSize: 9, fontWeight: "900", color: colors.primaryForeground, letterSpacing: 1 },
  packCredits: { fontSize: 36, fontWeight: "900", color: colors.foreground },
  packLabel: { fontSize: 12, color: colors.muted, marginTop: -4 },
  packPrice: { fontSize: 22, fontWeight: "800", color: colors.foreground, marginTop: 10 },
  packPerCredit: { fontSize: 11, color: colors.muted, marginTop: 2 },
  buyBtn: { marginTop: 14, backgroundColor: colors.accent, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 30 },
  buyBtnText: { fontSize: 14, fontWeight: "700", color: colors.foreground },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 24 },
  footerText: { fontSize: 11, color: colors.muted },
  successState: { flex: 1, justifyContent: "center", alignItems: "center", gap: 14 },
  successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center" },
  successTitle: { fontSize: 22, fontWeight: "800", color: colors.foreground },
  successSub: { fontSize: 14, color: colors.muted },
});
