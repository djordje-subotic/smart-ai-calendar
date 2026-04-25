import { useEffect, useRef, useState } from "react";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import * as Speech from "expo-speech";
import { haptic } from "../lib/haptics";

/**
 * Two-phase wake-word voice assistant for mobile.
 *
 * Mirrors the web `useHeyKrowna` hook but uses native iOS Speech Framework /
 * Android SpeechRecognizer via expo-speech-recognition.
 *
 * Phase "wake"    — foreground mic streams, transcripts are scanned for the
 *                   wake word. Nothing sent to AI until wake fires.
 * Phase "command" — 8s window after wake word; whatever the user says next
 *                   goes to `onCommand`.
 *
 * Only active while the screen is foregrounded — iOS privacy rules prevent
 * background listening without a paid SDK (Porcupine). Tap the pill to
 * start/stop a session.
 */

type Phase = "idle" | "wake" | "command" | "processing" | "speaking";

interface Options {
  onCommand: (command: string) => Promise<string>;
  enabled: boolean;
}

const WAKE_PATTERNS = [
  /\bhey\s+kr[oua][wv]?n+a?\b/i,
  /\bhej\s+kr[oua][wv]?n+a?\b/i,
  /\bok[ae]?y?\s+kr[oua][wv]?n+a?\b/i,
  /\bhi\s+kr[oua][wv]?n+a?\b/i,
];

function detectWakeWord(text: string): { match: boolean; remainder: string } {
  const trimmed = text.trim();
  for (const re of WAKE_PATTERNS) {
    const m = trimmed.match(re);
    if (m) {
      const rest = trimmed.slice((m.index ?? 0) + m[0].length).trim();
      return { match: true, remainder: rest };
    }
  }
  return { match: false, remainder: "" };
}

export function useHeyKrownaMobile({ onCommand, enabled }: Options) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const phaseRef = useRef<Phase>("idle");
  const enabledRef = useRef(enabled);
  const callbackRef = useRef(onCommand);
  const commandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commandBufferRef = useRef("");
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  callbackRef.current = onCommand;
  enabledRef.current = enabled;

  function updatePhase(p: Phase) {
    phaseRef.current = p;
    setPhase(p);
  }

  // Live stream of interim transcripts
  useSpeechRecognitionEvent("result", (event) => {
    if (phaseRef.current === "speaking" || phaseRef.current === "processing") return;
    const text = event.results?.[0]?.transcript?.trim() ?? "";
    if (!text) return;

    if (phaseRef.current === "wake") {
      setTranscript(text.length > 4 ? text : "");
      if (!event.isFinal) return;

      const { match, remainder } = detectWakeWord(text);
      if (match) {
        haptic.medium();
        updatePhase("command");
        setTranscript(remainder || "Listening…");

        if (remainder.length > 2) {
          handleCommand(remainder);
          return;
        }

        commandBufferRef.current = "";
        if (commandTimerRef.current) clearTimeout(commandTimerRef.current);
        commandTimerRef.current = setTimeout(() => {
          if (phaseRef.current === "command") {
            if (commandBufferRef.current.trim()) {
              handleCommand(commandBufferRef.current.trim());
            } else {
              setTranscript("");
              updatePhase("wake");
            }
          }
        }, 8000);
      }
      return;
    }

    if (phaseRef.current === "command") {
      setTranscript(text);
      if (event.isFinal && text.length > 2) {
        commandBufferRef.current = text;
        if (commandTimerRef.current) {
          clearTimeout(commandTimerRef.current);
          commandTimerRef.current = null;
        }
        handleCommand(text);
      }
    }
  });

  useSpeechRecognitionEvent("error", (event) => {
    if (event.error === "service-not-allowed" || event.error === "audio-capture") {
      setError("Microphone permission denied. Enable it in device settings.");
      enabledRef.current = false;
      updatePhase("idle");
    } else if (event.error === "language-not-supported") {
      setError("Speech recognition language not supported.");
      enabledRef.current = false;
      updatePhase("idle");
    }
    // Transient errors (no-speech, aborted, network) — let `end` event restart us
  });

  useSpeechRecognitionEvent("end", () => {
    // iOS auto-stops after ~60s silence; restart if still enabled
    if (
      enabledRef.current &&
      phaseRef.current !== "speaking" &&
      phaseRef.current !== "processing"
    ) {
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      restartTimerRef.current = setTimeout(() => {
        if (
          enabledRef.current &&
          phaseRef.current !== "speaking" &&
          phaseRef.current !== "processing"
        ) {
          startListening();
        }
      }, 250);
    }
  });

  async function startListening() {
    try {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) {
        setError("Microphone permission denied.");
        enabledRef.current = false;
        updatePhase("idle");
        return;
      }

      ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: true,
        continuous: true,
        // iOS-specific: keep recording even during brief silences
        iosTaskHint: "dictation",
      });

      if (phaseRef.current === "idle") updatePhase("wake");
      setError(null);
    } catch (e) {
      console.warn("Failed to start speech recognition:", e);
      setError("Couldn't start voice. Try again.");
    }
  }

  function stopListening() {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {}
  }

  async function handleCommand(command: string) {
    updatePhase("processing");
    stopListening();
    setTranscript(command);

    if (commandTimerRef.current) {
      clearTimeout(commandTimerRef.current);
      commandTimerRef.current = null;
    }

    try {
      const response = await callbackRef.current(command);
      updatePhase("speaking");
      setTranscript(response);
      haptic.success();

      // Speak response via expo-speech
      Speech.speak(response, {
        language: "en-US",
        rate: 0.95,
        pitch: 1.05,
        onDone: () => {
          setTranscript("");
          commandBufferRef.current = "";
          if (enabledRef.current) {
            updatePhase("wake");
            startListening();
          } else {
            updatePhase("idle");
          }
        },
      });
    } catch {
      haptic.error();
      setTranscript("Sorry, something went wrong.");
      updatePhase("speaking");
      Speech.speak("Sorry, something went wrong.", {
        onDone: () => {
          setTranscript("");
          if (enabledRef.current) {
            updatePhase("wake");
            startListening();
          } else {
            updatePhase("idle");
          }
        },
      });
    }
  }

  function endConversation() {
    enabledRef.current = false;
    if (commandTimerRef.current) clearTimeout(commandTimerRef.current);
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    stopListening();
    Speech.stop();
    commandBufferRef.current = "";
    setTranscript("");
    updatePhase("idle");
  }

  useEffect(() => {
    if (enabled) {
      startListening();
    } else {
      stopListening();
      Speech.stop();
      updatePhase("idle");
    }

    return () => {
      enabledRef.current = false;
      if (commandTimerRef.current) clearTimeout(commandTimerRef.current);
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      stopListening();
      Speech.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { phase, transcript, error, endConversation };
}
