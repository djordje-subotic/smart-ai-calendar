"use client";

import { CalendarEvent } from "@/src/types/event";
import { parseISO, isSameDay, isAfter, format } from "date-fns";
import { motion } from "framer-motion";
import { Clock, MapPin, Sparkles, CalendarDays } from "lucide-react";
import { useUIStore } from "@/src/stores/uiStore";

interface UpcomingEventsProps {
  events: CalendarEvent[];
  date: Date;
}

export function UpcomingEvents({ events, date }: UpcomingEventsProps) {
  const { openEventModal } = useUIStore();
  const now = new Date();

  const upcomingToday = events
    .filter(
      (e) =>
        isSameDay(parseISO(e.start_time), date) &&
        isAfter(parseISO(e.start_time), now)
    )
    .sort(
      (a, b) =>
        parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime()
    )
    .slice(0, 4);

  if (upcomingToday.length === 0) {
    return (
      <div className="rounded-xl border border-border/30 bg-card/50 p-4 text-center">
        <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
        <p className="text-xs text-muted-foreground">No upcoming events</p>
        <p className="text-[10px] text-primary/60 mt-1 flex items-center justify-center gap-1">
          <Sparkles className="h-3 w-3" />
          Use AI to plan something
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 px-1">
        Coming up
      </h3>
      {upcomingToday.map((event, i) => {
        const minutesUntil = Math.round(
          (parseISO(event.start_time).getTime() - now.getTime()) / 60000
        );
        const timeLabel =
          minutesUntil < 60
            ? `in ${minutesUntil}m`
            : `in ${Math.round(minutesUntil / 60)}h`;

        return (
          <motion.button
            key={event.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => openEventModal(event.id)}
            className="group flex w-full items-start gap-3 rounded-lg border border-border/20 bg-card/30 p-3 text-left transition-all hover:bg-card/60 hover:border-border/40"
          >
            <div
              className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: event.color }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-xs font-medium text-foreground">
                  {event.title}
                </span>
                {event.source === "ai" && (
                  <Sparkles className="h-3 w-3 shrink-0 text-primary/60" />
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="h-2.5 w-2.5" />
                  {format(parseISO(event.start_time), "HH:mm")}
                </span>
                <span className="text-primary/60 font-medium">{timeLabel}</span>
                {event.location && (
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="h-2.5 w-2.5 shrink-0" />
                    {event.location}
                  </span>
                )}
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
