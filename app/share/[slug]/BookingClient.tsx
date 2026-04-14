"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, CheckCircle2, Loader2 } from "lucide-react";

type Slot = { start: string; end: string };

type Props = {
  slug: string;
  slotsByDay: Record<string, Slot[]>;
  durationMinutes: number;
};

export function BookingClient({ slug, slotsByDay, durationMinutes }: Props) {
  const days = useMemo(() => Object.keys(slotsByDay).sort(), [slotsByDay]);
  const [selectedDay, setSelectedDay] = useState<string | null>(days[0] || null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booked, setBooked] = useState<Slot | null>(null);

  async function confirm() {
    if (!selectedSlot || !name.trim() || !email.trim()) {
      setError("Please fill in your name and email.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/share/${slug}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start: selectedSlot.start,
          end: selectedSlot.end,
          name,
          email,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");
      setBooked(selectedSlot);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setLoading(false);
    }
  }

  if (booked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-primary/20 bg-card/80 p-10 text-center shadow-2xl backdrop-blur-xl"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15">
          <CheckCircle2 className="h-7 w-7 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold">You&apos;re booked!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {formatLong(booked.start)} · {formatTime(booked.start)}–{formatTime(booked.end)}
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          A confirmation was sent to <span className="text-foreground">{email}</span>.
        </p>
      </motion.div>
    );
  }

  if (days.length === 0) {
    return (
      <div className="rounded-3xl border border-border/40 bg-card/80 p-10 text-center">
        <p className="text-sm text-muted-foreground">
          No open slots in the upcoming window. Check back soon.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border/40 bg-card/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
      <div className="grid gap-6 sm:grid-cols-[200px_1fr]">
        {/* Day picker */}
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Calendar className="h-3 w-3" />
            Day
          </div>
          <div className="flex flex-col gap-1 sm:max-h-96 sm:overflow-auto">
            {days.map((d) => {
              const active = d === selectedDay;
              return (
                <button
                  key={d}
                  onClick={() => {
                    setSelectedDay(d);
                    setSelectedSlot(null);
                  }}
                  className={`rounded-xl px-3 py-2 text-left text-sm transition ${
                    active
                      ? "bg-primary/15 text-foreground ring-1 ring-primary/30"
                      : "hover:bg-muted/30"
                  }`}
                >
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {weekday(d)}
                  </div>
                  <div className="font-semibold">{formatDayLabel(d)}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Slot picker / form */}
        <div>
          {!selectedSlot ? (
            <>
              <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                <Clock className="h-3 w-3" />
                {durationMinutes} min slots · {formatLong(selectedDay!)}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:max-h-96 sm:overflow-auto">
                {(slotsByDay[selectedDay!] || []).map((s) => (
                  <button
                    key={s.start}
                    onClick={() => setSelectedSlot(s)}
                    className="rounded-xl border border-border/40 bg-muted/20 px-3 py-2 text-sm font-medium transition hover:border-primary/50 hover:bg-primary/10"
                  >
                    {formatTime(s.start)}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="mb-4 rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm">
                <div className="text-xs uppercase tracking-widest text-primary/80">Selected</div>
                <div className="mt-1 font-semibold">
                  {formatLong(selectedSlot.start)} · {formatTime(selectedSlot.start)}–{formatTime(selectedSlot.end)}
                </div>
                <button
                  className="mt-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setSelectedSlot(null)}
                >
                  Change time
                </button>
              </div>

              {error && (
                <div className="mb-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs text-muted-foreground">Your name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="notes" className="text-xs text-muted-foreground">What&apos;s this about? (optional)</Label>
                  <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                <Button
                  onClick={confirm}
                  disabled={loading}
                  className="w-full gradient-primary border-0 text-primary-foreground"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? "Booking..." : "Confirm booking"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatLong(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatDayLabel(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function weekday(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short" });
}
