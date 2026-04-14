"use client";

import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles, CalendarDays, Target, Zap, RefreshCw, Lightbulb, BarChart3,
  Mic, Crown, ArrowRight, Check, Users, Video, Brain, ShieldAlert,
  Palette, MessageCircle, Globe, Smartphone, Clock,
} from "lucide-react";

const features = [
  { icon: Sparkles, title: "AI Chat Assistant", desc: "Tell Kron what you need in plain language. It creates events, tasks, and full schedules." },
  { icon: Brain, title: "Focus Mode", desc: "One-click deep work sessions. 25min to 2h blocks. Calendar auto-blocks your time." },
  { icon: Mic, title: "\"Hey Kron\" Voice", desc: "Hands-free scheduling. Full screen reader for blind users. Just speak." },
  { icon: RefreshCw, title: "Replan My Day", desc: "Plans changed? One tap and AI reorganizes your remaining schedule." },
  { icon: Users, title: "Social Scheduling", desc: "Add friends, invite to events, negotiate times. Timezone-aware." },
  { icon: Video, title: "Smart Meet Links", desc: "One click generates Google Meet links. Paste any Zoom or Teams link." },
  { icon: BarChart3, title: "Weekly AI Report", desc: "Get insights on how you spent your week. Patterns, suggestions, stats." },
  { icon: Target, title: "Smart Templates", desc: "One-click schedule templates: Productive Week, Sprint Mode, Vacation, and more." },
  { icon: MessageCircle, title: "AI Personality", desc: "Choose Kron's style: friendly, strict coach, professional, or hype man." },
  { icon: Zap, title: "Calendar Heatmap", desc: "GitHub-style activity grid. See your busiest and emptiest days at a glance." },
  { icon: Lightbulb, title: "AI Meeting Prep", desc: "Auto-generated briefings before meetings. Agenda, talking points, context." },
  { icon: ShieldAlert, title: "Your Rules, AI Follows", desc: "Set constraints AI must respect. Goals, priorities, ideal day — all personalized." },
];

const plans = [
  { name: "Free", price: "$0", period: "forever", features: ["50 AI requests/mo", "Calendar + Tasks + Habits", "Smart nudges", "Voice input", "Friends & invites"], cta: "Start free" },
  { name: "Pro", price: "$9.99", period: "/month", features: ["1,000 AI requests/mo", "All features unlocked", "Replan my day", "Schedule optimizer", "Daily AI briefing", "Google Calendar sync", "Booking links", "Buy extra credits"], cta: "Start free trial", popular: true },
  { name: "Ultra", price: "$19.99", period: "/month", features: ["5,000 AI requests/mo", "Everything in Pro", "Priority support", "API access"], cta: "Go Ultra" },
];

const stats = [
  { value: "10k+", label: "Events created" },
  { value: "98%", label: "User satisfaction" },
  { value: "<2s", label: "AI response time" },
  { value: "24/7", label: "Voice available" },
];

