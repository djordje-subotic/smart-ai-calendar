"use client";

import { useState, useEffect, useRef } from "react";
import { playSound } from "@/src/lib/sounds";

/**
 * Two-phase wake-word voice assistant.
 *
 * Phase "wake" — always listening, scans every transcript for the wake word
 * ("hey krowna", "hej krowna", "ok krowna", and common mis-transcriptions).
 * Nothing leaves the browser until the wake word fires.
 *
 * Phase "command" — triggered for 8 seconds after the wake word. Whatever
 * the user says in this window is sent to `onCommand`. After the response
 * is spoken, we drop back to "wake" and resume listening.
 *
 * This is the same model Siri / Google Assistant / Alexa use. The old
 * implementation sent literally everything to the AI, which hammered rate
 * limits and privacy.
 */

type Phase = "idle" | "wake" | "command" | "processing" | "speaking";

interface UseHeyKrownaOptions {
  onCommand: (command: string) => Promise<string>;
  enabled: boolean;
}

const WAKE_PATTERNS = [
  /\bhey\s+kr[oua][wv]?n+a?\b/i, // hey krowna / hey krona / hey crowna / hey kruna
  /\bhej\s+kr[oua][wv]?n+a?\b/i, // hej krowna (sr)
  /\bok[ae]?y?\s+kr[oua][wv]?n+a?\b/i, // ok krowna / okay krowna
  /\bhi\s+kr[oua][wv]?n+a?\b/i,
  /\bkrovn?a\s*[!?,.]/i, // "Krowna," as direct address
];

function detectWakeWord(text: string): { match: boolean; remainder: string } {
  const trimmed = text.trim();
  for (const re of WAKE_PATTERNS) {
    const m = trimmed.match(re);
    if (m) {
      // Strip the wake word and everything before it — the rest may be the
      // command ("hey krowna what's next" → "what's next")
      const rest = trimmed.slice((m.index ?? 0) + m[0].length).trim();
      return { match: true, remainder: rest };
    }
  }
  return { match: false, remainder: "" };
}

