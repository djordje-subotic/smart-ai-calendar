"use client";

import { useState, useEffect } from "react";
import { generateDailyBriefing } from "@/src/actions/ai";
import { Sparkles, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export function DailyBriefing() {
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadBriefing() {
    setLoading(true);
    setError(null);
    try {
      const text = await generateDailyBriefing();
      setBriefing(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate briefing");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-primary/20 bg-primary/5 p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg gradient-primary">
            <Sparkles className="h-3 w-3 text-white" />
          </div>
          <span className="text-xs font-semibold">Krowna AI Briefing</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={loadBriefing}
          disabled={loading}
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {briefing ? (
          <motion.p
            key="briefing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs leading-relaxed text-foreground/80"
          >
            {briefing}
          </motion.p>
        ) : error ? (
          <motion.p
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-destructive/70"
          >
            {error}
          </motion.p>
        ) : (
          <motion.button
            key="cta"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={loadBriefing}
            disabled={loading}
            className="text-xs text-primary hover:text-primary/80 transition-colors"
          >
            {loading ? "Generating..." : "Get your daily briefing →"}
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
