# Krowna — Product Requirements Document

**Version:** 1.0 (MVP launch)
**Last updated:** 2026-04-17
**Owner:** Djordje Subotic
**Status:** Pre-launch — deployed to production, awaiting paid users

---

## 1. Executive Summary

Krowna is an AI-native calendar that plans your day, protects your focus, and adapts when plans change. Users type or speak what they need, and Krowna schedules it, defends it, and reorganizes when life happens. Subscription SaaS at $9.99 / $19.99/mo, targeting individuals and small teams who feel their calendar is a source of anxiety rather than control.

**One-line pitch:** *"The calendar that rules your time, so you don't have to."*

**What makes it different:** voice-first scheduling ("Hey Krowna"), hybrid AI routing (GPT-4o mini + Claude Haiku 4.5 for 6× cost savings), and a personality layer — Krowna learns your goals, habits, energy patterns, and rules, then applies them automatically.

---

## 2. Problem Statement

Most people live in two separate tools: a calendar (Google/Apple/Outlook) that only remembers what they type in, and their actual intent (in notes, in their head, on paper). The gap between the two causes:

- **Calendar rot** — events get created but rarely rescheduled when plans slip, leaving stale calendars that nobody trusts
- **Planning friction** — creating a realistic day takes 15–30 min of manual drag-and-drop
- **Context loss** — you plan in the morning, but at 2 PM you can't remember why "Deep Work" was scheduled then
- **No accountability** — streaks, habits, and long-term goals live in separate apps and die the first time life intervenes
- **Voice + hands-free gaps** — existing calendar apps barely work while driving, cooking, or when hands are full

Competitors (Motion $29/mo, Reclaim $8–18/mo, Sunsama $20–25/mo, Akiflow $15–25/mo) solve *parts* of this but are:
- Too expensive for individuals (Motion)
- Optimized for background automation, not conversation (Reclaim)
- Premium lifestyle branding but weak voice/AI (Sunsama)
- Keyboard-power-user focused, poor mobile (Akiflow)

**Krowna's wedge:** *voice-first, cheaper than Motion, more conversational than Reclaim, better mobile than all of them.*

---

## 3. Target Users

### Primary persona: "Maja — the over-scheduled creator"
- Age 25–40, freelancer / indie hacker / content creator / small business owner
- Self-directed work, no boss to tell her what to do
- Uses 5+ tools (calendar, notes, tasks, habit trackers, planners) — hates the fragmentation
- Pays for Notion, Superhuman, sometimes ChatGPT Plus
- Pain: "I know what I want to do today, but turning it into a schedule takes forever"
- Willing to pay $10/mo for something that does it for her

### Secondary persona: "Luka — the ADHD professional"
- Age 22–35, tech/creative role
- Time blindness, procrastinates planning, hyperfocuses on wrong things
- Has tried Todoist, Sunsama, paper planners — drops each after 2–4 weeks
- Pain: "I can't hold the plan in my head, and when plans slip, I can't reorganize fast enough"
- Needs low-friction voice + AI that adapts without blame

### Tertiary persona: "The founder"
- Age 28–45, running a 1–5 person company
- Meetings dominate the day, deep work squeezed in cracks
- Pain: "Protecting focus time is impossible when everyone's calendars are negotiated ad-hoc"
- Uses Krowna share links to consolidate meeting booking

