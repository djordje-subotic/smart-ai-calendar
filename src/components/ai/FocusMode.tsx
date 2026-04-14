"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Brain, Loader2, Timer, Check } from "lucide-react";
import { motion } from "framer-motion";
import { startFocusSession } from "@/src/actions/ai";
import { useQueryClient } from "@tanstack/react-query";
import { playSound } from "@/src/lib/sounds";
import { cn } from "@/lib/utils";

const DURATIONS = [
  { min: 25, label: "25 min", desc: "Pomodoro" },
  { min: 45, label: "45 min", desc: "Short" },
  { min: 90, label: "90 min", desc: "Deep work" },
  { min: 120, label: "2 hours", desc: "Marathon" },
];

export function FocusModeCard() {
  const [starting, setStarting] = useState(false);
  const [started, setStarted] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(90);
  const queryClient = useQueryClient();

  async function handleStart() {
    setStarting(true);
    try {
      await startFocusSession(selectedDuration, "Focus Block");
      queryClient.invalidateQueries({ queryKey: ["events"] });
      playSound("success");
      setStarted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setStarting(false);
    }
  }

  if (started) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-5 text-center">
        <Check className="h-6 w-6 mx-auto text-violet-400 mb-2" />
        <p className="text-sm font-semibold text-violet-300">Focus mode active</p>
        <p className="text-[11px] text-muted-foreground mt-1">{selectedDuration} min block created. Go crush it!</p>
        <Button onClick={() => setStarted(false)} variant="ghost" size="sm" className="mt-3 text-[10px] text-muted-foreground">
          Done? Close this
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/30 bg-card/50 p-5"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
          <Brain className="h-4 w-4 text-violet-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Focus Mode</h3>
          <p className="text-[11px] text-muted-foreground/60">Block distraction-free time on your calendar</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {DURATIONS.map((d) => (
          <button
            key={d.min}
            onClick={() => setSelectedDuration(d.min)}
            className={cn(
              "rounded-lg border py-2 text-center transition-all",
              selectedDuration === d.min
                ? "border-violet-500/50 bg-violet-500/10"
                : "border-border/20 bg-muted/10 hover:bg-muted/20"
            )}
          >
            <div className={cn("text-xs font-semibold", selectedDuration === d.min ? "text-violet-400" : "text-foreground")}>{d.label}</div>
            <div className="text-[9px] text-muted-foreground/50">{d.desc}</div>
          </button>
        ))}
      </div>

      <Button
        onClick={handleStart}
        disabled={starting}
        className="w-full bg-violet-600 hover:bg-violet-700 border-0 text-white text-xs"
      >
        {starting ? <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" />Starting...</> : <><Timer className="mr-1.5 h-3 w-3" />Start focus session</>}
      </Button>
    </motion.div>
  );
}
