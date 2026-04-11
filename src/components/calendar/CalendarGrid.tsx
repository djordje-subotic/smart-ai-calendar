"use client";

import { useCalendarStore } from "@/src/stores/calendarStore";
import {
  format,
  isSameDay,
  isSameMonth,
  isToday,
  getMonthDays,
  getEventsForDay,
  getTasksForDay,
} from "@/src/lib/calendar/utils";
import { CalendarEvent } from "@/src/types/event";
import { Task } from "@/src/types/task";
import { cn } from "@/lib/utils";
import { EventCard } from "./EventCard";
import { TaskCardInline } from "@/src/components/tasks/TaskCardInline";
import { motion } from "framer-motion";

const dayHeaders = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface CalendarGridProps {
  events: CalendarEvent[];
  tasks?: Task[];
}

export function CalendarGrid({ events, tasks = [] }: CalendarGridProps) {
  const { selectedDate, setSelectedDate, setView } = useCalendarStore();
  const days = getMonthDays(selectedDate);
  const weeks = Math.ceil(days.length / 7);

  return (
    <motion.div
      key={format(selectedDate, "yyyy-MM")}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex h-full flex-col"
    >
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border/40 bg-card/30">
        {dayHeaders.map((day) => (
          <div
            key={day}
            className="py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid - fixed rows */}
      <div
        className="grid flex-1 grid-cols-7"
        style={{ gridTemplateRows: `repeat(${weeks}, minmax(0, 1fr))` }}
      >
        {days.map((day) => {
          const dayEvents = getEventsForDay(events, day);
          const dayTasks = getTasksForDay(tasks, day) as Task[];
          const isCurrentMonth = isSameMonth(day, selectedDate);
          const today = isToday(day);
          const selected = isSameDay(day, selectedDate);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "group relative border-b border-r border-border/20 p-1.5 transition-colors duration-100 cursor-pointer overflow-hidden",
                !isCurrentMonth && "bg-muted/5",
                isCurrentMonth && "bg-transparent",
                "hover:bg-accent/15"
              )}
              onClick={() => {
                setSelectedDate(day);
                setView("day");
              }}
            >
              {/* Date number */}
              <div className="mb-1 flex items-start justify-between">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs transition-all",
                    !isCurrentMonth && "text-muted-foreground/25 font-normal",
                    isCurrentMonth && !today && "text-foreground font-medium",
                    today && "gradient-primary text-white font-bold shadow-md shadow-primary/25",
                    selected && !today && "bg-accent text-foreground font-semibold"
                  )}
                >
                  {format(day, "d")}
                </span>
                {dayEvents.length > 0 && !today && isCurrentMonth && (
                  <span className="mt-1.5 mr-0.5 h-1.5 w-1.5 rounded-full bg-primary/40" />
                )}
              </div>

              {/* Events + Tasks */}
              <div className="space-y-0.5">
                {dayEvents.slice(0, 2).map((event) => (
                  <EventCard key={event.id} event={event} compact />
                ))}
                {dayTasks.slice(0, 2).map((task) => (
                  <TaskCardInline key={task.id} task={task} compact />
                ))}
                {(dayEvents.length + dayTasks.length) > 3 && (
                  <span className="block text-[10px] font-medium text-muted-foreground pl-1">
                    +{dayEvents.length + dayTasks.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
