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
- Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS v4, shadcn/ui
- Supabase (PostgreSQL + Auth + Realtime + RLS + Storage)
- **Hybrid AI**: Claude Haiku 4.5 (complex) + GPT-4o mini (simple) with auto-routing
- OpenAI Whisper for voice transcription (STT)
- Anthropic prompt caching (90% cost savings on repeated prompts)
- In-memory query cache (5min TTL) for read-only questions
- Framer Motion for animations
- Zustand (UI state) + TanStack Query (server state)
- date-fns for date manipulation
- Lemon Squeezy for payment processing (Merchant of Record — handles VAT/tax)

## Tech Stack (Mobile)
- Expo SDK 54, React Native 0.81, TypeScript, Expo Router
- Supabase with `expo-secure-store` for session persistence
- Custom `KronLogo` SVG component (`react-native-svg`) — matches web branding
- Ionicons (`@expo/vector-icons`) for UI icons — no emojis
- `expo-notifications` for push notifications + reminders
- `expo-av` for audio recording (voice input)
- `expo-speech` for TTS (AI voice responses)
- `expo-haptics` for tactile feedback
- `expo-web-browser` for OAuth flows (Google) + Lemon Squeezy Checkout
- `expo-calendar` for native EventKit / Android Calendar Provider access
- `react-native-gesture-handler` + `react-native-reanimated` for swipe gestures
- `@react-native-community/datetimepicker` for date/time selection
- DiceBear API for avatar generation (96 illustrated options)
- Hybrid AI proxied through web `/api/ai/*` endpoints
- Deep linking via `kron://` scheme

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
- **Free**: 50 AI requests/month, basic features, voice input, friends & invites
- **Pro** ($9.99/mo): 1,000 AI requests, Replan my day, Schedule optimizer, Daily briefing, Google Calendar sync, Booking links, Extra credits purchase
- **Ultra** ($19.99/mo): 5,000 AI requests, everything in Pro, priority support, API access
- **On-demand Credit Packs** (all plans):
  - 150 credits — $2.99
  - 500 credits — $5.99 (Best Value)
  - 1,500 credits — $14.99
  - Credits never expire, no subscription required
- Bonus credits deducted when plan monthly limit is reached
- Usage tracked per-user with monthly reset
- Upgrade/downgrade/cancel from Settings page
- Lemon Squeezy hosted checkout for real payments (with dev-mode simulated success when no API key)

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

