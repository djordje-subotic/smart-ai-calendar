"use client";

import { Task } from "@/src/types/task";
import { useToggleTask } from "@/src/hooks/useTasks";
import { Check, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardInlineProps {
  task: Task;
  compact?: boolean;
}

export function TaskCardInline({ task, compact = false }: TaskCardInlineProps) {
  const toggleTask = useToggleTask();
  const isDone = task.status === "done";

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    toggleTask.mutate({ id: task.id, status: isDone ? "todo" : "done" });
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md" style={{ backgroundColor: `${task.color}15` }}>
        <button onClick={handleToggle} className="shrink-0">
          {isDone ? (
            <div className="h-3 w-3 rounded-full flex items-center justify-center" style={{ backgroundColor: task.color }}>
              <Check className="h-2 w-2 text-white" />
            </div>
          ) : (
            <Circle className="h-3 w-3" style={{ color: task.color }} />
          )}
        </button>
        <span className={cn("truncate text-[11px]", isDone ? "line-through text-muted-foreground/40" : "font-medium")} style={{ color: isDone ? undefined : task.color }}>
          {task.title}
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 transition-colors hover:bg-accent/10"
      style={{ borderLeft: `3px dashed ${task.color}`, backgroundColor: `${task.color}08` }}
    >
      <button onClick={handleToggle} className="shrink-0 mt-0.5">
        {isDone ? (
          <div className="h-4 w-4 rounded-full flex items-center justify-center" style={{ backgroundColor: task.color }}>
            <Check className="h-2.5 w-2.5 text-white" />
          </div>
        ) : (
          <Circle className="h-4 w-4" style={{ color: task.color }} />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <span className={cn("text-xs font-medium", isDone && "line-through text-muted-foreground/40")}>
          {task.title}
        </span>
        {task.due_time && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50 font-mono mt-0.5">
            <Clock className="h-2.5 w-2.5" />
            {task.due_time}
          </span>
        )}
      </div>
    </div>
  );
}
