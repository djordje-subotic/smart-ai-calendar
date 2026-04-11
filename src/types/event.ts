export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_time: string;
  end_time: string;
  all_day: boolean;
  color: string;
  recurrence_rule: RecurrenceRule | null;
  reminder_minutes: number[];
  source: "manual" | "ai" | "google" | "apple" | "outlook";
  external_id: string | null;
  ai_metadata: AIMetadata | null;
  status: "confirmed" | "tentative" | "cancelled";
  created_at: string;
  updated_at: string;
}

export interface RecurrenceRule {
  freq: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  days?: string[];
  until?: string | null;
}

export interface AIMetadata {
  original_prompt: string;
  confidence: number;
  model_used: string;
}

export type CalendarView = "month" | "week" | "day";

export interface TimeSlot {
  hour: number;
  minute: number;
}
