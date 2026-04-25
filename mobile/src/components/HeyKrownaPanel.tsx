import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useHeyKrownaMobile } from "../hooks/useHeyKrownaMobile";
import { supabase } from "../lib/supabase";
import { colors } from "../constants/colors";
import * as SecureStore from "expo-secure-store";

const VOICE_STORAGE_KEY = "krowna-voice-enabled-v1";

interface Props {
  onCommand: (command: string) => Promise<string>;
}

/**
 * Floating "Hey Krowna" voice control for mobile.
 *
 * Renders a small pill that toggles wake-word listening. When listening,
 * shows a pulsing red indicator and a floating transcript bar. Only
 * foreground — iOS/Android OS rules prevent background mic without
 * paid wake-word SDK.
 */
export function HeyKrownaPanel({ onCommand }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  // Hydrate saved preference
  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(VOICE_STORAGE_KEY);
        if (stored === "1") {
          // Start enabled — user had it on last session
          setEnabled(true);
        }
      } catch {}
      // Sync to profile table
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("voice_enabled")
            .eq("id", user.id)
            .single();
          if (data?.voice_enabled) setEnabled(true);
        }
      } catch {}
    })();
  }, []);

  const { phase, transcript, error, endConversation } = useHeyKrownaMobile({
    onCommand,
    enabled,
  });

  // Pulse animation when actively listening
  useEffect(() => {
    if (phase === "command") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [phase, pulseAnim]);

  async function toggleEnabled() {
    const next = !enabled;
    setEnabled(next);
    try {
      await SecureStore.setItemAsync(VOICE_STORAGE_KEY, next ? "1" : "0");
    } catch {}
    // Persist to profile
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ voice_enabled: next }).eq("id", user.id);
      }
    } catch {}
    if (!next) endConversation();
  }

  const color =
    phase === "command"
      ? colors.destructive
      : phase === "speaking" || phase === "processing"
      ? colors.primary
      : phase === "wake" && transcript
      ? colors.primaryLight
      : enabled
      ? colors.primary
      : colors.muted;

  const label =
    phase === "processing" ? "Thinking…" :
    phase === "speaking" ? "Speaking…" :
    phase === "command" ? "Listening…" :
    phase === "wake" && transcript ? "Hearing…" :
    enabled ? "Say 'Hey Krowna'" : "Voice off";

  return (
    <>
      {/* Toggle pill */}
      <TouchableOpacity
        onPress={toggleEnabled}
        activeOpacity={0.8}
        style={[
          s.pill,
          {
            borderColor: color + "66",
            backgroundColor: color + "1A",
          },
        ]}
      >
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Ionicons
            name={enabled ? "mic" : "mic-off-outline"}
            size={14}
            color={color}
          />
        </Animated.View>
        <Text style={[s.pillText, { color }]}>{label}</Text>
      </TouchableOpacity>

      {/* Transcript bubble — appears during active interaction */}
      {enabled && (phase === "command" || phase === "processing" || phase === "speaking") && transcript ? (
        <View style={s.bubble}>
          <Text style={s.bubbleText}>{transcript}</Text>
        </View>
      ) : null}

      {/* Error banner */}
      {error ? (
        <View style={s.errorBanner}>
          <Ionicons name="warning-outline" size={14} color={colors.destructive} />
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : null}
    </>
  );
}

const s = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: { fontSize: 11, fontWeight: "700" },
  bubble: {
    position: "absolute",
    top: 60,
    right: 12,
    left: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
  },
  bubbleText: {
    fontSize: 13,
    color: colors.foreground,
    lineHeight: 18,
  },
  errorBanner: {
    position: "absolute",
    top: 60,
    right: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.destructive + "1A",
    borderWidth: 1,
    borderColor: colors.destructive + "66",
    borderRadius: 12,
    padding: 10,
    zIndex: 100,
  },
  errorText: { fontSize: 11, color: colors.destructive, flex: 1 },
});
