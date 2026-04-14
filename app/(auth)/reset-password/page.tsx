"use client";

import { useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Logo } from "@/src/components/layout/Logo";
import { Loader2, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirm) { setError("Passwords don't match"); return; }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });

    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/calendar"), 2000);
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo size="large" />
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/80 p-7 backdrop-blur-xl">
          {success ? (
            <div className="text-center space-y-4 py-4">
              <div className="flex justify-center">
                <div className="h-14 w-14 rounded-full bg-green-500/15 flex items-center justify-center">
                  <CheckCircle2 className="h-7 w-7 text-green-400" />
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold">Password updated!</h2>
                <p className="text-sm text-muted-foreground mt-2">Redirecting to your calendar...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bold tracking-tight">New password</h1>
                <p className="mt-1 text-sm text-muted-foreground">Choose a strong password for your account</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs text-muted-foreground">New password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="6+ characters"
                    required
                    minLength={6}
                    className="border-border/30 bg-muted/20 h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm" className="text-xs text-muted-foreground">Confirm password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat password"
                    required
                    minLength={6}
                    className="border-border/30 bg-muted/20 h-10"
                  />
                </div>

                <Button type="submit" className="w-full h-10 gradient-primary border-0 text-white font-semibold shadow-lg shadow-primary/20" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? "Updating..." : "Update password"}
                </Button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
