import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Dimensions } from "react-native";
import { useEffect, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/colors";
import { KrownaLogo } from "./KrownaLogo";

const { width } = Dimensions.get("window");
const DRAWER_WIDTH = width * 0.82;

export type CalendarView = "schedule" | "day" | "3day" | "week" | "month";

const VIEWS: { id: CalendarView; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: "schedule", label: "Schedule", icon: "list-outline" },
  { id: "day", label: "Day", icon: "square-outline" },
  { id: "3day", label: "3 Day", icon: "grid-outline" },
  { id: "week", label: "Week", icon: "menu-outline" },
  { id: "month", label: "Month", icon: "apps-outline" },
];

interface Props {
  visible: boolean;
  view: CalendarView;
  onSelectView: (v: CalendarView) => void;
  onClose: () => void;
  userEmail?: string;
}

export function CalendarDrawer({ visible, view, onSelectView, onClose, userEmail }: Props) {
  const slide = useMemo(() => new Animated.Value(-DRAWER_WIDTH), []);
  const fade = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slide, { toValue: 0, duration: 240, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 1, duration: 240, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slide, { toValue: -DRAWER_WIDTH, duration: 200, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, slide, fade]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[s.overlay, { opacity: fade }]}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[s.drawer, { transform: [{ translateX: slide }] }]}>
        <View style={s.header}>
          <KrownaLogo size="lg" />
        </View>

        {/* Views section */}
        <View style={s.section}>
          {VIEWS.map((v) => {
            const active = view === v.id;
            return (
              <TouchableOpacity
                key={v.id}
                style={[s.viewRow, active && s.viewRowActive]}
                onPress={() => { onSelectView(v.id); onClose(); }}
                activeOpacity={0.7}
              >
                <Ionicons name={v.icon} size={22} color={active ? colors.primaryForeground : colors.foreground} />
                <Text style={[s.viewLabel, active && { color: colors.primaryForeground, fontWeight: "700" }]}>{v.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* User email */}
        {userEmail && (
          <View style={s.userSection}>
            <View style={s.userAvatar}>
              <Text style={s.userAvatarText}>{userEmail[0]?.toUpperCase()}</Text>
            </View>
            <Text style={s.userEmail} numberOfLines={1}>{userEmail}</Text>
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.5)" },
  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    backgroundColor: colors.background,
    paddingTop: 60,
    paddingBottom: 20,
  },
  header: { paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  section: { paddingTop: 12 },
  viewRow: { flexDirection: "row", alignItems: "center", gap: 20, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 30, marginHorizontal: 8 },
  viewRowActive: { backgroundColor: colors.primary },
  viewLabel: { fontSize: 16, color: colors.foreground, fontWeight: "500" },
  userSection: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 24, paddingVertical: 16, marginTop: "auto", borderTopWidth: 0.5, borderTopColor: colors.border },
  userAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center" },
  userAvatarText: { fontSize: 14, fontWeight: "800", color: colors.primaryForeground },
  userEmail: { flex: 1, fontSize: 13, color: colors.muted },
});
