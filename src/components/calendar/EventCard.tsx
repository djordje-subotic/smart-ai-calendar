"use client";

import { CalendarEvent } from "@/src/types/event";
import { formatTimeRange, parseISO, getRecurrenceLabel } from "@/src/lib/calendar/utils";
import { useUIStore } from "@/src/stores/uiStore";
import { cn } from "@/lib/utils";
import { MapPin, Sparkles, RotateCcw } from "lucide-react";

interface EventCardProps {
  event: CalendarEvent;
  compact?: boolean;
}

export function EventCard({ event, compact = false }: EventCardProps) {
  const { openEventModal } = useUIStore();

  const durationMin = compact
    ? 0
    : (parseISO(event.end_time).getTime() - parseISO(event.start_time).getTime()) / 60000;

  const isShort = durationMin > 0 && durationMin <= 30;
  const isTiny = durationMin > 0 && durationMin <= 15;
  const recurrenceLabel = getRecurrenceLabel(event.recurrence_rule);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        openEventModal(event.id);
      }}
      className={cn(
        "group relative w-full overflow-hidden rounded-md text-left transition-all",
        compact ? "px-1.5 py-0.5" : "h-full px-2.5 py-1",
      )}
      style={{
        backgroundColor: `${event.color}25`,
        borderLeft: `3px solid ${event.color}`,
      }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: `linear-gradient(135deg, ${event.color}15, ${event.color}08)` }}
      />

      <div className="relative z-10 h-full">
        {compact ? (
          <div className="flex items-center gap-1">
            {recurrenceLabel && <RotateCcw className="h-2 w-2 shrink-0" style={{ color: event.color }} />}
            {event.source === "ai" && <Sparkles className="h-2.5 w-2.5 shrink-0" style={{ color: event.color }} />}
            <span className="truncate text-[11px] font-medium" style={{ color: event.color }}>
              {event.title}
            </span>
          </div>
        ) : isTiny ? (
          <div className="flex items-center gap-2 h-full">
            {recurrenceLabel && <RotateCcw className="h-2.5 w-2.5 shrink-0 text-muted-foreground/50" />}
            <span className="truncate text-[11px] font-semibold text-foreground">{event.title}</span>
          </div>
        ) : isShort ? (
          <div className="flex items-center gap-2 h-full flex-wrap">
            <span className="truncate text-xs font-semibold text-foreground">{event.title}</span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {formatTimeRange(event.start_time, event.end_time)}
            </span>
            {recurrenceLabel && <RotateCcw className="h-2.5 w-2.5 shrink-0 text-muted-foreground/40" />}
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              {event.source === "ai" && <Sparkles className="h-3 w-3 shrink-0" style={{ color: event.color }} />}
              <span className="truncate text-xs font-semibold text-foreground">{event.title}</span>
            </div>
            <p className="text-[11px] text-muted-foreground font-mono">
              {formatTimeRange(event.start_time, event.end_time)}
            </p>
            {recurrenceLabel && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                <RotateCcw className="h-2.5 w-2.5" />
                <span>{recurrenceLabel}</span>
              </div>
            )}
            {event.location && durationMin >= 60 && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                <MapPin className="h-2.5 w-2.5" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
