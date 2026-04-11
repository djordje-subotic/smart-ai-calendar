"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Plus, Flame, Trophy, Check, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getHabits, createHabit, deleteHabit, toggleCompletion } from "@/src/actions/habits";
import { Habit } from "@/src/types/habit";
import { EVENT_COLORS } from "@/src/constants/colors";
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());
  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    loadHabits();
  }, []);

  async function loadHabits() {
    const data = await getHabits();
    setHabits(data);
  }

  async function handleToggle(habitId: string) {
    const wasCompleted = completedToday.has(habitId);
    const newSet = new Set(completedToday);
    if (wasCompleted) {
      newSet.delete(habitId);
    } else {
      newSet.add(habitId);
    }
    setCompletedToday(newSet);
    await toggleCompletion(habitId, today);
    await loadHabits();
  }

  async function handleDelete(habitId: string) {
    await deleteHabit(habitId);
    await loadHabits();
  }

  async function handleCreate(formData: FormData) {
    const name = formData.get("name") as string;
    const frequency = formData.get("frequency") as string || "daily";
    const color = formData.get("color") as string || EVENT_COLORS[2];

    await createHabit({
      name,
      description: null,
      frequency: frequency as "daily" | "weekly" | "custom",
      target_days: [1, 2, 3, 4, 5],
      preferred_time: "09:00",
      duration_minutes: 30,
      color,
    });
    setShowCreate(false);
    await loadHabits();
  }

  // Last 7 days for streak visualization
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    return { date: format(d, "yyyy-MM-dd"), label: format(d, "EEE"), isToday: format(d, "yyyy-MM-dd") === today };
  });

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6 overflow-auto h-full">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-xl font-bold tracking-tight">Habits</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Build consistency, track streaks</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)} className="gradient-primary border-0 text-primary-foreground shadow-lg shadow-primary/20">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New Habit
        </Button>
      </motion.div>

      {/* Habit list */}
      {habits.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16 space-y-4"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Target className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-bold">Start building habits</h3>
            <p className="text-sm text-muted-foreground mt-1">Create your first habit and track your progress daily</p>
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)} className="gradient-primary border-0 text-primary-foreground">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Create first habit
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {habits.map((habit, i) => (
            <motion.div
              key={habit.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border/30 bg-card/50 p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggle(habit.id)}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg border-2 transition-all",
                      completedToday.has(habit.id)
                        ? "border-transparent scale-110"
                        : "border-border/40 hover:border-primary/40"
                    )}
                    style={{
                      backgroundColor: completedToday.has(habit.id) ? habit.color : "transparent",
                    }}
                  >
                    {completedToday.has(habit.id) && <Check className="h-4 w-4 text-white" />}
                  </button>
                  <div>
                    <h3 className="text-sm font-semibold">{habit.name}</h3>
                    <p className="text-[11px] text-muted-foreground capitalize">{habit.frequency}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Streak */}
                  <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ backgroundColor: `${habit.color}15` }}>
                    <Flame className="h-3.5 w-3.5" style={{ color: habit.color }} />
                    <span className="text-xs font-bold" style={{ color: habit.color }}>
                      {habit.streak_current}
                    </span>
                  </div>
                  {habit.streak_best > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Trophy className="h-3 w-3" />
                      {habit.streak_best}
                    </div>
                  )}
                  <button onClick={() => handleDelete(habit.id)} className="text-muted-foreground/30 hover:text-destructive transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* 7-day visualization */}
              <div className="flex gap-1.5">
                {last7Days.map((day) => (
                  <div key={day.date} className="flex-1 text-center">
                    <div className="text-[9px] text-muted-foreground/50 mb-1">{day.label}</div>
                    <div
                      className={cn(
                        "mx-auto h-6 w-6 rounded-md transition-all",
                        day.isToday && "ring-1 ring-primary/30"
                      )}
                      style={{
                        backgroundColor: `${habit.color}15`,
                      }}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
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
              <Label className="text-xs text-muted-foreground">Habit name</Label>
              <Input name="name" placeholder="e.g. Morning run, Read 30 min..." required className="border-border/30 bg-muted/20" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Frequency</Label>
              <div className="flex gap-2">
                {["daily", "weekly"].map((f) => (
                  <label key={f} className="flex-1">
                    <input type="radio" name="frequency" value={f} defaultChecked={f === "daily"} className="peer sr-only" />
                    <div className="rounded-lg border border-border/30 bg-muted/20 py-2 text-center text-xs font-medium capitalize cursor-pointer peer-checked:border-primary/50 peer-checked:bg-primary/10 peer-checked:text-primary transition-all">
                      {f}
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
                    <div
                      className="h-6 w-6 rounded-full cursor-pointer opacity-40 peer-checked:opacity-100 peer-checked:scale-125 peer-checked:ring-2 peer-checked:ring-offset-2 peer-checked:ring-offset-card transition-all"
                      style={{ backgroundColor: c }}
                    />
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
