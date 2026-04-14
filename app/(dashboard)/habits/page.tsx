"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Plus, Flame, Trophy, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getHabits, createHabit, deleteHabit, toggleCompletion, getCompletions } from "@/src/actions/habits";
import { Habit } from "@/src/types/habit";
import { EVENT_COLORS } from "@/src/constants/colors";
import { cn } from "@/lib/utils";
import { playSound } from "@/src/lib/sounds";
import { format, subDays } from "date-fns";

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [completedMap, setCompletedMap] = useState<Record<string, Set<string>>>({});
  const [loading, setLoading] = useState(true);
  const today = format(new Date(), "yyyy-MM-dd");
  const currentMonth = format(new Date(), "yyyy-MM");

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const data = await getHabits();
    setHabits(data);

    // Load completions for each habit this month
    const map: Record<string, Set<string>> = {};
    for (const habit of data) {
      const completions = await getCompletions(habit.id, currentMonth);
      map[habit.id] = new Set(completions.map((c) => c.completed_date));
    }
    setCompletedMap(map);
    setLoading(false);
  }

  async function handleToggle(habitId: string) {
    playSound("complete");
    // Optimistic update - immediate UI change
    const wasDone = completedMap[habitId]?.has(today);
    setCompletedMap((prev) => {
      const next = { ...prev };
      const dates = new Set(prev[habitId] || []);
      if (dates.has(today)) {
        dates.delete(today);
      } else {
        dates.add(today);
      }
      next[habitId] = dates;
      return next;
    });

    // Optimistic streak update
    setHabits((prev) => prev.map((h) => {
      if (h.id !== habitId) return h;
      const newStreak = wasDone
        ? Math.max(0, h.streak_current - 1)
        : h.streak_current + 1;
      return { ...h, streak_current: newStreak, streak_best: Math.max(h.streak_best, newStreak) };
    }));

    // Server update in background
    toggleCompletion(habitId, today).then((result) => {
      console.log("Toggle result:", result, "for habit:", habitId, "date:", today);
    }).catch((err) => {
      console.error("Toggle failed:", err);
      // Revert on error
      loadAll();
    });
  }

  async function handleDelete(habitId: string) {
    await deleteHabit(habitId);
    await loadAll();
  }

  async function handleCreate(formData: FormData) {
    const name = formData.get("name") as string;
    if (!name?.trim()) return;
    const frequency = formData.get("frequency") as string || "daily";
    const color = formData.get("color") as string || EVENT_COLORS[2];

    await createHabit({
      name: name.trim(),
      description: null,
      frequency: frequency as "daily" | "weekly" | "custom",
      target_days: [1, 2, 3, 4, 5],
      preferred_time: "09:00",
      duration_minutes: 30,
      color,
    });
    setShowCreate(false);
    await loadAll();
  }

  // Last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    return { date: format(d, "yyyy-MM-dd"), label: format(d, "EEE"), day: format(d, "d"), isToday: format(d, "yyyy-MM-dd") === today };
  });

  function isCompleted(habitId: string, date: string) {
    return completedMap[habitId]?.has(date) || false;
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading habits...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6 space-y-4 sm:space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Habits</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Build consistency, track streaks</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)} className="gradient-primary border-0 text-primary-foreground shadow-lg shadow-primary/20">
          <Plus className="mr-1.5 h-3.5 w-3.5" />New Habit
        </Button>
      </motion.div>

      {habits.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Target className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-bold">Start building habits</h3>
            <p className="text-sm text-muted-foreground mt-1">Create your first habit and track your progress daily</p>
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)} className="gradient-primary border-0 text-primary-foreground">
            <Plus className="mr-1.5 h-3.5 w-3.5" />Create first habit
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {habits.map((habit, i) => {
            const isTodayDone = isCompleted(habit.id, today);

            return (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-border/30 bg-card/50 p-4"
              >
                {/* Header row */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {/* Today's check button */}
                    <button
                      onClick={() => handleToggle(habit.id)}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl border-2 transition-all",
                        isTodayDone
                          ? "border-transparent scale-105"
                          : "border-border/40 hover:border-primary/40 hover:bg-accent/30"
                      )}
                      style={{ backgroundColor: isTodayDone ? habit.color : "transparent" }}
                    >
                      {isTodayDone ? (
                        <Check className="h-5 w-5 text-white" />
                      ) : (
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: `${habit.color}30` }} />
                      )}
                    </button>
                    <div>
                      <h3 className={cn("text-sm font-semibold", isTodayDone && "line-through text-muted-foreground")}>{habit.name}</h3>
                      <p className="text-[11px] text-muted-foreground capitalize">{habit.frequency}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Current streak */}
                    <div className="flex items-center gap-1.5 rounded-full px-3 py-1" style={{ backgroundColor: `${habit.color}15` }}>
                      <Flame className="h-3.5 w-3.5" style={{ color: habit.color }} />
                      <span className="text-xs font-bold" style={{ color: habit.color }}>{habit.streak_current}</span>
                      <span className="text-[10px] text-muted-foreground">day streak</span>
                    </div>
                    {habit.streak_best > 0 && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground" title="Best streak">
                        <Trophy className="h-3 w-3" />Best: {habit.streak_best}
                      </div>
                    )}
                    <button onClick={() => handleDelete(habit.id)} className="text-muted-foreground/30 hover:text-destructive transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* 7-day heatmap */}
                <div className="flex gap-1.5">
                  {last7Days.map((day) => {
                    const done = isCompleted(habit.id, day.date);
                    return (
                      <div key={day.date} className="flex-1 text-center">
                        <div className="text-[9px] text-muted-foreground/50 mb-1">{day.label}</div>
                        <div
                          className={cn(
                            "mx-auto h-8 w-full rounded-md flex items-center justify-center transition-all",
                            day.isToday && "ring-1 ring-primary/30"
                          )}
                          style={{ backgroundColor: done ? habit.color : `${habit.color}10` }}
                        >
                          {done ? (
                            <Check className="h-3.5 w-3.5 text-white" />
                          ) : (
                            <span className="text-[10px] text-muted-foreground/30">{day.day}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Habit Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md border-border/50 bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>New Habit</DialogTitle>
          </DialogHeader>
          <form action={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">What habit do you want to build?</Label>
              <Input name="name" placeholder="e.g. Morning run, Read 30 min, Meditate..." required className="border-border/30 bg-muted/20" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">How often?</Label>
              <div className="flex gap-2">
                {["daily", "weekly"].map((f) => (
                  <label key={f} className="flex-1">
                    <input type="radio" name="frequency" value={f} defaultChecked={f === "daily"} className="peer sr-only" />
                    <div className="rounded-lg border border-border/30 bg-muted/20 py-2.5 text-center text-xs font-medium capitalize cursor-pointer peer-checked:border-primary/50 peer-checked:bg-primary/10 peer-checked:text-primary transition-all">
                      {f === "daily" ? "Every day" : "Weekly"}
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Color</Label>
              <div className="flex gap-2">
                {EVENT_COLORS.map((c) => (
                  <label key={c}>
                    <input type="radio" name="color" value={c} defaultChecked={c === EVENT_COLORS[2]} className="peer sr-only" />
                    <div className="h-7 w-7 rounded-full cursor-pointer opacity-40 peer-checked:opacity-100 peer-checked:scale-110 peer-checked:ring-2 peer-checked:ring-offset-2 peer-checked:ring-offset-card transition-all" style={{ backgroundColor: c }} />
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" size="sm" className="gradient-primary border-0 text-primary-foreground">Create habit</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
