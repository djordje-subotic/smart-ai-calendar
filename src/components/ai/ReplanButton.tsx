"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { replanDay, type ReplanResult } from "@/src/actions/ai";
import { createEvent } from "@/src/actions/events";
import { RefreshCw, Loader2, ArrowRight, Plus, Trash2, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

export function ReplanButton() {
  const [result, setResult] = useState<ReplanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  async function handleReplan() {
    setLoading(true);
    setError(null);
    setApplied(false);
    try {
      const res = await replanDay();
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to replan");
    } finally {
      setLoading(false);
    }
  }

  async function handleApply() {
    if (!result) return;
    setApplying(true);
    try {
      // Apply adds - create new events
      for (const add of result.adds) {
        const today = new Date();
        const [h, m] = (add.time || "09:00").split(":").map(Number);
        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m || 0);
        const end = new Date(start.getTime() + 30 * 60000);

        await createEvent({
          title: add.title,
          description: add.reason,
          location: null,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          all_day: false,
          color: "#10B981",
          recurrence_rule: null,
          reminder_minutes: [15],
          source: "ai",
          external_id: null,
          ai_metadata: { original_prompt: "replan", confidence: 0.8, model_used: "claude-haiku-4-5" },
          status: "confirmed",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["events"] });
      setApplied(true);
    } catch (err) {
      setError("Failed to apply some changes");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div>
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-3"
          >
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="flex items-start justify-between">
                <p className="text-xs text-foreground/80 leading-relaxed flex-1">{result.message}</p>
                <button onClick={() => setResult(null)} className="text-muted-foreground/40 hover:text-muted-foreground ml-2">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {result.moves.length > 0 && result.moves.map((m, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] text-muted-foreground bg-background/30 rounded-lg px-3 py-2">
                  <ArrowRight className="h-3 w-3 text-blue-400 shrink-0" />
                  <span className="flex-1"><strong>{m.event_title}</strong>: {m.from} → {m.to} — {m.reason}</span>
                </div>
              ))}

              {result.adds.length > 0 && result.adds.map((a, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] text-muted-foreground bg-background/30 rounded-lg px-3 py-2">
                  <Plus className="h-3 w-3 text-green-400 shrink-0" />
                  <span className="flex-1"><strong>{a.title}</strong> at {a.time} — {a.reason}</span>
                </div>
              ))}

              {result.removes.length > 0 && result.removes.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] text-muted-foreground bg-background/30 rounded-lg px-3 py-2">
                  <Trash2 className="h-3 w-3 text-red-400 shrink-0" />
                  <span className="flex-1"><strong>{r.event_title}</strong> — {r.reason}</span>
                </div>
              ))}

              {/* Apply button */}
              {(result.adds.length > 0 || result.moves.length > 0) && !applied && (
                <Button
                  size="sm"
                  onClick={handleApply}
                  disabled={applying}
                  className="w-full gradient-primary border-0 text-primary-foreground text-xs"
                >
                  {applying ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Check className="mr-1.5 h-3 w-3" />}
                  {applying ? "Applying..." : "Apply changes"}
                </Button>
              )}

              {applied && (
                <div className="flex items-center gap-2 text-xs text-green-400">
                  <Check className="h-3.5 w-3.5" />
                  Changes applied to your calendar
                </div>
              )}

              {result.usage && (
                <p className="text-[9px] text-muted-foreground/30 text-right">{result.usage.used}/{result.usage.limit} credits</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="text-xs text-destructive mb-2">{error}</p>}

      <Button
        data-replan-btn
        variant="outline"
        size="sm"
        onClick={handleReplan}
        disabled={loading}
        className="text-xs border-border/40 hover:border-primary/30 hover:bg-primary/5 gap-1.5"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
        {loading ? "Replanning..." : "Replan my day"}
      </Button>
    </div>
  );
}
