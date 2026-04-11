"use client";

import { motion } from "framer-motion";
import { Battery, BatteryLow, BatteryMedium, BatteryFull, Flame, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

// Default energy curve based on chronobiology research
function getEnergyLevel(hour: number): { level: number; label: string; icon: typeof Flame; color: string } {
  // Morning peak (9-11), post-lunch dip (13-15), afternoon recovery (16-17), evening wind-down
  if (hour >= 6 && hour < 9) return { level: 60, label: "Warming up", icon: BatteryMedium, color: "#F59E0B" };
  if (hour >= 9 && hour < 12) return { level: 95, label: "Peak focus", icon: Flame, color: "#10B981" };
  if (hour >= 12 && hour < 13) return { level: 70, label: "Midday", icon: BatteryMedium, color: "#F59E0B" };
  if (hour >= 13 && hour < 15) return { level: 40, label: "Energy dip", icon: BatteryLow, color: "#EF4444" };
  if (hour >= 15 && hour < 17) return { level: 75, label: "Recovery", icon: BatteryMedium, color: "#3B82F6" };
  if (hour >= 17 && hour < 20) return { level: 55, label: "Winding down", icon: BatteryMedium, color: "#F59E0B" };
  return { level: 20, label: "Rest time", icon: Moon, color: "#8B5CF6" };
}

export function EnergyIndicator() {
  const hour = new Date().getHours();
  const { level, label, icon: Icon, color } = getEnergyLevel(hour);

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
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold" style={{ color }}>{label}</span>
        </div>
        <p className="text-[10px] text-muted-foreground">Energy level • {level}%</p>
      </div>
    </motion.div>
  );
}

export function EnergyTimeline() {
  const currentHour = new Date().getHours();
  const hours = Array.from({ length: 16 }, (_, i) => i + 6); // 6:00 - 21:00

  return (
    <div className="space-y-1.5">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 px-1">
        Energy today
      </h3>
      <div className="flex items-end gap-[3px] h-10 px-1">
        {hours.map((h) => {
          const { level, color } = getEnergyLevel(h);
          const isCurrent = h === currentHour;
          return (
            <motion.div
              key={h}
              initial={{ height: 0 }}
              animate={{ height: `${level}%` }}
              transition={{ duration: 0.5, delay: (h - 6) * 0.03 }}
              className={cn(
                "flex-1 rounded-sm transition-all",
                isCurrent ? "ring-1 ring-white/30" : ""
              )}
              style={{
                backgroundColor: isCurrent ? color : `${color}40`,
                minHeight: 2,
              }}
              title={`${h}:00 - ${level}%`}
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
