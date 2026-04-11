"use client";

import { CalendarEvent } from "@/src/types/event";
import { generateNudges, type Nudge } from "@/src/lib/calendar/nudges";
import { useUIStore } from "@/src/stores/uiStore";
import { Lightbulb, X, Clock, AlertTriangle, Coffee, CalendarPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";

const iconMap = {
  gap: Clock,
  missed: AlertTriangle,
  overloaded: AlertTriangle,
  nobreak: Coffee,
  empty: CalendarPlus,
};

const colorMap = {
  gap: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  missed: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  overloaded: "text-red-400 bg-red-400/10 border-red-400/20",
  nobreak: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  empty: "text-primary bg-primary/10 border-primary/20",
};

interface NudgeBannerProps {
  events: CalendarEvent[];
  date: Date;
}

export function NudgeBanner({ events, date }: NudgeBannerProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const { setCommandPaletteOpen } = useUIStore();

  const nudges = useMemo(() => generateNudges(events, date), [events, date]);
  const visibleNudges = nudges.filter((n) => !dismissed.has(n.id));

  if (visibleNudges.length === 0) return null;

  function handleDismiss(id: string) {
    setDismissed((prev) => new Set([...prev, id]));
  }

  function handleAction(nudge: Nudge) {
    if (nudge.action === "Replan day") {
      // Find and click the Replan button
      const replanBtn = document.querySelector('[data-replan-btn]') as HTMLButtonElement;
      if (replanBtn) replanBtn.click();
      else setCommandPaletteOpen(true);
    } else if (nudge.action === "Add break") {
      setCommandPaletteOpen(true);
      // Pre-fill with break suggestion - user can modify
    } else {
      setCommandPaletteOpen(true);
    }
    handleDismiss(nudge.id);
  }

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {visibleNudges.map((nudge) => {
          const Icon = iconMap[nudge.type];
          const colors = colorMap[nudge.type];
          return (
            <motion.div
              key={nudge.id}
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${colors}`}>
                <Icon className="h-4 w-4 shrink-0" />
                <p className="text-xs flex-1">{nudge.message}</p>
                {nudge.action && (
                  <button
                    onClick={() => handleAction(nudge)}
                    className="text-[10px] font-semibold underline underline-offset-2 shrink-0 hover:opacity-80"
                  >
                    {nudge.action}
                  </button>
                )}
                <button onClick={() => handleDismiss(nudge.id)} className="opacity-40 hover:opacity-80 shrink-0">
                  <X className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
