"use client";

import { login } from "@/src/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/src/components/layout/Logo";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

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
        <div className="absolute inset-0 gradient-primary opacity-10" />
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-[100px]" />
        <div className="relative z-10 max-w-md px-12">
          <Logo size="large" />
          <h1 className="mt-8 text-3xl font-extrabold tracking-tight leading-tight">
            Take the crown.<br /><span className="gradient-text">Rule your time.</span>
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Kron is the AI calendar that takes control of your schedule.
            Just tell it what you need — it handles the rest.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {["AI Scheduling", "Energy Tracking", "Focus Blocks", "Voice Input"].map((f) => (
              <span key={f} className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-medium text-primary">
                {f}
              </span>
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
          <div className="rounded-2xl border border-border/50 bg-card/80 p-6 backdrop-blur-xl">
            <div className="mb-6">
              <h1 className="text-xl font-bold tracking-tight">Welcome back</h1>
              <p className="mt-1 text-sm text-muted-foreground">Sign in to your calendar</p>
            </div>
            <form action={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
                <Input id="email" name="email" type="email" placeholder="you@example.com" required className="border-border/30 bg-muted/20" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs text-muted-foreground">Password</Label>
                <Input id="password" name="password" type="password" placeholder="••••••••" required className="border-border/30 bg-muted/20" />
              </div>
              <Button type="submit" className="w-full gradient-primary border-0 text-white font-medium shadow-lg shadow-primary/20" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
            <p className="mt-5 text-center text-xs text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-primary hover:underline">Create one free</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
