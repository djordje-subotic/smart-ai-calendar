# Krowna — Launch Plan

Living document. We work through this top-to-bottom. Each phase has a clear "done when" gate.

**Mark progress:** ⏳ Pending | 🔄 In progress | ✅ Done

---

## Phase 1 — Push current commit (5 min) 🔄

**Why:** Vercel auto-deploys from main. Hey Krowna wake word fixes are committed locally as `dfad02e` but the push from this AI session is blocked by a git keychain mismatch.

**Steps:**
1. Open Terminal locally
2. `cd ~/Desktop/repo/djordje/smart-ai-calendar`
3. `git push` — your terminal has correct `djordje-subotic` credentials
4. Wait ~3 min for Vercel to redeploy
5. Verify https://krowna.app loads with new wake word UI

**Done when:** Vercel deployment status = "Ready" and the AI tab on web shows new "Voice on" pill.

---

## Phase 2 — Resend domain verification (30 min + 1h DNS) ⏳

**Why:** Currently sending from `onboarding@resend.dev` which Gmail flags as spam. Welcome email is the first touchpoint — must not go to spam.

**Steps:**

### 2.1 Add domain to Resend (5 min)
1. https://resend.com/domains → "Add Domain"
2. Domain: `krowna.app`
3. Region: us-east-1 (closest to Vercel)
4. Click Add

### 2.2 Add DNS records to Cloudflare (10 min)
Resend will show 3-4 records (TXT for SPF, DKIM, DMARC):
1. https://dash.cloudflare.com → krowna.app → DNS
2. For each record from Resend: Add record → match Type, Name, Content exactly
3. Set proxy = OFF (orange cloud → grey)
4. Save

### 2.3 Wait for verification (15-60 min)
Resend dashboard shows "Pending" → "Verified" once DNS propagates.

### 2.4 Update env (5 min)
On Vercel → Project → Settings → Environment Variables:
- Edit `EMAIL_FROM` from `Krowna <onboarding@resend.dev>` → `Krowna <hello@krowna.app>`
- Save → triggers redeploy

**Done when:** Test signup with real email arrives in Primary inbox (not Spam) from `hello@krowna.app`.

---

## Phase 3 — Analytics setup (PostHog, 30 min) ⏳

**Why:** Can't optimize what you don't measure. Need funnel: signup → activation (1st event) → upgrade → cancel.

**Steps:**

### 3.1 Create PostHog account (5 min)
1. https://posthog.com → sign up (free tier: 1M events/mo)
2. Create project "Krowna"
3. Copy `NEXT_PUBLIC_POSTHOG_KEY` + `NEXT_PUBLIC_POSTHOG_HOST`

### 3.2 Install + integrate (15 min)
- `npm install posthog-js`
- Add `<PostHogProvider>` to `app/layout.tsx`
- Track key events: `signup`, `event_created`, `ai_chat_used`, `voice_activated`, `upgrade_started`, `upgrade_completed`, `cancel`

### 3.3 Verify in Vercel preview (5 min)
- Open krowna.app in incognito → sign up
- PostHog dashboard → Events → see your test events live

**Done when:** Funnel chart in PostHog shows signup → first event creation rate.

---

## Phase 4 — Sentry error monitoring (20 min) ⏳

**Why:** Currently errors only show in Vercel logs which you'll never check. Sentry alerts you when users hit errors.

**Steps:**
1. https://sentry.io → New Project → Next.js
2. `npx @sentry/wizard@latest -i nextjs` (auto-configures)
3. Add `SENTRY_AUTH_TOKEN` to Vercel env
4. Test: trigger error → check Sentry dashboard
5. Free tier: 5K errors/mo + email alerts

**Done when:** Sentry catches a deliberate test error from production.

---

## Phase 5 — Support email + legal review (15 min) ⏳

### 5.1 Setup support@krowna.app
**Option A — Cloudflare Email Routing (free):**
1. Cloudflare → krowna.app → Email → Email Routing
2. Add catch-all or specific addresses: `support@`, `hello@`, `privacy@`
3. Forward all to `subotic.djo@gmail.com` (or new dedicated inbox)

**Option B — Resend custom domain inbox**
Pre prijema treba poseban inbox provider; Cloudflare je jednostavnije.

### 5.2 Sanity-check legal pages
- Open `/legal/terms` and `/legal/privacy` on krowna.app
- Verify all email links point to `support@krowna.app` or `privacy@krowna.app`
- Verify subprocessors list matches reality (Supabase, OpenAI, Anthropic, LS, Resend, Vercel)

**Done when:** Sending email to `support@krowna.app` lands in your inbox.

---

## Phase 6 — Lemon Squeezy Live Mode (15 min posla + 1-3 dana review) ⏳

**Why:** Currently Test Mode. Real users can't actually pay until LS approves your account.

**Steps:**
1. https://app.lemonsqueezy.com → click your store name → "Activate Store"
2. Verify identity (passport / ID upload)
3. Add bank account (IBAN for Serbia)
4. Add tax info (VAT not required for individual under threshold)
5. Submit for review

**While waiting:**
- Test Mode keeps working for development
- All your products + webhook stay configured

**Done when:** LS sends "Store activated" email + dashboard shows "Live" toggle available. Flip toggle → all real payments now work.

---

## Phase 7 — Soft test with 3 friends (2-3 days) ⏳

