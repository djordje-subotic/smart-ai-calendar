"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getNotifications, getUnreadCount, markNotificationRead } from "@/src/actions/social";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

type Notification = Awaited<ReturnType<typeof getNotifications>>[number];

export function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    getUnreadCount().then(setUnread);
    const interval = setInterval(() => getUnreadCount().then(setUnread), 30000);
    return () => clearInterval(interval);
  }, []);

  async function handleOpen() {
    setOpen(!open);
    if (!open) {
      const data = await getNotifications();
      setNotifications(data);
      // Mark all as read
      for (const n of data.filter((n: Notification) => !n.read)) {
        await markNotificationRead(n.id);
      }
      setUnread(0);
    }
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="h-8 w-8 relative" onClick={handleOpen}>
        <Bell className="h-4 w-4 text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full gradient-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center">
            {unread}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border/30">
              <h3 className="text-sm font-semibold">Notifications</h3>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No notifications yet</p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className={`px-4 py-3 border-b border-border/10 ${n.read ? "" : "bg-primary/5"}`}>
                    <p className="text-xs font-medium">{n.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-[9px] text-muted-foreground/40 mt-1">{format(new Date(n.created_at), "MMM d, HH:mm")}</p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
