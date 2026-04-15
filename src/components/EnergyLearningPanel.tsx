"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Result = {
  ok: boolean;
  peak_hours?: number[];
  low_hours?: number[];
  chronotype?: string;
  reason?: string;
};

function formatHour(h: number) {
  const suffix = h >= 12 ? "pm" : "am";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}${suffix}`;
}

const CHRONO_LABEL: Record<string, string> = {
  morning: "Morning lark",
  evening: "Night owl",
  balanced: "Balanced",
};

export function EnergyLearningPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function run() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/learn-energy", { method: "POST" });
      const data: Result = await res.json();
      setResult(data);
    } catch {
      setResult({ ok: false, reason: "network" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-border/40 bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
          <Activity className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Learn my energy pattern</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Krowna looks at when you actually show up for events and finish tasks, then tunes
            scheduling to match your peaks.
          </p>
        </div>
        <Button size="sm" onClick={run} disabled={loading} className="gradient-primary border-0 text-primary-foreground">
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
          {loading ? "Learning..." : "Learn"}
        </Button>
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-lg border border-border/30 bg-muted/10 p-3"
        >
          {result.ok ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  {CHRONO_LABEL[result.chronotype || "balanced"]}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Peak hours:{" "}
                <span className="font-semibold text-foreground">
                  {result.peak_hours?.map(formatHour).join(" · ")}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                Low hours:{" "}
                <span className="font-semibold text-foreground">
                  {result.low_hours?.map(formatHour).join(" · ")}
                </span>
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {result.reason === "not_enough_data"
                ? "Not enough history yet — use Krowna for a couple of weeks and try again."
                : "Couldn't update right now. Try again in a moment."}
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}
