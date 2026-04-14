# Kron — Manual QA Test Plan

Run through this checklist before every production deploy. Any red mark = do not ship.

**Test accounts needed:**
- Fresh email (no prior account) for signup flow
- Existing verified account for login/reset flow
- Google account for OAuth / calendar sync
- Lemon Squeezy sandbox account for payment flows

---

## 0. Pre-flight

- [ ] `npm run ci` passes (typecheck + all unit tests)
- [ ] `npm run build` succeeds with no errors
- [ ] All `TODO=` in `.env.local` filled in for the environment being tested
- [ ] Supabase migrations 001-016 applied
- [ ] Lemon Squeezy webhook pointed at `/api/lemonsqueezy/webhook` with signing secret set

---

## 1. Auth flows

### Sign up
- [ ] `/register` loads without errors
- [ ] Submitting valid email + password creates account
- [ ] Welcome email arrives within 30s (check inbox + spam)
- [ ] Redirects to `/calendar` on success
- [ ] Onboarding tour starts on first calendar load
- [ ] Each onboarding step advances; "Skip" dismisses immediately
- [ ] Onboarding does NOT reappear on refresh (localStorage flag set)

### Login
- [ ] Wrong password shows error without leaking whether email exists
- [ ] Successful login redirects to `/calendar`
- [ ] Session persists across browser refresh
- [ ] "Forgot password?" link visible on login page

### Forgot / reset password
- [ ] Submit email → success message "Check your inbox"
- [ ] Email arrives with reset link
- [ ] Reset link opens `/reset-password`
- [ ] New password < 6 chars rejected
- [ ] Mismatched confirm password rejected
- [ ] Successful reset redirects to `/calendar` after 2s delay

