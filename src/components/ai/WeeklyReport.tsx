"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BarChart3, Loader2, Lightbulb, TrendingUp, Calendar, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { generateWeeklyReport, type WeeklyReport as WeeklyReportType } from "@/src/actions/ai";

export function WeeklyReportCard() {
  const [report, setReport] = useState<WeeklyReportType | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const data = await generateWeeklyReport();
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (!report) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border/30 bg-card/50 p-5"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Weekly Report</h3>
            <p className="text-[11px] text-muted-foreground/60">AI summary of your past 7 days</p>
          </div>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={loading}
          variant="outline"
          size="sm"
          className="w-full text-xs"
        >
          {loading ? <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" />Generating...</> : <><BarChart3 className="mr-1.5 h-3 w-3" />Generate report</>}
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-5 space-y-4"
    >
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-violet-400" />
        <h3 className="text-sm font-semibold">Your Week in Review</h3>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">{report.summary}</p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-background/50 border border-border/20 p-2.5 text-center">
          <Calendar className="h-3.5 w-3.5 mx-auto text-violet-400 mb-1" />
          <div className="text-lg font-bold">{report.stats.total_events}</div>
          <div className="text-[9px] text-muted-foreground">events</div>
        </div>
        <div className="rounded-lg bg-background/50 border border-border/20 p-2.5 text-center">
          <Clock className="h-3.5 w-3.5 mx-auto text-violet-400 mb-1" />
          <div className="text-lg font-bold">{Math.round(report.stats.total_hours)}h</div>
          <div className="text-[9px] text-muted-foreground">scheduled</div>
        </div>
      </div>

      {/* Insights */}
      {report.insights.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider mb-1.5">Insights</p>
          {report.insights.map((insight, i) => (
            <div key={i} className="flex items-start gap-2 mb-1">
              <Lightbulb className="h-3 w-3 text-amber-400 mt-0.5 shrink-0" />
              <span className="text-[11px] text-muted-foreground">{insight}</span>
            </div>
          ))}
        </div>
      )}

      {/* Suggestions */}
      {report.suggestions.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider mb-1.5">Suggestions</p>
          {report.suggestions.map((suggestion, i) => (
            <div key={i} className="flex items-start gap-2 mb-1">
              <TrendingUp className="h-3 w-3 text-green-400 mt-0.5 shrink-0" />
              <span className="text-[11px] text-muted-foreground">{suggestion}</span>
            </div>
          ))}
        </div>
      )}

      <Button onClick={handleGenerate} disabled={loading} variant="ghost" size="sm" className="w-full text-[10px] text-muted-foreground">
        {loading ? "Refreshing..." : "Refresh report"}
      </Button>
    </motion.div>
  );
}
