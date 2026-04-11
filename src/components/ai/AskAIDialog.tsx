"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Send, Loader2, Check, X, Clock, MapPin, RotateCcw, MessageSquare, Trash, Circle, Flag } from "lucide-react";
import { playSound } from "@/src/lib/sounds";
import { chatWithAI, type ChatMessage, type ChatResponse } from "@/src/actions/ai";
import { createEvent } from "@/src/actions/events";
import { createTask } from "@/src/actions/tasks";
import { useUIStore } from "@/src/stores/uiStore";
import { format, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
  events?: ChatResponse["events"];
  tasks?: ChatResponse["tasks"];
  savedEvents?: Set<number>;
  savedTasks?: Set<number>;
}

export function AskAIDialog() {
  const { isCommandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("kron-chat-messages");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("kron-chat-history");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [usageInfo, setUsageInfo] = useState<{ used: number; limit: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Persist chat to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("kron-chat-messages", JSON.stringify(messages.map((m) => ({
        role: m.role, content: m.content, events: m.events, tasks: m.tasks,
      }))));
    }
  }, [messages]);

  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem("kron-chat-history", JSON.stringify(chatHistory));
    }
  }, [chatHistory]);

  useEffect(() => {
    if (isCommandPaletteOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isCommandPaletteOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  function handleClear() {
    setMessages([]);
    setChatHistory([]);
    localStorage.removeItem("kron-chat-messages");
    localStorage.removeItem("kron-chat-history");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setLoading(true);
    playSound("send");

    const newMessages = [...messages, { role: "user" as const, content: userMsg }];
    setMessages(newMessages);

    const newHistory = [...chatHistory, { role: "user" as const, content: userMsg }];

    try {
      const result = await chatWithAI(newHistory);
      if (result.usage) setUsageInfo(result.usage);

      const assistantMsg: DisplayMessage = {
        role: "assistant",
        content: result.message,
        events: result.events,
        tasks: result.tasks,
        savedEvents: new Set(),
        savedTasks: new Set(),
      };

      setMessages([...newMessages, assistantMsg]);
      setChatHistory([...newHistory, { role: "assistant", content: result.message }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("limit reached") || msg.includes("Upgrade")) {
        setMessages([...newMessages, {
          role: "assistant",
          content: "You've reached your monthly AI limit. Upgrade your plan in Settings to continue using Kron AI.",
        }]);
      } else {
        setMessages([...newMessages, { role: "assistant", content: `Error: ${msg}` }]);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAddEvent(msgIdx: number, eventIdx: number, event: NonNullable<ChatResponse["events"]>[number]) {
    try {
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
        ai_metadata: { original_prompt: "chat", confidence: 0.9, model_used: "claude-haiku-4-5" },
        status: "confirmed",
      });

      setMessages((prev) => prev.map((m, i) => {
        if (i === msgIdx && m.savedEvents) {
          const newSaved = new Set(m.savedEvents);
          newSaved.add(eventIdx);
          return { ...m, savedEvents: newSaved };
        }
        return m;
      }));

      queryClient.invalidateQueries({ queryKey: ["events"] });
      playSound("success");
    } catch (err) {
      playSound("error");
      console.error("Failed to add event:", err);
    }
  }

  async function handleAddTask(msgIdx: number, taskIdx: number, task: NonNullable<ChatResponse["tasks"]>[number]) {
    try {
      await createTask({
        title: task.title,
        description: null,
        due_date: new Date().toISOString().split("T")[0],
        due_time: null,
        duration_minutes: 30,
        priority: (task.priority as any) || "medium",
        color: task.color || "#8B5CF6",
      });

      setMessages((prev) => prev.map((m, i) => {
        if (i === msgIdx && m.savedTasks) {
          const newSaved = new Set(m.savedTasks);
          newSaved.add(taskIdx);
          return { ...m, savedTasks: newSaved };
        }
        return m;
      }));
    } catch (err) {
      console.error("Failed to add task:", err);
    }
  }

  async function handleAddAll(msgIdx: number, msg: DisplayMessage) {
    if (msg.events) {
      for (let i = 0; i < msg.events.length; i++) {
        if (!msg.savedEvents?.has(i)) await handleAddEvent(msgIdx, i, msg.events[i]);
      }
    }
    if (msg.tasks) {
      for (let i = 0; i < msg.tasks.length; i++) {
        if (!msg.savedTasks?.has(i)) await handleAddTask(msgIdx, i, msg.tasks[i]);
      }
    }
  }

  return (
    <Dialog open={isCommandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <DialogContent className="sm:max-w-lg p-0 border-border/50 bg-card/95 backdrop-blur-xl overflow-hidden max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg gradient-primary">
              <MessageSquare className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">Kron AI</span>
            {messages.length > 0 && (
              <Badge variant="secondary" className="text-[9px]">{messages.length} msgs</Badge>
            )}
          </div>
          <div className="flex gap-1">
            {messages.length > 0 && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={handleClear}>
                <Trash className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[100px] max-h-[50vh]">
          {messages.length === 0 && (
            <div className="text-center py-8 space-y-2">
              <Sparkles className="h-8 w-8 mx-auto text-primary/30" />
              <p className="text-sm font-medium text-muted-foreground">How can I help?</p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {[
                  "Napravi mi raspored za produktivan dan",
                  "Trening svaki dan u 7",
                  "Plan my week with work and gym",
                  "Dodaj task: kupiti namirnice",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); inputRef.current?.focus(); }}
                    className="rounded-full border border-border/40 bg-muted/20 px-3 py-1 text-[11px] text-muted-foreground hover:bg-accent/30 hover:text-foreground transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, msgIdx) => (
            <motion.div
              key={msgIdx}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
            >
              <div className={cn(
                "max-w-[85%] rounded-xl px-3 py-2 text-sm",
                msg.role === "user"
                  ? "bg-primary/15 text-foreground"
                  : "bg-muted/30 text-foreground"
              )}>
                <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                {/* Event cards from AI */}
                {msg.events && msg.events.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {msg.events.map((event, eventIdx) => {
                      const saved = msg.savedEvents?.has(eventIdx);
                      return (
                        <div key={eventIdx} className="rounded-lg border border-border/30 bg-background/50 p-2.5">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: event.color || "#3B82F6" }} />
                                <span className="text-xs font-semibold">{event.title}</span>
                              </div>
                              <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                                {event.start_time && (
                                  <span className="flex items-center gap-1 font-mono">
                                    <Clock className="h-2.5 w-2.5" />
                                    {format(parseISO(event.start_time), "EEE MMM d · HH:mm")} – {format(parseISO(event.end_time), "HH:mm")}
                                  </span>
                                )}
                                {event.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-2.5 w-2.5" />{event.location}
                                  </span>
                                )}
                                {event.recurrence && (
                                  <span className="flex items-center gap-1 text-primary">
                                    <RotateCcw className="h-2.5 w-2.5" />Repeats {event.recurrence.freq}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              disabled={saved}
                              onClick={() => handleAddEvent(msgIdx, eventIdx, event)}
                              className={cn("h-7 text-[10px] shrink-0 ml-2", saved ? "bg-green-600/20 text-green-400" : "gradient-primary border-0 text-primary-foreground")}
                            >
                              {saved ? <><Check className="mr-1 h-3 w-3" />Added</> : <><Check className="mr-1 h-3 w-3" />Add</>}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Task cards from AI */}
                {msg.tasks && msg.tasks.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {msg.tasks.map((task, taskIdx) => {
                      const saved = msg.savedTasks?.has(taskIdx);
                      return (
                        <div key={taskIdx} className="rounded-lg border border-border/30 bg-background/50 p-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Circle className="h-3.5 w-3.5" style={{ color: task.color || "#8B5CF6" }} />
                              <span className="text-xs font-medium">{task.title}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${task.color}20`, color: task.color }}>
                                {task.priority}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              disabled={saved}
                              onClick={() => handleAddTask(msgIdx, taskIdx, task)}
                              className={cn("h-7 text-[10px] shrink-0 ml-2", saved ? "bg-green-600/20 text-green-400" : "gradient-primary border-0 text-primary-foreground")}
                            >
                              {saved ? <><Check className="mr-1 h-3 w-3" />Added</> : <><Check className="mr-1 h-3 w-3" />Add</>}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add All button when multiple items */}
                {((msg.events?.length || 0) + (msg.tasks?.length || 0)) > 1 && (
                  <Button
                    size="sm"
                    onClick={() => handleAddAll(msgIdx, msg)}
                    className="mt-2 w-full h-7 text-[10px] gradient-primary border-0 text-primary-foreground"
                  >
                    <Check className="mr-1 h-3 w-3" />
                    Add all ({(msg.events?.length || 0) + (msg.tasks?.length || 0)} items)
                  </Button>
                )}
              </div>
            </motion.div>
          ))}

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="rounded-xl bg-muted/30 px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            </motion.div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex items-center border-t border-border/30 px-4">
          <Sparkles className="h-4 w-4 text-primary/40 shrink-0" />
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell Kron what you need..."
            className="flex-1 bg-transparent py-3.5 px-3 text-sm outline-none placeholder:text-muted-foreground/40"
            disabled={loading}
          />
          <div className="flex items-center gap-2">
            {usageInfo && (
              <span className="text-[9px] text-muted-foreground/40">{usageInfo.used}/{usageInfo.limit}</span>
            )}
            <Button type="submit" size="icon" variant="ghost" disabled={loading || !input.trim()} className="h-8 w-8 shrink-0">
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
