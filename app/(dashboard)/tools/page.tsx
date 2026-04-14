"use client";

import { motion } from "framer-motion";
import { Wand2 } from "lucide-react";
import { WeeklyReportCard } from "@/src/components/ai/WeeklyReport";
import { FocusModeCard } from "@/src/components/ai/FocusMode";
import { SmartTemplatesCard } from "@/src/components/ai/SmartTemplates";
import { CalendarHeatmap } from "@/src/components/calendar/CalendarHeatmap";
import { EnergyIndicator, EnergyTimeline } from "@/src/components/calendar/EnergyIndicator";

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 space-y-4 sm:space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
            <Wand2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">AI Tools</h2>
            <p className="text-sm text-muted-foreground">Your productivity toolkit — powered by AI</p>
          </div>
        </div>
      </motion.div>

      {/* Top row: Focus + Report */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FocusModeCard />
        <WeeklyReportCard />
      </div>

      {/* Templates - full width */}
      <SmartTemplatesCard />

      {/* Bottom row: Heatmap + Energy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CalendarHeatmap />
        <div className="space-y-4">
          <EnergyIndicator />
          <EnergyTimeline />
        </div>
      </div>
    </div>
  );
}