export function useHeyKrowna({ onCommand, enabled }: UseHeyKrownaOptions) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const [lastError, setLastError] = useState<string | null>(null);

  const callbackRef = useRef(onCommand);
  const enabledRef = useRef(enabled);
  const phaseRef = useRef<Phase>("idle");
  // Web Speech API types aren't in standard lib.dom without extra typings.
  // The surface is small and we guard with runtime feature-detection.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commandWindowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commandBufferRef = useRef<string>("");

  callbackRef.current = onCommand;
  enabledRef.current = enabled;

  // Web Speech API works in Chrome, Edge, Safari, Opera. Only Firefox lacks it.
  const speechSupported =
    typeof window !== "undefined" &&
    (("SpeechRecognition" in window) || ("webkitSpeechRecognition" in window));

  function updatePhase(p: Phase) {
    phaseRef.current = p;
    setPhase(p);
  }

  function speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        resolve();
        return;
      }
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      utterance.volume = 0.85;

      const voices = window.speechSynthesis.getVoices();
      const pick =
        voices.find((v) => v.name.includes("Google UK English Female")) ||
        voices.find((v) => v.name.includes("Samantha")) ||
        voices.find((v) => v.name.includes("Daniel")) ||
        voices.find((v) => v.name.includes("Google") && v.lang.startsWith("en")) ||
        voices.find((v) => v.lang.startsWith("en") && v.localService) ||
        voices.find((v) => v.lang.startsWith("en")) ||
        voices[0];
      if (pick) utterance.voice = pick;
      utterance.lang = "en-US";

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
      setTimeout(resolve, 15000); // safety
    });
  }

  function stopRec() {
    try {
      recRef.current?.stop();
    } catch {}
    recRef.current = null;
  }

  function startListening() {
    if (!enabledRef.current) return;
    stopRec();

    const SR =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SR) {
      setLastError("Voice input not supported in this browser. Try Chrome, Edge, or Safari.");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec: any = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    // Prefer English wake-word detection — users can still speak Serbian inside
    // the command window and the AI will understand it.
    rec.lang = "en-US";
    recRef.current = rec;

    rec.onstart = () => {
      if (phaseRef.current === "idle") updatePhase("wake");
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (event: any) => {
      // Never process while speaking back or executing a command
      if (phaseRef.current === "speaking" || phaseRef.current === "processing") return;

      const last = event.results[event.results.length - 1];
      const text = last[0].transcript.trim();

      if (phaseRef.current === "wake") {
        // Only show transcript while user is speaking — otherwise stay blank
        // so the floating panel doesn't light up on random background audio
        setTranscript(text.length > 4 ? text : "");

        if (!last.isFinal) return;

        // Check for wake word in final transcripts
        const { match, remainder } = detectWakeWord(text);
        if (match) {
          playSound("activate");
          updatePhase("command");
          setTranscript(remainder || "Listening…");

          // If the wake word sentence already contained the command
          // ("hey krowna what's next"), execute it immediately
          if (remainder.length > 2) {
            handleCommand(remainder);
            return;
          }

          // Otherwise open an 8s window to capture the follow-up
          commandBufferRef.current = "";
          if (commandWindowTimerRef.current) clearTimeout(commandWindowTimerRef.current);
          commandWindowTimerRef.current = setTimeout(() => {
            if (phaseRef.current === "command") {
              if (commandBufferRef.current.trim()) {
                handleCommand(commandBufferRef.current.trim());
              } else {
                // No follow-up — go back to waiting for wake word
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
        if (last.isFinal && text.length > 2) {
          commandBufferRef.current = text;
          // Fire immediately when we see a final transcript in the command window
          if (commandWindowTimerRef.current) {
            clearTimeout(commandWindowTimerRef.current);
            commandWindowTimerRef.current = null;
          }
          handleCommand(text);
        }
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (event: any) => {
      // Surface meaningful errors, ignore benign ones (no-speech, aborted, network)
      const err = event.error;
      if (err === "not-allowed" || err === "service-not-allowed") {
        setLastError("Microphone permission denied. Enable it in browser settings.");
        enabledRef.current = false;
        updatePhase("idle");
      } else if (err === "no-speech" || err === "aborted" || err === "network") {
        // Normal transient issues — let onend restart us
      } else {
        console.warn("Voice recognition error:", err);
      }
    };

    rec.onend = () => {
      // Auto-restart as long as voice is enabled
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
    };

    try {
      rec.start();
      setLastError(null);
    } catch {
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      restartTimerRef.current = setTimeout(() => startListening(), 1000);
    }
  }

  async function handleCommand(command: string) {
    updatePhase("processing");
    stopRec();
    setTranscript(command);

    if (commandWindowTimerRef.current) {
      clearTimeout(commandWindowTimerRef.current);
      commandWindowTimerRef.current = null;
    }

    try {
      const response = await callbackRef.current(command);
      updatePhase("speaking");
      setTranscript(response);
      playSound("success");
      await speak(response);
    } catch {
      playSound("error");
      updatePhase("speaking");
      await speak("Sorry, something went wrong.");
    } finally {
      // Always return to wake-word listening
      setTranscript("");
      commandBufferRef.current = "";
      updatePhase("wake");
      startListening();
    }
  }

  function endConversation() {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    if (commandWindowTimerRef.current) {
      clearTimeout(commandWindowTimerRef.current);
      commandWindowTimerRef.current = null;
    }
    stopRec();
    window.speechSynthesis?.cancel();
    commandBufferRef.current = "";
    updatePhase("idle");
  }

  useEffect(() => {
    if (enabled && speechSupported) {
      window.speechSynthesis?.getVoices(); // preload
      updatePhase("wake");
      startListening();
    } else {
      stopRec();
      window.speechSynthesis?.cancel();
      updatePhase("idle");
    }

    return () => {
      enabledRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      if (commandWindowTimerRef.current) clearTimeout(commandWindowTimerRef.current);
      stopRec();
      window.speechSynthesis?.cancel();
    };
  }, [enabled, speechSupported]);

  return {
    phase,
    transcript,
    /** Browser can use voice input at all */
    isSupported: speechSupported,
    /** Legacy name kept for backwards compatibility with existing components */
    isChrome: speechSupported,
    endConversation,
    lastError,
  };
}
