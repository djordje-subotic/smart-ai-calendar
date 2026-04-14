import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/colors";

export const AVATAR_STYLES = [
  { id: "avataaars", label: "Classic" },
  { id: "bottts", label: "Robot" },
  { id: "fun-emoji", label: "Fun" },
  { id: "lorelei", label: "Lorelei" },
  { id: "notionists", label: "Notion" },
  { id: "open-peeps", label: "Peeps" },
  { id: "thumbs", label: "Thumbs" },
  { id: "big-smile", label: "Smile" },
];

export const AVATAR_SEEDS = ["felix", "aneka", "nova", "zephyr", "luna", "orion", "kai", "aria", "sage", "blaze", "ember", "storm"];

export function getDiceBearUrl(style: string, seed: string, size: number = 128) {
  return `https://api.dicebear.com/9.x/${style}/png?seed=${seed}&size=${size}`;
}

export function parseAvatarPreset(preset: string | null): { style: string; seed: string } | null {
  if (!preset || !preset.includes(":")) return null;
  const [style, seed] = preset.split(":");
  return { style, seed };
}

interface AvatarPickerProps {
  visible: boolean;
  currentPreset: string | null;
  onSelect: (preset: string) => void;
  onClose: () => void;
}

export function AvatarPicker({ visible, currentPreset, onSelect, onClose }: AvatarPickerProps) {
  const current = parseAvatarPreset(currentPreset);
  const [selectedStyle, setSelectedStyle] = useState(current?.style || "avataaars");

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={onClose}><Text style={s.cancel}>Cancel</Text></TouchableOpacity>
          <Text style={s.title}>Choose Avatar</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* Style tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.styleTabs} contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}>
          {AVATAR_STYLES.map((style) => (
            <TouchableOpacity
              key={style.id}
              style={[s.styleTab, selectedStyle === style.id && s.styleTabActive]}
              onPress={() => setSelectedStyle(style.id)}
            >
              <Text style={[s.styleTabText, selectedStyle === style.id && { color: colors.primaryForeground }]}>{style.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Avatar grid */}
        <ScrollView contentContainerStyle={s.grid} showsVerticalScrollIndicator={false}>
          {AVATAR_SEEDS.map((seed) => {
            const preset = `${selectedStyle}:${seed}`;
            const isSelected = currentPreset === preset;
            return (
              <TouchableOpacity
                key={seed}
                style={[s.avatarBtn, isSelected && s.avatarBtnActive]}
                onPress={() => { onSelect(preset); onClose(); }}
              >
                <Image source={{ uri: getDiceBearUrl(selectedStyle, seed) }} style={s.avatar} />
                {isSelected && (
                  <View style={s.checkBadge}>
                    <Ionicons name="checkmark" size={14} color={colors.primaryForeground} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  cancel: { fontSize: 15, color: colors.muted, width: 50 },
  title: { fontSize: 16, fontWeight: "800", color: colors.foreground },
  styleTabs: { maxHeight: 48, paddingVertical: 10 },
  styleTab: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  styleTabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  styleTabText: { fontSize: 12, color: colors.muted, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, padding: 16 },
  avatarBtn: { width: "30%", aspectRatio: 1, borderRadius: 16, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.card, overflow: "hidden", position: "relative" },
  avatarBtnActive: { borderColor: colors.primary, transform: [{ scale: 1.02 }] },
  avatar: { width: "100%", height: "100%" },
  checkBadge: { position: "absolute", top: 4, right: 4, backgroundColor: colors.primary, width: 24, height: 24, borderRadius: 12, justifyContent: "center", alignItems: "center" },
});
