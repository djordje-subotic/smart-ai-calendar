"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  User, Target, Plus, Check, X, Briefcase, Sun, Moon, Coffee, Brain,
  Sparkles, Dumbbell, ShieldAlert, Palette, Save, Clock, CalendarDays,
  ArrowLeft, Heart, MapPin, Cake, Camera, MessageCircle, Quote,
  Search, ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getUserProfile, saveUserProfile, uploadAvatar, type UserProfile } from "@/src/actions/profile";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

// --- DiceBear avatar styles ---
// Each style generates a unique illustrated avatar via DiceBear API
const AVATAR_STYLES = [
  { id: "avataaars", label: "Classic" },
  { id: "bottts", label: "Robot" },
  { id: "fun-emoji", label: "Fun" },
  { id: "lorelei", label: "Lorelei" },
  { id: "notionists", label: "Notion" },
  { id: "open-peeps", label: "Peeps" },
  { id: "thumbs", label: "Thumbs" },
  { id: "big-smile", label: "Smile" },
];

// Each style gets 12 seed variations
const AVATAR_SEEDS = ["felix", "aneka", "nova", "zephyr", "luna", "orion", "kai", "aria", "sage", "blaze", "ember", "storm"];

function getDiceBearUrl(style: string, seed: string) {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}&size=128`;
}

// --- City data ---
const CITIES = [
  "Belgrade, Serbia", "Novi Sad, Serbia", "Nis, Serbia",
  "New York, USA", "Los Angeles, USA", "San Francisco, USA", "Chicago, USA", "Miami, USA", "Austin, USA", "Seattle, USA", "Boston, USA",
  "London, UK", "Manchester, UK", "Edinburgh, UK",
  "Berlin, Germany", "Munich, Germany", "Hamburg, Germany",
  "Paris, France", "Lyon, France", "Marseille, France",
  "Amsterdam, Netherlands", "Rotterdam, Netherlands",
  "Rome, Italy", "Milan, Italy",
  "Madrid, Spain", "Barcelona, Spain",
  "Lisbon, Portugal", "Porto, Portugal",
  "Vienna, Austria", "Zurich, Switzerland", "Geneva, Switzerland",
  "Stockholm, Sweden", "Copenhagen, Denmark", "Oslo, Norway", "Helsinki, Finland",
  "Prague, Czech Republic", "Warsaw, Poland", "Krakow, Poland", "Budapest, Hungary",
  "Bucharest, Romania", "Sofia, Bulgaria", "Zagreb, Croatia", "Ljubljana, Slovenia",
  "Athens, Greece", "Istanbul, Turkey", "Dubai, UAE", "Abu Dhabi, UAE",
  "Tokyo, Japan", "Seoul, South Korea", "Singapore", "Hong Kong",
  "Sydney, Australia", "Melbourne, Australia",
  "Toronto, Canada", "Vancouver, Canada", "Montreal, Canada",
  "Mexico City, Mexico", "Sao Paulo, Brazil", "Buenos Aires, Argentina",
  "Mumbai, India", "Bangalore, India", "Delhi, India",
  "Tel Aviv, Israel", "Cape Town, South Africa", "Lagos, Nigeria", "Nairobi, Kenya",
  "Bangkok, Thailand", "Jakarta, Indonesia", "Kuala Lumpur, Malaysia",
  "Beijing, China", "Shanghai, China", "Taipei, Taiwan",
];

// --- Motivation styles ---
const MOTIVATION_STYLES = [
  { id: "friendly" as const, label: "Friendly", desc: "Warm, supportive, celebrates your wins", color: "text-green-400 bg-green-500/10 border-green-500/20" },
  { id: "strict" as const, label: "Strict Coach", desc: "Pushes you hard, no excuses accepted", color: "text-red-400 bg-red-500/10 border-red-500/20" },
  { id: "professional" as const, label: "Professional", desc: "Clean, efficient, straight to the point", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { id: "hype" as const, label: "Hype Man", desc: "MAXIMUM energy, pumps you up!", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
];

// --- Chip data ---
const GOAL_SUGGESTIONS = [
  "Stay fit & healthy", "Learn new skills", "Read more books", "Be more productive",
  "Better work-life balance", "Build a side project", "Meditate daily", "Sleep 8 hours",
  "Eat healthier", "Advance my career", "Save money", "Travel more",
];
const HABIT_SUGGESTIONS = [
  "Morning workout", "Meditation", "Reading", "Journaling", "Walk after lunch",
  "Evening stretch", "Deep work block", "Meal prep", "No phone before bed", "Study session",
];
const HOBBY_SUGGESTIONS = [
  "Gaming", "Cooking", "Music", "Photography", "Hiking", "Drawing",
  "Writing", "Cycling", "Yoga", "Movies", "Gardening", "Podcasts",
];
const PRIORITY_SUGGESTIONS = [
  "Family time", "Career growth", "Health & fitness", "Learning", "Social life",
  "Side projects", "Rest & recovery", "Financial goals",
];
const CONSTRAINT_SUGGESTIONS = [
  "Kids pickup at 16:00", "No meetings before 10", "Lunch at 13:00",
  "Gym only MWF", "No work on weekends", "Prayer times", "Commute 8-9 & 17-18",
];
const DAYS = [
  { id: "MO", label: "Mon" }, { id: "TU", label: "Tue" }, { id: "WE", label: "Wed" },
  { id: "TH", label: "Thu" }, { id: "FR", label: "Fri" }, { id: "SA", label: "Sat" }, { id: "SU", label: "Sun" },
];

// --- City Picker Component ---
function CityPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = search
    ? CITIES.filter((c) => c.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
    : CITIES.slice(0, 8);

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 h-9 w-full rounded-md border px-3 text-sm cursor-pointer transition-colors",
          "border-border/30 bg-muted/15 hover:bg-muted/25",
          open && "ring-1 ring-primary/30"
        )}
      >
        <MapPin className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
        <span className={value ? "text-foreground" : "text-muted-foreground/40"}>{value || "Select your city..."}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground/40 ml-auto shrink-0" />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute z-50 mt-1 w-full rounded-lg border border-border/30 bg-card shadow-xl overflow-hidden"
          >
            <div className="p-2 border-b border-border/20">
              <div className="flex items-center gap-2 rounded-md border border-border/30 bg-muted/15 px-2">
                <Search className="h-3 w-3 text-muted-foreground/50" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search cities..."
                  autoFocus
                  className="flex-1 bg-transparent py-1.5 text-xs outline-none placeholder:text-muted-foreground/40"
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto py-1">
              {filtered.map((city) => (
                <button
                  key={city}
                  onClick={() => { onChange(city); setOpen(false); setSearch(""); }}
                  className={cn(
                    "flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left hover:bg-accent/30 transition-colors",
                    value === city && "text-primary font-medium bg-primary/5"
                  )}
                >
                  <MapPin className="h-2.5 w-2.5 text-muted-foreground/40 shrink-0" />
                  {city}
                  {value === city && <Check className="h-2.5 w-2.5 ml-auto text-primary" />}
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="px-3 py-3 text-center">
                  <p className="text-[10px] text-muted-foreground/50 mb-1.5">City not found</p>
                  <button
                    onClick={() => { onChange(search); setOpen(false); setSearch(""); }}
                    className="text-[10px] text-primary hover:underline"
                  >
                    Use &ldquo;{search}&rdquo; anyway
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Chip selector ---
function ChipSection({
  suggestions, selected, onToggle, customValue, onCustomChange, onCustomAdd, placeholder,
}: {
  suggestions: string[];
  selected: string[];
  onToggle: (v: string) => void;
  customValue: string;
  onCustomChange: (v: string) => void;
  onCustomAdd: () => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((item) => (
          <button
            key={item}
            onClick={() => onToggle(item)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-all duration-150",
              selected.includes(item)
                ? "border-primary/50 bg-primary/15 text-primary font-medium"
                : "border-border/30 bg-muted/10 text-muted-foreground hover:bg-muted/25 hover:text-foreground"
            )}
          >
            {selected.includes(item) && <Check className="inline h-2.5 w-2.5 mr-1 -mt-px" />}
            {item}
          </button>
        ))}
        {selected.filter((s) => !suggestions.includes(s)).map((item) => (
          <button
            key={item}
            onClick={() => onToggle(item)}
            className="rounded-full border border-primary/50 bg-primary/15 text-primary font-medium px-3 py-1 text-xs transition-all"
          >
            <Check className="inline h-2.5 w-2.5 mr-1 -mt-px" />
            {item}
            <X className="inline h-2.5 w-2.5 ml-1.5 opacity-60" />
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={customValue}
          onChange={(e) => onCustomChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onCustomAdd(); } }}
          placeholder={placeholder}
          className="border-border/30 bg-muted/15 text-sm placeholder:text-muted-foreground/40"
        />
        <Button size="sm" variant="outline" className="shrink-0 border-border/30" onClick={onCustomAdd}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// --- Section card ---
function Section({
  icon: Icon, title, description, children, number,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
  number: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: number * 0.05 }}
      className="rounded-xl border border-border/30 bg-card/50 p-6"
    >
      <div className="flex items-center gap-3 mb-1">
        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-3.5 w-3.5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-[11px] text-muted-foreground/70">{description}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </motion.div>
  );
}

// --- Section divider ---
function SectionDivider({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="pt-4 pb-1">
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
      <p className="text-xs text-muted-foreground/60">{subtitle}</p>
    </div>
  );
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Identity
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPreset, setAvatarPreset] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [city, setCity] = useState("");
  const [motto, setMotto] = useState("");

  // AI personality
  const [motivationStyle, setMotivationStyle] = useState<"strict" | "friendly" | "professional" | "hype">("friendly");

  // About
  const [occupation, setOccupation] = useState("");
  const [bio, setBio] = useState("");

  // Lists
  const [goals, setGoals] = useState<string[]>([]);
  const [customGoal, setCustomGoal] = useState("");
  const [habits, setHabits] = useState<string[]>([]);
  const [customHabit, setCustomHabit] = useState("");
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [customHobby, setCustomHobby] = useState("");
  const [priorities, setPriorities] = useState<string[]>([]);
  const [customPriority, setCustomPriority] = useState("");
  const [constraints, setConstraints] = useState<string[]>([]);
  const [customConstraint, setCustomConstraint] = useState("");
  const [idealDay, setIdealDay] = useState("");

  // Schedule
  const [workDays, setWorkDays] = useState(["MO", "TU", "WE", "TH", "FR"]);
  const [workStart, setWorkStart] = useState("09:00");
  const [workEnd, setWorkEnd] = useState("17:00");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [sleepTime, setSleepTime] = useState("23:00");
  const [lunchTime, setLunchTime] = useState("13:00");
  const [focusPreference, setFocusPreference] = useState<"morning" | "afternoon" | "evening">("morning");

  // Avatar picker
  const [avatarStyle, setAvatarStyle] = useState("avataaars");

  useEffect(() => {
    getUserProfile().then((p) => {
      if (p) {
        setDisplayName(p.display_name || "");
        setAvatarUrl(p.avatar_url || "");
        setAvatarPreset(p.avatar_preset || "");
        setDateOfBirth(p.date_of_birth || "");
        setCity(p.city || "");
        setMotivationStyle(p.motivation_style || "friendly");
        setMotto(p.motto || "");
        setOccupation(p.occupation || "");
        setBio(p.bio || "");
        setGoals(p.goals);
        setHabits(p.daily_habits);
        setHobbies(p.hobbies);
        setPriorities(p.priorities);
        setConstraints(p.constraints);
        setIdealDay(p.ideal_day || "");
        setWorkDays(p.work_schedule?.days || ["MO", "TU", "WE", "TH", "FR"]);
        setWorkStart(p.work_schedule?.start || "09:00");
        setWorkEnd(p.work_schedule?.end || "17:00");
        setWakeTime(p.preferences?.wake_time || "07:00");
        setSleepTime(p.preferences?.sleep_time || "23:00");
        setLunchTime(p.preferences?.lunch_time || "13:00");
        setFocusPreference(p.preferences?.focus_preference || "morning");
        // Parse avatar preset to restore style
        if (p.avatar_preset && p.avatar_preset.includes(":")) {
          const [s] = p.avatar_preset.split(":");
          setAvatarStyle(s);
        }
      }
      setLoading(false);
    });
  }, []);

  function toggle(list: string[], setList: (v: string[]) => void, item: string) {
    setList(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  }

  function addCustom(value: string, list: string[], setList: (v: string[]) => void, setValue: (v: string) => void) {
    const v = value.trim();
    if (v && !list.includes(v)) setList([...list, v]);
    setValue("");
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const url = await uploadAvatar(formData);
      setAvatarUrl(url);
      setAvatarPreset("");
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  }

  function selectPresetAvatar(style: string, seed: string) {
    const presetId = `${style}:${seed}`;
    setAvatarPreset(presetId);
    setAvatarUrl("");
  }

  // Get current avatar display
  const currentAvatarSrc = avatarUrl
    ? avatarUrl
    : avatarPreset && avatarPreset.includes(":")
      ? getDiceBearUrl(avatarPreset.split(":")[0], avatarPreset.split(":")[1])
      : null;

  async function handleSave() {
    setSaving(true);
    try {
      await saveUserProfile({
        display_name: displayName || null,
        avatar_url: avatarUrl || null,
        avatar_preset: avatarPreset || null,
        date_of_birth: dateOfBirth || null,
        city: city || null,
        motivation_style: motivationStyle,
        motto: motto || null,
        occupation: occupation || null,
        bio: bio || null,
        goals,
        daily_habits: habits,
        hobbies,
        priorities,
        constraints,
        ideal_day: idealDay || null,
        work_schedule: { days: workDays, start: workStart, end: workEnd },
        preferences: {
          wake_time: wakeTime,
          sleep_time: sleepTime,
          lunch_time: lunchTime,
          focus_preference: focusPreference,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast.success("Profile saved");
    } catch (err) {
      console.error("Failed to save profile:", err);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6 pb-24 space-y-4 sm:space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/calendar" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-3 w-3" />Back to calendar
        </Link>
        <h2 className="text-xl font-bold tracking-tight">My Profile</h2>
        <p className="text-sm text-muted-foreground">Your profile info and AI personalization settings.</p>
      </motion.div>

      {/* ============================================= */}
      {/* SECTION 1: PROFILE INFO                       */}
      {/* ============================================= */}
      <SectionDivider title="Profile Info" subtitle="Your personal info visible to friends" />

      {/* Avatar & Identity */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border/30 bg-card/50 p-6"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <User className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Avatar & Identity</h3>
            <p className="text-[11px] text-muted-foreground/70">How you appear to Krowna and friends</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6">
          {/* Current avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <div className="h-24 w-24 rounded-2xl border-2 border-border/30 bg-muted/15 flex items-center justify-center overflow-hidden">
                {currentAvatarSrc ? (
                  <img src={currentAvatarSrc} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-muted-foreground/30" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full gradient-primary flex items-center justify-center shadow-lg border-2 border-background hover:scale-110 transition-transform"
              >
                <Camera className="h-3 w-3 text-primary-foreground" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            {uploading && <span className="text-[10px] text-primary">Uploading...</span>}
            <span className="text-[10px] text-muted-foreground/50">Upload or pick below</span>
          </div>

          {/* Identity fields */}
          <div className="flex-1 space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Display name</label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How should Krowna call you?"
                className="border-border/30 bg-muted/15"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5"><Cake className="h-3 w-3" />Birthday</label>
                <Input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="border-border/30 bg-muted/15 font-mono text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5"><MapPin className="h-3 w-3" />City</label>
                <CityPicker value={city} onChange={setCity} />
              </div>
            </div>
          </div>
        </div>

        {/* Avatar style picker */}
        <div className="mt-5">
          <label className="text-xs text-muted-foreground mb-2 block">Choose an avatar</label>

          {/* Style tabs */}
          <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
            {AVATAR_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => setAvatarStyle(style.id)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-[10px] font-medium transition-all",
                  avatarStyle === style.id
                    ? "gradient-primary text-primary-foreground"
                    : "bg-muted/15 text-muted-foreground border border-border/30 hover:bg-muted/25"
                )}
              >
                {style.label}
              </button>
            ))}
          </div>

          {/* Avatar grid */}
          <div className="grid grid-cols-6 gap-2">
            {AVATAR_SEEDS.map((seed) => {
              const presetId = `${avatarStyle}:${seed}`;
              const isSelected = avatarPreset === presetId && !avatarUrl;
              return (
                <button
                  key={seed}
                  onClick={() => selectPresetAvatar(avatarStyle, seed)}
                  className={cn(
                    "aspect-square rounded-xl border overflow-hidden transition-all",
                    isSelected
                      ? "border-2 border-primary/60 scale-105 shadow-lg shadow-primary/20 ring-2 ring-primary/20"
                      : "border-border/30 hover:border-border/60 hover:scale-[1.03]"
                  )}
                >
                  <img
                    src={getDiceBearUrl(avatarStyle, seed)}
                    alt={seed}
                    className="w-full h-full object-cover bg-muted/15"
                  />
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Motto */}
      <Section icon={Quote} title="Your Motto" description="A personal mantra shown on your profile." number={1}>
        <Input
          value={motto}
          onChange={(e) => setMotto(e.target.value)}
          placeholder="E.g. 'Discipline equals freedom', 'One day at a time', 'Build the life you want'..."
          className="border-border/30 bg-muted/15"
        />
      </Section>

      {/* ============================================= */}
      {/* SECTION 2: AI PERSONALIZATION                 */}
      {/* ============================================= */}
      <SectionDivider title="AI Personalization" subtitle="Help Krowna understand you for better schedules" />

      {/* Motivation Style */}
      <Section icon={MessageCircle} title="Krowna's Personality" description="How should Krowna talk to you? This changes the AI's tone." number={2}>
        <div className="grid grid-cols-2 gap-2">
          {MOTIVATION_STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => setMotivationStyle(style.id)}
              className={cn(
                "rounded-xl border p-3.5 text-left transition-all",
                motivationStyle === style.id
                  ? `${style.color} border-2`
                  : "border-border/30 bg-muted/10 hover:bg-muted/20"
              )}
            >
              <span className={cn("text-xs font-semibold", motivationStyle === style.id ? "" : "text-foreground")}>{style.label}</span>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">{style.desc}</p>
            </button>
          ))}
        </div>
      </Section>

      {/* About You */}
      <Section icon={Briefcase} title="About You" description="Who are you? AI uses this to understand your schedule needs." number={3}>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Occupation</label>
            <Input
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              placeholder="Software Engineer, Student, Designer, Freelancer..."
              className="border-border/30 bg-muted/15"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">About you</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Your work, lifestyle, responsibilities — anything that helps AI plan your time better..."
              rows={3}
              className="w-full rounded-md border border-border/30 bg-muted/15 px-3 py-2.5 text-sm placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>
      </Section>

      {/* Goals */}
      <Section icon={Target} title="Goals" description="What do you want to achieve? AI aligns your schedule with these." number={4}>
        <ChipSection
          suggestions={GOAL_SUGGESTIONS}
          selected={goals}
          onToggle={(g) => toggle(goals, setGoals, g)}
          customValue={customGoal}
          onCustomChange={setCustomGoal}
          onCustomAdd={() => addCustom(customGoal, goals, setGoals, setCustomGoal)}
          placeholder="Add your own goal..."
        />
      </Section>

      {/* Life Priorities */}
      <Section icon={Heart} title="Life Priorities" description="What matters most? AI protects time for these." number={5}>
        <ChipSection
          suggestions={PRIORITY_SUGGESTIONS}
          selected={priorities}
          onToggle={(p) => toggle(priorities, setPriorities, p)}
          customValue={customPriority}
          onCustomChange={setCustomPriority}
          onCustomAdd={() => addCustom(customPriority, priorities, setPriorities, setCustomPriority)}
          placeholder="Add priority..."
        />
      </Section>

      {/* Daily Habits */}
      <Section icon={Dumbbell} title="Daily Habits" description="Habits AI will build into your routine." number={6}>
        <ChipSection
          suggestions={HABIT_SUGGESTIONS}
          selected={habits}
          onToggle={(h) => toggle(habits, setHabits, h)}
          customValue={customHabit}
          onCustomChange={setCustomHabit}
          onCustomAdd={() => addCustom(customHabit, habits, setHabits, setCustomHabit)}
          placeholder="Add habit..."
        />
      </Section>

      {/* Hobbies */}
      <Section icon={Palette} title="Hobbies & Interests" description="AI suggests time for things you enjoy." number={7}>
        <ChipSection
          suggestions={HOBBY_SUGGESTIONS}
          selected={hobbies}
          onToggle={(h) => toggle(hobbies, setHobbies, h)}
          customValue={customHobby}
          onCustomChange={setCustomHobby}
          onCustomAdd={() => addCustom(customHobby, hobbies, setHobbies, setCustomHobby)}
          placeholder="Add hobby..."
        />
      </Section>

      {/* Constraints */}
      <Section icon={ShieldAlert} title="Constraints & Rules" description="Hard rules AI must always respect." number={8}>
        <ChipSection
          suggestions={CONSTRAINT_SUGGESTIONS}
          selected={constraints}
          onToggle={(c) => toggle(constraints, setConstraints, c)}
          customValue={customConstraint}
          onCustomChange={setCustomConstraint}
          onCustomAdd={() => addCustom(customConstraint, constraints, setConstraints, setCustomConstraint)}
          placeholder="Add rule... (e.g. 'No calls after 18:00')"
        />
      </Section>

      {/* Schedule & Rhythm */}
      <Section icon={Clock} title="Schedule & Rhythm" description="When you work, sleep, and focus best." number={9}>
        <div className="space-y-5">
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Work days</label>
            <div className="flex gap-2">
              {DAYS.map((day) => (
                <button
                  key={day.id}
                  onClick={() => toggle(workDays, setWorkDays, day.id)}
                  className={cn(
                    "flex-1 h-9 rounded-lg text-xs font-medium transition-all",
                    workDays.includes(day.id)
                      ? "gradient-primary text-primary-foreground"
                      : "bg-muted/15 text-muted-foreground border border-border/30 hover:bg-muted/25"
                  )}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5"><Sun className="h-3 w-3" />Wake up</label>
              <Input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} className="border-border/30 bg-muted/15 font-mono text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5"><Coffee className="h-3 w-3" />Lunch</label>
              <Input type="time" value={lunchTime} onChange={(e) => setLunchTime(e.target.value)} className="border-border/30 bg-muted/15 font-mono text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5"><Moon className="h-3 w-3" />Sleep</label>
              <Input type="time" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} className="border-border/30 bg-muted/15 font-mono text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5"><CalendarDays className="h-3 w-3" />Work from</label>
              <Input type="time" value={workStart} onChange={(e) => setWorkStart(e.target.value)} className="border-border/30 bg-muted/15 font-mono text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5"><CalendarDays className="h-3 w-3" />Work until</label>
              <Input type="time" value={workEnd} onChange={(e) => setWorkEnd(e.target.value)} className="border-border/30 bg-muted/15 font-mono text-sm" />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
              <Brain className="h-3 w-3" />When are you most productive?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: "morning", label: "Morning", sub: "6\u201312h", icon: Sun },
                { id: "afternoon", label: "Afternoon", sub: "12\u201318h", icon: Coffee },
                { id: "evening", label: "Evening", sub: "18\u201324h", icon: Moon },
              ] as const).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setFocusPreference(opt.id)}
                  className={cn(
                    "rounded-xl border py-3 text-center transition-all",
                    focusPreference === opt.id
                      ? "border-primary/50 bg-primary/10 shadow-sm shadow-primary/10"
                      : "border-border/30 bg-muted/10 hover:bg-muted/20"
                  )}
                >
                  <opt.icon className={cn("h-4 w-4 mx-auto mb-1", focusPreference === opt.id ? "text-primary" : "text-muted-foreground/60")} />
                  <div className={cn("text-xs font-medium", focusPreference === opt.id ? "text-primary" : "text-muted-foreground")}>{opt.label}</div>
                  <div className="text-[10px] text-muted-foreground/50 mt-0.5">{opt.sub}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Ideal Day */}
      <Section icon={Sparkles} title="Your Ideal Day" description="Describe your perfect day \u2014 AI uses this as a template." number={10}>
        <textarea
          value={idealDay}
          onChange={(e) => setIdealDay(e.target.value)}
          placeholder="Describe how your perfect day looks from morning to evening. E.g. 'Wake up at 7, gym at 7:30, deep work 9-12, lunch at 13, meetings 14-16, hobby time 17-18, family dinner at 19, reading before bed...'"
          rows={5}
          className="w-full rounded-md border border-border/30 bg-muted/15 px-3 py-2.5 text-sm placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 leading-relaxed"
        />
      </Section>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/30 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-2xl px-6 py-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground/60">
            {saved ? (
              <span className="text-green-400 flex items-center gap-1"><Check className="h-3 w-3" />Profile saved! AI will use this.</span>
            ) : (
              "Changes are saved when you click Save."
            )}
          </p>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gradient-primary border-0 text-primary-foreground px-6"
          >
            {saving ? "Saving..." : <><Save className="mr-2 h-4 w-4" />Save profile</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
