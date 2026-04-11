import { z } from "zod";

// Helper: accept string or null/false/undefined, normalize to string | null
const optionalString = z
  .union([z.string(), z.boolean(), z.null(), z.undefined()])
  .transform((v) => (typeof v === "string" ? v : null));

// Helper: require a datetime string, fallback to now+offset if null/missing
function requiredDateTime(offsetHours: number) {
  return z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => {
      if (typeof v === "string" && v.length > 0) return v;
      const d = new Date();
      d.setHours(d.getHours() + offsetHours);
      return d.toISOString();
    });
}

export const ParsedEventSchema = z.object({
  title: z.union([z.string(), z.null()]).transform((v) => v || "Untitled Event"),
  start_time: requiredDateTime(0),
  end_time: requiredDateTime(1),
  location: optionalString,
  description: optionalString,
  recurrence: z
    .any()
    .transform((v): { freq: "daily" | "weekly" | "monthly" | "yearly"; interval: number; days?: string[]; until?: string | null } | null => {
      if (typeof v === "object" && v !== null && "freq" in v) {
        const freq = v.freq as string;
        if (["daily", "weekly", "monthly", "yearly"].includes(freq)) {
          return { freq: freq as "daily" | "weekly" | "monthly" | "yearly", interval: v.interval || 1, days: v.days, until: v.until || null };
        }
      }
      return null;
    }),
  confidence: z.union([z.number(), z.null()]).transform((v) => v ?? 0.5),
  needs_clarification: optionalString,
});

export type ParsedEvent = z.infer<typeof ParsedEventSchema>;
