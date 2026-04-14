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

// AI Actions - actions AI wants to perform on existing events
export interface AIAction {
  type: "delete" | "move" | "update";
  event_id: string;
  event_title: string;
  description: string; // Human-readable description of what will happen
  // For move actions
  new_start_time?: string;
  new_end_time?: string;
  // For update actions
  updates?: {
    title?: string;
    description?: string;
    location?: string;
    color?: string;
  };
}
