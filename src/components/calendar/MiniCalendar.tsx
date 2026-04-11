"use client";

import { useCalendarStore } from "@/src/stores/calendarStore";
import {
  format,
  isSameDay,
  isSameMonth,
  isToday,
  getMonthDays,
  addMonths,
  subMonths,
} from "@/src/lib/calendar/utils";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

const dayHeaders = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export function MiniCalendar() {
  const { selectedDate, setSelectedDate, setView } = useCalendarStore();
  const [displayMonth, setDisplayMonth] = useState(selectedDate);
  const days = getMonthDays(displayMonth);

  return (
    <div className="select-none">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wide">
          {format(displayMonth, "MMMM yyyy")}
        </span>
        <div className="flex gap-0.5">
          <button
            onClick={() => setDisplayMonth(subMonths(displayMonth, 1))}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          >
            <ChevronLeft className="h-3 w-3" />
          </button>
          <button
            onClick={() => setDisplayMonth(addMonths(displayMonth, 1))}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center">
        {dayHeaders.map((d) => (
          <div key={d} className="py-1 text-[10px] font-medium text-muted-foreground/70">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const selected = isSameDay(day, selectedDate);
          const today = isToday(day);
          const currentMonth = isSameMonth(day, displayMonth);
          return (
            <button
              key={day.toISOString()}
              onClick={() => {
                setSelectedDate(day);
                setView("day");
              }}
              className={cn(
                "relative rounded-md py-1 text-[11px] transition-all duration-150",
                !currentMonth && "text-muted-foreground/30",
                currentMonth && !selected && !today && "text-foreground/70 hover:bg-accent/50",
                today && !selected && "font-bold text-primary",
                selected && "text-primary-foreground font-semibold"
              )}
            >
              {selected && (
                <motion.div
                  layoutId="mini-cal-selected"
                  className="absolute inset-0 rounded-md gradient-primary"
                  transition={{ duration: 0.15 }}
                />
              )}
              <span className="relative z-10">{format(day, "d")}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
