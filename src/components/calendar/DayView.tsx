"use client";

import { CalendarEvent } from "@/src/types/event";
import { useCalendarStore } from "@/src/stores/calendarStore";
import { useUIStore } from "@/src/stores/uiStore";
import {
  format,
  parseISO,
  getHoursOfDay,
  getEventsForDay,
  isToday,
} from "@/src/lib/calendar/utils";
import { EventCard } from "./EventCard";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface DayViewProps {
  events: CalendarEvent[];
}

// Calculate overlapping columns for events
function layoutEvents(events: CalendarEvent[]) {
  if (events.length === 0) return [];

  const sorted = [...events].sort((a, b) =>
    parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime()
  );

  const columns: CalendarEvent[][] = [];

  for (const event of sorted) {
    const eStart = parseISO(event.start_time).getTime();
    let placed = false;

    for (let col = 0; col < columns.length; col++) {
      const lastInCol = columns[col][columns[col].length - 1];
      const lastEnd = parseISO(lastInCol.end_time).getTime();
      if (eStart >= lastEnd) {
        columns[col].push(event);
        placed = true;
        break;
      }
    }

    if (!placed) {
      columns.push([event]);
    }
  }

  const totalCols = columns.length;
  const result: { event: CalendarEvent; col: number; totalCols: number }[] = [];

  columns.forEach((col, colIdx) => {
    col.forEach((event) => {
      result.push({ event, col: colIdx, totalCols });
    });
  });

  return result;
}

function NowLine() {
  const [top, setTop] = useState(() => {
    const now = new Date();
    return (now.getHours() + now.getMinutes() / 60 - 7) * 64;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTop((now.getHours() + now.getMinutes() / 60 - 7) * 64);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  if (top < 0) return null;

  return (
    <div
      className="absolute left-16 right-0 z-20 flex items-center pointer-events-none"
      style={{ top: `${top}px` }}
    >
      <div className="h-3 w-3 -ml-1.5 rounded-full gradient-primary now-line-glow" />
      <div className="h-[2px] flex-1 gradient-primary now-line-glow" />
    </div>
  );
}

export function DayView({ events }: DayViewProps) {
  const { selectedDate } = useCalendarStore();
  const { openEventModal } = useUIStore();
  const hours = getHoursOfDay();
  const dayEvents = getEventsForDay(events, selectedDate);
  const showNowLine = isToday(selectedDate);
  const laidOut = layoutEvents(dayEvents);

  function getEventPosition(event: CalendarEvent) {
    const start = parseISO(event.start_time);
    const end = parseISO(event.end_time);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    const top = (startHour - 7) * 64;
    const height = Math.max((endHour - startHour) * 64, 32);
    return { top: Math.max(top, 0), height };
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex h-full flex-col overflow-auto"
    >
      <div className="relative flex-1">
        {/* Time grid */}
        {hours.map((hour) => (
          <div
            key={hour}
            className="flex h-16 border-b border-border/15 hover:bg-accent/10 cursor-pointer transition-colors"
            onClick={() => openEventModal()}
          >
            <div className="w-16 shrink-0 px-2 py-1 text-right">
              <span className="font-mono text-[11px] text-muted-foreground/50">
                {format(new Date(2024, 0, 1, hour), "HH:mm")}
              </span>
            </div>
            <div className="flex-1 border-l border-border/15" />
          </div>
        ))}

        {/* Now line */}
        {showNowLine && <NowLine />}

        {/* Events overlay - with column layout */}
        <div className="absolute inset-0 left-16 pointer-events-none">
          {laidOut.map(({ event, col, totalCols }, i) => {
            const { top, height } = getEventPosition(event);
            const width = `${(1 / totalCols) * 100 - 1}%`;
            const left = `${(col / totalCols) * 100}%`;

            return (
              <motion.div
                key={`${event.id}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                className="absolute pointer-events-auto pr-1"
                style={{ top: `${top}px`, height: `${height}px`, left, width }}
              >
                <EventCard event={event} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