## Calendar Integrations
- **Google Calendar**: bidirectional sync via OAuth 2.0 (web + mobile)
- **Apple Calendar / any CalDAV source**: ICS URL subscriptions (web) — paste a public `webcal://` or `https://` link and Kron fetches + upserts every 6h
- **Native device calendar** (mobile): `expo-calendar` → iOS EventKit + Android Calendar Provider; reads all connected accounts (iCloud, Google, Outlook) and mirrors into Kron with `source: "device"`
- **Outlook**: supported via ICS subscription (MS publishes ICS URL per calendar)
- All external events tagged with `subscription_id` + `external_uid` for idempotent resync and sweep-deletion

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
├── app/                        # Next.js pages
│   ├── (auth)/                 # Login, Register (premium design with feature showcases)
│   ├── (dashboard)/            # All authenticated pages
│   │   ├── calendar/           # Month/week/day calendar views
│   │   ├── today/              # Daily overview: briefing, nudges, replan
│   │   ├── habits/             # Habit tracking with 7-day heatmap + streaks
│   │   ├── tools/              # AI Tools hub: Focus, Report, Templates, Heatmap, Energy
│   │   ├── friends/            # Friend list: avatars, birthdays, search, add by email
│   │   ├── profile/            # Full profile: 11 sections, avatar picker, city, motto
│   │   ├── settings/           # Plans, integrations, credits, sound toggle
│   │   └── layout.tsx          # Dashboard shell: sidebar (desktop) + drawer (mobile)
│   ├── api/ai/chat/            # REST API for mobile AI calls
│   ├── api/google/             # Google OAuth callback + sync
│   └── layout.tsx              # Root: fonts, providers, viewport
├── src/
│   ├── actions/                # 10 server action modules
│   │   ├── ai.ts               # chatWithAI, replan, optimize, briefing, report, focus, templates, heatmap, meetingPrep, executeActions
│   │   ├── events.ts           # CRUD with meeting_url
│   │   ├── tasks.ts            # Task CRUD
│   │   ├── habits.ts           # Habit CRUD + completions
│   │   ├── profile.ts          # getUserProfile, saveUserProfile, uploadAvatar
│   │   ├── credits.ts          # purchaseCredits, getBonusCredits, getPurchaseHistory
│   │   ├── social.ts           # Friends, invites, notifications, mutual free time (timezone-aware)
│   │   ├── subscription.ts     # changePlan, cancelSubscription
│   │   ├── auth.ts             # login, register, logout, getUser
│   │   └── google-calendar.ts  # OAuth, sync, disconnect, generateMeetLink
│   ├── components/             # 32 components
│   │   ├── ai/                 # AIInputBar, AskAIDialog, CreditPurchase, DailyBriefing, FocusMode, HeyKronIndicator, NudgeBanner, OptimizePanel, ReplanButton, SmartTemplates, WeeklyReport
│   │   ├── calendar/           # CalendarGrid, CalendarHeatmap, DayView, EnergyIndicator, EventCard, EventModal, MiniCalendar, ScheduleScore, UpcomingEvents, WeekView
│   │   ├── tasks/              # TaskPanel (modal creation), TaskCardInline
│   │   ├── social/             # InvitePanel (timezone-aware), NotificationBell
│   │   ├── profile/            # ProfilePanel (sidebar widget)
│   │   └── layout/             # Header, LandingPage, Logo, MobileDrawer, Sidebar
│   ├── lib/                    # Supabase (server+client), AI prompts/schemas, calendar utils, voice, sounds, google-calendar
│   ├── stores/                 # Zustand: calendarStore, uiStore (with mobile drawer state)
│   ├── hooks/                  # useEvents, useVoice, useHeyKron
│   ├── types/                  # event (meeting_url), task, habit, ai (AIAction)
│   ├── constants/              # colors, credits
│   └── __tests__/              # 10 test suites, 175 tests
├── supabase/migrations/        # 14 SQL migrations (001-014)
├── mobile/                     # Expo React Native app
│   ├── app/(auth)/             # Login, Register (premium dark theme)
│   ├── app/(tabs)/             # 10 screens: calendar, today, ai, habits, tasks, profile, friends, tools, more, settings
│   ├── src/constants/          # colors (matching web theme)
│   ├── src/stores/             # authStore (Zustand)
│   └── src/lib/                # supabase, notifications (push), voice (TTS)
├── middleware.ts                # Auth guard for all dashboard routes
├── vitest.config.ts             # Test configuration
└── APP_SPEC.md
```

## Pages & Navigation
**Web sidebar:** Calendar → Today → Habits → AI Tools → Friends → Settings
**Web additional:** /profile (from sidebar widget)
**Mobile tabs (5 visible):** Calendar → Today → Kron AI → Habits → More
**Mobile hidden (5 via navigation):** Tasks, Profile, Friends, Tools, Settings

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

### 20. Voice Assistant (Always-On Mode)
- No wake word needed — when enabled, Kron listens continuously
- Toggle "Voice on/off" button in header (Chrome only)
- Flow: User speaks → Kron processes → Kron speaks response → listens again
- Recognition paused while Kron speaks (prevents self-hearing)
- Prefers premium TTS voices: Google UK English Female, Samantha (macOS), Daniel (macOS)
- Always speaks English for consistent quality (Serbian TTS is poor in browsers)
- Floating panel appears during interaction showing: sound waves, transcript, chat history
- Green status = ready, Red = hearing speech, Gold = speaking, Spinner = thinking
- Sound effects on all actions: send, success, complete, delete, toggle, notify
- Sound effects toggle in Settings (Preferences section)

### 21. AI Actions with Confirmation
- AI can delete, move, and update existing events (not just create)
- Uses real event IDs from user's calendar for precise targeting
- Actions shown as amber confirmation cards in chat with Confirm/Cancel buttons
- Supports bulk operations: "delete all for today" → shows all affected events
- Nothing executes until user explicitly confirms
- `executeAIActions()` server action processes confirmed actions

### 22. User Profile & Goals (/profile page)
Full profile page with 11 sections, split into "Profile Info" and "AI Personalization":

**Profile Info (visible to friends):**
- Avatar: DiceBear illustrated avatars (8 styles × 12 seeds) + custom upload via Supabase Storage
- Display name, birthday (date picker), city (searchable dropdown with 70+ cities)
- Personal motto

**AI Personalization:**
- Kron's personality: 4 motivation styles (Friendly, Strict Coach, Professional, Hype Man) — changes AI tone
- About you: occupation + bio textarea
- Goals: 12 preset chips + custom (Stay fit, Learn skills, Read more...)
- Life priorities: what matters most, AI protects time for these
- Daily habits: habits AI builds into routine
- Hobbies & interests: AI suggests time for these
- Constraints & rules: hard rules AI must respect ("No meetings before 10")
- Schedule & rhythm: work days, wake/lunch/sleep times, peak focus preference
- Your ideal day: free text template for AI scheduling

**Sidebar widget**: Compact ProfilePanel showing avatar + name + city + goals count, links to /profile

### 23. Friends Page (/friends)
- Full friend list with DiceBear avatars, display name, occupation, city, birthday
- **Upcoming birthdays** banner: detects birthdays within 7 days, pink highlight
- Add friend by email with instant feedback
- Pending requests with Accept/Decline
- Search/filter friends by name, city, occupation
- Sidebar navigation: Friends link between Habits and Settings

### 24. Smart Meet Integration
- `meeting_url` field on events table
- **Event modal**: paste any meeting link (Zoom, Teams, etc.) + "Meet" button to auto-generate Google Meet link (if Google connected)
- **Meet link generation**: creates temporary Google Calendar event to get Meet URL, then deletes the GCal event
- **Join buttons**: visible on EventCard (DayView/WeekView), UpcomingEvents sidebar widget
- Short events show Video icon indicator, long events show "Join" button
- AI suggests meet links when creating meeting-type events

### 25. On-Demand AI Credits
- When monthly plan limit is reached, users can buy extra credits instead of hitting a wall
- **3 packages**: 50 credits ($1.99), 150 credits ($4.99, "Best Value"), 500 credits ($11.99)
- Bonus credits never expire, don't reset monthly
- `checkAndTrackUsage()` automatically falls back to bonus credits when plan limit hit
- **Chat UX**: credit packages appear inline when limit reached, purchase is instant
- **Settings**: "Extra AI Credits" section shows balance + purchase options
- `credit_purchases` table tracks purchase history with RLS

### 26. Voice-First Accessibility (Hey Kron)
- `voiceMode` flag on `chatWithAI()` changes AI behavior for spoken interaction
- Voice mode responses: short (2-3 sentences), spoken-friendly, no formatting
- Screen reader commands: "What's next?", "Read my day", "How many events?", "Am I free at 3?"
- AI addresses user by name, references motto for motivation
- Serbian speech recognition (`sr-RS`) as primary language
- Voice preference persisted in database (`voice_enabled` column), auto-activates on login
- Blind users can use Kron fully without seeing the screen

## Database Schema Additions
```
profiles (additions):
  display_name, avatar_url, avatar_preset, date_of_birth, city
  motivation_style ('strict'|'friendly'|'professional'|'hype'), motto
  occupation, bio, goals (JSONB), daily_habits (JSONB), hobbies (JSONB)
  priorities (JSONB), constraints (JSONB), ideal_day (TEXT)
  work_schedule (JSONB), preferences (JSONB), onboarding_completed
  bonus_credits (INTEGER), voice_enabled (BOOLEAN)
  push_token (TEXT) -- for Expo push notifications

