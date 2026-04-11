"use client";

import { useCalendarStore } from "@/src/stores/calendarStore";
import { useEvents } from "@/src/hooks/useEvents";
import { CalendarGrid } from "@/src/components/calendar/CalendarGrid";
import { WeekView } from "@/src/components/calendar/WeekView";
import { DayView } from "@/src/components/calendar/DayView";
import { EventModal } from "@/src/components/calendar/EventModal";
import { AIInputBar } from "@/src/components/ai/AIInputBar";
import { OptimizePanel } from "@/src/components/ai/OptimizePanel";

export default function CalendarPage() {
  const { selectedDate, view } = useCalendarStore();
  const { data: events = [], isLoading } = useEvents(selectedDate);

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        ) : view === "month" ? (
          <CalendarGrid events={events} />
        ) : view === "week" ? (
          <WeekView events={events} />
        ) : (
          <DayView events={events} />
        )}
      </div>
      <OptimizePanel />
      <AIInputBar events={events} />
      <EventModal events={events} />
    </div>
  );
}
