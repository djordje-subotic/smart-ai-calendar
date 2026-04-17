"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";

/**
 * Wraps page content with a smooth fade-in + subtle upward slide.
 * Drop this at the top of any page component:
 *
 *   <PageTransition>
 *     <YourContent />
 *   </PageTransition>
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
