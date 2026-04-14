"use client";

import { useState, useEffect } from "react";
import { getCalendarHeatmap } from "@/src/actions/ai";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function CalendarHeatmap() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [data, setData] = useState<Array<{ date: string; count: number; hours: number }>>([]);

  useEffect(() => {
    getCalendarHeatmap(year, month).then(setData).catch(() => {});
  }, [year, month]);

  const monthName = new Date(year, month).toLocaleString("en", { month: "long", year: "numeric" });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  function getIntensity(date: string): number {
    const d = data.find((x) => x.date === date);
    if (!d) return 0;
    if (d.hours >= 8) return 4;
    if (d.hours >= 5) return 3;
    if (d.hours >= 2) return 2;
    return 1;
  }

  const intensityColors = [
    "bg-muted/15 border-border/10",       // 0: empty
    "bg-primary/15 border-primary/20",     // 1: light
    "bg-primary/30 border-primary/30",     // 2: medium
    "bg-primary/50 border-primary/40",     // 3: busy
    "bg-primary/70 border-primary/50",     // 4: packed
  ];

  function prev() {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  }

  function next() {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  }

  return (
    <div className="rounded-xl border border-border/30 bg-card/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">Activity</h3>
        <div className="flex items-center gap-2">
          <button onClick={prev} className="text-muted-foreground/40 hover:text-muted-foreground"><ChevronLeft className="h-3 w-3" /></button>
          <span className="text-[10px] font-medium text-muted-foreground w-24 text-center">{monthName}</span>
          <button onClick={next} className="text-muted-foreground/40 hover:text-muted-foreground"><ChevronRight className="h-3 w-3" /></button>
        </div>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-[8px] text-muted-foreground/30 text-center font-medium">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for first day offset */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const intensity = getIntensity(dateStr);
          const dayData = data.find((x) => x.date === dateStr);
          const isToday = dateStr === new Date().toISOString().split("T")[0];

          return (
            <div
              key={day}
              title={dayData ? `${dayData.count} events, ${dayData.hours.toFixed(1)}h` : "No events"}
              className={cn(
                "aspect-square rounded-sm border flex items-center justify-center text-[8px] font-mono transition-colors",
                intensityColors[intensity],
                isToday && "ring-1 ring-primary/60"
              )}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 mt-2">
        <span className="text-[8px] text-muted-foreground/30">Less</span>
        {intensityColors.map((c, i) => (
          <div key={i} className={cn("h-2.5 w-2.5 rounded-sm border", c)} />
        ))}
        <span className="text-[8px] text-muted-foreground/30">More</span>
      </div>
    </div>
  );
}
