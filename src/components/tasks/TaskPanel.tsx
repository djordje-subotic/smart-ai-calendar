"use client";

import { useState, useEffect } from "react";
import { getTasks, createTask, updateTaskStatus, deleteTask } from "@/src/actions/tasks";
import { Task } from "@/src/types/task";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Check, Circle, Flag, Trash2, ChevronDown, ChevronUp } from "lucide-react";
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
  const [showAdd, setShowAdd] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [newDueTime, setNewDueTime] = useState("");
  const [newPriority, setNewPriority] = useState<Task["priority"]>("medium");
  const [newColor, setNewColor] = useState<string>(EVENT_COLORS[4]);

  useEffect(() => { loadTasks(); }, []);

  async function loadTasks() {
    const data = await getTasks();
    setTasks(data);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await createTask({
      title: newTitle.trim(),
      description: null,
      due_date: newDueDate || new Date().toISOString().split("T")[0],
      due_time: newDueTime || null,
      duration_minutes: 30,
      priority: newPriority,
      color: newColor,
    });
    setNewTitle("");
    setShowAdd(false);
    await loadTasks();
  }

  async function handleToggle(task: Task) {
    const newStatus = task.status === "done" ? "todo" : "done";
    await updateTaskStatus(task.id, newStatus);
    await loadTasks();
  }

  async function handleDelete(id: string) {
    await deleteTask(id);
    await loadTasks();
  }

  return (
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
              {tasks.length === 0 && !showAdd && (
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
                    <button
                      onClick={() => handleToggle(task)}
                      className="mt-0.5 shrink-0"
                    >
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
                        <span className="block text-[9px] font-mono text-muted-foreground/50">
                          {task.due_time}
                        </span>
                      )}
                    </div>
                    {task.priority !== "medium" && (
                      <span className="text-[9px] font-bold shrink-0" style={{ color: pConfig.color }}>
                        {pConfig.icon}
                      </span>
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

              {/* Add task form */}
              <AnimatePresence>
                {showAdd && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleAdd}
                    className="space-y-2 pt-1 overflow-hidden"
                  >
                    <Input
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Task name..."
                      autoFocus
                      className="h-8 text-xs border-border/30 bg-muted/20"
                    />
                    <div className="flex gap-1.5">
                      <input
                        type="date"
                        value={newDueDate}
                        onChange={(e) => setNewDueDate(e.target.value)}
                        className="flex-1 h-7 rounded-md border border-border/30 bg-muted/20 px-2 text-[10px] font-mono outline-none focus:border-primary/40"
                      />
                      <input
                        type="time"
                        value={newDueTime}
                        onChange={(e) => setNewDueTime(e.target.value)}
                        placeholder="Time"
                        className="w-20 h-7 rounded-md border border-border/30 bg-muted/20 px-2 text-[10px] font-mono outline-none focus:border-primary/40"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {/* Priority */}
                      {(["low", "medium", "high", "urgent"] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setNewPriority(p)}
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[9px] font-medium transition-all",
                            newPriority === p ? "ring-1 ring-white/20" : "opacity-40"
                          )}
                          style={{ backgroundColor: `${PRIORITY_CONFIG[p].color}20`, color: PRIORITY_CONFIG[p].color }}
                        >
                          {PRIORITY_CONFIG[p].label}
                        </button>
                      ))}
                      {/* Colors */}
                      <div className="ml-auto flex gap-1">
                        {EVENT_COLORS.slice(0, 5).map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setNewColor(c)}
                            className={cn("h-3.5 w-3.5 rounded-full transition-all", newColor === c ? "scale-125 ring-1 ring-white/20" : "opacity-30")}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <Button type="button" variant="ghost" size="sm" className="h-7 text-[10px] flex-1" onClick={() => setShowAdd(false)}>Cancel</Button>
                      <Button type="submit" size="sm" className="h-7 text-[10px] flex-1 gradient-primary border-0 text-primary-foreground">Add</Button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {!showAdd && (
                <button
                  onClick={() => setShowAdd(true)}
                  className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] text-muted-foreground/40 hover:text-muted-foreground hover:bg-accent/20 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  Add task
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
