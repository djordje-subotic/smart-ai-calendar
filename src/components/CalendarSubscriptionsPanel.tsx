"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarPlus, RefreshCw, Trash2, Link2, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addSubscription,
  deleteSubscription,
  listSubscriptions,
  syncSubscription,
  type CalendarSubscription,
} from "@/src/actions/calendarSubscriptions";

export function CalendarSubscriptionsPanel() {
  const [subs, setSubs] = useState<CalendarSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ label: "", url: "", provider: "apple" });

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await listSubscriptions();
    setSubs(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial CRUD fetch
    refresh();
  }, [refresh]);

  async function handleAdd() {
    if (!form.url.trim()) {
      setError("Paste your calendar's ICS / webcal URL");
      return;
    }
    setSaving(true);
    setError(null);
    const result = await addSubscription({
      label: form.label || (form.provider === "apple" ? "iCloud" : "External calendar"),
      icsUrl: form.url,
      provider: form.provider,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setForm({ label: "", url: "", provider: "apple" });
    setShowAdd(false);
    refresh();
  }

  async function handleSync(id: string) {
    setSyncingId(id);
    await syncSubscription(id);
    setSyncingId(null);
    refresh();
  }

  async function handleDelete(id: string) {
    await deleteSubscription(id);
    setSubs((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Paste a public ICS / webcal URL from iCloud, Outlook, or any calendar provider.
        </p>
        <Button
          size="sm"
          onClick={() => setShowAdd(!showAdd)}
          className="gradient-primary border-0 text-primary-foreground"
        >
          <CalendarPlus className="mr-1 h-3 w-3" /> Add
        </Button>
      </div>

      {showAdd && (
        <div className="rounded-xl border border-border/40 bg-card p-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Name</Label>
            <Input
              placeholder="iCloud personal"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Calendar URL</Label>
            <Input
              placeholder="webcal://p01-caldav.icloud.com/published/…"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
            />
            <p className="text-[11px] text-muted-foreground">
              In Apple Calendar → File → Share Calendar → Public → copy URL.
            </p>
          </div>
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-2 text-xs text-destructive">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => { setShowAdd(false); setError(null); }} className="flex-1">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={saving}
              className="flex-1 gradient-primary border-0 text-primary-foreground"
            >
              {saving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              {saving ? "Connecting..." : "Connect"}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-border/40 bg-muted/10 p-4 text-xs text-muted-foreground">
          Loading...
        </div>
      ) : subs.length === 0 && !showAdd ? (
        <div className="rounded-xl border border-dashed border-border/40 bg-muted/10 p-5 text-center">
          <Link2 className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
          <p className="text-sm font-medium">No calendars connected</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Bring your Apple, Outlook, or any ICS feed into Kron.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {subs.map((sub) => (
            <div key={sub.id} className="rounded-xl border border-border/40 bg-card p-3">
              <div className="flex items-start gap-3">
                <div
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: sub.color + "33" }}
                >
                  <Link2 className="h-4 w-4" style={{ color: sub.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold">{sub.label}</p>
                    {sub.last_sync_error ? (
                      <AlertTriangle className="h-3 w-3 text-destructive" />
                    ) : sub.last_synced_at ? (
                      <CheckCircle2 className="h-3 w-3 text-green-400" />
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {sub.event_count} events ·{" "}
                    {sub.last_synced_at
                      ? `synced ${formatDistanceToNow(new Date(sub.last_synced_at), { addSuffix: true })}`
                      : "not synced yet"}
                  </p>
                  {sub.last_sync_error && (
                    <p className="mt-1 truncate text-[11px] text-destructive">{sub.last_sync_error}</p>
                  )}
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => handleSync(sub.id)}
                  disabled={syncingId === sub.id}
                >
                  {syncingId === sub.id ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-1 h-3 w-3" />
                  )}
                  Resync
                </Button>
                <div className="flex-1" />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-destructive/70 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleDelete(sub.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
