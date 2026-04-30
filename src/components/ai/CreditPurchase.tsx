"use client";

import { useState } from "react";
import { Zap, Check, Sparkles, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { CREDIT_PACKAGES, type CreditPackage } from "@/src/constants/credits";
import { cn } from "@/lib/utils";

interface CreditPurchaseProps {
  onPurchased?: (newBalance: number) => void;
  compact?: boolean;
}

export function CreditPurchase({ onPurchased, compact = false }: CreditPurchaseProps) {
  const [buying, setBuying] = useState<string | null>(null);
  const [purchased, setPurchased] = useState(false);

  async function handleBuy(pack: CreditPackage) {
    setBuying(pack.id);
    try {
      const res = await fetch("/api/credits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pack.id }),
      });
      const data = await res.json();

      if (data.mode === "lemonsqueezy" && data.url) {
        // Real payment - redirect to Lemon Squeezy hosted checkout
        window.location.href = data.url;
        return;
      }

      if (data.mode === "simulated" && data.newBalance !== undefined) {
        // Dev mode fallback - credits added directly
        setPurchased(true);
        onPurchased?.(data.newBalance);
        setTimeout(() => setPurchased(false), 3000);
      }
    } catch (err) {
      console.error("Purchase failed:", err);
    } finally {
      setBuying(null);
    }
  }

  if (purchased) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-center">
        <Check className="h-6 w-6 mx-auto text-green-400 mb-1" />
        <p className="text-sm font-medium text-green-400">Credits added!</p>
        <p className="text-[10px] text-muted-foreground">You can keep using AI now.</p>
      </motion.div>
    );
  }

  return (
    <div className={cn("space-y-3", compact && "space-y-2")}>
      {!compact && (
        <div className="text-center space-y-1">
          <Zap className="h-6 w-6 mx-auto text-primary/60" />
          <p className="text-sm font-semibold">Need more AI requests?</p>
          <p className="text-[11px] text-muted-foreground">Buy credits on demand — no subscription needed. Credits never expire.</p>
        </div>
      )}

      <div className={cn("grid gap-2", compact ? "grid-cols-3" : "grid-cols-3")}>
        {CREDIT_PACKAGES.map((pack) => (
          <button
            key={pack.id}
            onClick={() => handleBuy(pack)}
            disabled={buying !== null}
            className={cn(
              "relative rounded-xl border p-3 text-center transition-all hover:scale-[1.02]",
              pack.popular
                ? "border-primary/40 bg-primary/5"
                : "border-border/30 bg-card/50 hover:border-border/50"
            )}
          >
            {pack.popular && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full gradient-primary px-2 py-0.5 text-[8px] font-bold text-primary-foreground">
                BEST VALUE
              </div>
            )}
            <div className={cn("font-bold", compact ? "text-base" : "text-lg")}>{pack.credits}</div>
            <div className="text-[10px] text-muted-foreground">credits</div>
            <div className={cn("font-semibold mt-1", compact ? "text-sm" : "text-base", pack.popular && "text-primary")}>{pack.price}</div>
            <div className="text-[9px] text-muted-foreground/60">{pack.perCredit}/req</div>
            {/* Visual-only "Buy" pill — the whole card is the real <button>, so
                we render a styled div to avoid button-in-button invalid HTML. */}
            <div
              className={cn(
                "w-full mt-2 text-[10px] h-7 rounded-md inline-flex items-center justify-center font-medium border",
                pack.popular
                  ? "gradient-primary border-0 text-primary-foreground"
                  : "border-border/40 bg-transparent text-foreground"
              )}
            >
              {buying === pack.id ? "Buying..." : "Buy"}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