events (additions):
  meeting_url (TEXT)

credit_purchases:
  id, user_id, credits, price_cents, package_id, created_at

share_links:
  slug (unique), title, description, duration_minutes, days_ahead
  earliest_hour, latest_hour, include_weekends, timezone, enabled

share_link_bookings:
  share_link_id, host_user_id, event_id, guest_name, guest_email
  start_time, end_time, notes, status

calendar_subscriptions:
  label, ics_url, color, provider ('apple'|'outlook'|'ics')
  last_synced_at, last_sync_error, event_count, enabled

events (additions):
  subscription_id (FK), external_uid (for ICS deduplication)

Migrations: 001-016 (16 migrations total)
```

## API Endpoints (Next.js /api routes)
All AI endpoints are auth-gated + rate-limited (30/min for AI, 10/min for billing, 20/min for transcription).
```
/api/ai/chat              POST  - Hybrid AI chat (GPT-4o mini / Claude)
/api/ai/briefing          POST  - Daily briefing generation
/api/ai/replan            POST  - Replan my day
/api/ai/weekly-report     POST  - Weekly AI report
/api/ai/transcribe        POST  - Whisper STT (audio → text, 25MB cap)
/api/ai/learn-energy      POST  - Recompute user's energy profile from behavior

/api/google/auth-url      GET   - Google OAuth URL for mobile
/api/google/callback      GET   - OAuth callback handler
/api/google/sync          POST  - Sync Google Calendar events