### Non-target
- Enterprise teams (<5 users OK; 50+ need different product)
- Existing Google Calendar power users who don't want AI
- Pure task managers (we're calendar-first, not Todoist competitor)

---

## 4. Goals & Success Metrics

### North Star Metric
**Weekly Active Paid Users (WAPU)** — subscribers who opened Krowna at least once in the last 7 days.
- Month 3 target: 50
- Month 6 target: 300
- Month 12 target: 1,500

### Secondary KPIs
| Metric | Definition | Month 6 target |
|--------|-----------|----------------|
| Free → Paid conversion | Signups that upgrade within 30 days | 3–5% |
| Monthly Churn (paid) | % of paid users who cancel / month | <6% |
| Activation rate | New signups who create ≥1 event in first 48h | 70% |
| AI usage / active user / day | Average AI requests per active day | 3–8 |
| MRR | Monthly Recurring Revenue | $1,500 |
| Mobile install rate | % of signups who install the mobile app | 40% |

### Leading indicators (weekly)
- New signups (goal: 50/week by M3)
- Trial-to-paid attempt rate (clicked "Upgrade" in first 30 days)
- D7 retention of new signups

### Non-metrics (deliberately not tracking)
- DAU (daily active users) — calendar apps are weekly/daily mix, WAU + WAPU is truer
- AI credits per user — we want users to use AI freely, not ration it

---

## 5. Scope — MVP

### In scope (shipped, production)
- **Auth:** email/password signup, login, forgot/reset password, onboarding tour
- **Calendar views:** Month / Week / Day / 3-Day (mobile) — drag-to-reschedule, click-to-create
- **Events:** title, times, location, description, color (8), recurrence (daily/weekly/monthly), meeting URL, reminders
- **Tasks:** title, priority, due date/time, status, optimistic UI
- **Habits:** name, frequency, streak tracking, 7-day heatmap
- **AI chat:** `/api/ai/chat` hybrid routing (GPT-4o mini + Claude Haiku), conversational, creates events/tasks, edits/moves/deletes with confirmation
- **Voice:** "Hey Krowna" wake word (web), press-to-record (mobile), Whisper transcription
- **Focus mode:** one-click deep-work block creation (4 presets)
- **Weekly AI report:** patterns, insights, recommendations
- **Smart templates:** one-click week schedules (Productive / Sprint / Balanced / Vacation)
- **Social scheduling:** friend list, event invites, counter-proposals, timezone-aware
- **Booking links:** public Calendly-style share page with double-book prevention + email confirmations
- **Google Calendar sync:** bidirectional OAuth (web + mobile)
- **Apple / ICS calendar sync:** web via public ICS URL, mobile via native EventKit
- **Energy profile learning:** infers peak/low hours from 60-day event + task data
- **Payments:** Lemon Squeezy Pro $9.99/mo, Ultra $19.99/mo with proper cancel flow (access until period end)
- **Light theme:** full dark/light toggle with system-preference auto mode
- **Mobile:** native iOS + Android app (Expo SDK 54) with full feature parity except Week/3-Day grid and voice wake word
- **Offline mode (mobile):** SecureStore SWR cache on today/calendar/tasks/habits
- **Browser notifications:** event reminders via service worker (tab-backgrounded safe)
- **Legal:** Terms, Privacy, cookie banner, SEO + OG metadata

### Deferred (post-launch, Phase 2)
- Credit packs (code shipped, UI commented out for MVP simplicity)
- Google Calendar OAuth production verification (requires Google review)
- Apple Calendar bidirectional sync (currently read-only)
- VAPID web push (server-sent notifications when browser closed)
- iOS/Android home-screen widgets
- Team plan (shared calendars, availability overlap)
- Autonomous AI agent (books meetings via email)
- Multi-timezone event support per user
- RRULE full recurrence support (we only support simple weekly/monthly)

### Out of scope (not planned)
- White-label / enterprise contracts
- Time-tracking and billing (Harvest/Toggl territory)
- Project management (Linear/Asana territory)
- Messaging / chat (Slack territory)
- Video conferencing hosting (we only link to Zoom/Meet/Teams)

---

## 6. Core User Stories

### Signup → First event (under 5 min)
1. Visit krowna.app, click "Get started free"
2. Sign up with email + password
3. Welcome email hits inbox within 30s
4. Redirect to `/calendar`, onboarding tour runs (6 steps, skippable)
5. Press ⌘K, type "Plan my productive week"
6. Krowna returns 5–8 proposed events → user clicks "Add All"
7. Calendar fills with colored blocks; user sees the value

**Success criterion:** 70% of signups create ≥1 event in first 48h.

### Daily use — Plan my day
1. Morning, user opens Krowna (web or mobile)
2. Today page shows: Schedule Score, Daily Briefing, upcoming events, nudges
3. User says "Hey Krowna, what do I have today?" → Krowna reads aloud
4. User adds a task via voice: "Add buy groceries for 6 PM"
5. Plans change: user clicks "Replan my day" → Krowna reorganizes remaining blocks
6. Evening: user reviews day, ticks habits, gets Weekly Report on Sunday

### Cancelling a subscription
1. User opens Settings → Plans → "Cancel subscription"
2. Krowna calls LS API `DELETE /v1/subscriptions/{id}`
3. Status flips to "cancelled" but user keeps Pro/Ultra until end of paid period
4. Toast: "Subscription cancelled. You'll keep access until the end of your billing period."
5. At period end, `subscription_expired` webhook downgrades plan to Free + nulls `ls_subscription_id`

### Booking a meeting (share link)
1. User creates a share link in Settings (30-min slot, 9–17h M–F, 14 days ahead)
2. Shares URL `krowna.app/share/abc123` with client
3. Client (not logged in) sees available slots, picks 14:00, enters name + email
4. System verifies no conflict exists (event or prior booking)
5. Event appears on user's calendar immediately
6. Guest + host both get confirmation emails via Resend
7. Slot disappears for anyone else viewing the link

---

## 7. Functional Requirements

### 7.1 Auth
- Email/password via Supabase Auth
- Session persists across browser/app restarts
- Password reset via Supabase email + custom reset page
- Logout clears React Query cache + localStorage on web, SecureStore on mobile
- Onboarding tour runs once per user (localStorage flag, first 10 min window)

### 7.2 Calendar
- Views: Month, Week, Day (web); + 3-Day, Schedule (mobile)
- Event drag to reschedule with optimistic UI, revert on error
- Click empty slot to open EventModal prefilled for that time
- Recurrence: `{freq, interval, days?}` JSONB; recurring events render on all matching days
- Meeting URL field with auto-detected video service + "Join" button
- Reminder_minutes array (default [15])
- All-day events supported

### 7.3 AI
- Hybrid routing via `classifyComplexity()`: simple → GPT-4o mini, complex → Claude Haiku 4.5
- Anthropic prompt caching: 90% cost reduction on repeated system prompts
- Query cache (5-min TTL) for read-only questions ("what's today", "am I free at 3")
- System prompt explicitly requires non-null titles; 3-layer title validation
- Usage tracked per user, rate-limited to plan tier
- Voice mode: short spoken-friendly responses, no JSON in message, Serbian primary

### 7.4 Payments
- Lemon Squeezy Merchant of Record (handles VAT/tax/compliance)
- Upgrade: direct LS hosted checkout → `subscription_created` webhook stores `ls_subscription_id`
- Downgrade: direct Supabase update (downgrade to Free = no LS call)
- Cancel: LS API DELETE call → access until period end → `subscription_expired` downgrades
- Test card: `4242 4242 4242 4242` in Test Mode
- Webhook signature: HMAC-SHA256 verified with timing-safe equal

### 7.5 Sync
- Google Calendar: OAuth 2.0, access+refresh tokens stored in `profiles`, sync next 2 months, dedup by `external_id`
- ICS subscriptions: fetch every 6h, parse VEVENTs, upsert by `(subscription_id, external_uid)`, sweep deleted
- Native EventKit (mobile): read-only, 30 days back + 90 days forward window

### 7.6 Notifications
- Browser: Notification API + service worker for backgrounded tab, auto-schedule next 12h events
- Mobile: `expo-notifications` local scheduling (24h horizon, max 30 to respect iOS 64-limit)
- Toast (sonner) for all in-app action confirmations

---

## 8. Non-Functional Requirements

### Performance
- Landing page LCP < 2s on 4G (Lighthouse mobile ≥ 85)
- AI response time: simple query < 2s P95, complex query < 5s P95
- Calendar page initial render < 1s with cached data
- Zero layout shift (CLS = 0) on modal open (scrollbar-gutter: stable)

### Security
- Supabase RLS on every table — users can only read/write their own data
- Service-role key only used in 3 places: LS webhook, share booking, share page read
- API rate limiting: 30 AI/min, 10 billing/min, 5 auth/min, 300 webhook/min
- HMAC-SHA256 webhook verification
- HSTS + strict CSP headers via middleware
- `.env*` in `.gitignore`, never logged

### Accessibility
- Focus-visible rings on all interactive elements
- Keyboard navigation everywhere (⌘K, tab, enter, esc)
- Screen reader compatible (voice mode specifically built for blind users with Hey Krowna)
- Color contrast AAA on text, AA on buttons

### Browser & Device Support
- Web: latest 2 versions of Chrome, Safari, Firefox, Edge (desktop + mobile)
- Mobile: iOS 15+, Android 10+
- No IE support

### Scalability (targets for Year 1)
- 10,000 signups in database
- 1,500 concurrent WebSocket connections (Supabase Realtime)
- 500 AI requests/minute across all users
- Vercel auto-scales; Supabase Pro handles up to 50k MAU before we need to upgrade

### Internationalization
- UI: English primary, Serbian secondary (nav, onboarding, auth)
- AI: fluent in English + Serbian, supports code-switching (user writes in Serbian, AI responds in Serbian)
- Voice: Serbian `sr-RS` primary STT; English TTS (Serbian TTS voices are weak in browsers)
- Timezones: user profile stores IANA tz; all dates stored UTC; displayed in user's tz

---

## 9. Monetization

### Pricing tiers (MVP)
| Plan | Price | AI limit | Target user |
|------|-------|----------|-------------|
| Free | $0 | 50 req/mo | Trial / casual users |
| Pro | $9.99/mo | 1,000 req/mo | Power individuals |
| Ultra | $19.99/mo | 5,000 req/mo | Heavy users + future API |

### Unit economics (per user, estimated)
| Line | Pro ($9.99) | Ultra ($19.99) |
|------|-------------|----------------|
| Revenue | $9.99 | $19.99 |
| LS fees (5% + $0.50) | -$1.00 | -$1.50 |
| AI costs (at cap) | -$3.00 | -$15.00 |
| AI costs (realistic 40% usage) | -$1.20 | -$6.00 |
| **Gross margin (realistic)** | **~78%** | **~62%** |

### Revenue projections
Conservative (P50 — most likely):
- M3: $100–300 MRR
- M6: $500–1,500 MRR
- M12: $1,500–5,000 MRR

Optimistic (P10 — if launch hits):
- M6: $3,000 MRR
- M12: $10,000 MRR

### Deferred monetization levers
- **Credit packs** ($2.99 / $5.99 / $14.99 one-time) — UI shipped but hidden; re-enable once we have usage data
- **Team plan** ($49/mo shared calendar pool) — not before M9
- **API access** (included in Ultra, can split out later) — not before M12

---

## 10. Go-to-Market

### Launch sequence
1. **Soft launch** (week 1 post-deploy) — 10–30 friends + Krowna Twitter/X thread
2. **Beta feedback** (week 2) — iterate on first 20 user reports
3. **Product Hunt launch** (week 3–4) — prepared landing, 3 demo videos, early-access waitlist
4. **Content marketing** — ADHD/productivity communities (Reddit, r/getdisciplined, r/ADHD), SEO blog posts ("AI calendar 2026", "Motion vs Reclaim vs Krowna")
5. **Paid acquisition** — not before M3 (we need PMF signal first; see analysis in prior session)

### Distribution channels
| Channel | Weight | Budget | Expected CAC |
|---------|--------|--------|--------------|
| Organic Twitter/X (building in public) | 40% | $0 (time) | $0 |
| Reddit niches (authentic participation) | 20% | $0 | $0 |
| Product Hunt launch | 15% | $0 | $0 |
| Content/SEO blog | 15% | $0 (time) | $20–50 long-term |
| UGC creators (post-M3) | 5% | $200/mo test | $15–40 |
| Apple Search Ads (post-M3) | 5% | $150/mo | $8–20 |

Avoided: paid Meta/Google display, paid TikTok ads (too expensive at indie scale, poor ROAS for SaaS).

### Messaging hierarchy
1. **Primary:** "Rule your time" — voice + AI + calendar unified
2. **Secondary by persona:**
   - Creators: "Stop planning. Start doing."
   - ADHD: "For brains that resist planning."
   - Founders: "Protect your focus. Automate scheduling."

---

## 11. Technical Architecture

### Stack
- **Web:** Next.js 16 App Router (Turbopack), TypeScript, Tailwind 4, shadcn/ui, framer-motion, TanStack Query, Zustand, sonner
- **Mobile:** Expo SDK 54, React Native 0.81, expo-router, react-native-reanimated
- **Backend:** Supabase (Postgres, Auth, Realtime, Storage, RLS)
- **AI:** Anthropic Claude Haiku 4.5 (complex), OpenAI GPT-4o mini (simple), Whisper (voice STT)
- **Payments:** Lemon Squeezy (MoR)
- **Email:** Resend
- **Hosting:** Vercel (web), EAS (mobile binaries)
- **Domain:** krowna.app (primary), potentially krowna.com (alias, not yet owned)

### Key architectural decisions
- **Server Actions** over `/api/*` routes for mutations (except AI endpoints and webhook)
- **React Query** for server state; Zustand only for UI state (calendarStore, uiStore)
- **RLS everywhere** — no custom auth middleware, Supabase does it
- **Service role key** used ONLY in webhook, share booking endpoint, and share page read (documented, never expanded)
- **Hybrid AI routing** for cost optimization — routes via `classifyComplexity()` deterministic heuristic
- **Prompt caching** on Anthropic for 90% reduction on repeated system prompts
- **Mobile → Web API** via Bearer token (mobile has no cookies); dual-auth helper in `/api/ai/transcribe`

### Data model highlights
- `profiles`: user settings, plan, ls_subscription_id, energy_profile, preferences
- `events`: title, times, recurrence_rule (JSONB), color, source (manual/ai/google/device/ics), meeting_url, external_uid
- `tasks`, `habits`, `habit_completions`, `ai_usage_log`, `credit_purchases`, `notifications`
- `share_links`, `share_link_bookings`, `calendar_subscriptions`

### Performance primitives
- Anthropic prompt cache (90% input discount)
- In-memory query cache (5-min TTL for read-only AI questions)
- Next.js dynamic ImageResponse for OG/icons (cached at edge)
- Service worker for push + PWA install
- Mobile SWR cache in SecureStore for offline-first reads

---

## 12. Timeline / Milestones

### Shipped (as of 2026-04-17)
- [x] All MVP functional requirements (see §5 In Scope)
- [x] Production deploy at `https://krowna.app`
- [x] Lemon Squeezy live subscriptions working (Test Mode)
- [x] Resend email working (dev domain `onboarding@resend.dev`)
- [x] 312 automated tests passing, typecheck clean

### Pre-launch checklist (week 1–2)
- [ ] Resend domain verification (`hello@krowna.app`) — reduces spam rate
- [ ] Google OAuth production approval (required for sync beyond 100 test users)
- [ ] Mobile EAS build + iOS App Store submit (1–2 weeks review)
- [ ] Mobile EAS build + Google Play submit (3–7 days review)
- [ ] Soft launch to 10 friends + record feedback
- [ ] Lemon Squeezy live mode (after LS account review + bank connected)

### Launch (week 3)
- [ ] Product Hunt launch with curated demo video
- [ ] Twitter/X launch thread + landing GIFs
- [ ] Reddit posts in r/productivity, r/ADHD, r/getdisciplined

### Post-launch (M1–M3)
- [ ] First 100 paying users
- [ ] Iterate on top 5 feedback themes
- [ ] Decide: re-enable credit packs? (based on % of users who hit AI limit)
- [ ] SEO content (3 blog posts / month)

### M4–M6
- [ ] Team plan pilot (5 beta teams)
- [ ] Mobile home-screen widget
- [ ] Apple Calendar bidirectional sync
- [ ] Consider: Outlook integration

### M7–M12
- [ ] API access (public docs + Ultra tier gate)
- [ ] Autonomous AI agent (reads email, proposes meetings)
- [ ] Hit $5k MRR milestone

---

## 13. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **AI cost blowout** (users find way to run expensive queries cheaply) | Medium | High | Rate limits per plan + per-IP; hard stop at monthly limit; monitor weekly cost dashboards |
| **Market too crowded** (Motion/Reclaim dominate) | High | Medium | Focus on voice-first + mobile-native + ex-YU market first (less crowded) |
| **LS account suspension** (payments platform risk) | Low | Critical | Keep Stripe account warm as backup; export customer data regularly |
| **Google OAuth approval denial** | Medium | Medium | Can ship without it — ICS subscription path works; reapply after demo video |
| **Supabase outage** | Low | High | Status page monitored; graceful degradation via cached data; no sensitive ops during peaks |
| **Whisper / Anthropic outage** | Low | Medium | Fallback chain: Claude → OpenAI → cached response → "AI unavailable, try again" |
| **Mobile App Store rejection** | Medium | Medium | Follow Apple guidelines strictly; test on TestFlight first; prepare backup flow via PWA if rejected |
| **Domain / brand trademark challenge** | Low | Critical | Trademark check done pre-launch; secondary names considered |
| **Low organic growth** (no PMF) | High | Critical | Validate with 30+ beta users before heavy marketing spend; if <3% trial→paid after 1,000 signups, pivot messaging/targeting |
| **Regulatory (GDPR / payment)** | Low | Medium | LS handles VAT/tax; Privacy Policy explicit about subprocessors; DPO email in privacy page |
| **Key person risk (solo founder)** | High | N/A | Document everything (APP_SPEC, PRD, MANUAL_TESTS); keep deploy boring/automated |

---

## 14. Open Questions

1. **Ex-YU market first or global from day 1?**
   Local = cheaper CAC, lower ARPU (Balkan purchasing power). Global = higher ARPU, harder SEO/distribution.
   *Leaning: global-first with English UI, but Serbian AI + tagline as differentiator for ex-YU.*

2. **Re-enable credit packs pre-launch or wait for data?**
   Pros of re-enabling: users who hit limit don't churn. Cons: clutters pricing page, may cannibalize Ultra upgrades.
   *Decision: wait until M2 usage data shows >10% hitting limit, then re-enable.*

3. **Voice wake word on mobile?**
   Currently mobile uses press-to-record (tap mic button). Web has always-listening "Hey Krowna". Mobile wake word needs always-on background audio = battery + iOS privacy review risk.
   *Decision: keep press-to-record for MVP; revisit if users ask.*

4. **Apple Watch support?**
   Niche but viral demo. Expo has limited watchOS support. Native Swift app would be ~4 weeks of work.
   *Decision: post-M6 if user demand signals it.*

5. **Serbian-first or English-first landing page?**
   Current: English. Our differentiator in ex-YU market is Serbian AI, but landing in Serbian limits TAM.
   *Decision: keep landing English; add `/sr` locale in M2 if ex-YU traffic justifies it.*

6. **B2B / Team plan timing?**
   First 3 signups are likely solo, but if a founder brings 2 teammates, we lose that revenue to Free tier.
   *Decision: wait for 3+ unsolicited team requests before building; don't speculate-build.*

---

## 15. Glossary

- **WAPU** — Weekly Active Paid Users (our North Star metric)
- **LS** — Lemon Squeezy (payment processor)
- **MoR** — Merchant of Record (LS acts as MoR, handles VAT/tax/compliance on our behalf)
- **RLS** — Row-Level Security (Postgres / Supabase feature)
- **PMF** — Product-Market Fit
- **CAC** — Customer Acquisition Cost
- **LTV** — Lifetime Value
- **MRR / ARR** — Monthly / Annual Recurring Revenue
- **SWR** — Stale-While-Revalidate (mobile cache pattern)
- **HMAC** — Hash-based Message Authentication Code (webhook signing)
- **EventKit** — iOS native calendar API
- **ICS** — iCalendar file format (RFC 5545)

---

## Appendices

- **APP_SPEC.md** — feature-level implementation reference (what exists in the codebase)
- **MANUAL_TESTS.md** — pre-deploy QA checklist (16 sections, ~120 items)
- **`.env.local.example`** — all 13 required env vars with comments

**Ownership:** Djordje Subotic (founder, full-stack, PM)
**Review cadence:** PRD reviewed monthly; major changes trigger a new version
