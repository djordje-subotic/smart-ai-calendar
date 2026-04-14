"use client";

import { login } from "@/src/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/src/components/layout/Logo";
import { Loader2, Crown, Sparkles, Mic, Users, Brain, Video, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const highlights = [
  { icon: Sparkles, text: "AI schedules your entire week" },
  { icon: Mic, text: "Hands-free voice assistant" },
  { icon: Users, text: "Social scheduling with friends" },
  { icon: Brain, text: "Learns your goals and habits" },
  { icon: Video, text: "One-click Meet links" },
];

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await login(formData);
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
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="relative z-10 max-w-md px-12">
          <Logo size="large" />
          <h1 className="mt-8 text-4xl font-black tracking-tight leading-[1.1]">
            Your personal
            <br />
            <span className="gradient-text">AI time manager.</span>
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Calendar + AI + Tasks + Habits + Voice + Friends — everything you need to own your time, in one app.
          </p>

          <div className="mt-8 space-y-2.5">
            {highlights.map((h, i) => (
              <motion.div
                key={h.text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="flex items-center gap-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <h.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-foreground/80">{h.text}</span>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-3 text-[11px] text-muted-foreground/50">
            <div className="flex -space-x-2">
              {["F", "M", "A", "K"].map((l, i) => (
                <div key={i} className="h-6 w-6 rounded-full gradient-primary flex items-center justify-center text-[9px] font-bold text-primary-foreground border-2 border-background">
                  {l}
                </div>
              ))}
            </div>
            <span>Trusted by productive people worldwide</span>
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
                <h1 className="text-xl font-bold tracking-tight">Welcome back</h1>
              </div>
              <p className="text-sm text-muted-foreground">Sign in to rule your time</p>
            </div>
            <form action={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
                <Input id="email" name="email" type="email" placeholder="you@example.com" required className="border-border/30 bg-muted/20 h-10" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs text-muted-foreground">Password</Label>
                <Input id="password" name="password" type="password" placeholder="Enter your password" required className="border-border/30 bg-muted/20 h-10" />
              </div>
              <Button type="submit" className="w-full h-10 gradient-primary border-0 text-white font-semibold shadow-lg shadow-primary/20" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <Link href="/forgot-password" className="block text-xs text-muted-foreground hover:text-primary mb-3">
                Forgot password?
              </Link>
              <p className="text-xs text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-primary font-medium hover:underline">
                  Create one free <ArrowRight className="inline h-3 w-3" />
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