/api/credits/checkout     POST  - Lemon Squeezy checkout for credit packs
/api/subscription/checkout POST - Lemon Squeezy checkout for Pro/Ultra
/api/lemonsqueezy/webhook POST  - Signed webhook (HMAC-SHA256 verified)

/api/share/[slug]/book    POST  - Public booking endpoint (rate-limited per IP)

/icon, /apple-icon        GET   - Dynamic PNG brand icons (Edge runtime)
/icon-192.png, /icon-512.png, /icon-maskable-512.png   GET - PWA icons
/opengraph-image          GET   - Dynamic OG image (1200×630)
```

## Environment Variables
```
# --- Required (web) ---
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
ANTHROPIC_API_KEY

# --- Required in prod ---
NEXT_PUBLIC_APP_URL           # Base URL for OAuth + LS redirects + emails
SUPABASE_SERVICE_ROLE_KEY     # Webhook + share page bypass RLS (never expose)

# --- Optional (features unlock when set) ---
OPENAI_API_KEY                # GPT-4o mini hybrid + Whisper STT
GOOGLE_CLIENT_ID              # Google Calendar integration
GOOGLE_CLIENT_SECRET

# Lemon Squeezy (payments)
LEMONSQUEEZY_API_KEY
LEMONSQUEEZY_STORE_ID
LEMONSQUEEZY_WEBHOOK_SECRET
LS_VARIANT_PACK_100           # Variant IDs for each product
LS_VARIANT_PACK_300
LS_VARIANT_PACK_1000
LS_VARIANT_PLAN_PRO
LS_VARIANT_PLAN_ULTRA

# Email (Resend)
RESEND_API_KEY                # Without: emails logged to console
EMAIL_FROM                    # e.g. "Kron <hello@kron.app>"

