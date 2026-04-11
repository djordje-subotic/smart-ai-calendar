"use client";

import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  CalendarDays,
  Target,
  Zap,
  RefreshCw,
  Lightbulb,
  BarChart3,
  Mic,
  Crown,
  ArrowRight,
  Check,
} from "lucide-react";

const features = [
  { icon: Sparkles, title: "AI Chat Assistant", desc: "Tell Kron what you need in plain language. It understands Serbian and English." },
  { icon: CalendarDays, title: "Smart Scheduling", desc: "AI fills your entire week based on your goals, energy, and preferences." },
  { icon: RefreshCw, title: "Replan My Day", desc: "Plans changed? One tap and AI reorganizes your remaining schedule." },
  { icon: Lightbulb, title: "Smart Nudges", desc: "Proactive hints: 'You have 2h free' or 'No lunch break today' — always helpful, never annoying." },
  { icon: Target, title: "Habit Streaks", desc: "Track habits with Duolingo-style streaks. Build consistency, see your progress." },
  { icon: BarChart3, title: "Schedule Score", desc: "See how healthy your day is at a glance. Kron rates your schedule 0-100." },
  { icon: Zap, title: "Energy Tracking", desc: "Know when you're at peak focus. Schedule hard work in the morning, light tasks after lunch." },
  { icon: Mic, title: "Voice Input", desc: "Speak to schedule. Just say what you need, Kron handles the rest." },
];

const plans = [
  { name: "Free", price: "$0", period: "forever", features: ["20 AI requests/mo", "Calendar + Tasks + Habits", "Smart nudges", "Voice input"], cta: "Start free" },
  { name: "Pro", price: "$9", period: "/month", features: ["300 AI requests/mo", "All features unlocked", "Replan my day", "Schedule optimizer", "Daily AI briefing", "Google Calendar sync"], cta: "Start free trial", popular: true },
  { name: "Ultra", price: "$19", period: "/month", features: ["3000 AI requests/mo", "Everything in Pro", "Priority support", "API access", "10x more than Pro"], cta: "Go Ultra" },
];

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
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-6">
            <Crown className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Your personal time manager</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-[1.1]">
            Stop managing time.
            <br />
            <span className="gradient-text">Let AI rule it.</span>
          </h1>

          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Kron is the AI calendar that understands your schedule, protects your focus,
            and reorganizes your day when plans change. Just tell it what you need.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="gradient-primary border-0 text-primary-foreground shadow-xl shadow-primary/20 px-8 text-base">
                Start for free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground">No credit card required</p>
          </div>
        </motion.div>

        {/* App preview placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-16 rounded-2xl border border-border/30 bg-card/50 p-2 shadow-2xl"
        >
          <div className="rounded-xl bg-background border border-border/20 h-[400px] flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="flex justify-center gap-3">
                <div className="h-3 w-3 rounded-full bg-red-500/60" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                <div className="h-3 w-3 rounded-full bg-green-500/60" />
              </div>
              <p className="text-sm text-muted-foreground/40">App Preview</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold tracking-tight">Everything you need to own your time</h2>
          <p className="text-muted-foreground mt-3">Not just a calendar. A personal time manager.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border/20 bg-card/30 p-5 hover:bg-card/60 transition-colors"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 mb-3">
                <f.icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold mb-1.5">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold tracking-tight">Simple, honest pricing</h2>
          <p className="text-muted-foreground mt-3">Start free. Upgrade when you need more AI power.</p>
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
              <ul className="mt-5 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="mt-auto">
                <Button
                  className={`w-full mt-6 ${plan.popular ? "gradient-primary border-0 text-primary-foreground" : ""}`}
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-primary/20 bg-primary/5 p-12"
        >
          <Crown className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold tracking-tight">Ready to rule your time?</h2>
          <p className="text-muted-foreground mt-2 mb-6">Join Kron and never waste a minute again.</p>
          <Link href="/register">
            <Button size="lg" className="gradient-primary border-0 text-primary-foreground px-8">
              Start for free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/20 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo />
          <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Kron. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
