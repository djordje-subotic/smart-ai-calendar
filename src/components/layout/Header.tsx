"use client";

import { Button } from "@/components/ui/button";
import { useCalendarStore } from "@/src/stores/calendarStore";
import { useUIStore } from "@/src/stores/uiStore";
import { CalendarView } from "@/src/types/event";
import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from "@/src/lib/calendar/utils";
import { ChevronLeft, ChevronRight, Plus, Menu } from "lucide-react";
import { NotificationBell } from "@/src/components/social/NotificationBell";
import { HeyKronIndicator } from "@/src/components/ai/HeyKronIndicator";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const views: { value: CalendarView; label: string }[] = [
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
  { value: "day", label: "Day" },
];

export function Header() {
  const { selectedDate, view, setSelectedDate, setView } = useCalendarStore();
  const { openEventModal, setMobileMenuOpen } = useUIStore();

  function navigate(direction: "prev" | "next") {
    const fn =
      view === "month"
        ? direction === "prev"
          ? subMonths
          : addMonths
        : view === "week"
          ? direction === "prev"
            ? subWeeks
            : addWeeks
          : direction === "prev"
            ? subDays
            : addDays;
    setSelectedDate(fn(selectedDate, 1));
  }

  function goToToday() {
    setSelectedDate(new Date());
  }

  const title =
    view === "month"
      ? format(selectedDate, "MMMM yyyy")
      : view === "week"
        ? `Week of ${format(selectedDate, "MMM d, yyyy")}`
        : format(selectedDate, "EEEE, MMMM d, yyyy");

  return (
    <header className="flex h-14 items-center justify-between border-b border-border/50 px-3 sm:px-4 gap-2">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(true)}
          className="h-8 w-8 lg:hidden shrink-0"
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Today button - hidden on very small screens */}
        <Button
          variant="outline"
          size="sm"
          onClick={goToToday}
          className="border-border/50 bg-transparent text-xs font-medium hover:bg-accent/50 hidden sm:inline-flex"
        >
          Today
        </Button>

        {/* Navigation arrows */}
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => navigate("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => navigate("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Title */}
        <motion.h1
          key={title}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="text-sm sm:text-lg font-semibold tracking-tight truncate"
        >
          {title}
        </motion.h1>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* View switcher - hidden on mobile */}
        <div className="relative hidden sm:flex rounded-lg border border-border/50 bg-muted/30 p-0.5">
          {views.map((v) => (
            <button
              key={v.value}
              onClick={() => setView(v.value)}
              className={cn(
                "relative rounded-md px-2 sm:px-3 py-1.5 text-xs font-medium transition-colors",
                view === v.value
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {view === v.value && (
                <motion.div
                  layoutId="view-tab"
                  className="absolute inset-0 rounded-md gradient-primary pointer-events-none"
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                />
              )}
              <span className="relative z-10">{v.label}</span>
            </button>
          ))}
        </div>

        <HeyKronIndicator />
        <NotificationBell />

        {/* New Event */}
        <Button
          size="sm"
          onClick={() => openEventModal()}
          className="gradient-primary border-0 text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow h-8"
        >
          <Plus className="h-3.5 w-3.5 sm:mr-1.5" />
          <span className="hidden sm:inline">New Event</span>
        </Button>
      </div>
    </header>
  );
}