# --- Mobile (mobile/.env.local) ---
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_API_URL           # URL of deployed web for AI calls
```

## Pricing
| Plan | Price | AI Requests | Features |
|------|-------|-------------|----------|
| Free | $0 | 50/mo | Calendar, tasks, habits, nudges, voice, friends |
| Pro | $9.99/mo | 1,000/mo | All features: Replan, Optimize, Briefing, GCal, Energy, Booking links |
| Ultra | $19.99/mo | 5,000/mo | Everything in Pro + Priority support + API |
| Credits | $2.99–$14.99 | 150–1,500 | On-demand, never expire, any plan |

## Cost Optimization (AI Hybrid System)
- **Simple queries** (event creation, questions, quick actions) → GPT-4o mini ($0.15/M input)
- **Complex queries** (scheduling, replan, weekly report) → Claude Haiku 4.5 ($1/M input)
- **Auto-routing** via `classifyComplexity()` in `src/lib/ai/providers.ts`
- **Anthropic prompt caching** — 90% cost savings on repeat system prompts
- **Query cache** (5min TTL) for read-only questions like "what's today", "am i free"
- **Graceful fallback** to Claude when OpenAI key is missing
- Result: ~89% profit margin at 1000 users mix

### 27. Weekly AI Report
- AI generates summary of past 7 days: total events, total hours, busiest/emptiest day
- Insights: patterns detected (too many meetings, no exercise, etc.)
- Suggestions: what to improve next week
- Accessible from Today page — "Generate report" button
- Uses 1 AI credit

### 28. Calendar Heatmap
- GitHub-style contributions grid in sidebar
- Shows event density per day for the current month
- 5 intensity levels: empty, light, medium, busy, packed
- Month navigation with prev/next arrows
- Hover shows count + hours for each day
- Legend: Less → More
- Today highlighted with ring

### 29. Focus Mode
- One-click deep work session creation
- 4 durations: Pomodoro (25m), Short (45m), Deep Work (90m), Marathon (2h)
- Creates a purple "Focus Block" event on calendar instantly
- Sound feedback on start
- Available on Today page

### 30. AI Meeting Prep
- Before a meeting, generates a briefing from event context
- Looks at previous meetings with similar title for continuity
- Returns: briefing summary, suggested agenda items, talking points
- Accessible from event details
- Uses 1 AI credit

### 31. Smart Templates
- One-click schedule templates for next week
- 5 templates: Productive Week, Study Week, Balanced Life, Sprint Week, Vacation Mode
- AI generates events personalized to user's profile and constraints
- Events added to calendar starting next Monday
- Available on Today page

### 32. Timezone-Aware Social Scheduling
- Event invites show organizer's and invitee's timezones
- When timezones differ, displays warning with city name
- All invite times stored as ISO with timezone info

### 33. Push Notifications (Mobile)
- Expo Push Notifications integration
- Permission request on first login
- Push token stored in profiles table for server-side push
- Event reminders scheduled locally (15 min before)
- Android notification channel with Kron branding
- Notification handler: shows alert, plays sound, sets badge

### 34. Mobile Voice (TTS)
- Voice mode toggle in AI chat (🔊/🔇)
- AI responses spoken aloud via expo-speech
- Natural English TTS with tuned rate/pitch
- Works alongside text display — voice is additive, not replacement

### 35. Responsive Web Design
- Mobile drawer navigation (slide-in from left)
- Hamburger menu in header on small screens
- View switcher hidden on mobile (defaults to day view)
- All pages with responsive padding (p-4 sm:p-6)
- WeekView uses container width, not hardcoded sidebar

### 36. Comprehensive Test Suite
- 175 automated tests across 10 test suites
- Coverage: credits, AI types, stores, responsive design, landing page, social scheduling, edge cases, mobile app, integration
- Static analysis: null safety, error handling, security, data integrity
- All tests pass on every build

### 37. Mobile App (Expo SDK 54) — Production Ready
Feature parity with web:
- **Kron logo**: SVG crown with golden gradient (identical to web)
- **Ionicons tab bar**: Calendar, Today, Kron AI (highlighted center), Habits, More
- **Premium auth**: login/register with feature pills, free plan includes list
- **Google Calendar-style UI**: MonthPicker (horizontal chips), CalendarDrawer (side menu), FAB +, view switcher
- **Calendar Views**:
  - Schedule (list grouped by day)
  - Day (24h timeline with drag-and-drop)
  - 3-Day / Week / Month (event blocks in grid)
- **Event CRUD**: Full modal with date/time pickers, recurrence, meeting URL, color picker
- **Event Quick Actions**: Long-press to reveal Edit/Move/Duplicate/Delete bottom sheet
- **Drag-and-drop**: Long-press + drag on Day view (15-min snap, haptic feedback)
- **Today dashboard**: Stats cards, schedule score, daily briefing, nudges, replan button, upcoming events, invites
- **AI Chat**: Full parity with web including voice mode, event cards, action cards, Hey Kron button
- **Habits**: 7-day heatmap, streaks, optimistic toggle
- **Tasks**: CRUD with priorities, colors, optimistic updates
- **Profile**: 11 sections — avatar picker (96 DiceBear avatars), motivation style, goals, habits, hobbies, priorities, constraints, ideal day, birthday, city
- **Friends**: Search by name/city/occupation, upcoming birthdays widget, add by email
- **Tools**: Focus Mode, Smart Templates, Weekly Report, Calendar Heatmap, Energy Indicator
- **Settings**: Usage bar, credit purchase modal, preferences (sound/voice), Google integration, plans, sign out
- **Social Invites**: Accept/Decline/Counter with timezone warnings
- **Notifications Bell**: In-app modal with read/unread, auto-polling
- **Push Notifications**: `expo-notifications` with tap routing to correct screen
- **Deep Linking**: `kron://event/X`, `kron://friend/X`, `kron://today`, etc.
- **Haptic Feedback**: Light/medium/heavy impacts, success/warning/error on all key actions

### 38. Hey Kron Voice (Full Voice Assistant)
- **Web**: Web Speech API (free, native browser STT) for Chrome/Edge
- **Mobile**: `expo-av` audio recording → Whisper API (`/api/ai/transcribe`) → text
- **TTS on both platforms**: Web SpeechSynthesis / `expo-speech` for AI voice responses
- **Voice mode toggle** persisted in `profiles.voice_enabled`
- **Graceful fallback** when no OpenAI key — shows friendly alert, text input still works
- **Push-to-talk** mic button in chat (replaces send button when input is empty)
- **Pulse animation** during recording, haptic on start/stop

