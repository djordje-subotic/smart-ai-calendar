import { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert } from "react-native";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/colors";
import { haptic } from "../lib/haptics";
import { apiFetch } from "../lib/api";

interface Props {
  onTranscript?: (text: string) => void;
  compact?: boolean;
}

// Auto-stop after 30s to prevent runaway recording on dead mics / pocket dial
const MAX_RECORD_MS = 30_000;

/**
 * Tap-to-toggle voice recorder.
 *
 * Press-and-hold was unreliable on mobile — quick taps would start/stop
 * before expo-av finished setting up the recorder, leading to silent
 * failures. Tap-to-toggle has clear state transitions: first tap starts,
 * second tap (or 30s timeout) stops and transcribes.
 *
 * True "Hey Krowna" wake-word on mobile requires native SDKs (Porcupine /
 * PicoVoice) which is out of scope for MVP. The tap-to-toggle flow gives
 * the same UX feel: single tap and the mic is immediately listening.
 */
export function HeyKrownaButton({ onTranscript, compact }: Props) {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(1);
    }
  }, [isRecording]);

  // Cleanup on unmount — don't leave a recorder running in the background
  useEffect(() => {
    return () => {
      if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  async function startRecording() {
    try {
      haptic.medium();

      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission needed", "Grant microphone access to use voice input.");
        haptic.warning();
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);

      // Safety timeout — if the user walks away with the mic on, stop automatically
      autoStopTimerRef.current = setTimeout(() => {
        if (recordingRef.current) stopRecording();
      }, MAX_RECORD_MS);
    } catch (err) {
      console.warn("Failed to start recording", err);
      setIsRecording(false);
      haptic.error();
      Alert.alert("Couldn't start recording", "Try again in a moment.");
    }
  }

  async function stopRecording() {
    const recording = recordingRef.current;
    if (!recording) return;

    haptic.light();
    setIsRecording(false);
    setProcessing(true);
    recordingRef.current = null;

    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (!uri) {
        setProcessing(false);
        return;
      }

      const formData = new FormData();
      formData.append("audio", {
        uri,
        type: "audio/m4a",
        name: "recording.m4a",
      } as unknown as Blob);

      // apiFetch attaches the Supabase access token so the API route can
      // authenticate (mobile has no cookies — see api-auth.ts on the web).
      const res = await apiFetch(`/api/ai/transcribe`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.error === "NO_API_KEY") {
        Alert.alert("Voice not configured", "Add OPENAI_API_KEY to enable transcription.");
        haptic.warning();
      } else if (data.text && onTranscript) {
        onTranscript(data.text);
        haptic.success();
      } else if (data.error) {
        Alert.alert("Transcription failed", data.error);
        haptic.error();
      } else {
        haptic.warning();
        Alert.alert("Nothing heard", "Try again and speak clearly.");
      }
    } catch (err) {
      console.warn("Failed to stop recording", err);
      haptic.error();
    } finally {
      setProcessing(false);
    }
  }

  function handleTap() {
    if (processing) return;
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  const size = compact ? 40 : 56;

  return (
    <View style={s.container}>
      <TouchableOpacity onPress={handleTap} activeOpacity={0.8} disabled={processing}>
        <Animated.View
          style={[
            s.button,
            { width: size, height: size, borderRadius: size / 2 },
            isRecording && { backgroundColor: colors.destructive },
            processing && { opacity: 0.6 },
            { transform: [{ scale: pulse }] },
          ]}
        >
          <Ionicons
            name={isRecording ? "mic" : processing ? "hourglass-outline" : "mic-outline"}
            size={compact ? 18 : 26}
            color={isRecording ? "#fff" : colors.primaryForeground}
          />
        </Animated.View>
      </TouchableOpacity>
      {!compact && (
        <Text style={s.hint}>
          {isRecording
            ? "Listening… tap to send"
            : processing
            ? "Transcribing…"
            : "Tap to speak"}
        </Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { alignItems: "center", gap: 6 },
  button: {
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  hint: { fontSize: 11, color: colors.muted, fontWeight: "600" },
});
