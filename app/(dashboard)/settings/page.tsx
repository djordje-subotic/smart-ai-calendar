"use client";

import { logout } from "@/src/actions/auth";
import { getUsageStats } from "@/src/actions/ai";
import { changePlan, cancelSubscription, type Plan } from "@/src/actions/subscription";
import { getGoogleAuthUrl, getGoogleSyncStatus, disconnectGoogle } from "@/src/actions/google-calendar";
import { sendFriendRequest, getFriends, getPendingRequests, respondToFriendRequest } from "@/src/actions/social";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, Zap, Crown, Shield, Check, RefreshCw, Unlink, UserPlus, Users, X, Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const plans: { id: Plan; name: string; price: string; period: string; icon: typeof Shield; features: string[]; popular?: boolean }[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "/forever",
    icon: Shield,
    features: ["20 AI requests/month", "Calendar + Tasks + Habits", "Smart nudges", "Voice input"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$9",
    period: "/month",
    icon: Zap,
    popular: true,
    features: ["300 AI requests/month", "All features unlocked", "Replan my day", "Schedule optimizer", "Daily AI briefing", "Google Calendar sync", "Energy scheduling"],
  },
  {
    id: "ultra",
    name: "Ultra",
    price: "$19",
    period: "/month",
    icon: Crown,
    features: ["3000 AI requests/month", "Everything in Pro", "Priority support", "API access", "10x more than Pro"],
  },
];

