"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, ArrowRight, Sparkles, Calendar, Target, Users, Wand2, Crown } from "lucide-react";
import { createClient } from "@/src/lib/supabase/client";

const STEPS = [
  {
    icon: Crown,
    title: "Welcome to Kron!",
    description: "Your AI-powered personal time manager. Let me show you around in 30 seconds.",
  },
  {
    icon: Sparkles,
    title: "Ask AI anything",
    description: 'Press ⌘K or the sparkle button. Say "Plan my productive week" or "Add gym tomorrow at 7".',
  },
  {
    icon: Calendar,
    title: "Month, Week & Day views",
    description: "Switch views in the header. Drag events to reschedule. Click empty slots to create.",
  },
  {
    icon: Target,
    title: "Set up your profile",
    description: "Tell Kron your goals, habits, and constraints. AI will personalize every schedule.",
  },
  {
    icon: Wand2,
    title: "AI Tools",
    description: "Focus Mode for deep work, Smart Templates for full weeks, Weekly Report for insights.",
  },
  {
    icon: Users,
    title: "Schedule with friends",
    description: "Add friends by email, send event invites, find mutual free time. Works across timezones.",
  },
];

export function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    checkFirstTime();
  }, []);

  async function checkFirstTime() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const seen = localStorage.getItem(`kron-onboarding-${user.id}`);
      if (seen) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("created_at, onboarding_completed")
        .eq("id", user.id)
        .single();

      // Show onboarding to new users (created < 10 min ago) who haven't completed it
      if (profile && !profile.onboarding_completed) {
        const created = new Date(profile.created_at).getTime();
        const isNew = Date.now() - created < 10 * 60 * 1000;
        if (isNew) setOpen(true);
      }
    } catch {}
  }

  async function handleFinish() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        localStorage.setItem(`kron-onboarding-${user.id}`, "done");
      }
    } catch {}
    setOpen(false);
  }

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1);
    else handleFinish();
  }

  if (!open) return null;
  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        >
          <motion.div
            key={step}
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md rounded-3xl border border-primary/20 bg-card p-8 shadow-2xl"
          >
            <button
              onClick={handleFinish}
              className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent/50"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex justify-center mb-5">
              <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/30">
                <Icon className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>

            <h2 className="text-2xl font-black tracking-tight text-center mb-2">{current.title}</h2>
            <p className="text-sm text-muted-foreground text-center leading-relaxed mb-6">{current.description}</p>

            {/* Progress dots */}
            <div className="flex justify-center gap-1.5 mb-6">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step ? "w-6 bg-primary" : i < step ? "w-1.5 bg-primary/50" : "w-1.5 bg-muted/40"
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {step > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)} className="flex-1">
                  Back
                </Button>
              )}
              {step === 0 && (
                <Button variant="ghost" size="sm" onClick={handleFinish} className="flex-1 text-muted-foreground">
                  Skip
                </Button>
              )}
              <Button
                size="sm"
                onClick={next}
                className="flex-1 gradient-primary border-0 text-primary-foreground"
              >
                {step === STEPS.length - 1 ? (
                  "Let's go!"
                ) : (
                  <>Next <ArrowRight className="ml-1 h-3 w-3" /></>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
