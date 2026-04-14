"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Layout, Loader2, Sparkles, BookOpen, Dumbbell, Briefcase, Palmtree } from "lucide-react";
import { motion } from "framer-motion";
import { applyTemplate, type ChatResponse } from "@/src/actions/ai";
import { createEvent } from "@/src/actions/events";
import { useQueryClient } from "@tanstack/react-query";
import { playSound } from "@/src/lib/sounds";
import { cn } from "@/lib/utils";

const TEMPLATES = [
  { id: "productive_week", name: "Productive Week", desc: "Deep work, meetings, exercise, breaks", icon: Briefcase, color: "text-blue-400 bg-blue-500/10" },
  { id: "study_week", name: "Study Week", desc: "Study blocks, revision, practice, balance", icon: BookOpen, color: "text-green-400 bg-green-500/10" },
  { id: "balanced_week", name: "Balanced Life", desc: "Work, exercise, hobbies, social, rest", icon: Dumbbell, color: "text-amber-400 bg-amber-500/10" },
  { id: "sprint_week", name: "Sprint Week", desc: "Maximum productivity, minimal distractions", icon: Sparkles, color: "text-red-400 bg-red-500/10" },
  { id: "vacation_mode", name: "Vacation Mode", desc: "Relax, explore, no work, recharge", icon: Palmtree, color: "text-cyan-400 bg-cyan-500/10" },
];

export function SmartTemplatesCard() {
  const [applying, setApplying] = useState<string | null>(null);
  const [result, setResult] = useState<{ template: string; count: number } | null>(null);
  const queryClient = useQueryClient();

  async function handleApply(templateId: string) {
    setApplying(templateId);
    try {
      const startDate = new Date();
      // Start from next Monday
      const dayOfWeek = startDate.getDay();
      const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
      startDate.setDate(startDate.getDate() + daysUntilMonday);

      const response = await applyTemplate(templateId, startDate.toISOString().split("T")[0]);

      if (response.events && response.events.length > 0) {
        for (const event of response.events) {
          await createEvent({
            title: event.title,
            description: event.description,
            location: event.location,
            start_time: event.start_time,
            end_time: event.end_time,
            all_day: false,
            color: event.color || "#3B82F6",
            recurrence_rule: event.recurrence as any,
            reminder_minutes: [15],
            source: "ai",
            external_id: null,
            meeting_url: null,
            ai_metadata: { original_prompt: `template:${templateId}`, confidence: 0.9, model_used: "claude-haiku-4-5" },
            status: "confirmed",
          });
        }
        queryClient.invalidateQueries({ queryKey: ["events"] });
        playSound("success");
        setResult({ template: templateId, count: response.events.length });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setApplying(null);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/30 bg-card/50 p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Layout className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Smart Templates</h3>
          <p className="text-[11px] text-muted-foreground/60">One-click schedule for next week</p>
        </div>
      </div>

      <div className="space-y-2">
        {TEMPLATES.map((t) => {
          const isApplied = result?.template === t.id;
          return (
            <button
              key={t.id}
              onClick={() => !isApplied && handleApply(t.id)}
              disabled={applying !== null}
              className={cn(
                "flex items-center gap-3 w-full rounded-lg border p-3 text-left transition-all",
                isApplied
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-border/20 bg-muted/10 hover:bg-muted/20"
              )}
            >
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", t.color)}>
                <t.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold">{t.name}</div>
                <div className="text-[10px] text-muted-foreground/60">{t.desc}</div>
              </div>
              {applying === t.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
              ) : isApplied ? (
                <span className="text-[10px] text-green-400 font-medium shrink-0">{result.count} events added</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
