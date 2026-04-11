"use client";

import { motion } from "framer-motion";
import { Battery, BatteryLow, BatteryMedium, Flame, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { getUsageStats } from "@/src/actions/ai";

type Chronotype = "lark" | "balanced" | "owl";

const ENERGY_PROFILES: Record<Chronotype, Record<string, { level: number; label: string; color: string }>> = {
  lark: {
    "6-9": { level: 80, label: "Peak energy", color: "#10B981" },
    "9-12": { level: 95, label: "Peak focus", color: "#10B981" },
    "12-13": { level: 65, label: "Midday", color: "#F59E0B" },
    "13-15": { level: 35, label: "Energy dip", color: "#EF4444" },
    "15-17": { level: 60, label: "Recovery", color: "#3B82F6" },
    "17-20": { level: 40, label: "Winding down", color: "#F59E0B" },
    "20-24": { level: 15, label: "Rest time", color: "#8B5CF6" },
  },
  balanced: {
    "6-9": { level: 55, label: "Warming up", color: "#F59E0B" },
    "9-12": { level: 90, label: "Peak focus", color: "#10B981" },
    "12-13": { level: 65, label: "Midday", color: "#F59E0B" },
    "13-15": { level: 40, label: "Energy dip", color: "#EF4444" },
    "15-17": { level: 70, label: "Recovery", color: "#3B82F6" },
    "17-20": { level: 50, label: "Winding down", color: "#F59E0B" },
    "20-24": { level: 20, label: "Rest time", color: "#8B5CF6" },
  },
  owl: {
    "6-9": { level: 25, label: "Slow start", color: "#EF4444" },
    "9-12": { level: 55, label: "Warming up", color: "#F59E0B" },
    "12-13": { level: 70, label: "Getting going", color: "#3B82F6" },
    "13-15": { level: 60, label: "Steady", color: "#3B82F6" },
    "15-18": { level: 80, label: "Peak focus", color: "#10B981" },
    "18-21": { level: 95, label: "Peak energy", color: "#10B981" },
    "21-24": { level: 70, label: "Creative time", color: "#3B82F6" },
  },
};

function getEnergyForHour(hour: number, chronotype: Chronotype) {
  const profile = ENERGY_PROFILES[chronotype];
  for (const range of Object.keys(profile)) {
    const [start, end] = range.split("-").map(Number);
    if (hour >= start && hour < end) return profile[range];
  }
  return { level: 20, label: "Rest time", color: "#8B5CF6" };
}

export function EnergyIndicator() {
  const hour = new Date().getHours();
  const [chronotype, setChronotype] = useState<Chronotype>("balanced");

  useEffect(() => {
    getUsageStats().then((stats) => {
      if (stats?.energy_profile?.chronotype) {
        setChronotype(stats.energy_profile.chronotype as Chronotype);
      }
    });
  }, []);

  const { level, label, color } = getEnergyForHour(hour, chronotype);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-3 rounded-xl border border-border/30 bg-card/50 px-4 py-3"
    >
      <div className="relative h-9 w-9 shrink-0">
        <svg className="h-9 w-9 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-border/20" />
          <motion.circle
            cx="18" cy="18" r="15" fill="none"
            stroke={color} strokeWidth="2.5" strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 15}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 15 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 15 * (1 - level / 100) }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Flame className="h-3.5 w-3.5" style={{ color }} />
        </div>
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold" style={{ color }}>{label}</span>
        </div>
        <p className="text-[10px] text-muted-foreground">Energy {level}%</p>
      </div>
    </motion.div>
  );
}

export function EnergyTimeline() {
  const currentHour = new Date().getHours();
  const hours = Array.from({ length: 16 }, (_, i) => i + 6);
  const [chronotype, setChronotype] = useState<Chronotype>("balanced");

  useEffect(() => {
    getUsageStats().then((stats) => {
      if (stats?.energy_profile?.chronotype) {
        setChronotype(stats.energy_profile.chronotype as Chronotype);
      }
    });
  }, []);

  return (
    <div className="space-y-1.5">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 px-1">
        Energy today
      </h3>
      <div className="flex items-end gap-[3px] h-10 px-1">
        {hours.map((h) => {
          const { level, color } = getEnergyForHour(h, chronotype);
          const isCurrent = h === currentHour;
          return (
            <motion.div
              key={h}
              initial={{ height: 0 }}
              animate={{ height: `${level}%` }}
              transition={{ duration: 0.5, delay: (h - 6) * 0.03 }}
              className={isCurrent ? "flex-1 rounded-sm ring-1 ring-white/30" : "flex-1 rounded-sm"}
              style={{ backgroundColor: isCurrent ? color : `${color}40`, minHeight: 2 }}
              title={`${h}:00 — ${level}%`}
            />
          );
        })}
      </div>
      <div className="flex justify-between px-1">
        <span className="text-[9px] text-muted-foreground/40">6am</span>
        <span className="text-[9px] text-muted-foreground/40">12pm</span>
        <span className="text-[9px] text-muted-foreground/40">9pm</span>
      </div>
    </div>
  );
}
