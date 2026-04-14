"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "kron-cookie-consent-v1";

export function CookieBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        // Small delay so it doesn't fight with page load animations
        const t = setTimeout(() => setOpen(true), 800);
        return () => clearTimeout(t);
      }
    } catch {}
  }, []);

  function persist(value: "accepted" | "essential") {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ value, at: new Date().toISOString() })
      );
    } catch {}
    setOpen(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", damping: 24, stiffness: 260 }}
          className="fixed bottom-4 left-4 right-4 z-[90] sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-md"
        >
          <div className="rounded-2xl border border-primary/20 bg-card/95 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/15">
                <Cookie className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Cookies &amp; privacy</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  We use essential cookies to keep you signed in and remember preferences. No
                  ads, no tracking. Read our{" "}
                  <Link href="/legal/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="flex-1 text-xs"
                onClick={() => persist("essential")}
              >
                Essential only
              </Button>
              <Button
                size="sm"
                className="flex-1 gradient-primary border-0 text-xs text-primary-foreground"
                onClick={() => persist("accepted")}
              >
                Accept all
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