export default function SettingsPage() {
  const [usage, setUsage] = useState<{ plan: string; used: number; limit: number } | null>(null);
  const [switching, setSwitching] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingReqs, setPendingReqs] = useState<any[]>([]);
  const [friendEmail, setFriendEmail] = useState("");
  const [friendError, setFriendError] = useState<string | null>(null);
  const [friendSuccess, setFriendSuccess] = useState(false);
  const [soundsOn, setSoundsOn] = useState(true);

  useEffect(() => {
    getUsageStats().then(setUsage);
    getGoogleSyncStatus().then((s) => setGoogleConnected(s.connected));
    getFriends().then(setFriends);
    getPendingRequests().then(setPendingReqs);
    setSoundsOn(localStorage.getItem("kron-sounds") !== "false");
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
          {/* Google Calendar - real integration */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 rounded-xl border border-border/30 bg-card/50 p-4">
            <span className="text-xl">🔵</span>
            <div className="flex-1">
              <h4 className="text-sm font-medium">Google Calendar</h4>
              <p className="text-[11px] text-muted-foreground">
                {googleConnected ? "Connected — events synced" : "Import and sync your events"}
              </p>
            </div>
            {googleConnected ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-xs border-border/40" disabled={syncing} onClick={async () => {
                  setSyncing(true);
                  await fetch("/api/google/sync", { method: "POST" });
                  setSyncing(false);
                }}>
                  <RefreshCw className={`h-3 w-3 mr-1.5 ${syncing ? "animate-spin" : ""}`} />
                  {syncing ? "Syncing..." : "Sync now"}
                </Button>
                <Button variant="ghost" size="sm" className="text-xs text-destructive/60 hover:text-destructive" onClick={async () => {
                  await disconnectGoogle();
                  setGoogleConnected(false);
                }}>
                  <Unlink className="h-3 w-3 mr-1.5" />
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="text-xs border-border/40" onClick={async () => {
                const url = await getGoogleAuthUrl();
                window.location.href = url;
              }}>
                Connect
              </Button>
            )}
          </motion.div>

          {/* Others - coming soon */}
          {[
            { name: "Apple Calendar", icon: "⚪", desc: "Import and sync with iCloud" },
            { name: "Outlook", icon: "🔷", desc: "Sync with Microsoft Outlook" },
          ].map((cal, i) => (
            <motion.div key={cal.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (i + 1) * 0.05 }} className="flex items-center gap-4 rounded-xl border border-border/30 bg-card/50 p-4">
              <span className="text-xl">{cal.icon}</span>
              <div className="flex-1">
                <h4 className="text-sm font-medium">{cal.name}</h4>
                <p className="text-[11px] text-muted-foreground">{cal.desc}</p>
              </div>
              <span className="text-[10px] text-muted-foreground/50 font-medium">Coming soon</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Friends */}
      <div>
        <h3 className="text-sm font-semibold mb-4">Friends & Social Scheduling</h3>

        {/* Pending requests */}
        {pendingReqs.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-xs text-muted-foreground">Pending requests</p>
            {pendingReqs.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
                <span className="text-xs font-medium flex-1">{r.fromName} wants to connect</span>
                <Button size="sm" className="h-7 text-[10px] gradient-primary border-0 text-primary-foreground" onClick={async () => {
                  await respondToFriendRequest(r.id, true);
                  setPendingReqs((p) => p.filter((x) => x.id !== r.id));
                  const f = await getFriends();
                  setFriends(f);
                }}>
                  <Check className="mr-1 h-3 w-3" />Accept
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={async () => {
                  await respondToFriendRequest(r.id, false);
                  setPendingReqs((p) => p.filter((x) => x.id !== r.id));
                }}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add friend */}
        <div className="flex gap-2 mb-4">
          <Input
            value={friendEmail}
            onChange={(e) => { setFriendEmail(e.target.value); setFriendError(null); setFriendSuccess(false); }}
            placeholder="Friend's email..."
            className="border-border/30 bg-muted/20 text-sm"
          />
          <Button size="sm" variant="outline" className="shrink-0 text-xs" onClick={async () => {
            if (!friendEmail.trim()) return;
            setFriendError(null);
            setFriendSuccess(false);
            const res = await sendFriendRequest(friendEmail.trim());
            if (res.success) {
              setFriendSuccess(true);
              setFriendEmail("");
            } else {
              setFriendError(res.error || "Failed");
            }
          }}>
            <UserPlus className="mr-1.5 h-3.5 w-3.5" />Add
          </Button>
        </div>
        {friendError && <p className="text-xs text-destructive mb-3">{friendError}</p>}
        {friendSuccess && <p className="text-xs text-green-400 mb-3">Friend request sent!</p>}

        {/* Friend list */}
        {friends.length > 0 && (
          <div className="space-y-2">
            {friends.map((f) => (
              <div key={f.id} className="flex items-center gap-3 rounded-xl border border-border/30 bg-card/50 p-3">
                <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                  {f.name[0]?.toUpperCase()}
                </div>
                <span className="text-sm font-medium flex-1">{f.name}</span>
                <Users className="h-3.5 w-3.5 text-muted-foreground/40" />
              </div>
            ))}
          </div>
        )}

        {friends.length === 0 && pendingReqs.length === 0 && (
          <p className="text-xs text-muted-foreground/50 text-center py-4">Add friends to schedule events together</p>
        )}
      </div>

      {/* Preferences */}
      <div>
        <h3 className="text-sm font-semibold mb-4">Preferences</h3>
        <div className="flex items-center justify-between rounded-xl border border-border/30 bg-card/50 p-4">
          <div className="flex items-center gap-3">
            {soundsOn ? <Volume2 className="h-4 w-4 text-primary" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
            <div>
              <h4 className="text-sm font-medium">Sound effects</h4>
              <p className="text-[11px] text-muted-foreground">Play sounds on actions (create, complete, send, etc.)</p>
            </div>
          </div>
          <button
            onClick={() => {
              const next = !soundsOn;
              setSoundsOn(next);
              localStorage.setItem("kron-sounds", String(next));
            }}
            className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${soundsOn ? "bg-primary" : "bg-muted"}`}
          >
            <div className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${soundsOn ? "translate-x-5" : "translate-x-0"}`} />
          </button>
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
                className={`relative rounded-xl border p-7 pb-8 transition-all flex flex-col min-h-[380px] ${
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
                <ul className="mt-5 mb-6 space-y-2.5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Check className="h-3 w-3 mt-0.5 text-primary/60 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {(() => {
                  const rank: Record<string, number> = { free: 0, pro: 1, ultra: 2 };
                  const currentRank = rank[currentPlan] || 0;
                  const targetRank = rank[plan.id] || 0;
                  const isUpgrade = targetRank > currentRank;
                  const showGradient = !isCurrent && (isUpgrade || plan.popular);

                  return (
                    <Button
                      className={`w-full mt-auto text-xs ${
                        showGradient
                          ? "gradient-primary border-0 text-primary-foreground shadow-lg shadow-primary/20"
                          : ""
                      }`}
                      variant={showGradient ? "default" : "outline"}
                      size="sm"
                      disabled={isCurrent || switching !== null}
                      onClick={() => handleChangePlan(plan.id)}
                    >
                      {switching === plan.id
                        ? "Switching..."
                        : isCurrent
                          ? "Current plan"
                          : isUpgrade
                            ? `Upgrade to ${plan.name}`
                            : `Downgrade to ${plan.name}`}
                    </Button>
                  );
                })()}
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