### 39. Optimistic UI Updates
- Tasks: toggle done/delete — instant UI change, revert on error
- Habits: today completion toggle — instant, revert on error
- Event move (drag-and-drop): instant position change, revert on error
- `useOptimisticState` hook for reusable optimistic pattern

### 40. Deep Linking & Push Handlers
- `kron://` scheme configured on iOS and Android
- `handleDeepLink()` routes URLs to appropriate screens
- `setupNotificationHandlers()` — tap notification routes based on type:
  - event_reminder → /today
  - friend_request / invite_accepted → /friends
  - event_invite / counter_proposal → /today

### 41. Public Booking Links (Calendly in a box)
- Users create `/share/<slug>` pages from Settings
- Config: title, description, duration (15-240 min), days ahead (1-60), earliest/latest hour, include weekends, timezone
- Public page computes free slots by cross-referencing events + existing bookings
- Guest books with name/email/notes — no signup needed
- Conflict detection at booking time (prevents double-bookings when slot was just taken)
- Automatic confirmation emails to guest + host (via Resend)
- Event auto-created on host's calendar with source `share_link`

### 42. Light Theme (Full)
- `.light` class with amber-based palette matching brand
- Theme-aware `color-mix` utilities (glass, shimmer) — no hardcoded white overlays
- Persistent preference via localStorage (web) / SecureStore (mobile)
- Bootstrap script in `<head>` prevents flash on first paint (web)
- System / Dark / Light toggle in Settings (web) and Settings (mobile)
- Mobile: `colors` palette is live-mutated + components re-render via `subscribeTheme`

### 43. Service Worker (Background Notifications)
- `public/sw.js` registered by NotificationManager when enabled
- Page posts `schedule-reminder` messages; SW runs `setTimeout` and fires notification
- Survives backgrounded tabs (in-page `setTimeout` would be throttled)
- `notificationclick` focuses existing tab or opens `/calendar`
- Falls back to in-page setTimeout when SW unavailable

### 44. Mobile Offline Mode
- `offlineCache.ts` — TTL-backed SecureStore cache with stale-while-revalidate
- `useNetworkStatus` — periodic HEAD ping to Supabase with 5s timeout
- `OfflineBanner` — absolute-positioned yellow banner over safe area
- Every read screen paints cached data first, then refreshes when online
- React Query `networkMode: "offlineFirst"` with exponential retry

### 45. Mobile Swipe Gestures
- `SwipeableRow` — pan gesture + reanimated spring + haptics
- Right swipe (green) — complete / mark done / undo
- Left swipe (red) — delete / archive
- 80px threshold for fire, 140px max travel, 1 haptic per direction
- Wired into tasks, habits, UpcomingEvents widget

### 46. Apple / Device Calendar Native Sync (Mobile)
- `expo-calendar` with calendar permission flow
- Reads from iOS EventKit (iCloud, Apple Cal, any CalDAV account user has added)
- Reads from Android Calendar Provider (Google, Samsung, any configured account)
- Upserts into Kron `events` with `source: "device"`, tagged by `external_uid`
- Configurable window (default 30 days back, 90 days ahead)
- Disconnect button removes all device-sourced events

### 47. ICS Calendar Subscriptions (Web)
- `src/lib/ics.ts` — minimal RFC 5545 parser: VEVENT blocks, line unfolding, TZID/Z/DATE handling, webcal:// normalization
- `calendar_subscriptions` table with per-row sync state + error tracking
- Events upserted by `(subscription_id, external_uid)` unique index
- Stale event sweep on every resync (events removed upstream also removed in Kron)
- Limited to ±30d past + 1yr future to keep events table tidy

### 48. AI Energy Profile Learning
- `learnEnergyProfile()` reads 60 days of events + task completions
- Heuristic: completed events +1/hour, cancelled events -1, tasks-done +1.5
- Needs 20+ signals to emit (sparse users keep default profile)
- Picks top 3 waking hours → `peak_hours`, bottom 3 → `low_hours`
- Computes morning/evening mass → chronotype label (morning/evening/balanced)
- Stored in `profiles.energy_profile` JSONB with `learned_at` timestamp
- User triggers from Settings with instant feedback card

