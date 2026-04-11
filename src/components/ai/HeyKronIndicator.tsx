"use client";

import { useState, useCallback, useEffect } from "react";
import { useHeyKron } from "@/src/hooks/useHeyKron";
import { playSound } from "@/src/lib/sounds";
import { chatWithAI, type ChatMessage } from "@/src/actions/ai";
import { createEvent } from "@/src/actions/events";
import { useQueryClient } from "@tanstack/react-query";
import { Mic, MicOff, Loader2, Volume2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function HeyKronIndicator() {
  const [mounted, setMounted] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    setMounted(true);
    setEnabled(localStorage.getItem("kron-hey-mode") === "true");
  }, []);

  const handleCommand = useCallback(async (command: string): Promise<string> => {
    const newHistory: ChatMessage[] = [...chatHistory, { role: "user", content: command }];

    try {
      const result = await chatWithAI(newHistory);
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

  const { phase, transcript, isChrome, endConversation } = useHeyKron({
    onCommand: handleCommand,
    enabled,
  });

  function toggleEnabled() {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem("kron-hey-mode", String(next));
    if (next) playSound("activate");
    if (!next) {
      endConversation();
      setChatHistory([]);
    }
  }

  if (!mounted || !isChrome) return null;

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={toggleEnabled}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium transition-all border",
          phase === "listening" || phase === "ready"
            ? transcript
              ? "bg-red-500/15 text-red-400 border-red-500/30"
              : "bg-green-500/15 text-green-400 border-green-500/30"
            : phase === "speaking"
              ? "bg-primary/15 text-primary border-primary/30"
              : phase === "processing"
                ? "bg-primary/15 text-primary border-primary/30"
                : enabled
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-muted/30 text-muted-foreground border-border/30 hover:border-border/50"
        )}
      >
        {phase === "processing" ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : phase === "speaking" ? (
          <Volume2 className="h-3 w-3" />
        ) : (phase === "ready" || phase === "listening") && transcript ? (
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
        {phase === "processing" ? "Thinking..." :
         phase === "speaking" ? "Speaking..." :
         transcript ? "Hearing..." :
         enabled ? "Voice on" : "Voice off"}
      </button>

      {/* Floating panel - shows when something is happening */}
      <AnimatePresence>
        {enabled && (phase === "processing" || phase === "speaking" || transcript) && (
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
                <span className="text-xs font-semibold">Kron Voice</span>
              </div>
              <button onClick={() => { endConversation(); setChatHistory([]); setEnabled(false); localStorage.setItem("kron-hey-mode", "false"); }}
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
              Always listening · Just speak naturally
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
