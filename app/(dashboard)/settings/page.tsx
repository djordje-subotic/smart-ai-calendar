"use client";

import { logout } from "@/src/actions/auth";
import { getUsageStats } from "@/src/actions/ai";
import { changePlan, cancelSubscription, type Plan } from "@/src/actions/subscription";
import { Button } from "@/components/ui/button";
import { LogOut, Zap, Crown, Shield, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const plans: { id: Plan; name: string; price: string; period: string; icon: typeof Shield; features: string[]; popular?: boolean }[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "/forever",
    icon: Shield,
    features: ["20 AI requests/month", "Basic calendar views", "Manual event creation", "1 focus block"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$7",
    period: "/month",
    icon: Zap,
    popular: true,
    features: ["500 AI requests/month", "Smart scheduling", "Energy-aware scheduling", "Unlimited focus blocks", "Daily AI briefing", "Priority support"],
  },
  {
    id: "team",
    name: "Team",
    price: "$12",
    period: "/user/month",
    icon: Crown,
    features: ["2000 AI requests/month", "Everything in Pro", "Team calendars", "Shared focus blocks", "Social scheduling", "API access"],
  },
];

export default function SettingsPage() {
  const [usage, setUsage] = useState<{ plan: string; used: number; limit: number } | null>(null);
  const [switching, setSwitching] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    getUsageStats().then(setUsage);
  }, []);

  async function handleChangePlan(planId: Plan) {
    setSwitching(planId);
    const result = await changePlan(planId);
    if (result.success) {
      const stats = await getUsageStats();
      setUsage(stats);
    }
    setSwitching(null);
  }

  async function handleCancel() {
    setCancelling(true);
    const result = await cancelSubscription();
    if (result.success) {
      const stats = await getUsageStats();
      setUsage(stats);
    }
    setCancelling(false);
  }

  const currentPlan = usage?.plan || "free";

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-8 overflow-auto h-full">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and subscription</p>
      </motion.div>

      {/* Usage stats */}
      {usage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border/30 bg-card/50 p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">AI Usage This Month</h3>
            <span className="text-xs font-medium capitalize px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {currentPlan} plan
            </span>
          </div>
          <div className="relative h-2 rounded-full bg-muted/50 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((usage.used / usage.limit) * 100, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute inset-y-0 left-0 rounded-full gradient-primary"
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{usage.used}</span> / {usage.limit} AI requests used
          </p>
        </motion.div>
      )}

      {/* Calendar Integrations */}
      <div>
        <h3 className="text-sm font-semibold mb-4">Calendar Integrations</h3>
        <div className="space-y-2">
          {[
            { name: "Google Calendar", icon: "🔵", desc: "Sync events bidirectionally" },
            { name: "Apple Calendar", icon: "⚪", desc: "Import and sync with iCloud" },
            { name: "Outlook", icon: "🔷", desc: "Sync with Microsoft Outlook" },
          ].map((cal, i) => (
            <motion.div
              key={cal.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 rounded-xl border border-border/30 bg-card/50 p-4"
            >
              <span className="text-xl">{cal.icon}</span>
              <div className="flex-1">
                <h4 className="text-sm font-medium">{cal.name}</h4>
                <p className="text-[11px] text-muted-foreground">{cal.desc}</p>
              </div>
              <Button variant="outline" size="sm" className="text-xs border-border/40">
                Connect
              </Button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div>
        <h3 className="text-sm font-semibold mb-4">Plans & Pricing</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan, i) => {
            const isCurrent = currentPlan === plan.id;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-xl border p-5 transition-all ${
                  plan.popular
                    ? "border-primary/40 bg-primary/5 shadow-lg shadow-primary/10"
                    : "border-border/30 bg-card/50"
                } ${isCurrent ? "ring-2 ring-primary/30" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full gradient-primary px-3 py-0.5 text-[10px] font-bold text-primary-foreground">
                    MOST POPULAR
                  </div>
                )}
                <plan.icon className={`h-5 w-5 mb-3 ${plan.popular ? "text-primary" : "text-muted-foreground"}`} />
                <h4 className="font-bold">{plan.name}</h4>
                <div className="mt-1 flex items-baseline gap-0.5">
                  <span className="text-2xl font-extrabold">{plan.price}</span>
                  <span className="text-xs text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Check className="h-3 w-3 mt-0.5 text-primary/60 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full mt-5 text-xs ${
                    plan.popular && !isCurrent
                      ? "gradient-primary border-0 text-primary-foreground shadow-lg shadow-primary/20"
                      : ""
                  }`}
                  variant={plan.popular && !isCurrent ? "default" : "outline"}
                  size="sm"
                  disabled={isCurrent || switching !== null}
                  onClick={() => handleChangePlan(plan.id)}
                >
                  {switching === plan.id
                    ? "Switching..."
                    : isCurrent
                      ? "Current plan"
                      : currentPlan !== "free" && plan.id === "free"
                        ? "Downgrade"
                        : `Upgrade to ${plan.name}`}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Cancel subscription */}
      {currentPlan !== "free" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-destructive/20 bg-destructive/5 p-5"
        >
          <h3 className="text-sm font-semibold text-destructive">Cancel Subscription</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            You&apos;ll lose access to {currentPlan === "pro" ? "Pro" : "Team"} features at the end of your billing period.
            Your events and data will be preserved.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={cancelling}
            className="text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            {cancelling ? "Cancelling..." : "Cancel subscription"}
          </Button>
        </motion.div>
      )}

      {/* Account */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="pt-4 border-t border-border/30"
      >
        <h3 className="text-sm font-medium mb-3 text-muted-foreground">Account</h3>
        <form action={logout}>
          <Button
            variant="ghost"
            size="sm"
            type="submit"
            className="text-destructive/70 hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
