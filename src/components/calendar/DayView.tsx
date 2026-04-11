"use client";

import { CalendarEvent } from "@/src/types/event";
import { Task } from "@/src/types/task";
import { useCalendarStore } from "@/src/stores/calendarStore";
import { useUIStore } from "@/src/stores/uiStore";
import { useUpdateEvent } from "@/src/hooks/useEvents";
import {
  format,
  parseISO,
  getHoursOfDay,
  getEventsForDay,
  isToday,
  createDateAtTime,
  getTasksForDay,
} from "@/src/lib/calendar/utils";
import { EventCard } from "./EventCard";
import { TaskCardInline } from "@/src/components/tasks/TaskCardInline";
import { useEffect, useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, CheckSquare } from "lucide-react";

const HOUR_HEIGHT = 64;
const MIN_OFFSET_HOUR = 7;

interface DayViewProps {
  events: CalendarEvent[];
  tasks?: Task[];
}

function layoutEvents(events: CalendarEvent[]) {
  if (events.length === 0) return [];
  const sorted = [...events].sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime());
  const columns: CalendarEvent[][] = [];

  for (const event of sorted) {
    const eStart = parseISO(event.start_time).getTime();
    const eEnd = parseISO(event.end_time).getTime();
    let placed = false;

    for (let col = 0; col < columns.length; col++) {
      // Check against ALL events in column, not just last
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

function NowLine() {
  const [top, setTop] = useState(() => {
    const now = new Date();
    return (now.getHours() + now.getMinutes() / 60 - MIN_OFFSET_HOUR) * HOUR_HEIGHT;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTop((now.getHours() + now.getMinutes() / 60 - MIN_OFFSET_HOUR) * HOUR_HEIGHT);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  if (top < 0) return null;

  return (
    <div className="absolute left-16 right-0 z-20 flex items-center pointer-events-none" style={{ top: `${top}px` }}>
      <div className="h-3 w-3 -ml-1.5 rounded-full gradient-primary now-line-glow" />
      <div className="h-[2px] flex-1 gradient-primary now-line-glow" />
    </div>
  );
}

export function DayView({ events, tasks = [] }: DayViewProps) {
  const { selectedDate } = useCalendarStore();
  const { openEventModal } = useUIStore();
  const updateEvent = useUpdateEvent();
  const hours = getHoursOfDay();
  const dayEvents = getEventsForDay(events, selectedDate);
  const dayTasks = getTasksForDay(tasks, selectedDate) as Task[];
  const timedTasks = dayTasks.filter((t) => t.due_time);
  const untimedTasks = dayTasks.filter((t) => !t.due_time);
  const showNowLine = isToday(selectedDate);
  const laidOut = layoutEvents(dayEvents);
  const [tasksExpanded, setTasksExpanded] = useState(true);

  // --- Drag-and-drop state ---
  const [dragging, setDragging] = useState<{ eventId: string; startY: number; origTop: number; currentTop: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Click-to-create state ---
  const [creating, setCreating] = useState<{ startY: number; endY: number } | null>(null);
  const [creatingActive, setCreatingActive] = useState(false);

  function getEventPosition(event: CalendarEvent) {
    const start = parseISO(event.start_time);
    const end = parseISO(event.end_time);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    const top = (startHour - MIN_OFFSET_HOUR) * HOUR_HEIGHT;
    const height = Math.max((endHour - startHour) * HOUR_HEIGHT, 28);
    return { top: Math.max(top, 0), height };
  }

  function pixelToTime(y: number): { hour: number; minutes: number } {
    const raw = y / HOUR_HEIGHT + MIN_OFFSET_HOUR;
    const hour = Math.floor(raw);
    const minutes = Math.round((raw - hour) * 4) * 15; // snap to 15min
    return { hour: Math.min(Math.max(hour, MIN_OFFSET_HOUR), 23), minutes: Math.min(minutes, 45) };
  }

  // --- DnD handlers ---
  function handleDragStart(e: React.MouseEvent, eventId: string, origTop: number) {
    e.stopPropagation();
    e.preventDefault();
    setDragging({ eventId, startY: e.clientY, origTop, currentTop: origTop });
  }

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!dragging) return;
    const dy = e.clientY - dragging.startY;
    const newTop = Math.max(0, dragging.origTop + dy);
    // Snap to 15-minute grid
    const snapped = Math.round(newTop / (HOUR_HEIGHT / 4)) * (HOUR_HEIGHT / 4);
    setDragging((d) => d ? { ...d, currentTop: snapped } : null);
  }, [dragging]);

  const handleDragEnd = useCallback(async () => {
    if (!dragging) return;
    const { eventId, currentTop } = dragging;
    const event = dayEvents.find((e) => e.id === eventId);
    setDragging(null);

    if (!event) return;

    const { hour, minutes } = pixelToTime(currentTop);
    const oldStart = parseISO(event.start_time);
    const duration = parseISO(event.end_time).getTime() - oldStart.getTime();

    const newStart = createDateAtTime(selectedDate, hour, minutes);
    const newEnd = new Date(newStart.getTime() + duration);

    if (newStart.getTime() !== oldStart.getTime()) {
      await updateEvent.mutateAsync({
        id: eventId,
        updates: { start_time: newStart.toISOString(), end_time: newEnd.toISOString() },
      });
    }
  }, [dragging, dayEvents, selectedDate, updateEvent]);

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

  // --- Click-to-create handlers ---
  function handleSlotMouseDown(e: React.MouseEvent) {
    if (dragging) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const y = e.clientY - rect.top + (containerRef.current?.scrollTop || 0);
    const snapped = Math.round(y / (HOUR_HEIGHT / 4)) * (HOUR_HEIGHT / 4);
    setCreating({ startY: snapped, endY: snapped + HOUR_HEIGHT });
    setCreatingActive(true);
  }

  function handleSlotMouseMove(e: React.MouseEvent) {
    if (!creatingActive || !creating || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top + containerRef.current.scrollTop;
    const snapped = Math.round(y / (HOUR_HEIGHT / 4)) * (HOUR_HEIGHT / 4);
    setCreating((c) => c ? { ...c, endY: Math.max(snapped, c.startY + HOUR_HEIGHT / 4) } : null);
  }

  function handleSlotMouseUp() {
    if (!creating || !creatingActive) return;
    setCreatingActive(false);

    const start = pixelToTime(creating.startY);
    const end = pixelToTime(creating.endY);

    const startStr = `${String(start.hour).padStart(2, "0")}:${String(start.minutes).padStart(2, "0")}`;
    const endStr = `${String(end.hour).padStart(2, "0")}:${String(end.minutes).padStart(2, "0")}`;

    useCalendarStore.getState().setSelectedDate(selectedDate);
    useUIStore.getState().openEventModalWithTime(startStr, endStr);

    setCreating(null);
  }

  return (
    <div
      ref={containerRef}
      className={cn("flex h-full flex-col overflow-auto", dragging && "select-none")}
      onMouseMove={handleSlotMouseMove}
      onMouseUp={handleSlotMouseUp}
    >
      {/* Untimed tasks - Google Calendar style top section */}
      {untimedTasks.length > 0 && (
        <div className="border-b border-border/20 bg-card/30">
          <button
            onClick={() => setTasksExpanded(!tasksExpanded)}
            className="flex items-center gap-2 px-4 py-2 text-[11px] font-semibold text-muted-foreground/60 hover:text-muted-foreground w-full"
          >
            {tasksExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            <CheckSquare className="h-3 w-3" />
            <span>Tasks ({untimedTasks.length})</span>
          </button>
          {tasksExpanded && (
            <div className="px-4 pb-2 space-y-1 ml-16">
              {untimedTasks.map((task) => (
                <TaskCardInline key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="relative flex-1">
        {/* Time grid */}
        {hours.map((hour) => (
          <div
            key={hour}
            className="flex h-16 border-b border-border/15 hover:bg-accent/10 cursor-crosshair transition-colors"
            onMouseDown={handleSlotMouseDown}
          >
            <div className="w-16 shrink-0 px-2 py-1 text-right pointer-events-none">
              <span className="font-mono text-[11px] text-muted-foreground/50">
                {format(new Date(2024, 0, 1, hour), "HH:mm")}
              </span>
            </div>
            <div className="flex-1 border-l border-border/15">
              {/* Half-hour line */}
              <div className="h-1/2 border-b border-border/5" />
            </div>
          </div>
        ))}

        {/* Now line */}
        {showNowLine && <NowLine />}

        {/* Creating preview */}
        {creating && creatingActive && (
          <div
            className="absolute left-16 right-4 rounded-md border-2 border-dashed border-primary/40 bg-primary/10 z-10 pointer-events-none flex items-center justify-center"
            style={{
              top: `${creating.startY}px`,
              height: `${creating.endY - creating.startY}px`,
            }}
          >
            <span className="text-[11px] font-medium text-primary/70">
              {format(createDateAtTime(selectedDate, pixelToTime(creating.startY).hour, pixelToTime(creating.startY).minutes), "HH:mm")}
              {" – "}
              {format(createDateAtTime(selectedDate, pixelToTime(creating.endY).hour, pixelToTime(creating.endY).minutes), "HH:mm")}
            </span>
          </div>
        )}

        {/* Events overlay */}
        <div className="absolute inset-0 left-16 pointer-events-none">
          {laidOut.map(({ event, col, totalCols }, i) => {
            const isDragging = dragging?.eventId === event.id;
            const pos = getEventPosition(event);
            const top = isDragging ? dragging!.currentTop : pos.top;
            const width = `${(1 / totalCols) * 100 - 1}%`;
            const left = `${(col / totalCols) * 100}%`;

            return (
              <div
                key={`${event.id}-${i}`}
                className={cn(
                  "absolute pointer-events-auto pr-1 transition-shadow",
                  isDragging && "z-30 shadow-2xl opacity-90 cursor-grabbing",
                  !isDragging && "cursor-grab"
                )}
                style={{
                  top: `${top}px`,
                  height: `${pos.height}px`,
                  left,
                  width,
                  transition: isDragging ? "none" : "top 0.15s ease",
                }}
                onMouseDown={(e) => handleDragStart(e, event.id, pos.top)}
              >
                <EventCard event={event} />
                {/* Resize handle */}
                <div
                  className="absolute bottom-0 left-0 right-1 h-2 cursor-s-resize hover:bg-white/10 rounded-b-md"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    // Future: resize logic
                  }}
                />
              </div>
            );
          })}

          {/* Timed tasks in timeline */}
          {timedTasks.map((task) => {
            if (!task.due_time) return null;
            const [h, m] = task.due_time.split(":").map(Number);
            const top = (h + m / 60 - MIN_OFFSET_HOUR) * HOUR_HEIGHT;
            if (top < 0) return null;

            return (
              <div
                key={task.id}
                className="absolute left-1 right-4 pointer-events-auto"
                style={{ top: `${top}px`, height: "28px" }}
              >
                <TaskCardInline task={task} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
