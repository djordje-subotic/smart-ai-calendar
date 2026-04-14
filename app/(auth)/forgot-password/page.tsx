"use client";

import { useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Logo } from "@/src/components/layout/Logo";
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-full items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 flex justify-center">
          <Logo size="large" />
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/80 p-7 backdrop-blur-xl">
          {sent ? (
            <div className="text-center space-y-4 py-4">
              <div className="flex justify-center">
                <div className="h-14 w-14 rounded-full bg-green-500/15 flex items-center justify-center">
                  <CheckCircle2 className="h-7 w-7 text-green-400" />
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold">Check your email</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  We sent a password reset link to <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>
              <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                <ArrowLeft className="h-3 w-3" />Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bold tracking-tight">Forgot password?</h1>
                <p className="mt-1 text-sm text-muted-foreground">Enter your email and we'll send a reset link</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="border-border/30 bg-muted/20 h-10"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-10 gradient-primary border-0 text-white font-semibold shadow-lg shadow-primary/20"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? "Sending..." : (<><Mail className="mr-2 h-4 w-4" />Send reset link</>)}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-3 w-3" />Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