**Why:** You'll find 5-10 bugs in real-world flow that you can't catch yourself. Cheaper to fix before public launch.

**Steps:**

### 7.1 Recruit testers (1 day)
- 3 friends who fit the persona (creator/founder/ADHD)
- Send them: "I'm launching Krowna in 2 weeks, can you spend 30 min trying it and telling me what breaks?"
- Free Pro for 3 months as thanks

### 7.2 Setup test feedback channel
- Discord channel OR Telegram group OR shared Notion doc
- Tell them: paste screenshots, paste error messages, "this confused me"
- Daily check-in for 3 days

### 7.3 Iterate (2 days)
- Fix critical (broken flows) immediately
- Log nice-to-haves for V2
- One bugfix commit per round

**Done when:** All 3 testers complete: signup → create event with AI → upgrade to Pro Test card → cancel.

---

## Phase 8 — Mobile EAS build (4-6 hours posla + 1-2 nedelje review) ⏳

**Why:** 50% ciljne publike koristi telefon. iOS App Store + Google Play.

**Steps:**

### 8.1 Apple Developer + EAS setup (2h)
- Apple Developer account: $99/year — https://developer.apple.com/programs/
- `npm install -g eas-cli`
- `cd mobile && eas login`
- `eas build:configure`
- Bundle ID: `com.krowna.app` (verify in app.json)

### 8.2 First TestFlight build (1h posla + 30min build queue)
- Set `EXPO_PUBLIC_API_URL=https://krowna.app` in `mobile/.env.local`
- `eas build --profile production --platform ios`
- Wait for build (~20-40 min)
- Submit to App Store Connect: `eas submit --platform ios`
- Add yourself as TestFlight tester
- Install via TestFlight app → smoke test full flow

### 8.3 App Store metadata + assets (2h)
- Screenshots (5-8 per device size — iPhone 6.7" + 6.1" + iPad if applicable)
- App description (paste from PRD section 2)
- Keywords: "ai calendar, productivity, focus, scheduling, time management"
- Privacy Policy URL: `https://krowna.app/legal/privacy`
- Support URL: `https://krowna.app` or `mailto:support@krowna.app`

### 8.4 Submit for App Store review (5 min)
- Click "Submit for Review"
- Wait 1-7 days (Apple median ~24h in 2026)

### 8.5 Google Play (parallel, 3-7 days review)
- $25 one-time fee
- `eas build --profile production --platform android`
- `eas submit --platform android`

**Done when:** App appears as "Approved" in App Store Connect and you can install from public App Store.

---

## Phase 9 — Marketing prep (3-4h) ⏳

### 9.1 Demo video (1-2 min, 2h)
- Screencast: signup → "Plan my productive week" voice command → AI fills calendar → upgrade flow
- Tools: QuickTime / Loom / Screen Studio
- Background music optional
- Captions essential (silent autoplay)

### 9.2 Landing page polish (30 min)
- Open `/` and read every word as if you're a stranger
- Update hero stats if needed
- Verify all CTAs work
- Verify footer links

### 9.3 Twitter/X launch post draft (30 min)
- Hook: "I built an AI calendar that actually plans your week"
- 3 GIFs: voice command, replan, calendar view
- CTA: "Try free at krowna.app"

### 9.4 Product Hunt page setup (1h, schedule for week 3)
- Create maker profile if you don't have one
- Tagline: "AI calendar that rules your time"
- Description: paste short version from PRD
- Gallery: demo video + 4-5 screenshots
- Schedule launch: Tuesday-Thursday, 12:01 AM PT (LA time)

**Done when:** Demo video uploaded, Twitter post drafted, PH page in "Scheduled" state.

---

## Phase 10 — Public launch day ⏳

### Morning (your timezone):
- Tweet launch thread (5 tweets max)
- Post in r/productivity (if PMF), r/ADHD (organic, not promo), Indie Hackers
- Email tester friends: "Today's the day, please share if you liked it"

### Throughout the day:
- Reply to every comment within 1h
- Monitor Sentry + PostHog
- Hot-fix any critical bugs immediately

### End of day:
- Tally signups + paid conversions
- Lessons learned doc

**Done when:** Day 1 launch retrospective written.

---

## Phase 11 — Week 1 post-launch ⏳

- Daily check: signups, errors, NPS comments
- Weekly bug fix release
- Reach out to first 10 paying customers personally
- Decide: re-enable credit packs based on usage data?

**Decision gate at end of week 1:**
- < 100 signups → marketing problem, not product
- < 3% trial→paid → pricing or messaging issue
- > 5% trial→paid → pour gas (PH launch, paid UGC test)

---

## Realan timeline

| Week | Focus |
|------|-------|
| **Week 0 (sada)** | Phases 1-5: push, email, analytics, support |
| **Week 1** | Phase 6 (LS approval) + Phase 7 (soft test) |
| **Week 2** | Phase 8 (mobile build) + Phase 9 (marketing) |
| **Week 3** | Phase 10 (public launch) |
| **Week 4+** | Phase 11 (iterate) |

**Brutalno realno:** ako ti je puno radi sam → smanjuj scope. Web-only launch (preskačemo mobile) skraćuje sve za 2 nedelje. Mobile dodaješ posle PMF signala.

---

## Naredni korak

🟢 **Phase 1: push commit** — uradi to sad u svom terminal-u, javi mi kad je gotovo.
