"use client";

import { CalendarEvent } from "@/src/types/event";
import { useCalendarStore } from "@/src/stores/calendarStore";
import { useUIStore } from "@/src/stores/uiStore";
import { useUpdateEvent } from "@/src/hooks/useEvents";
import {
  format,
  isToday,
  getWeekDays,
  getHoursOfDay,
  getEventsForDay,
  parseISO,
  createDateAtTime,
} from "@/src/lib/calendar/utils";
import { cn } from "@/lib/utils";
import { EventCard } from "./EventCard";
import { useState, useCallback, useEffect, useRef } from "react";

const HOUR_HEIGHT = 48;
const MIN_OFFSET_HOUR = 7;

interface WeekViewProps {
  events: CalendarEvent[];
  tasks?: any[];
}

// Same layout algorithm as DayView - handles overlapping events
function layoutEvents(events: CalendarEvent[]) {
  if (events.length === 0) return [];
  const sorted = [...events].sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime());
  const columns: CalendarEvent[][] = [];

  for (const event of sorted) {
    const eStart = parseISO(event.start_time).getTime();
    const eEnd = parseISO(event.end_time).getTime();
    let placed = false;

    for (let col = 0; col < columns.length; col++) {
      const overlaps = columns[col].some((existing) => {
        const exStart = parseISO(existing.start_time).getTime();
        const exEnd = parseISO(existing.end_time).getTime();
        return eStart < exEnd && eEnd > exStart;
      });

      if (!overlaps) {
        columns[col].push(event);
        placed = true;
        break;
      }
    }
    if (!placed) columns.push([event]);
  }

  const totalCols = columns.length;
  return columns.flatMap((col, colIdx) => col.map((event) => ({ event, col: colIdx, totalCols })));
}

