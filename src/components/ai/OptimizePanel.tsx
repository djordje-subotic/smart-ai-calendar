"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { optimizeSchedule, type OptimizeResult } from "@/src/actions/ai";
import { Wand2, ArrowRight, Plus, Trash2, Lightbulb, Loader2, Lock, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { startOfWeek, endOfWeek } from "date-fns";
import { useCalendarStore } from "@/src/stores/calendarStore";
import Link from "next/link";

const typeIcons = {
  move: ArrowRight,
  add: Plus,
  remove: Trash2,
  tip: Lightbulb,
};

const typeColors = {
  move: "#3B82F6",
  add: "#10B981",
  remove: "#EF4444",
  tip: "#F59E0B",
};

export function OptimizePanel() {
  const { selectedDate } = useCalendarStore();
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProRequired, setIsProRequired] = useState(false);

  async function handleOptimize() {
    setLoading(true);
    setError(null);
    setIsProRequired(false);

    const start = startOfWeek(selectedDate, { weekStartsOn: 1 }).toISOString();
    const end = endOfWeek(selectedDate, { weekStartsOn: 1 }).toISOString();

    try {
      const res = await optimizeSchedule("optimize my schedule for productivity", start, end);
      setResult(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Pro") || msg.includes("Upgrade")) {
        setIsProRequired(true);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-t border-border/30 bg-background/80 backdrop-blur-xl">
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-3">
              {/* Score + Analysis */}
              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                  style={{
                    backgroundColor: result.score >= 70 ? "#10B98120" : result.score >= 40 ? "#F59E0B20" : "#EF444420",
                    color: result.score >= 70 ? "#10B981" : result.score >= 40 ? "#F59E0B" : "#EF4444",
                  }}
                >
                  {result.score}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{result.analysis}</p>
              </div>

              {/* Suggestions */}
              {result.suggestions.length > 0 && (
                <div className="space-y-2">
                  {result.suggestions.map((s, i) => {
                    const Icon = typeIcons[s.type] || Lightbulb;
                    const color = typeColors[s.type] || "#F59E0B";
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-2.5 rounded-lg border border-border/20 bg-card/30 p-3"
                      >
                        <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color }} />
                        <div>
                          <span className="text-xs font-medium text-foreground">
                            {s.event_title || s.title}
                          </span>
                          <p className="text-[11px] text-muted-foreground">{s.reason}</p>
                          {s.suggested_time && (
                            <p className="text-[10px] text-primary font-mono mt-0.5">{s.suggested_time}</p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setResult(null)}>
                Dismiss
              </Button>
            </div>
          </motion.div>
        )}

        {isProRequired && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 m-3 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-primary">
                <Crown className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold">Pro feature</p>
                <p className="text-[11px] text-muted-foreground">AI schedule optimization requires a Pro or Team plan.</p>
              </div>
              <Link href="/settings">
                <Button size="sm" className="gradient-primary border-0 text-primary-foreground text-xs">
                  Upgrade
                </Button>
              </Link>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-4 pb-3"
          >
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Optimize button */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border/20">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleOptimize}
          disabled={loading}
          className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
          {loading ? "Analyzing..." : "Optimize schedule"}
        </Button>
      </div>
    </div>
  );
}
