"use client";

import { useEvents } from "@/src/hooks/useEvents";
import { DayView } from "@/src/components/calendar/DayView";
import { EventModal } from "@/src/components/calendar/EventModal";
import { AIInputBar } from "@/src/components/ai/AIInputBar";
import { DailyBriefing } from "@/src/components/ai/DailyBriefing";
import { format, isToday, parseISO } from "date-fns";
import { motion } from "framer-motion";

export default function TodayPage() {
  const today = new Date();
  const { data: events = [] } = useEvents(today);
  const todayEvents = events.filter((e) => isToday(parseISO(e.start_time)));

  return (
    <div className="flex h-full flex-col">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-border/30 px-6 py-4 space-y-3"
      >
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            {format(today, "EEEE, MMMM d")}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {todayEvents.length === 0
              ? "No events today"
              : `${todayEvents.length} event${todayEvents.length > 1 ? "s" : ""} today`}
          </p>
        </div>
        <DailyBriefing />
      </motion.div>
      <div className="flex-1 overflow-auto">
        <DayView events={events} />
      </div>
      <AIInputBar events={events} />
      <EventModal events={events} />
    </div>
  );
}
