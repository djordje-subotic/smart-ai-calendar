import { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert } from "react-native";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/colors";
import { haptic } from "../lib/haptics";

interface Props {
  onTranscript?: (text: string) => void;
  compact?: boolean;
}

/**
 * Press-and-hold mic button for voice input.
 * Records audio while held, transcribes when released.
 * On platforms without STT available, serves as visual cue / launches dictation.
 */
export function HeyKrownaButton({ onTranscript, compact }: Props) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
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

  async function startRecording() {
    try {
      haptic.medium();
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission needed", "Grant microphone access to use voice input.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording", err);
      setIsRecording(false);
    }
  }

  async function stopRecording() {
    if (!recording) return;
    haptic.light();
    setIsRecording(false);
    setProcessing(true);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
        const formData = new FormData();
        formData.append("audio", {
          uri,
          type: "audio/m4a",
          name: "recording.m4a",
        } as any);

        const res = await fetch(`${API_URL}/api/ai/transcribe`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (data.error === "NO_API_KEY") {
          Alert.alert("Voice not configured", "Add OPENAI_API_KEY to .env.local to enable voice transcription.");
          haptic.warning();
        } else if (data.text && onTranscript) {
          onTranscript(data.text);
          haptic.success();
        } else if (data.error) {
          Alert.alert("Transcription failed", data.error);
          haptic.error();
        }
      }
    } catch (err) {
      console.error("Failed to stop recording", err);
      haptic.error();
    } finally {
      setProcessing(false);
    }
  }

  const size = compact ? 40 : 56;

  return (
    <View style={s.container}>
      <TouchableOpacity
        onPressIn={startRecording}
        onPressOut={stopRecording}
        activeOpacity={0.8}
        disabled={processing}
      >
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
            name={isRecording ? "mic" : processing ? "ellipse" : "mic-outline"}
            size={compact ? 18 : 26}
            color={isRecording ? "#fff" : colors.primaryForeground}
          />
        </Animated.View>
      </TouchableOpacity>
      {!compact && (
        <Text style={s.hint}>
          {isRecording ? "Recording... release to send" : processing ? "Processing..." : "Hold to speak"}
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
