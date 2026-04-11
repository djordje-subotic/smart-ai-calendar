import { RecurrenceRule } from "./event";

export interface AIParseResult {
  title: string;
  start_time: string;
  end_time: string;
  location: string | null;
  description: string | null;
  recurrence: RecurrenceRule | null;
  confidence: number;
  needs_clarification: string | null;
}

export interface AITimeSuggestion {
  start_time: string;
  end_time: string;
  score: number;
  reason: string;
}

export interface AIConflict {
  conflicting_event_id: string;
  new_event_title: string;
  resolutions: AIResolution[];
}

export interface AIResolution {
  type: "move_new" | "move_existing" | "shorten";
  description: string;
  suggested_time?: { start: string; end: string };
}
