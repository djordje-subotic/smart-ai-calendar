import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  setHours,
  setMinutes,
  parseISO,
  isWithinInterval,
  areIntervalsOverlapping,
} from "date-fns";
import { CalendarEvent } from "@/src/types/event";

export {
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  parseISO,
};

export function getMonthDays(date: Date): Date[] {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export function getHoursOfDay(): number[] {
  return Array.from({ length: 17 }, (_, i) => i + 7); // 7:00 - 23:00
}

export function getEventsForDay(
  events: CalendarEvent[],
  day: Date
): CalendarEvent[] {
  const result: CalendarEvent[] = [];

  for (const event of events) {
    const eventStart = parseISO(event.start_time);
    const eventEnd = parseISO(event.end_time);

    // Direct match
    if (
      isSameDay(eventStart, day) ||
      isSameDay(eventEnd, day) ||
      isWithinInterval(day, { start: eventStart, end: eventEnd })
    ) {
      result.push(event);
      continue;
    }

    // Recurring event match
    if (event.recurrence_rule) {
      const rule = event.recurrence_rule;
      const dayOfWeek = day.getDay(); // 0=Sun, 1=Mon...
      const dayDiff = Math.floor((day.getTime() - eventStart.getTime()) / 86400000);

      // Only show on/after the start date
      if (dayDiff < 0) continue;

      let matches = false;

      if (rule.freq === "daily") {
        matches = dayDiff % (rule.interval || 1) === 0;
      } else if (rule.freq === "weekly") {
        if (rule.days && rule.days.length > 0) {
          const dayMap: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
          matches = rule.days.some((d) => dayMap[d] === dayOfWeek);
        } else {
          matches = dayDiff % (7 * (rule.interval || 1)) === 0;
        }
      } else if (rule.freq === "monthly") {
        matches = day.getDate() === eventStart.getDate();
      } else if (rule.freq === "yearly") {
        matches = day.getDate() === eventStart.getDate() && day.getMonth() === eventStart.getMonth();
      }

      if (matches) {
        // Create a virtual copy for this day
        const duration = eventEnd.getTime() - eventStart.getTime();
        const virtualStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), eventStart.getHours(), eventStart.getMinutes());
        const virtualEnd = new Date(virtualStart.getTime() + duration);
        result.push({
          ...event,
          start_time: virtualStart.toISOString(),
          end_time: virtualEnd.toISOString(),
        });
      }
    }
  }

  return result;
}

export function hasConflict(
  event: { start_time: string; end_time: string },
  existingEvents: CalendarEvent[]
): CalendarEvent | null {
  const newInterval = {
    start: parseISO(event.start_time),
    end: parseISO(event.end_time),
  };

  for (const existing of existingEvents) {
    const existingInterval = {
      start: parseISO(existing.start_time),
      end: parseISO(existing.end_time),
    };
    if (areIntervalsOverlapping(newInterval, existingInterval)) {
      return existing;
    }
  }
  return null;
}

export function formatTimeRange(startTime: string, endTime: string): string {
  const start = parseISO(startTime);
  const end = parseISO(endTime);
  return `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`;
}

export function createDateAtTime(date: Date, hours: number, minutes = 0): Date {
  return setMinutes(setHours(date, hours), minutes);
}
