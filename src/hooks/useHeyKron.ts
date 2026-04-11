"use client";

import { useState, useEffect, useRef } from "react";
import { playSound } from "@/src/lib/sounds";

type Phase = "idle" | "ready" | "listening" | "processing" | "speaking";

interface UseHeyKronOptions {
  onCommand: (command: string) => Promise<string>;
  enabled: boolean;
}

export function useHeyKron({ onCommand, enabled }: UseHeyKronOptions) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const callbackRef = useRef(onCommand);
  const enabledRef = useRef(enabled);
  const phaseRef = useRef<Phase>("idle");
  const recRef = useRef<any>(null);

  callbackRef.current = onCommand;
  enabledRef.current = enabled;

  const isChrome = typeof window !== "undefined" &&
    /Chrome/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent);

  function updatePhase(p: Phase) {
    phaseRef.current = p;
    setPhase(p);
  }

  function speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !window.speechSynthesis) { resolve(); return; }
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      utterance.volume = 0.85;

      // Find best voice
      const voices = window.speechSynthesis.getVoices();
      const pick = (
        // Prefer natural/premium voices
        voices.find((v) => v.name.includes("Google UK English Female")) ||
        voices.find((v) => v.name.includes("Google UK English Male")) ||
        voices.find((v) => v.name.includes("Samantha")) || // macOS
        voices.find((v) => v.name.includes("Daniel")) || // macOS
        voices.find((v) => v.name.includes("Karen")) || // macOS
        voices.find((v) => v.name.includes("Google") && v.lang.startsWith("en")) ||
        voices.find((v) => v.lang.startsWith("en") && v.localService) ||
        voices.find((v) => v.lang.startsWith("en")) ||
        voices[0]
      );
      if (pick) utterance.voice = pick;

      // Always speak in English for consistent quality
      utterance.lang = "en-US";

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
      setTimeout(resolve, 15000); // safety
    });
  }

  function stopRec() {
    try { recRef.current?.stop(); } catch {}
    recRef.current = null;
  }

  function startListening() {
    if (!enabledRef.current) return;
    stopRec();

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    recRef.current = rec;

    rec.onstart = () => {
      if (phaseRef.current === "idle" || phaseRef.current === "ready") {
        updatePhase("ready");
      }
    };

    rec.onresult = (event: any) => {
      if (phaseRef.current === "speaking" || phaseRef.current === "processing") return;

      const last = event.results[event.results.length - 1];
      const text = last[0].transcript.trim();

      if (phaseRef.current === "ready") {
        // Show interim transcript
        setTranscript(text);
      } else if (phaseRef.current === "listening") {
        setTranscript(text);
      }

      if (last.isFinal && text.length > 2) {
        setTranscript("");
        handleCommand(text);
      }
    };

    rec.onerror = () => {};

    rec.onend = () => {
      // Auto restart if enabled and not speaking/processing
      if (enabledRef.current && phaseRef.current !== "speaking" && phaseRef.current !== "processing") {
        setTimeout(() => {
          if (enabledRef.current && phaseRef.current !== "speaking" && phaseRef.current !== "processing") {
            startListening();
          }
        }, 300);
      }
    };

    try { rec.start(); } catch {
      setTimeout(() => startListening(), 1000);
    }
  }

  async function handleCommand(command: string) {
    updatePhase("processing");
    stopRec();
    setTranscript("");

    try {
      const response = await callbackRef.current(command);

      // Speak response
      updatePhase("speaking");
      setTranscript(response);
      playSound("success");
      await speak(response);

      // Back to listening
      setTranscript("");
      updatePhase("ready");
      startListening();
    } catch {
      playSound("error");
      updatePhase("speaking");
      await speak("Sorry, something went wrong.");
      setTranscript("");
      updatePhase("ready");
      startListening();
    }
  }

  function endConversation() {
    stopRec();
    window.speechSynthesis?.cancel();
    updatePhase("idle");
  }

  useEffect(() => {
    if (enabled && isChrome) {
      // Preload voices
      window.speechSynthesis?.getVoices();

      updatePhase("ready");
      startListening();
    } else {
      stopRec();
      window.speechSynthesis?.cancel();
      updatePhase("idle");
    }

    return () => {
      enabledRef.current = false;
      stopRec();
      window.speechSynthesis?.cancel();
    };
  }, [enabled, isChrome]);

  return { phase, transcript, isChrome, endConversation };
}
