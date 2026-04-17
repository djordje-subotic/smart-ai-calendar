"use client";

import { motion } from "framer-motion";

/**
 * Skeleton placeholder blocks for loading states. Uses shimmer animation
 * from globals.css so they pulse while data loads.
 */

export function SkeletonLine({ width = "100%", height = 12 }: { width?: string | number; height?: number }) {
  return (
    <div
      className="rounded-md bg-muted/40 shimmer"
      style={{ width, height }}
    />
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-xl border border-border/20 bg-card/30 p-4 space-y-3"
    >
      <SkeletonLine width="60%" height={14} />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <SkeletonLine key={i} width={`${80 - i * 15}%`} />
      ))}
    </motion.div>
  );
}

export function SkeletonCalendarGrid() {
  return (
    <div className="grid grid-cols-7 gap-1 p-4">
      {Array.from({ length: 35 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square rounded-lg bg-muted/20 shimmer"
          style={{ animationDelay: `${i * 30}ms` }}
        />
      ))}
    </div>
  );
}

export function SkeletonEventList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-3 rounded-xl border border-border/20 bg-card/30 p-3"
        >
          <div className="h-8 w-1 rounded-full bg-muted/40 shimmer" />
          <div className="flex-1 space-y-2">
            <SkeletonLine width="50%" height={13} />
            <SkeletonLine width="30%" height={10} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function SkeletonPage({ type = "list" }: { type?: "list" | "calendar" | "cards" }) {
  return (
    <div className="animate-in fade-in-0 duration-300">
      {/* Header skeleton */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="space-y-2">
          <SkeletonLine width={120} height={20} />
          <SkeletonLine width={80} height={10} />
        </div>
        <div className="h-9 w-9 rounded-full bg-muted/30 shimmer" />
      </div>

      {type === "calendar" && <SkeletonCalendarGrid />}
      {type === "list" && <SkeletonEventList />}
      {type === "cards" && (
        <div className="space-y-3 p-4">
          <SkeletonCard />
          <SkeletonCard lines={2} />
          <SkeletonCard lines={4} />
        </div>
      )}
    </div>
  );
}
