"use client";

import { useState, useEffect, useCallback } from "react";
import { getTasks, createTask, updateTaskStatus, deleteTask } from "@/src/actions/tasks";
import { Task } from "@/src/types/task";
import { playSound } from "@/src/lib/sounds";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Check, Circle, Trash2, ChevronDown, ChevronUp, CalendarDays, Clock } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { EVENT_COLORS } from "@/src/constants/colors";

const PRIORITY_CONFIG = {
  urgent: { color: "#EF4444", icon: "!!", label: "Urgent" },
  high: { color: "#F59E0B", icon: "!", label: "High" },
  medium: { color: "#3B82F6", icon: "·", label: "Medium" },
  low: { color: "#6B7280", icon: "", label: "Low" },
};

export function TaskPanel() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [newDueTime, setNewDueTime] = useState("");
  const [newPriority, setNewPriority] = useState<Task["priority"]>("medium");
  const [newColor, setNewColor] = useState<string>(EVENT_COLORS[4]);
  const [saving, setSaving] = useState(false);

  const loadTasks = useCallback(async () => {
    const data = await getTasks();
    setTasks(data);
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  function resetForm() {
    setNewTitle("");
    setNewDueDate(new Date().toISOString().split("T")[0]);
    setNewDueTime("");
    setNewPriority("medium");
    setNewColor(EVENT_COLORS[4]);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSaving(true);
    playSound("success");
    await createTask({
      title: newTitle.trim(),
      description: null,
      due_date: newDueDate || new Date().toISOString().split("T")[0],
      due_time: newDueTime || null,
      duration_minutes: 30,
      priority: newPriority,
      color: newColor,
    });
    resetForm();
    setShowModal(false);
    setSaving(false);
    await loadTasks();
    toast.success(`"${newTitle.trim()}" added`);
  }

  async function handleToggle(task: Task) {
    playSound("complete");
    const newStatus = task.status === "done" ? "todo" : "done";
    await updateTaskStatus(task.id, newStatus);
    await loadTasks();
    toast.success(newStatus === "done" ? `"${task.title}" completed` : `"${task.title}" reopened`);
  }

  async function handleDelete(id: string) {
    playSound("delete");
    await deleteTask(id);
    await loadTasks();
    toast.success("Task deleted");
  }

  return (
    <>
      <div className="rounded-xl border border-border/30 bg-card/50 overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          <span>Tasks ({tasks.length})</span>
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="px-2 pb-2 space-y-1">
                {tasks.length === 0 && (
                  <p className="text-[11px] text-muted-foreground/40 text-center py-3">No tasks yet</p>
                )}

                {tasks.map((task) => {
                  const pConfig = PRIORITY_CONFIG[task.priority];
                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-accent/20 transition-colors"
                    >
                      <button onClick={() => handleToggle(task)} className="mt-0.5 shrink-0">
                        {task.status === "done" ? (
                          <div className="h-4 w-4 rounded-full flex items-center justify-center" style={{ backgroundColor: task.color }}>
                            <Check className="h-2.5 w-2.5 text-white" />
                          </div>
                        ) : (
                          <Circle className="h-4 w-4" style={{ color: task.color }} />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <span className={cn(
                          "text-[11px] leading-tight",
                          task.status === "done" && "line-through text-muted-foreground/40"
                        )}>
                          {task.title}
                        </span>
                        {task.due_time && (
                          <span className="block text-[9px] font-mono text-muted-foreground/50">{task.due_time}</span>
                        )}
                      </div>
                      {task.priority !== "medium" && (
                        <span className="text-[9px] font-bold shrink-0" style={{ color: pConfig.color }}>{pConfig.icon}</span>
                      )}
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="opacity-0 group-hover:opacity-100 shrink-0 text-muted-foreground/30 hover:text-destructive transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </motion.div>
                  );
                })}

                <button
                  onClick={() => setShowModal(true)}
                  className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] text-muted-foreground/40 hover:text-muted-foreground hover:bg-accent/20 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  Add task
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Task Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md border-border/50 bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">New Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What do you need to do?"
              autoFocus
              required
              className="border-0 bg-transparent px-0 text-lg font-semibold placeholder:text-muted-foreground/30 focus-visible:ring-0"
            />

            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                <Input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} className="border-border/30 bg-muted/20 text-sm font-mono" />
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                <Input type="time" value={newDueTime} onChange={(e) => setNewDueTime(e.target.value)} placeholder="Optional" className="border-border/30 bg-muted/20 text-sm font-mono" />
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="text-xs text-muted-foreground/60 mb-2 block">Priority</label>
              <div className="flex gap-2">
                {(["low", "medium", "high", "urgent"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setNewPriority(p)}
                    className={cn(
                      "flex-1 rounded-lg py-2 text-xs font-medium transition-all border",
                      newPriority === p
                        ? "ring-1 ring-white/10 border-transparent"
                        : "opacity-40 border-border/20 hover:opacity-70"
                    )}
                    style={{
                      backgroundColor: newPriority === p ? `${PRIORITY_CONFIG[p].color}25` : "transparent",
                      color: PRIORITY_CONFIG[p].color,
                    }}
                  >
                    {PRIORITY_CONFIG[p].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div className="flex items-center gap-3">
              <label className="text-xs text-muted-foreground/60 shrink-0">Color</label>
              <div className="flex gap-2">
                {EVENT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className={cn(
                      "h-6 w-6 rounded-full transition-all duration-150",
                      newColor === c ? "scale-125 ring-2 ring-offset-2 ring-offset-card ring-white/20" : "opacity-40 hover:opacity-70"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => { setShowModal(false); resetForm(); }} className="text-muted-foreground">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving || !newTitle.trim()} className="gradient-primary border-0 text-primary-foreground shadow-lg shadow-primary/20">
                {saving ? "Adding..." : "Add task"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
