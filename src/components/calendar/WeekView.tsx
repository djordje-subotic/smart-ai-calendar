"use client";

import { CalendarEvent } from "@/src/types/event";
import { useCalendarStore } from "@/src/stores/calendarStore";
import {
  format,
  isToday,
  getWeekDays,
  getHoursOfDay,
  getEventsForDay,
  parseISO,
} from "@/src/lib/calendar/utils";
import { cn } from "@/lib/utils";
import { EventCard } from "./EventCard";
import { motion } from "framer-motion";

interface WeekViewProps {
  events: CalendarEvent[];
}

export function WeekView({ events }: WeekViewProps) {
  const { selectedDate, setSelectedDate, setView } = useCalendarStore();
  const weekDays = getWeekDays(selectedDate);
  const hours = getHoursOfDay();

  function getEventPosition(event: CalendarEvent) {
    const start = parseISO(event.start_time);
    const end = parseISO(event.end_time);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    const top = (startHour - 7) * 48;
    const height = Math.max((endHour - startHour) * 48, 24);
    return { top: Math.max(top, 0), height };
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex h-full flex-col overflow-auto"
    >
      {/* Day headers */}
      <div className="sticky top-0 z-10 flex border-b border-border/30 bg-background/80 backdrop-blur-xl">
        <div className="w-16 shrink-0" />
        {weekDays.map((day) => {
          const today = isToday(day);
          return (
            <div
              key={day.toISOString()}
              className="flex-1 border-l border-border/15 py-2 text-center cursor-pointer hover:bg-accent/20 transition-colors"
              onClick={() => {
                setSelectedDate(day);
                setView("day");
              }}
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                {format(day, "EEE")}
              </div>
              <div
                className={cn(
                  "mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all",
                  today
                    ? "gradient-primary text-white shadow-lg shadow-primary/20"
                    : "text-foreground/70"
                )}
              >
                {format(day, "d")}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="relative flex flex-1">
        <div className="w-16 shrink-0">
          {hours.map((hour) => (
            <div key={hour} className="h-12 px-2 py-1 text-right">
              <span className="font-mono text-[10px] text-muted-foreground/40">
                {format(new Date(2024, 0, 1, hour), "HH:mm")}
              </span>
            </div>
          ))}
        </div>

        {weekDays.map((day) => {
          const dayEvents = getEventsForDay(events, day);
          return (
            <div key={day.toISOString()} className="relative flex-1 border-l border-border/15">
              {hours.map((hour) => (
                <div key={hour} className="h-12 border-b border-border/10" />
              ))}
              <div className="absolute inset-0 pointer-events-none">
                {dayEvents.map((event) => {
                  const { top, height } = getEventPosition(event);
                  return (
                    <div
                      key={event.id}
                      className="absolute left-0.5 right-0.5 pointer-events-auto"
                      style={{ top: `${top}px`, height: `${height}px` }}
                    >
                      <EventCard event={event} compact />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