### Sign out
- [ ] Settings → Sign out → returns to `/login`
- [ ] Session cleared (back button doesn't reveal dashboard)

---

## 2. Calendar views

### Month view
- [ ] Current day highlighted with gold dot
- [ ] Up to 3 events shown per cell, "+N more" on overflow
- [ ] Click empty cell opens event modal prefilled for that day
- [ ] Click event opens edit modal
- [ ] Click "+N more" opens Day view for that day

### Week view
- [ ] 7 columns, Mon-Sun (configurable per locale)
- [ ] Events visually sized by duration
- [ ] Overlapping events split side-by-side
- [ ] Drag event to new time → moves (optimistic, snaps to 15 min)
- [ ] Drag across days → moves to that day
- [ ] "Now" line visible on today's column at current time
- [ ] Recurring events show circular arrow icon

### Day view
- [ ] Current time line updates every minute
- [ ] Tasks with due_time appear at their position
- [ ] Tasks without time in collapsible top section
- [ ] Meeting URL events show "Join" button
- [ ] Long-press to resize event duration

### Event CRUD
- [ ] Create: title + times required, color picker works
- [ ] Create recurring: daily/weekly/monthly persists
- [ ] Edit: changes save, UI updates optimistically
- [ ] Delete: confirmation prompt, event disappears
- [ ] Meeting URL field: paste Zoom link → Join button appears

---

## 3. AI

### Chat
- [ ] Press ⌘K (or sidebar sparkle) opens AI dialog
- [ ] "Stavi mi trening u 7 ujutro" → creates event on today
- [ ] Multi-event request: "Plan my productive week" → returns multiple events
- [ ] "Add All" batch-adds events
- [ ] Each event card has individual "Add" button
- [ ] Credit usage increments in usage bar after each request
- [ ] When hitting monthly limit, credit packs modal appears inline

### Voice (Chrome/Edge only)
- [ ] Mic button records when empty input
- [ ] Transcribed text fills input
- [ ] "Hey Kron" mode toggle persists across refresh
- [ ] Wake word triggers listening, activation beep plays
- [ ] After command, success chime plays, event created

### AI actions (delete/move/edit)
- [ ] "Delete all events for today" shows confirmation card
- [ ] Confirm button executes, events disappear
- [ ] Cancel button dismisses, no changes made

### Replan my day
- [ ] Today page shows "Replan" button
- [ ] Click → AI returns moves/adds/removes list
- [ ] Accept → calendar updates
- [ ] Uses 1 credit

### Smart templates / Focus mode / Weekly report / Meeting prep
- [ ] Each AI Tool loads and produces output
- [ ] Focus Block appears on calendar after Focus Mode
- [ ] Weekly report renders with stats + insights

---

## 4. Tasks / Habits

### Tasks
- [ ] Create task: title, priority, due date/time
- [ ] Check box → strikes through, removes from list on refresh
- [ ] Task with due_time appears on calendar at correct position

### Habits
- [ ] Create habit with name + color
- [ ] Today check box marks complete, flame icon ticks up
- [ ] 7-day heatmap fills in for completed days
- [ ] Streak persists across day rollover

---

## 5. Social

### Friends
- [ ] Search friend by email → request sent
- [ ] Other account accepts → both lists update
- [ ] Upcoming birthdays banner shows within 7 days

### Event invites
- [ ] Invite friend to event → they see it in their sidebar
- [ ] Friend can Accept / Counter / Decline
- [ ] Counter-proposal sends new time + message
- [ ] Accepted invite creates event on both calendars
- [ ] Timezone warning visible when zones differ

### Notifications bell
- [ ] Bell shows unread count
- [ ] Click → modal lists notifications
- [ ] Click notification → routes to relevant page

---

## 6. Payments (Lemon Squeezy)

### Credits
- [ ] Settings → "Extra AI Credits" shows balance
- [ ] Click a pack → redirects to Lemon Squeezy hosted checkout
- [ ] Complete sandbox payment → redirects back to `/settings?purchase=success`
- [ ] Webhook fires, bonus_credits increments in DB within 10s
- [ ] Balance updates in UI after refresh

### Subscriptions
- [ ] Free plan → click "Upgrade to Pro" → LS checkout
- [ ] After payment, plan updates to "pro" in DB + UI
- [ ] Ultra upgrade works the same way
- [ ] Cancel subscription: plan keeps working until period end

### Webhook signature verification
- [ ] Send a malformed `X-Signature` header to webhook → 401
- [ ] Send valid signature → 200, event processed
- [ ] Check Supabase `ai_usage_log` or equivalent for trace

---

## 7. Google Calendar sync

- [ ] Settings → Connect Google → OAuth flow opens
- [ ] After consent, events imported (count shown)
- [ ] Google events visible on calendar with Google color
- [ ] Create event in Google Calendar → next sync imports it
- [ ] Disconnect: all Google-sourced events removed

---

## 8. Apple / ICS calendar sync

### Web (ICS subscription)
- [ ] Settings → External calendars → Add
- [ ] Paste `webcal://` URL from iCloud public calendar → connects
- [ ] Events appear with "Synced N events ago" status
- [ ] Resync button refreshes count
- [ ] Delete: events removed, subscription gone

### Mobile (EventKit)
- [ ] Settings → Apple Calendar → Sync
- [ ] iOS permission dialog appears
- [ ] Grant → "N events synced" shown
- [ ] Events visible on calendar with gray source color
- [ ] Disconnect: all device events removed

---

## 9. Booking links (public share pages)

- [ ] Settings → Booking links → New link
- [ ] URL copies to clipboard on click
- [ ] Open link in incognito (no auth) → sees public booking page
- [ ] Available slots show (30-min granularity)
- [ ] Book a slot as guest with name + email
- [ ] Guest confirmation email arrives
- [ ] Host notification email arrives
- [ ] Event appears on host's calendar immediately
- [ ] Re-visit the same slot in incognito → slot is gone (no double-book)
- [ ] Disable link → public URL shows "Link not found"

---

## 10. Notifications

### Web (browser)
- [ ] Settings → Notifications → Enable
- [ ] Permission prompt appears, grant
- [ ] Test notification fires
- [ ] Create event 2 min in future with 1-min reminder
- [ ] Background the tab
- [ ] Notification fires at correct time (service worker keeps it alive)
- [ ] Click notification → tab focuses + navigates to calendar

### Mobile (local)
- [ ] Expo dev client or real device build
- [ ] Settings → grant notifications permission
- [ ] Create event 2 min in future
- [ ] Kill the app
- [ ] Notification still fires at correct time (expo-notifications scheduled)
- [ ] Tap notification → opens app on today screen

---

## 11. Theme / UI

### Light theme
- [ ] Settings → Appearance → Light → whole UI swaps
- [ ] No dark residue (no hard-coded white overlays)
- [ ] Text remains readable on all pages
- [ ] OS set to light → Auto mode matches
- [ ] Refresh page → no flash of wrong theme (bootstrap script works)

### Mobile light theme
- [ ] Toggle Dark theme switch → UI swaps
- [ ] Status bar color inverts correctly
- [ ] Persists across app restart

### Responsive web
- [ ] iPhone viewport (375px) — hamburger menu, drawer opens
- [ ] Tablet (768px) — sidebar visible, week view fits
- [ ] Desktop (1440px) — full layout

---

## 12. Mobile specifics

### Offline mode
- [ ] Airplane mode → yellow "offline — showing cached" banner appears
- [ ] Previously loaded Today / Calendar / Tasks / Habits still render
- [ ] New mutations queue or show friendly error

### Swipe gestures
- [ ] Tasks: swipe right → Done; swipe left → Delete; haptic tick at threshold
- [ ] Habits: swipe right → Done/Undo; swipe left → Archive
- [ ] Events (UpcomingEvents): swipe left → Delete

### Week / 3-Day hourly views
- [ ] Calendar drawer → select Week → 7-column hourly grid
- [ ] Auto-scrolls to ~7am on mount
- [ ] 3-Day view shows rolling 3-day window

### Icons + splash
- [ ] App icon on home screen shows Kron crown
- [ ] Splash screen on cold boot shows branded dark background + crown
- [ ] Notification icon on Android is the monochrome Kron silhouette

---

## 13. Legal / compliance

- [ ] `/legal/terms` loads
- [ ] `/legal/privacy` loads
- [ ] Footer links work from landing
- [ ] Cookie banner appears on first visit
- [ ] "Essential only" and "Accept all" both dismiss permanently
- [ ] Banner does NOT appear on second visit

---

## 14. Security

- [ ] `/calendar` while logged out → redirects to `/login`
- [ ] Direct API call to `/api/ai/chat` with no session → 401
- [ ] Spam 40 AI requests in 1 min → 31st gets 429 with Retry-After header
- [ ] Response headers include HSTS, X-Frame-Options DENY, Permissions-Policy
- [ ] Check that `SUPABASE_SERVICE_ROLE_KEY` is never in client bundle (Network tab → view source of any JS file)

---

## 15. SEO / metadata

- [ ] View source of `/` → contains OpenGraph + Twitter meta tags
- [ ] `/opengraph-image` renders a 1200×630 branded image
- [ ] `/icon` returns a 32×32 PNG with Kron branding
- [ ] `/apple-icon` returns 180×180 PNG
- [ ] `/icon-192.png`, `/icon-512.png`, `/icon-maskable-512.png` all return valid images
- [ ] `<link rel="manifest">` points to `/manifest.json` which loads

---

## 16. Error handling

- [ ] Visit `/this-does-not-exist` → 404 page with "Go to calendar" CTA
- [ ] Force an error in a component (throw inside a server action) → `app/error.tsx` shows Reset + home link
- [ ] All error digest IDs displayed on error page

---

## Regression sweep (every deploy)

If any of these break, do not ship:

- [ ] Create a regular event → save → appears on calendar
- [ ] Delete an event → confirms → gone
- [ ] AI chat creates an event
- [ ] Sign out, sign back in, everything restores
- [ ] Mobile: cold boot → login → see today's events
- [ ] Payment: test card → subscription upgrades

---

## Post-deploy smoke (production)

After every Vercel deploy + mobile build promotion:

- [ ] `curl https://kron.app/api/ai/chat` returns 401 (auth guard live)
- [ ] Lemon Squeezy webhook URL reachable, returns 401 on unsigned request
- [ ] Vercel logs show no middleware errors for first 15 min
- [ ] Landing page loads under 2s (Lighthouse mobile score ≥ 85)
- [ ] Signup + first AI chat works for a brand-new account
