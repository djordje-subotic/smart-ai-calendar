"use client";

import { register } from "@/src/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/src/components/layout/Logo";
import { Loader2, Crown, Check, Sparkles, Calendar, Target, Mic } from "lucide-react";
import { motion } from "framer-motion";

const benefits = [
  { icon: Sparkles, title: "AI-Powered Scheduling", desc: "Just say what you need — Krowna creates your entire schedule" },
  { icon: Calendar, title: "All-in-One", desc: "Calendar, tasks, habits, friends, voice — one app for everything" },
  { icon: Target, title: "Personalized to You", desc: "Set goals, habits, constraints — AI adapts to your lifestyle" },
  { icon: Mic, title: "Voice Assistant", desc: "\"Hey Krowna, plan my week\" — hands-free, screen-reader accessible" },
];

const freeIncludes = [
  "30 AI requests per month",
  "Full calendar with week/day views",
  "Tasks, habits, and streaks",
  "Voice input and Hey Krowna",
  "Friends and social scheduling",
  "Smart nudges (no AI cost)",
  "Schedule score and energy tracking",
];

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await register(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-full">
      {/* Left: Hero */}
      <div className="hidden lg:flex lg:flex-1 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-[0.07]" />
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-blue-500/15 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="relative z-10 max-w-md px-12">
          <Logo size="large" />
          <h1 className="mt-8 text-4xl font-black tracking-tight leading-[1.1]">
            Stop managing time.
            <br />
            <span className="gradient-text">Let AI rule it.</span>
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Krowna is not just a calendar — it&apos;s your personal AI time manager that knows your goals, respects your constraints, and adapts when plans change.
          </p>

          <div className="mt-8 space-y-4">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 shrink-0 mt-0.5">
                  <b.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{b.title}</h3>
                  <p className="text-xs text-muted-foreground/70">{b.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex flex-1 items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo />
          </div>
          <div className="rounded-2xl border border-border/50 bg-card/80 p-7 backdrop-blur-xl">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-bold tracking-tight">Create your account</h1>
              </div>
              <p className="text-sm text-muted-foreground">Free forever. No credit card.</p>
            </div>
            <form action={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-xs text-muted-foreground">Full name</Label>
                <Input id="fullName" name="fullName" type="text" placeholder="Your name" required className="border-border/30 bg-muted/20 h-10" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
                <Input id="email" name="email" type="email" placeholder="you@example.com" required className="border-border/30 bg-muted/20 h-10" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs text-muted-foreground">Password</Label>
                <Input id="password" name="password" type="password" placeholder="6+ characters" minLength={6} required className="border-border/30 bg-muted/20 h-10" />
              </div>
              <Button type="submit" className="w-full h-10 gradient-primary border-0 text-white font-semibold shadow-lg shadow-primary/20" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Creating..." : "Start for free"}
              </Button>
            </form>

            {/* What's included */}
            <div className="mt-5 pt-5 border-t border-border/20">
              <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider mb-2">Free plan includes</p>
              <div className="grid grid-cols-1 gap-1">
                {freeIncludes.map((item) => (
                  <div key={item} className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
                    <Check className="h-2.5 w-2.5 text-primary/60 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 text-center">
              <p className="text-xs text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
