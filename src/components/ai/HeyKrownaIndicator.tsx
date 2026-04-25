"use client";

import { useState, useCallback, useEffect } from "react";
import { useHeyKrowna } from "@/src/hooks/useHeyKrowna";
import { playSound } from "@/src/lib/sounds";
import { migrateLocalStorageKey } from "@/src/lib/storageMigration";
import { chatWithAI, type ChatMessage } from "@/src/actions/ai";
import { createEvent } from "@/src/actions/events";
import { createClient } from "@/src/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Mic, MicOff, Loader2, Volume2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function HeyKrownaIndicator() {
  const [mounted, setMounted] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    setMounted(true);
    // Load voice preference from DB, fallback to localStorage
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from("profiles").select("voice_enabled").eq("id", user.id).single().then(({ data }) => {
          const voiceOn = data?.voice_enabled || false;
          setEnabled(voiceOn);
          localStorage.setItem("krowna-hey-mode", String(voiceOn));
        });
      } else {
        const stored = migrateLocalStorageKey("krowna-hey-mode", "krowna-hey-mode");
        setEnabled(stored === "true");
      }
    });
  }, []);

  const handleCommand = useCallback(async (command: string): Promise<string> => {
    const newHistory: ChatMessage[] = [...chatHistory, { role: "user", content: command }];

    try {
      const result = await chatWithAI(newHistory, "Europe/Belgrade", true);
      setChatHistory([...newHistory, { role: "assistant", content: result.message }]);

      if (result.events && result.events.length > 0) {
        for (const event of result.events) {
          await createEvent({
            title: event.title,
            description: event.description,
            location: event.location,
            start_time: event.start_time,
            end_time: event.end_time,
            all_day: false,
            color: event.color || "#3B82F6",
            recurrence_rule: event.recurrence as any,
            reminder_minutes: [15],
            source: "ai",
            external_id: null,
            meeting_url: event.meeting_url || null,
            ai_metadata: { original_prompt: command, confidence: 0.9, model_used: "claude-haiku-4-5" },
            status: "confirmed",
          });
        }
        queryClient.invalidateQueries({ queryKey: ["events"] });
      }

      return result.message;
    } catch (err) {
      return `Sorry, I got an error: ${err instanceof Error ? err.message : "Unknown error"}`;
    }
  }, [chatHistory, queryClient]);

  const { phase, transcript, isSupported, endConversation, lastError } = useHeyKrowna({
    onCommand: handleCommand,
    enabled,
  });

  function toggleEnabled() {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem("krowna-hey-mode", String(next));
    // Persist to DB
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) supabase.from("profiles").update({ voice_enabled: next }).eq("id", user.id);
    });
    if (next) playSound("activate");
    if (!next) {
      endConversation();
      setChatHistory([]);
    }
  }

  if (!mounted) return null;

  // Unsupported browsers: show a muted, disabled toggle with hint
  if (!isSupported) {
    return (
      <button
        disabled
        title="Voice requires Chrome, Edge, or Safari"
        className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium border border-border/30 bg-muted/20 text-muted-foreground/50 cursor-not-allowed"
      >
        <MicOff className="h-3 w-3" />
        Voice unsupported
      </button>
    );
  }

  const statusLabel =
    phase === "processing" ? "Thinking…" :
    phase === "speaking" ? "Speaking…" :
    phase === "command" ? "Listening…" :
    phase === "wake" && transcript ? "Hearing…" :
    enabled ? "Voice on" : "Voice off";

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={toggleEnabled}
        title={enabled ? "Say 'Hey Krowna' to talk. Click to turn off." : "Turn voice on — then say 'Hey Krowna'"}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium transition-all border",
          phase === "command"
            ? "bg-red-500/15 text-red-400 border-red-500/40 ring-2 ring-red-500/30"
            : phase === "speaking" || phase === "processing"
              ? "bg-primary/15 text-primary border-primary/30"
              : phase === "wake" && transcript
                ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                : enabled
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-muted/30 text-muted-foreground border-border/30 hover:border-border/50"
        )}
      >
        {phase === "processing" ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : phase === "speaking" ? (
          <Volume2 className="h-3 w-3" />
        ) : phase === "command" ? (
          <div className="flex items-center gap-[2px] h-3">
            <div className="w-[2px] rounded-full bg-red-400 sound-bar-1" />
            <div className="w-[2px] rounded-full bg-red-400 sound-bar-2" />
            <div className="w-[2px] rounded-full bg-red-400 sound-bar-3" />
          </div>
        ) : enabled ? (
          <Mic className="h-3 w-3" />
        ) : (
          <MicOff className="h-3 w-3" />
        )}
        {statusLabel}
      </button>

      {/* Permission-denied toast (inline, since user needs to act) */}
      {lastError && enabled && (
        <div className="fixed top-16 right-6 z-50 w-72 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          {lastError}
        </div>
      )}

      {/* Floating panel - shows during active interaction */}
      <AnimatePresence>
        {enabled && (phase === "processing" || phase === "speaking" || phase === "command" || transcript) && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed top-16 right-6 z-50 w-80 rounded-2xl border border-primary/20 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg gradient-primary">
                  <Mic className="h-3 w-3 text-primary-foreground" />
                </div>
                <span className="text-xs font-semibold">Krowna Voice</span>
              </div>
              <button onClick={() => { endConversation(); setChatHistory([]); setEnabled(false); localStorage.setItem("krowna-hey-mode", "false"); }}
                className="text-muted-foreground/40 hover:text-muted-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* Current activity */}
              <div className="flex items-center gap-3">
                {phase === "processing" ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
                    <span className="text-xs text-muted-foreground">Thinking...</span>
                  </>
                ) : phase === "speaking" ? (
                  <>
                    <div className="flex items-center gap-[3px] h-5 shrink-0">
                      <div className="w-[3px] rounded-full bg-primary sound-bar-1" />
                      <div className="w-[3px] rounded-full bg-primary sound-bar-2" />
                      <div className="w-[3px] rounded-full bg-primary sound-bar-3" />
                      <div className="w-[3px] rounded-full bg-primary sound-bar-4" />
                      <div className="w-[3px] rounded-full bg-primary sound-bar-5" />
                    </div>
                    <p className="text-xs text-foreground leading-relaxed">{transcript}</p>
                  </>
                ) : transcript ? (
                  <>
                    <div className="flex items-center gap-[3px] h-5 shrink-0">
                      <div className="w-[3px] rounded-full bg-red-400 sound-bar-1" />
                      <div className="w-[3px] rounded-full bg-red-400 sound-bar-2" />
                      <div className="w-[3px] rounded-full bg-red-400 sound-bar-3" />
                      <div className="w-[3px] rounded-full bg-red-400 sound-bar-4" />
                      <div className="w-[3px] rounded-full bg-red-400 sound-bar-5" />
                    </div>
                    <p className="text-xs text-foreground italic">{transcript}</p>
                  </>
                ) : null}
              </div>

              {/* Recent history */}
              {chatHistory.length > 0 && (
                <div className="space-y-1.5 border-t border-border/10 pt-2">
                  {chatHistory.slice(-4).map((msg, i) => (
                    <div key={i} className={cn(
                      "rounded-lg px-2.5 py-1.5 text-[10px] leading-relaxed",
                      msg.role === "user" ? "bg-primary/10 text-foreground ml-6" : "bg-muted/30 text-foreground/80 mr-6"
                    )}>
                      {msg.content.length > 100 ? msg.content.slice(0, 100) + "..." : msg.content}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-4 py-2 border-t border-border/20 text-[9px] text-muted-foreground/40 text-center">
              Say &ldquo;Hey Krowna&rdquo; to start · Then &ldquo;What&apos;s next?&rdquo; or &ldquo;Plan my day&rdquo;
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