### 49. Rate Limiting
- `src/lib/rate-limit.ts` — sliding-window in-memory limiter
- Presets: AI (30/min), auth (5/min), billing (10/min), general (120/min), webhook (300/min)
- Applied on every AI endpoint + billing + share booking
- Returns 429 with `Retry-After` header; sets `X-RateLimit-*` on success
- Opportunistic GC sweeps expired buckets every 60s

### 50. Security Hardening
- Middleware sets HSTS (2yr preload), X-Frame-Options DENY, X-Content-Type-Options, Permissions-Policy (camera=(), mic=(self), geo=()), Referrer-Policy strict-origin
- Public path allowlist (login/register/forgot/reset/legal/api/share)
- Supabase session refresh in middleware on every request
- Webhook HMAC-SHA256 verification with timing-safe equal for Lemon Squeezy
- Service-role key only referenced in webhook handler and share page (never client)

### 51. Legal & Compliance
- `/legal/terms` — full Terms of Service with Lemon Squeezy MoR disclosure
- `/legal/privacy` — Privacy Policy listing subprocessors (Supabase, OpenAI, Anthropic, LS, Google, Vercel)
- Cookie banner (`src/components/CookieBanner.tsx`) — essential-only vs accept-all, stored preference
- Footer links on landing page

### 52. Emails (Resend)
- `src/lib/email.ts` with branded HTML shell (dark background, amber accent, Kron header)
- Templates: welcome (on signup), bookingGuest (to guest), bookingHost (to host)
- Fire-and-forget (never blocks signup/booking on email failure)
- Dev mode: logs subject + recipient to console when no `RESEND_API_KEY`

## What Makes Kron Best-in-Class
1. **Personal AI time manager** — not just a calendar, your AI assistant for time
2. **Hybrid AI** — GPT-4o mini + Claude auto-routing for optimal cost/quality
3. **Prompt caching** — 90% Claude input cost savings via Anthropic cache
4. **Query caching** — read-only questions answered from cache (5min TTL)
5. **AI actions with confirmation** — delete, move, edit events via chat
6. **Deep personalization** — 11 profile sections, motivation style, ideal day
7. **Voice-first accessibility** — Web Speech (browser) + Whisper STT (mobile)
8. **Focus Mode** — one-click deep work blocks
9. **Weekly AI Report** — insights on how you spent your time
10. **Smart Templates** — one-click schedule for your whole week
11. **AI Meeting Prep** — auto-generated briefings before meetings
12. **Calendar Heatmap** — GitHub-style activity visualization
13. **Social scheduling** — friends, invites, timezone-aware, birthday tracking
14. **Smart Meet links** — one-click Google Meet + any video link
15. **On-demand credits** — pay-as-you-go, never hit a wall (Stripe checkout)
16. **Replan my day** — one button reorganizes everything
17. **Smart nudges** — proactive suggestions, zero AI cost
18. **AI chat with context** — knows your schedule, goals, and personality
19. **DiceBear avatars** — 96 illustrated options + custom upload
20. **Task modal** — proper full-screen task creation
21. **Energy tracking** — peak focus vs low energy awareness
22. **Habits with streaks** — Duolingo-style engagement with optimistic UI
23. **Schedule scoring** — gamified time management
24. **TTS + sound effects** — Kron speaks back, satisfying audio feedback
25. **Haptic feedback** — tactile response on all key mobile actions
26. **Google Calendar sync** — import existing events, OAuth flow on web + mobile
27. **Premium gold branding** — distinctive visual identity, SVG logo on both platforms
28. **Cross-platform** — web + mobile sharing same backend
29. **Google Calendar-style mobile UI** — MonthPicker, CalendarDrawer, FAB, 3 views
30. **Drag-and-drop events** — long-press + drag on mobile Day view with haptic snap
31. **Event Quick Actions** — bottom sheet on long-press (Edit/Move/Duplicate/Delete)
32. **Deep linking** — `kron://` scheme routes to any screen
33. **Push notifications** — with tap-to-route handler on mobile
34. **Optimistic UI** — instant feedback, auto-revert on error
35. **Production test suite** — 175 automated tests across 10 suites

## Roadmap

