"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Sun,
  Target,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Users,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/src/stores/uiStore";
import { MiniCalendar } from "@/src/components/calendar/MiniCalendar";
import { ScheduleScore } from "@/src/components/calendar/ScheduleScore";
import { UpcomingEvents } from "@/src/components/calendar/UpcomingEvents";
import { TaskPanel } from "@/src/components/tasks/TaskPanel";
import { InvitePanel } from "@/src/components/social/InvitePanel";
import { ProfilePanel } from "@/src/components/profile/ProfilePanel";
import { Logo } from "./Logo";
import { motion, AnimatePresence } from "framer-motion";
import { useCalendarStore } from "@/src/stores/calendarStore";
import { useEvents } from "@/src/hooks/useEvents";

const navItems = [
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/today", label: "Today", icon: Sun },
  { href: "/habits", label: "Habits", icon: Target },
  { href: "/tools", label: "AI Tools", icon: Wand2 },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, toggleSidebar } = useUIStore();
  const { selectedDate } = useCalendarStore();
  const { data: events = [] } = useEvents(selectedDate);

  return (
    <motion.aside
      initial={false}
      animate={{ width: isSidebarOpen ? 260 : 68 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="flex flex-col border-r border-border/50 bg-sidebar overflow-hidden"
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between px-4">
        <Logo collapsed={!isSidebarOpen} />
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
        >
          {isSidebarOpen ? (
            <ChevronLeft className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      {/* Scrollable middle section */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Mini Calendar + Widgets */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden px-3 space-y-3 pb-2"
            >
              <ProfilePanel />
              <div className="rounded-xl border border-border/50 bg-card/50 p-3">
                <MiniCalendar />
              </div>
              <ScheduleScore events={events} date={selectedDate} />
              <UpcomingEvents events={events} date={selectedDate} />
              <InvitePanel />
              <TaskPanel />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <nav className="mt-2 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg gradient-primary pointer-events-none"
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                />
              )}
              <item.icon className="relative z-10 h-4 w-4 shrink-0" />
              <AnimatePresence>
                {isSidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="relative z-10 truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
        </nav>
      </div>

      {/* AI Quick Access */}
      <div className="p-3">
        <button
          onClick={() => useUIStore.getState().setCommandPaletteOpen(true)}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg border border-border/50 px-3 py-2.5 text-sm transition-all duration-200",
            "bg-accent/30 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:glow",
            !isSidebarOpen && "justify-center"
          )}
        >
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          {isSidebarOpen && (
            <>
              <span className="flex-1 text-left">Ask AI...</span>
              <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                ⌘K
              </kbd>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
