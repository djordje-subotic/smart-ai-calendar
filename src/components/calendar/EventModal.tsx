"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUIStore } from "@/src/stores/uiStore";
import { useCalendarStore } from "@/src/stores/calendarStore";
import { toast } from "sonner";
import { useCreateEvent, useUpdateEvent, useDeleteEvent } from "@/src/hooks/useEvents";
import { CalendarEvent, RecurrenceRule } from "@/src/types/event";
import { EVENT_COLORS, DEFAULT_EVENT_COLOR } from "@/src/constants/colors";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Trash2, CalendarDays, Clock, MapPin, AlignLeft, RotateCcw, Sparkles, Video, Link, Loader2, X } from "lucide-react";
import { generateMeetLink, getGoogleSyncStatus } from "@/src/actions/google-calendar";

interface EventModalProps {
  events: CalendarEvent[];
}

const RECURRENCE_OPTIONS = [
  { value: "none", label: "No repeat" },
  { value: "daily", label: "Every day" },
  { value: "weekly", label: "Every week" },
  { value: "monthly", label: "Every month" },
  { value: "yearly", label: "Every year" },
];

export function EventModal({ events }: EventModalProps) {
  const { isEventModalOpen, editingEventId, prefillStartTime, prefillEndTime, closeEventModal } = useUIStore();
  const { selectedDate } = useCalendarStore();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEventMutation = useDeleteEvent();

  const existingEvent = editingEventId ? events.find((e) => e.id === editingEventId) : null;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [color, setColor] = useState<string>(DEFAULT_EVENT_COLOR);
  const [recurrence, setRecurrence] = useState("none");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [generatingMeet, setGeneratingMeet] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);

  useEffect(() => {
    getGoogleSyncStatus().then((s) => setGoogleConnected(s.connected));
  }, []);

  useEffect(() => {
    if (existingEvent) {
      setTitle(existingEvent.title);
      setDescription(existingEvent.description || "");
      setLocation(existingEvent.location || "");
      setDate(format(new Date(existingEvent.start_time), "yyyy-MM-dd"));
      setStartTime(format(new Date(existingEvent.start_time), "HH:mm"));
      setEndTime(format(new Date(existingEvent.end_time), "HH:mm"));
      setColor(existingEvent.color);
      setRecurrence(existingEvent.recurrence_rule?.freq || "none");
      setMeetingUrl(existingEvent.meeting_url || "");
    } else {
      setTitle("");
      setDescription("");
      setLocation("");
      setDate(format(selectedDate, "yyyy-MM-dd"));
      setStartTime(prefillStartTime || "09:00");
      setEndTime(prefillEndTime || "10:00");
      setColor(DEFAULT_EVENT_COLOR);
      setRecurrence("none");
      setMeetingUrl("");
    }
  }, [existingEvent, selectedDate, isEventModalOpen]);

  const isSaving = createEvent.isPending || updateEvent.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startTime || !endTime || endTime <= startTime) {
      alert("Please set valid start and end times");
      return;
    }
    const startDateTime = new Date(`${date}T${startTime}`).toISOString();
    const endDateTime = new Date(`${date}T${endTime}`).toISOString();

    const recurrenceRule: RecurrenceRule | null =
      recurrence === "none"
        ? null
        : { freq: recurrence as RecurrenceRule["freq"], interval: 1 };

    const eventData = {
      title,
      description: description || null,
      location: location || null,
      start_time: startDateTime,
      end_time: endDateTime,
      all_day: false,
      color,
      recurrence_rule: recurrenceRule,
      reminder_minutes: [15],
      source: "manual" as const,
      external_id: null,
      ai_metadata: null,
      meeting_url: meetingUrl || null,
      status: "confirmed" as const,
    };

    if (existingEvent) {
      await updateEvent.mutateAsync({ id: existingEvent.id, updates: eventData });
      toast.success("Event updated");
    } else {
      await createEvent.mutateAsync(eventData);
      toast.success("Event created");
    }
    closeEventModal();
  }

  async function handleDelete() {
    if (existingEvent) {
      await deleteEventMutation.mutateAsync(existingEvent.id);
      toast.success("Event deleted");
      closeEventModal();
    }
  }

  return (
    <Dialog open={isEventModalOpen} onOpenChange={(open) => !open && closeEventModal()}>
      <DialogContent className="sm:max-w-md border-border/50 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-base font-semibold">
              {existingEvent ? "Edit Event" : "New Event"}
            </DialogTitle>
            {existingEvent?.source === "ai" && (
              <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px]">
                <Sparkles className="mr-1 h-2.5 w-2.5" />AI created
              </Badge>
            )}
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title"
            required
            className="border-0 bg-transparent px-0 text-lg font-semibold placeholder:text-muted-foreground/30 focus-visible:ring-0"
          />

          {/* Fields */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="border-border/30 bg-muted/20 text-sm font-mono" />
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              <div className="flex items-center gap-2 flex-1">
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className="border-border/30 bg-muted/20 text-sm font-mono" />
                <span className="text-muted-foreground/40 text-xs">to</span>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required className="border-border/30 bg-muted/20 text-sm font-mono" />
              </div>
            </div>

            {/* Repeat */}
            <div className="flex items-center gap-3">
              <RotateCcw className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                className="flex-1 rounded-md border border-border/30 bg-muted/20 px-3 py-2 text-sm outline-none focus:border-primary/40 transition-colors"
              >
                {RECURRENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Add location" className="border-border/30 bg-muted/20 text-sm" />
            </div>
            <div className="flex items-center gap-3">
              <AlignLeft className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add description" className="border-border/30 bg-muted/20 text-sm" />
            </div>

            {/* Video call */}
            <div className="flex items-center gap-3">
              <Video className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              {meetingUrl ? (
                <div className="flex items-center gap-2 flex-1 rounded-md border border-border/30 bg-muted/20 px-3 py-1.5">
                  <Link className="h-3 w-3 text-primary shrink-0" />
                  <a href={meetingUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary truncate flex-1 hover:underline">
                    {meetingUrl.replace(/^https?:\/\//, "")}
                  </a>
                  <button type="button" onClick={() => setMeetingUrl("")} className="text-muted-foreground/50 hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 flex-1">
                  <Input
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                    placeholder="Paste meeting link (Zoom, Meet...)"
                    className="border-border/30 bg-muted/20 text-sm"
                  />
                  {googleConnected && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={generatingMeet}
                      className="shrink-0 text-xs border-border/30 gap-1.5"
                      onClick={async () => {
                        setGeneratingMeet(true);
                        try {
                          const startDateTime = new Date(`${date}T${startTime}`).toISOString();
                          const endDateTime = new Date(`${date}T${endTime}`).toISOString();
                          const result = await generateMeetLink(title || "Meeting", startDateTime, endDateTime);
                          if (result?.url) {
                            setMeetingUrl(result.url);
                          }
                        } catch (err) {
                          console.error("Failed to generate Meet link:", err);
                        } finally {
                          setGeneratingMeet(false);
                        }
                      }}
                    >
                      {generatingMeet ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <Video className="h-3 w-3" />
                          Meet
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Color picker */}
          <div className="flex items-center gap-3">
            <Label className="text-xs text-muted-foreground/60 shrink-0">Color</Label>
            <div className="flex gap-1.5 flex-wrap">
              {EVENT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-6 w-6 rounded-full transition-all duration-150",
                    color === c ? "scale-125 ring-2 ring-offset-2 ring-offset-card ring-white/20" : "opacity-40 hover:opacity-70"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-2">
            {existingEvent ? (
              <Button type="button" variant="ghost" size="sm" onClick={handleDelete} className="text-destructive/70 hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />Delete
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={closeEventModal} className="text-muted-foreground">Cancel</Button>
              <Button type="submit" size="sm" disabled={isSaving} className="gradient-primary border-0 text-primary-foreground shadow-lg shadow-primary/20">
                {isSaving ? "Saving..." : existingEvent ? "Save changes" : "Create event"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
