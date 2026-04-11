import { CalendarEvent } from "@/src/types/event";
import { parseISO, isSameDay, isAfter, isBefore } from "date-fns";

export interface Nudge {
  id: string;
  type: "gap" | "missed" | "overloaded" | "nobreak" | "empty";
  message: string;
  action?: string;
}

export function generateNudges(events: CalendarEvent[], date: Date): Nudge[] {
  const nudges: Nudge[] = [];
  const now = new Date();
  const isToday = isSameDay(date, now);

  const dayEvents = events
    .filter((e) => isSameDay(parseISO(e.start_time), date))
    .sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime());

  // 1. Empty day
  if (dayEvents.length === 0) {
    nudges.push({
      id: "empty",
      type: "empty",
      message: "Your day is wide open. Want to plan something?",
      action: "Plan my day",
    });
    return nudges;
  }

  // 2. Missed events (past events today that might need rescheduling)
  if (isToday) {
    const missed = dayEvents.filter(
      (e) => isBefore(parseISO(e.end_time), now) && e.status === "confirmed"
    );
    if (missed.length > 0) {
      nudges.push({
        id: "missed",
        type: "missed",
        message: `${missed.length} event${missed.length > 1 ? "s" : ""} already passed. Need to reschedule?`,
        action: "Replan day",
      });
    }
  }

  // 3. Gap detection - find free slots > 2 hours
  if (isToday) {
    const futureEvents = dayEvents.filter((e) => isAfter(parseISO(e.start_time), now));
    if (futureEvents.length > 0) {
      const nextEvent = futureEvents[0];
      const gapMinutes = (parseISO(nextEvent.start_time).getTime() - now.getTime()) / 60000;
      if (gapMinutes > 120) {
        const hours = Math.round(gapMinutes / 60);
        nudges.push({
          id: "gap",
          type: "gap",
          message: `You have ${hours}h free before your next event. Want to fill it?`,
          action: "Suggest activities",
        });
      }
    }
  }

  // 4. Overloaded day (> 6 events)
  if (dayEvents.length > 6) {
    nudges.push({
      id: "overloaded",
      type: "overloaded",
      message: `Busy day with ${dayEvents.length} events. Consider moving some to tomorrow.`,
      action: "Replan day",
    });
  }

  // 5. No break between 12-14
  const hasLunchBreak = dayEvents.some((e) => {
    const start = parseISO(e.start_time).getHours();
    return start >= 12 && start < 14 && e.title.toLowerCase().includes("lunch");
  });
  const hasEventsDuringLunch = dayEvents.some((e) => {
    const start = parseISO(e.start_time).getHours();
    const end = parseISO(e.end_time).getHours();
    return (start <= 12 && end >= 13) || (start >= 12 && start < 14);
  });
  if (hasEventsDuringLunch && !hasLunchBreak && dayEvents.length >= 3) {
    nudges.push({
      id: "nobreak",
      type: "nobreak",
      message: "No lunch break scheduled. Take care of yourself!",
      action: "Add break",
    });
  }

  return nudges.slice(0, 2); // Max 2 nudges to not overwhelm
}