// Animated calendar preview
function AppPreview() {
  const events = [
    { title: "Morning Workout", time: "07:00", color: "#10B981", top: 8, height: 36 },
    { title: "Deep Work — Project Alpha", time: "09:00", color: "#3B82F6", top: 56, height: 72 },
    { title: "Team Standup", time: "11:00", color: "#8B5CF6", top: 140, height: 28, hasMeet: true },
    { title: "Lunch Break", time: "12:00", color: "#F97316", top: 178, height: 28 },
    { title: "Client Meeting", time: "14:00", color: "#EF4444", top: 218, height: 48, hasMeet: true },
    { title: "Reading", time: "18:00", color: "#06B6D4", top: 278, height: 36 },
  ];

  return (
    <div className="rounded-xl bg-background border border-border/20 p-4 h-[420px] relative overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-red-500/60" />
          <div className="h-2 w-2 rounded-full bg-yellow-500/60" />
          <div className="h-2 w-2 rounded-full bg-green-500/60" />
        </div>
        <span className="text-[10px] text-muted-foreground/40 font-mono">Today — Friday</span>
        <div className="flex items-center gap-1 text-[10px] text-primary/40">
          <Mic className="h-2.5 w-2.5" />
          <span>Voice on</span>
        </div>
      </div>

      {/* Time grid */}
      <div className="relative">
        {[7, 9, 11, 12, 14, 16, 18, 20].map((h) => (
          <div key={h} className="flex items-center gap-2 h-[48px]">
            <span className="text-[9px] font-mono text-muted-foreground/30 w-8 shrink-0">{h}:00</span>
            <div className="flex-1 border-t border-border/10" />
          </div>
        ))}

        {/* Events */}
        {events.map((event, i) => (
          <motion.div
            key={event.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="absolute left-10 right-2 rounded-md px-2.5 py-1"
            style={{
              top: event.top,
              height: event.height,
              backgroundColor: `${event.color}20`,
              borderLeft: `3px solid ${event.color}`,
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-foreground truncate">{event.title}</span>
              {event.hasMeet && <Video className="h-2.5 w-2.5 text-primary/60 shrink-0" />}
            </div>
            <span className="text-[9px] font-mono text-muted-foreground/50">{event.time}</span>
          </motion.div>
        ))}

        {/* Now line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute left-8 right-0 flex items-center"
          style={{ top: 160 }}
        >
          <div className="h-2 w-2 rounded-full bg-primary shadow-lg shadow-primary/40" />
          <div className="flex-1 h-[2px] bg-primary/40" />
        </motion.div>
      </div>

      {/* AI Chat bubble */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-3 left-3 right-3 rounded-xl border border-primary/20 bg-card/80 backdrop-blur p-3"
      >
        <div className="flex items-center gap-2 mb-1.5">
          <div className="h-5 w-5 rounded-md gradient-primary flex items-center justify-center">
            <Sparkles className="h-2.5 w-2.5 text-primary-foreground" />
          </div>
          <span className="text-[10px] font-semibold">Kron AI</span>
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="text-[11px] text-muted-foreground"
        >
          Your afternoon is packed. I moved Reading to 18:00 and added a 15min break before the client call.
        </motion.p>
      </motion.div>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <Logo size="large" />
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-muted-foreground">Sign in</Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="gradient-primary border-0 text-primary-foreground">Get started free</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-6">
            <Crown className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Your AI-powered personal time manager</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05]">
            Your calendar.
            <br />
            <span className="gradient-text">Your AI assistant.</span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Kron is the all-in-one AI calendar that schedules your day, protects your focus,
            tracks your habits, and adapts when plans change. Just speak or type what you need.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="gradient-primary border-0 text-primary-foreground shadow-xl shadow-primary/20 px-8 text-base h-12">
                Start for free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground">No credit card required · Free forever plan</p>
          </div>
        </motion.div>

        {/* App preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-14 rounded-2xl border border-border/30 bg-card/50 p-2 shadow-2xl shadow-primary/5"
        >
          <AppPreview />
        </motion.div>
      </section>

      {/* Stats */}
      <section className="max-w-4xl mx-auto px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-2xl md:text-3xl font-black gradient-text">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* All-in-one banner */}
      <section className="max-w-4xl mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-primary/10 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 p-8 text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Calendar + AI + Tasks + Habits + Voice + Social
          </h2>
          <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
            Everything in one app. No more switching between 5 tools to manage your time.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {["Schedule", "Tasks", "Habits", "Voice", "Friends", "Meet Links", "AI Chat", "Focus Mode", "Templates", "Heatmap", "Meeting Prep", "Weekly Report"].map((tag) => (
              <span key={tag} className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">{tag}</span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold tracking-tight">Everything you need to own your time</h2>
          <p className="text-muted-foreground mt-3">Not just a calendar. A personal time manager that thinks ahead.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl border border-border/20 bg-card/30 p-5 hover:bg-card/60 hover:border-border/40 transition-all group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 mb-3 group-hover:scale-110 transition-transform">
                <f.icon className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold mb-1.5">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
          <p className="text-muted-foreground mt-3">Three steps to a perfectly managed schedule</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: "1", title: "Set up your profile", desc: "Tell Kron your goals, habits, work hours, and constraints. Takes 2 minutes.", icon: Palette },
            { step: "2", title: "Talk to Kron", desc: "Type or speak: 'Plan my week', 'Add gym tomorrow at 7', 'Delete all meetings Friday'.", icon: MessageCircle },
            { step: "3", title: "Let AI handle it", desc: "Kron creates events, respects your rules, sends meet links, and adapts when things change.", icon: Sparkles },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="text-center"
            >
              <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
                <item.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold tracking-tight">Simple, honest pricing</h2>
          <p className="text-muted-foreground mt-3">Start free. Upgrade when you need more AI power. Buy extra credits anytime.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-xl border p-6 flex flex-col ${
                plan.popular
                  ? "border-primary/40 bg-primary/5 shadow-xl shadow-primary/10"
                  : "border-border/20 bg-card/30"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full gradient-primary px-4 py-1 text-[10px] font-bold text-primary-foreground">
                  MOST POPULAR
                </div>
              )}
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="mt-5 space-y-2.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="mt-6">
                <Button
                  className={`w-full ${plan.popular ? "gradient-primary border-0 text-primary-foreground" : ""}`}
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground/50 mt-4">
          Need more? Buy extra AI credits on demand — they never expire.
        </p>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-16 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-primary/20 bg-primary/5 p-12"
        >
          <Crown className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold tracking-tight">Ready to rule your time?</h2>
          <p className="text-muted-foreground mt-2 mb-6">Join thousands of people who stopped managing time and started living.</p>
          <Link href="/register">
            <Button size="lg" className="gradient-primary border-0 text-primary-foreground px-8 shadow-xl shadow-primary/20">
              Start for free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/20 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <nav className="flex items-center gap-5 text-xs text-muted-foreground">
            <Link href="/legal/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/legal/privacy" className="hover:text-foreground">Privacy</Link>
            <a href="mailto:support@kron.app" className="hover:text-foreground">Support</a>
          </nav>
          <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Kron. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
