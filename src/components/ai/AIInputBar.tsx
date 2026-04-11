"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Send,
  X,
  Check,
  Loader2,
  MapPin,
  Clock,
  RotateCcw,
  Mic,
} from "lucide-react";
import { parseEventPrompt } from "@/src/actions/ai";
import { useCreateEvent } from "@/src/hooks/useEvents";
import { CalendarEvent } from "@/src/types/event";
import { ParsedEvent } from "@/src/lib/ai/schemas";
import { format, parseISO } from "date-fns";
import { DEFAULT_EVENT_COLOR } from "@/src/constants/colors";
import { motion, AnimatePresence } from "framer-motion";

interface AIInputBarProps {
  events: CalendarEvent[];
}

export function AIInputBar({ events }: AIInputBarProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<ParsedEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usageInfo, setUsageInfo] = useState<{ used: number; limit: number } | null>(null);
  const createEvent = useCreateEvent();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    setIsLoading(true);
    setError(null);
    setSuggestion(null);

    try {
      const result = await parseEventPrompt(input.trim());
      if (result.usage) setUsageInfo(result.usage);
      setSuggestion(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("ANTHROPIC_API_KEY")) {
        setError("AI not configured. Add ANTHROPIC_API_KEY to .env.local and restart.");
      } else {
        setError(`AI error: ${message}`);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConfirm() {
    if (!suggestion) return;
    setError(null);

    try {
      await createEvent.mutateAsync({
        title: suggestion.title,
        description: suggestion.description,
        location: suggestion.location,
        start_time: suggestion.start_time,
        end_time: suggestion.end_time,
        all_day: false,
        color: DEFAULT_EVENT_COLOR,
        recurrence_rule: suggestion.recurrence,
        reminder_minutes: [15],
        source: "ai",
        external_id: null,
        ai_metadata: {
          original_prompt: input,
          confidence: suggestion.confidence,
          model_used: "claude-haiku-4-5",
      },
        status: "confirmed",
      });

      setSuggestion(null);
      setInput("");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Failed to save: ${message}`);
    }
  }

  function handleDismiss() {
    setSuggestion(null);
    setError(null);
  }

  return (
    <div className="border-t border-border/30 bg-background/80 backdrop-blur-xl">
      {/* AI Suggestion Card */}
      <AnimatePresence>
        {suggestion && (
          <motion.div
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 20, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mx-3 mt-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm">{suggestion.title}</h3>
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary border-primary/20 text-[10px]"
                    >
                      {Math.round(suggestion.confidence * 100)}%
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      <span className="font-mono">
                        {format(parseISO(suggestion.start_time), "EEE, MMM d")}
                        {" "}
                        {format(parseISO(suggestion.start_time), "HH:mm")}
                        {" - "}
                        {format(parseISO(suggestion.end_time), "HH:mm")}
                      </span>
                    </div>
                    {suggestion.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" />
                        <span>{suggestion.location}</span>
                      </div>
                    )}
                    {suggestion.recurrence && (
                      <div className="flex items-center gap-1.5">
                        <RotateCcw className="h-3 w-3" />
                        <span>Repeats {suggestion.recurrence.freq}</span>
                      </div>
                    )}
                  </div>

                  {suggestion.needs_clarification && (
                    <p className="text-xs text-amber-400/80 bg-amber-400/5 rounded-md px-2 py-1">
                      {suggestion.needs_clarification}
                    </p>
                  )}
                </div>

                <div className="flex gap-1.5 ml-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDismiss}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleConfirm}
                    className="h-8 gradient-primary text-white border-0 shadow-lg shadow-primary/20"
                  >
                    <Check className="mr-1 h-3.5 w-3.5" />
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mx-3 mt-3 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <Sparkles className="h-4 w-4 text-primary/60" />
            )}
          </div>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Ask AI: "Meeting with Sarah tomorrow at 2pm" or "Rucak u 13h"...'
            className="w-full rounded-xl border border-border/50 bg-muted/30 py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-200 placeholder:text-muted-foreground/40 focus:border-primary/40 focus:bg-muted/50 focus:ring-2 focus:ring-primary/10"
            disabled={isLoading}
          />
          {isLoading && (
            <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
              <div className="h-full w-full shimmer" />
            </div>
          )}
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground"
        >
          <Mic className="h-4 w-4" />
        </Button>
        <Button
          type="submit"
          size="icon"
          disabled={isLoading || !input.trim()}
          className="h-10 w-10 shrink-0 gradient-primary border-0 text-white shadow-lg shadow-primary/20 disabled:opacity-30 disabled:shadow-none"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>

      {/* Usage counter */}
      {usageInfo && (
        <div className="flex justify-end px-3 pb-2">
          <span className="text-[10px] text-muted-foreground/50">
            {usageInfo.used}/{usageInfo.limit} AI requests used
          </span>
        </div>
      )}
    </div>
  );
}
