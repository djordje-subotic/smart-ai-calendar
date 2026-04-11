export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  frequency: "daily" | "weekly" | "custom";
  target_days: number[];
  preferred_time: string | null;
  duration_minutes: number;
  color: string;
  streak_current: number;
  streak_best: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completed_date: string;
  completed_at: string;
  notes: string | null;
}
