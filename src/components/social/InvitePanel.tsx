"use client";

import { useCallback, useEffect, useState } from "react";
import { getMyInvites, respondToInvite, type InviteWithMeta } from "@/src/actions/social";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X, Clock, MessageSquare, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";

export function InvitePanel() {
  const [invites, setInvites] = useState<InviteWithMeta[]>([]);
  const [counterTime, setCounterTime] = useState<Record<string, string>>({});
  const [counterMsg, setCounterMsg] = useState<Record<string, string>>({});
  const [showCounter, setShowCounter] = useState<string | null>(null);

  const loadInvites = useCallback(async () => {
    const data = await getMyInvites();
    setInvites(data);
  }, []);

  useEffect(() => {
    loadInvites();
    const interval = setInterval(loadInvites, 30000);
    return () => clearInterval(interval);
  }, [loadInvites]);

  async function handleAccept(inviteId: string) {
    await respondToInvite(inviteId, "accept");
    await loadInvites();
  }

  async function handleDecline(inviteId: string) {
    await respondToInvite(inviteId, "decline");
    await loadInvites();
  }

  async function handleCounter(inviteId: string) {
    const time = counterTime[inviteId];
    const msg = counterMsg[inviteId] || "How about this time instead?";
    if (!time) return;

    const today = new Date();
    const [h, m] = time.split(":").map(Number);
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m || 0);
    const end = new Date(start.getTime() + 60 * 60000);

    await respondToInvite(inviteId, "counter", {
      start: start.toISOString(),
      end: end.toISOString(),
      message: msg,
    });
    setShowCounter(null);
    await loadInvites();
  }

  const pendingInvites = invites.filter((i) => !i.isOrganizer && (i.status === "pending" || i.status === "negotiating"));

  if (pendingInvites.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 px-1">
        Event Invites ({pendingInvites.length})
      </h3>
      {pendingInvites.map((inv) => (
        <motion.div
          key={inv.id}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 space-y-2"
        >
          <div>
            <p className="text-xs font-semibold">{inv.proposed_title}</p>
            <p className="text-[10px] text-muted-foreground">
              From {inv.otherName} · {format(parseISO(inv.proposed_start), "EEE MMM d, HH:mm")} – {format(parseISO(inv.proposed_end), "HH:mm")}
            </p>
            {inv.proposed_location && (
              <p className="text-[10px] text-muted-foreground/60">📍 {inv.proposed_location}</p>
            )}
            {inv.myTimezone && inv.otherTimezone && inv.myTimezone !== inv.otherTimezone && (
              <p className="text-[10px] text-amber-400/70 flex items-center gap-1 mt-0.5">
                <Globe className="h-2.5 w-2.5" />
                {inv.otherName} is in {inv.otherTimezone?.split("/")[1]?.replace(/_/g, " ") || inv.otherTimezone}
              </p>
            )}
            {inv.counter_message && (
              <p className="text-[10px] text-cyan-400 mt-1 flex items-center gap-1">
                <MessageSquare className="h-2.5 w-2.5" />
                {inv.counter_message}
              </p>
            )}
          </div>

          {showCounter === inv.id ? (
            <div className="space-y-2">
              <Input
                type="time"
                value={counterTime[inv.id] || ""}
                onChange={(e) => setCounterTime({ ...counterTime, [inv.id]: e.target.value })}
                className="h-7 text-xs border-border/30 bg-muted/20 font-mono"
                placeholder="Suggest time"
              />
              <Input
                value={counterMsg[inv.id] || ""}
                onChange={(e) => setCounterMsg({ ...counterMsg, [inv.id]: e.target.value })}
                className="h-7 text-xs border-border/30 bg-muted/20"
                placeholder="Message (optional)"
              />
              <div className="flex gap-1.5">
                <Button size="sm" className="h-6 text-[10px] flex-1" variant="ghost" onClick={() => setShowCounter(null)}>Cancel</Button>
                <Button size="sm" className="h-6 text-[10px] flex-1 bg-cyan-600 text-white" onClick={() => handleCounter(inv.id)}>Send</Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-1.5">
              <Button size="sm" className="h-7 text-[10px] flex-1 gradient-primary border-0 text-primary-foreground" onClick={() => handleAccept(inv.id)}>
                <Check className="mr-1 h-3 w-3" />Accept
              </Button>
              <Button size="sm" className="h-7 text-[10px] flex-1" variant="outline" onClick={() => setShowCounter(inv.id)}>
                <Clock className="mr-1 h-3 w-3" />Suggest time
              </Button>
              <Button size="sm" className="h-7 text-[10px]" variant="ghost" onClick={() => handleDecline(inv.id)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
