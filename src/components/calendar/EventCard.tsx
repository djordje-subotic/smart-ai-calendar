"use client";

import { CalendarEvent } from "@/src/types/event";
import { formatTimeRange } from "@/src/lib/calendar/utils";
import { useUIStore } from "@/src/stores/uiStore";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { MapPin, Sparkles } from "lucide-react";

interface EventCardProps {
  event: CalendarEvent;
  compact?: boolean;
}

export function EventCard({ event, compact = false }: EventCardProps) {
  const { openEventModal } = useUIStore();

  return (
    <motion.button
      whileHover={{ scale: compact ? 1 : 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={(e) => {
        e.stopPropagation();
        openEventModal(event.id);
      }}
      className={cn(
        "group relative w-full overflow-hidden rounded-md text-left transition-all",
        compact ? "px-1.5 py-0.5" : "px-2.5 py-1.5"
      )}
      style={{
        backgroundColor: `${event.color}18`,
        borderLeft: `3px solid ${event.color}`,
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{
          background: `linear-gradient(135deg, ${event.color}10, ${event.color}05)`,
        }}
      />

      <div className="relative z-10">
        {compact ? (
          <div className="flex items-center gap-1">
            {event.source === "ai" && (
              <Sparkles className="h-2.5 w-2.5 shrink-0" style={{ color: event.color }} />
            )}
            <span
              className="truncate text-[11px] font-medium"
              style={{ color: event.color }}
            >
              {event.title}
            </span>
          </div>
        ) : (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              {event.source === "ai" && (
                <Sparkles className="h-3 w-3 shrink-0" style={{ color: event.color }} />
              )}
              <span className="truncate text-xs font-semibold text-foreground">
                {event.title}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-mono">
              {formatTimeRange(event.start_time, event.end_time)}
            </p>
            {event.location && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
                <MapPin className="h-2.5 w-2.5" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.button>
  );
}