### Completed
- [x] AI Actions — delete, move, edit events with confirmation
- [x] User Profile & Goals — 11 sections of personalization
- [x] Friends page with avatars, birthdays, search
- [x] Smart Meet integration — generate + join video calls
- [x] On-demand AI credits — pay-as-you-go with new packages (100/300/1000)
- [x] Voice-first accessibility — Web Speech API (browser) + Whisper (mobile)
- [x] Weekly AI Report — 7-day summary with insights
- [x] Calendar Heatmap — GitHub-style activity grid
- [x] Focus Mode — one-click deep work sessions
- [x] AI Meeting Prep — auto briefings before meetings
- [x] Smart Templates — one-click weekly schedules
- [x] Timezone-aware social scheduling
- [x] Push notifications (mobile) — with tap-to-route handler
- [x] Mobile TTS voice mode
- [x] Responsive web design
- [x] 175 automated tests
- [x] **Hybrid AI system** — GPT-4o mini + Claude auto-routing
- [x] **Anthropic prompt caching** — 90% input cost savings
- [x] **Query cache** for read-only questions (5min TTL)
- [x] **Increased plan limits** — Free 30, Pro 500, Ultra 5000
- [x] **Stripe payment integration** — with dev-mode fallback
- [x] **Whisper STT** — voice transcription for mobile
- [x] **Deep linking** — `kron://` scheme with route handler
- [x] **Optimistic UI updates** — tasks, habits, events
- [x] **Event Quick Actions** — long-press bottom sheet (Edit/Move/Duplicate/Delete)
- [x] **Drag-and-drop events** on mobile Day view (long-press + drag, 15-min snap)
- [x] **Google Calendar-style mobile UI** — MonthPicker, CalendarDrawer, FAB, Schedule/Day/Month views
- [x] **Mobile Kron branding** — SVG logo, Ionicons (no emojis)
- [x] **Haptic feedback** — all key actions on mobile
- [x] **Mobile event CRUD modal** — full create/edit/delete
- [x] **Mobile notification bell** — in-app modal with read/unread

### Completed — Production hardening (v1.0)
- [x] **Lemon Squeezy payments** — credits (3 packs) + subscriptions (Pro/Ultra), HMAC-SHA256 webhook
- [x] **Apple / ICS calendar sync** — subscription URLs (web) + native EventKit (mobile via expo-calendar)
- [x] **Public booking links** — Calendly-style share page with conflict detection + double-book prevention
- [x] **Password reset flow** — forgot + reset pages via `supabase.auth`
- [x] **Onboarding tutorial** — 6-step tour for new users (first 10 min after signup)
- [x] **Legal pages** — Terms, Privacy, GDPR-compliant cookie banner
- [x] **SEO + OG** — dynamic favicon, apple-icon, 192/512/maskable PNG routes, OG image, Twitter cards, metadata
- [x] **Rate limiting** — sliding-window in-memory limiter, preset buckets for AI/billing/auth/webhook
- [x] **Security headers** — HSTS, X-Frame-Options, Permissions-Policy, Referrer-Policy via middleware
- [x] **Browser notifications** — service worker reschedules timers when tab backgrounded; NotificationManager syncs next 12h of events
- [x] **Light theme** — full `.light` class with amber palette + `color-mix` theme-aware utilities; persistent ThemeToggle
- [x] **Email notifications** — Resend integration with welcome + booking host/guest templates
- [x] **Mobile offline mode** — SecureStore-backed SWR cache on today/calendar/tasks/habits, offline banner
- [x] **Mobile swipe gestures** — tasks (complete/delete), habits (done/archive), events (delete)
- [x] **Mobile Week + 3-Day hourly views** — horizontal grid with auto-scroll to 7am
- [x] **Mobile light theme** — theme-aware palette, persistent toggle, reactive StatusBar/background
- [x] **Mobile local notifications** — `expo-notifications` auto-scheduled for next 24h of events
- [x] **Mobile brand icons** — generated from SVG via sharp (`scripts/generate-icons.mjs`), Kron crown + amber
- [x] **Error boundaries** — `app/error.tsx` + `app/not-found.tsx`
- [x] **AI energy profile learning** — recomputes peak/low hours from 60-day event + task completion signal
- [x] **Comprehensive test suite** — 175+ automated tests + manual checklist

### Planned
- [ ] Autonomous AI agent (books meetings via email)
- [ ] Team plan (shared calendars, availability)
- [ ] iOS/Android home-screen widgets (native)
- [ ] AI daily check-in (morning routine prompt)
- [ ] Recurring events full RRULE support
- [ ] Multi-timezone event support per user
- [ ] VAPID web push (server-sent notifications when browser closed)
