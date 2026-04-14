"use client";

import { useState } from "react";
import { Bell, BellOff, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  areNotificationsEnabled,
  getNotificationSupport,
  requestNotificationPermission,
  setNotificationsEnabled,
  showNotification,
  type NotificationSupport,
} from "@/src/lib/notifications";

export function NotificationSettings() {
  // Lazy init keeps the browser-API read out of the effect body (avoids
  // React 19's set-state-in-effect warning). Hydration mismatch is fine —
  // this is a client-only component.
  const [support, setSupport] = useState<NotificationSupport>(() =>
    typeof window === "undefined" ? "unsupported" : getNotificationSupport()
  );
  const [enabled, setEnabled] = useState(() =>
    typeof window === "undefined" ? false : areNotificationsEnabled()
  );


  async function handleEnable() {
    const result = await requestNotificationPermission();
    setSupport(result);
    if (result === "granted") {
      setNotificationsEnabled(true);
      setEnabled(true);
      showNotification("Notifications enabled", {
        body: "You'll get a heads-up before your events start.",
      });
    }
  }

  function handleDisable() {
    setNotificationsEnabled(false);
    setEnabled(false);
  }

  if (support === "unsupported") {
    return (
      <div className="rounded-xl border border-border/40 bg-muted/20 p-4 text-sm text-muted-foreground">
        Your browser doesn&apos;t support notifications.
      </div>
    );
  }

  if (support === "denied") {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm">
        <p className="font-semibold text-destructive">Notifications blocked</p>
        <p className="mt-1 text-xs text-muted-foreground">
          You&apos;ve blocked Kron notifications in your browser. Re-enable them from your browser&apos;s site
          settings, then refresh this page.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/40 bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
          {enabled ? (
            <Bell className="h-4 w-4 text-primary" />
          ) : (
            <BellOff className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Event reminders</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {enabled
              ? "Kron will ping you before your events start."
              : "Get a desktop notification before your next event."}
          </p>
        </div>
        {enabled ? (
          <Button size="sm" variant="ghost" onClick={handleDisable}>
            <Check className="mr-1 h-3 w-3" /> On
          </Button>
        ) : (
          <Button size="sm" onClick={handleEnable} className="gradient-primary border-0 text-primary-foreground">
            Enable
          </Button>
        )}
      </div>
    </div>
  );
}
