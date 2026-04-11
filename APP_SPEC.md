# Kron — Rule Your Time

## App Vision
Kron is a premium AI-powered calendar app that aims to be the #1 smart calendar on the market. It combines the familiar feel of Google Calendar with powerful AI capabilities that no competitor offers. The goal: users should never have to manually organize their schedule again.

## Brand Identity
- **Name**: Kron (from "krona" = crown + "chronos" = time)
- **Tagline**: "Rule your time."
- **Logo**: Golden crown with 3 points, gem dots, gradient (#D97706 → #F59E0B → #FBBF24)
- **Color palette**: Dark theme with amber/gold accents. Background #1a1520 style.
- **Font**: Plus Jakarta Sans (UI), JetBrains Mono (timestamps)
- **Tone**: Premium, confident, empowering. "You're the ruler of your time."

## Platforms
- **Web**: Next.js 15 (App Router) — primary platform, deployed on Vercel
- **Mobile**: Expo (React Native) in `mobile/` folder — shares Supabase backend
- Both platforms share the same database, auth, and branding

## Tech Stack (Web)
- Next.js 15, TypeScript, Tailwind CSS v4, shadcn/ui
- Supabase (PostgreSQL + Auth + Realtime + RLS)
- Claude API (Haiku 4.5) for AI features
- Framer Motion for animations
- Zustand (UI state) + TanStack Query (server state)
- date-fns for date manipulation

## Core Features

### 1. Calendar Views
- **Month view**: Grid with event dots, click to open day. Shows up to 3 events per cell.
- **Week view**: 7-column time grid (7:00-23:00). Events shown as blocks with proper height based on duration. Overlapping events sit side-by-side in columns.
- **Day view**: Vertical timeline. Events as colored blocks. Real-time "now line" with glow.
- **All views**: Drag-and-drop to move events. Click empty slot to create. 15-minute grid snapping.

### 2. Events
- Title, description, location, date, start/end time, color (8 options)
- **Recurrence**: daily, weekly, monthly, yearly. Recurring events appear on all matching days.
- **Source tracking**: manual, ai, google, apple, outlook
- **AI metadata**: stores original prompt and confidence score for AI-created events
- Events scale visually by duration: 15min=tiny, 30min=compact, 1h=normal, 2h+=expanded

### 3. AI Assistant (Kron AI)
- **Chat interface** (⌘K or sidebar button): Multi-turn conversation with memory
- **Context-aware**: AI sees user's existing events for next 30 days
- **Natural language**: "Stavi mi trening svaki dan u 7" → creates daily recurring event
- **Schedule generation**: "Napravi mi raspored za produktivnu nedelju" → generates 5-10 events
- **Tasks**: AI can create tasks alongside events
- **Languages**: Serbian + English natively supported
- **Quick suggestions**: Pre-made prompts for common actions
- **Per-message event cards**: Each AI suggestion has individual "Add" button + "Add All" for batch
- **Voice input**: Web Speech API (mic button on input bar), supports Serbian

### 4. AI Schedule Optimizer (Pro feature)
- Analyzes current week for issues (back-to-back meetings, missing breaks, overload)
- Returns score (0-100) and specific suggestions (move, add, remove events)
- Accessible from "Optimize schedule" button below calendar

### 5. Tasks
- Title, due date, due time, duration, priority (low/medium/high/urgent), color, status
- **Task Panel** in sidebar: collapsible list with checkbox completion, priority badges, delete
- Tasks created via AI chat or manually
- Priorities shown as colored badges

### 6. Habits
- Name, frequency (daily/weekly), color, streak tracking
- **7-day heatmap**: Visual grid showing last 7 days with check marks for completed days
- **Streak counter**: Current streak + best streak (flame + trophy icons)
- **Today's check**: Large checkbox — tap to mark today as done
- Completions stored in database per day, loaded from server (not just local state)

### 7. Daily AI Briefing
- On Today page: "Kron AI Briefing" card
- Click to generate: AI summarizes your day in 2-3 sentences
- Considers existing events, suggests if day is empty

### 8. Energy Tracking
- **Energy Indicator** in sidebar: circular progress showing current energy level
- **Energy Timeline**: bar chart (6:00-21:00) visualizing energy curve through the day
- Based on chronobiology: peak 9-12, dip 13-15, recovery 15-17
- Currently hardcoded, planned: learn from user behavior

### 9. Schedule Score
- Circular score (0-100) in sidebar
- Evaluates day health: penalizes back-to-back meetings, overloaded days, too many events
- Color-coded: green (80+), amber (50-79), red (<50)

### 10. Upcoming Events Widget
- Sidebar widget showing next events with countdown ("in 30m", "in 2h")
- Links to event details on click

## Pricing & Monetization
- **Free**: 20 AI requests/month, basic features, 1 focus block
- **Pro** ($7/mo): 500 AI requests, schedule optimizer, energy scheduling, unlimited focus blocks, daily briefing
- **Team** ($12/user/mo): 2000 AI requests, team calendars, shared focus blocks, social scheduling, API access
- Usage tracked per-user with monthly reset
- Upgrade/downgrade/cancel from Settings page

## Database Schema (Supabase PostgreSQL)
- **profiles**: user settings, timezone, plan, ai_credits_used, energy_profile
- **events**: calendar events with recurrence_rule (JSONB), color, source, ai_metadata
- **tasks**: title, due_date, due_time, priority, status, color
- **habits**: name, frequency, target_days, streak_current, streak_best, color
- **habit_completions**: per-day completion records (UNIQUE per habit+date)
- **ai_usage_log**: tracking every AI call with tokens used
- **focus_blocks**: scheduled focus time periods
- All tables have RLS policies: users can only access their own data

## Authentication
- Supabase Auth: email/password, Google, Apple sign-in
- Middleware protects all /calendar, /today, /habits, /settings routes
- Auto-creates profile on signup (database trigger)
- Auth state persisted across sessions

## Calendar Integrations (Planned)
- Google Calendar: bidirectional sync
- Apple Calendar: iCloud import
- Outlook: Microsoft Graph API
- UI ready in Settings with "Connect" buttons

## Key UX Principles
1. **Google Calendar familiar feel**: Same interaction patterns (DnD, click-to-create, time blocks)
2. **AI-first but not AI-only**: Everything AI does, user can also do manually
3. **Dark-first design**: Premium dark theme with gold accents, glassmorphism
4. **Responsive feedback**: Loading states, optimistic updates, animations on every interaction
5. **Voice-ready**: Mic button for hands-free event creation
6. **Multi-language**: Serbian and English natively in AI and UI

## File Structure
```
smart-ai-calendar/
├── app/                    # Next.js pages
│   ├── (auth)/             # Login, Register
│   ├── (dashboard)/        # Calendar, Today, Habits, Settings
│   └── layout.tsx          # Root with providers
├── src/
│   ├── actions/            # Server Actions (events, tasks, habits, ai, auth, subscription)
│   ├── components/
│   │   ├── calendar/       # CalendarGrid, WeekView, DayView, EventCard, EventModal, etc.
│   │   ├── ai/             # AIInputBar, AskAIDialog, DailyBriefing, OptimizePanel
│   │   ├── tasks/          # TaskPanel
│   │   ├── habits/         # (inline in page)
│   │   └── layout/         # Sidebar, Header, Logo
│   ├── lib/                # Supabase clients, AI prompts/schemas, calendar utils, voice
│   ├── stores/             # Zustand (calendarStore, uiStore)
│   ├── hooks/              # useEvents, useVoice
│   ├── types/              # event, task, habit, ai
│   └── constants/          # colors
├── supabase/migrations/    # SQL migrations (005 total)
├── mobile/                 # Expo React Native app (independent)
├── middleware.ts            # Auth guard
└── APP_SPEC.md             # This file
```

## Personal Time Manager Features

### 11. Replan My Day
- One button on Today page: "Replan my day"
- AI looks at remaining events + tasks, skips past ones, and suggests reorganization
- Shows moves (reschedule), adds (suggest breaks/activities), removes (cancel unnecessary)
- Costs 1 AI credit
- Available on all plans (uses from credit pool)

### 12. Smart Nudges (Free - No AI)
- Proactive, non-invasive suggestions generated locally (zero AI cost)
- Types:
  - **Empty day**: "Your day is wide open. Want to plan something?"
  - **Missed events**: "2 events already passed. Need to reschedule?"
  - **Free gap**: "You have 3h free before your next event. Want to fill it?"
  - **Overloaded**: "Busy day with 8 events. Consider moving some to tomorrow."
  - **No break**: "No lunch break scheduled. Take care of yourself!"
- Max 2 nudges shown at a time (not overwhelming)
- Each nudge has dismiss (X) and action button
- Color-coded by type (blue=gap, amber=missed, red=overloaded, orange=nobreak)

### 13. Tasks in Calendar (Google Calendar Style)
- Tasks with due_time appear in DayView timeline at their exact time position
- Tasks without time appear in collapsible "Tasks" section at top of DayView
- Tasks visible in MonthView grid alongside events (with checkbox)
- Inline checkbox - mark done directly from calendar without opening modal
- Dashed left border distinguishes tasks from events visually

### 14. Recurring Event Indicators
- RotateCcw icon on all events with recurrence_rule
- Human-readable labels: "Every day", "Every Mon, Wed", "Every month"
- Shown on all event sizes (compact = icon only, large = icon + label)

### 15. "Hey Kron" Voice Assistant (Chrome only)
- Always-listening mode activated from header toggle button
- Two-phase recognition: Phase 1 (wake word) → Phase 2 (command)
- Wake word detection: fuzzy matching "hey kron" + 50+ variations (he cron, hey crown, hey chrome, etc.)
- Sound feedback: activation beep when wake word detected, success chime when done
- Auto-timeout: 8 seconds to say command after wake word
- Auto-creates events without manual confirmation
- Persisted on/off state in localStorage

### 16. Text-to-Speech (AI Voice)
- Kron speaks AI responses aloud using browser SpeechSynthesis API
- Activated automatically in Hey Kron mode
- Prefers Google English voice, falls back to system default

### 17. UI Sound Effects
- Activation beep (rising double tone) — wake word detected, mode toggled
- Processing beep (single low tone) — AI thinking
- Success chime (ascending 3-tone) — event created, task completed
- Error buzz (low square wave) — something failed
- Click tick (short high tone) — button interactions
- All generated via Web Audio API (no audio files needed)

### 18. Social Scheduling (Multiplayer Calendar)
- **Friend system**: Add friends by email, accept/decline requests
- **Event invites**: Invite friend to event → they see it in sidebar
- **Negotiation flow**: Invitee can Accept / Suggest another time / Decline
- **Counter-proposals**: Suggest new time + message → organizer gets notified
- **Conflict detection**: Auto-checks invitee's calendar for conflicts
- **Mutual free time**: AI finds slots when both users are free
- **Dual event creation**: On accept, event created in BOTH calendars
- **Notification system**: Bell icon with unread count, real-time polling

### 19. Google Calendar Sync
- OAuth 2.0 flow: Connect → Google login → tokens stored in DB
- Import events from Google Calendar (next 2 months)
- Skip already-imported events (by external_id)
- Auto token refresh on expiry
- Disconnect: removes tokens + all google-sourced events
- Sync now button in Settings

## Pricing
| Plan | Price | AI Requests | Features |
|------|-------|-------------|----------|
| Free | $0 | 20/mo | Calendar, tasks, habits, nudges, voice |
| Pro | $9/mo | 300/mo | All features: Replan, Optimize, Briefing, GCal, Energy |
| Ultra | $19/mo | 3000/mo | Everything in Pro + Priority support + API |

## What Makes Kron Best-in-Class
1. **Personal time manager** — not just a calendar, an AI that actively manages your time
2. **"Hey Kron" voice assistant** — hands-free scheduling, like Siri for your calendar
3. **Social scheduling** — invite friends, negotiate times, find mutual availability
4. **Replan my day** — plans change? One button reorganizes everything
5. **Smart nudges** — proactive suggestions without using AI credits
6. **AI chat with context** — full conversation that knows your schedule
7. **Schedule generation** — describe your ideal day, AI fills the calendar
8. **Tasks in calendar** — Google Calendar style with inline checkboxes
9. **Energy-aware** — shows when you're at peak focus vs low energy
10. **Habits with streaks** — Duolingo-style engagement
11. **Schedule scoring** — gamifies time management
12. **TTS + sound effects** — Kron speaks back, UI has satisfying audio feedback
13. **Google Calendar sync** — import existing events, bidirectional
14. **Premium gold branding** — distinctive visual identity
15. **Cross-platform** — web + mobile sharing same backend

## Roadmap
- [ ] Google Calendar OAuth sync
- [ ] Apple Calendar sync
- [ ] AI that learns user's energy patterns from behavior
- [ ] Autonomous AI agent that books/reschedules meetings via email
- [ ] Team features (shared calendars, availability)
- [ ] iOS/Android widgets
- [ ] Browser notifications
- [ ] Dark/light theme toggle
- [ ] Drag to resize events (bottom edge)
- [ ] Focus time auto-blocking
- [ ] Meeting prep AI (auto-generates agendas from context)
