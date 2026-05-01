-- Recompute habit streak_current and streak_best whenever a habit_completion is
-- inserted or deleted. The web app does this in src/actions/habits.ts, but
-- mobile writes directly through the Supabase client and was leaving the
-- streak counters stale. A trigger keeps them in sync from both surfaces.

CREATE OR REPLACE FUNCTION public.recompute_habit_streak(target_habit_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  streak INT := 0;
  cursor_date DATE := CURRENT_DATE;
  has_today BOOLEAN;
  best INT;
BEGIN
  -- If today isn't completed, the streak still counts back from yesterday.
  SELECT EXISTS (
    SELECT 1 FROM habit_completions
    WHERE habit_id = target_habit_id AND completed_date = CURRENT_DATE
  ) INTO has_today;

  IF NOT has_today THEN
    cursor_date := CURRENT_DATE - INTERVAL '1 day';
  END IF;

  LOOP
    EXIT WHEN streak >= 365;
    IF EXISTS (
      SELECT 1 FROM habit_completions
      WHERE habit_id = target_habit_id AND completed_date = cursor_date
    ) THEN
      streak := streak + 1;
      cursor_date := cursor_date - INTERVAL '1 day';
    ELSE
      EXIT;
    END IF;
  END LOOP;

  SELECT COALESCE(streak_best, 0) INTO best FROM habits WHERE id = target_habit_id;

  UPDATE habits
  SET streak_current = streak,
      streak_best = GREATEST(streak, COALESCE(best, 0))
  WHERE id = target_habit_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.habit_completion_streak_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recompute_habit_streak(OLD.habit_id);
    RETURN OLD;
  ELSE
    PERFORM public.recompute_habit_streak(NEW.habit_id);
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS habit_completions_streak_aiu ON habit_completions;
CREATE TRIGGER habit_completions_streak_aiu
  AFTER INSERT OR UPDATE ON habit_completions
  FOR EACH ROW EXECUTE FUNCTION public.habit_completion_streak_trigger();

DROP TRIGGER IF EXISTS habit_completions_streak_ad ON habit_completions;
CREATE TRIGGER habit_completions_streak_ad
  AFTER DELETE ON habit_completions
  FOR EACH ROW EXECUTE FUNCTION public.habit_completion_streak_trigger();

GRANT EXECUTE ON FUNCTION public.recompute_habit_streak(UUID) TO authenticated;
