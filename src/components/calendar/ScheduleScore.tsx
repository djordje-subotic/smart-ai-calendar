"use client";

import { CalendarEvent } from "@/src/types/event";
import { parseISO, isSameDay } from "date-fns";
import { motion } from "framer-motion";
import { Zap, TrendingUp, Coffee, Brain } from "lucide-react";

interface ScheduleScoreProps {
  events: CalendarEvent[];
  date: Date;
}

function calculateScore(events: CalendarEvent[], date: Date) {
  const dayEvents = events.filter((e) => isSameDay(parseISO(e.start_time), date));

  if (dayEvents.length === 0) return { score: 100, label: "Open day", icon: Coffee, color: "#10B981" };

  // Calculate metrics
  const totalMinutes = dayEvents.reduce((acc, e) => {
    const start = parseISO(e.start_time);
    const end = parseISO(e.end_time);
    return acc + (end.getTime() - start.getTime()) / 60000;
  }, 0);

  const totalHours = totalMinutes / 60;

  // Check for back-to-back meetings (no gaps)
  const sorted = [...dayEvents].sort(
    (a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime()
  );
  let backToBack = 0;
  for (let i = 1; i < sorted.length; i++) {
    const prevEnd = parseISO(sorted[i - 1].end_time).getTime();
    const nextStart = parseISO(sorted[i].start_time).getTime();
    if (nextStart - prevEnd < 15 * 60000) backToBack++;
  }

  // Score logic
  let score = 100;
  if (totalHours > 6) score -= 30; // Too packed
  else if (totalHours > 4) score -= 10;
  score -= backToBack * 15; // Penalize back-to-back
  if (dayEvents.length > 6) score -= 20; // Too many events
  score = Math.max(0, Math.min(100, score));

  if (score >= 80) return { score, label: "Well balanced", icon: TrendingUp, color: "#10B981" };
  if (score >= 50) return { score, label: "Getting busy", icon: Zap, color: "#F59E0B" };
  return { score, label: "Overloaded", icon: Brain, color: "#EF4444" };
}

export function ScheduleScore({ events, date }: ScheduleScoreProps) {
  const { score, label, icon: Icon, color } = calculateScore(events, date);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-3 rounded-xl border border-border/30 bg-card/50 px-4 py-3"
    >
      {/* Circular score */}
      <div className="relative h-11 w-11 shrink-0">
        <svg className="h-11 w-11 -rotate-90" viewBox="0 0 44 44">
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-border/30"
          />
          <motion.circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 18}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 18 }}
            animate={{
              strokeDashoffset: 2 * Math.PI * 18 * (1 - score / 100),
            }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold" style={{ color }}>
            {score}
          </span>
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5" style={{ color }} />
          <span className="text-xs font-semibold" style={{ color }}>
            {label}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Schedule health score
        </p>
      </div>
    </motion.div>
  );
}