export function WeekView({ events, tasks = [] }: WeekViewProps) {
  const { selectedDate, setSelectedDate, setView } = useCalendarStore();
  const { openEventModal } = useUIStore();
  const updateEvent = useUpdateEvent();
  const containerRef = useRef<HTMLDivElement>(null);
  const weekDays = getWeekDays(selectedDate);
  const hours = getHoursOfDay();

  // DnD state
  const [dragging, setDragging] = useState<{
    eventId: string; startY: number; startX: number;
    origTop: number; origDayIdx: number; currentTop: number; currentDayIdx: number;
  } | null>(null);

  function getEventPosition(event: CalendarEvent) {
    const start = parseISO(event.start_time);
    const end = parseISO(event.end_time);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    const top = (startHour - MIN_OFFSET_HOUR) * HOUR_HEIGHT;
    const height = Math.max((endHour - startHour) * HOUR_HEIGHT, 20);
    return { top: Math.max(top, 0), height };
  }

  function pixelToTime(y: number) {
    const raw = y / HOUR_HEIGHT + MIN_OFFSET_HOUR;
    const hour = Math.floor(raw);
    const minutes = Math.round((raw - hour) * 4) * 15;
    return { hour: Math.min(Math.max(hour, MIN_OFFSET_HOUR), 23), minutes: Math.min(minutes, 45) };
  }

  function handleDragStart(e: React.MouseEvent, eventId: string, origTop: number, dayIdx: number) {
    e.stopPropagation();
    e.preventDefault();
    setDragging({ eventId, startY: e.clientY, startX: e.clientX, origTop, origDayIdx: dayIdx, currentTop: origTop, currentDayIdx: dayIdx });
  }

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!dragging) return;
    const dy = e.clientY - dragging.startY;
    const dx = e.clientX - dragging.startX;
    const newTop = Math.max(0, dragging.origTop + dy);
    const snapped = Math.round(newTop / (HOUR_HEIGHT / 4)) * (HOUR_HEIGHT / 4);
    const containerWidth = containerRef.current?.offsetWidth || window.innerWidth;
    const colWidth = (containerWidth - 64) / 7;
    const dayShift = Math.round(dx / colWidth);
    const newDayIdx = Math.min(6, Math.max(0, dragging.origDayIdx + dayShift));
    setDragging((d) => d ? { ...d, currentTop: snapped, currentDayIdx: newDayIdx } : null);
  }, [dragging]);

  const handleDragEnd = useCallback(async () => {
    if (!dragging) return;
    const { eventId, currentTop, currentDayIdx } = dragging;
    setDragging(null);

    let origEvent: CalendarEvent | undefined;
    for (const day of weekDays) {
      const found = getEventsForDay(events, day).find((e) => e.id === eventId);
      if (found) { origEvent = found; break; }
    }
    if (!origEvent) return;

    const { hour, minutes } = pixelToTime(currentTop);
    const oldStart = parseISO(origEvent.start_time);
    const duration = parseISO(origEvent.end_time).getTime() - oldStart.getTime();
    const targetDay = weekDays[currentDayIdx];
    const newStart = createDateAtTime(targetDay, hour, minutes);
    const newEnd = new Date(newStart.getTime() + duration);

    if (newStart.getTime() !== oldStart.getTime()) {
      await updateEvent.mutateAsync({
        id: eventId,
        updates: { start_time: newStart.toISOString(), end_time: newEnd.toISOString() },
      });
    }
  }, [dragging, events, weekDays, updateEvent]);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
      return () => {
        window.removeEventListener("mousemove", handleDragMove);
        window.removeEventListener("mouseup", handleDragEnd);
      };
    }
  }, [dragging, handleDragMove, handleDragEnd]);

  return (
    <div ref={containerRef} className={cn("flex h-full flex-col overflow-auto", dragging && "select-none")}>
      {/* Day headers */}
      <div className="sticky top-0 z-10 flex border-b border-border/30 bg-background/80 backdrop-blur-xl">
        <div className="w-16 shrink-0" />
        {weekDays.map((day, dayIdx) => {
          const today = isToday(day);
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "flex-1 border-l border-border/15 py-2 text-center cursor-pointer hover:bg-accent/20 transition-colors",
                dragging?.currentDayIdx === dayIdx && "bg-primary/5"
              )}
              onClick={() => { setSelectedDate(day); setView("day"); }}
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                {format(day, "EEE")}
              </div>
              <div className={cn(
                "mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                today ? "gradient-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-foreground/70"
              )}>
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

        {weekDays.map((day, dayIdx) => {
          const dayEvents = getEventsForDay(events, day);
          const laidOut = layoutEvents(dayEvents);

          return (
            <div key={day.toISOString()} className="relative flex-1 border-l border-border/15">
              {/* Grid lines */}
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="h-12 border-b border-border/10 hover:bg-accent/10 cursor-crosshair transition-colors"
                  onClick={() => { setSelectedDate(day); openEventModal(); }}
                >
                  <div className="h-1/2 border-b border-border/5" />
                </div>
              ))}

              {/* Events as blocks with proper height */}
              <div className="absolute inset-0 pointer-events-none">
                {laidOut.map(({ event, col, totalCols }, i) => {
                  const isDragging = dragging?.eventId === event.id;
                  const pos = getEventPosition(event);
                  const top = isDragging && dragging ? dragging.currentTop : pos.top;

                  if (isDragging && dragging && dragging.currentDayIdx !== dayIdx) return null;

                  const width = totalCols > 1 ? `${(1 / totalCols) * 100 - 2}%` : "calc(100% - 4px)";
                  const left = totalCols > 1 ? `${(col / totalCols) * 100 + 1}%` : "2px";

                  return (
                    <div
                      key={`${event.id}-${i}`}
                      className={cn(
                        "absolute pointer-events-auto",
                        isDragging && "z-30 shadow-xl opacity-90 cursor-grabbing",
                        !isDragging && "cursor-grab"
                      )}
                      style={{
                        top: `${top}px`,
                        height: `${pos.height}px`,
                        left,
                        width,
                        transition: isDragging ? "none" : "top 0.15s ease",
                      }}
                      onMouseDown={(e) => handleDragStart(e, event.id, pos.top, dayIdx)}
                    >
                      <EventCard event={event} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
