"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Sun, Target, Settings, Sparkles, Users, Wand2, X } from "lucide-react";
import { useUIStore } from "@/src/stores/uiStore";
import { Logo } from "./Logo";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/today", label: "Today", icon: Sun },
  { href: "/habits", label: "Habits", icon: Target },
  { href: "/tools", label: "AI Tools", icon: Wand2 },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileDrawer() {
  const pathname = usePathname();
  const { isMobileMenuOpen, setMobileMenuOpen, setCommandPaletteOpen } = useUIStore();

  return (
    <AnimatePresence>
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 left-0 z-50 w-72 border-r border-border/50 bg-sidebar flex flex-col lg:hidden"
          >
            {/* Header */}
            <div className="flex h-14 items-center justify-between px-4">
              <Logo />
              <button onClick={() => setMobileMenuOpen(false)} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/30">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all",
                      isActive
                        ? "gradient-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* AI button */}
            <div className="p-3">
              <button
                onClick={() => { setMobileMenuOpen(false); setCommandPaletteOpen(true); }}
                className="flex w-full items-center gap-3 rounded-lg border border-border/50 px-3 py-3 text-sm bg-accent/30 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
              >
                <Sparkles className="h-5 w-5 text-primary" />
                Ask AI...
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
