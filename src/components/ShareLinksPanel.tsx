"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Copy, Link2, Plus, Trash2, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createShareLink,
  deleteShareLink,
  getShareLinks,
  updateShareLink,
  type ShareLink,
} from "@/src/actions/share";

export function ShareLinksPanel() {
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await getShareLinks();
    setLinks(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial CRUD fetch
    refresh();
  }, [refresh]);

  function publicUrl(slug: string) {
    if (typeof window === "undefined") return `/share/${slug}`;
    return `${window.location.origin}/share/${slug}`;
  }

  async function handleCreate() {
    startTransition(async () => {
      const link = await createShareLink({
        title: "Book time with me",
        duration_minutes: 30,
        days_ahead: 14,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      if (link) setLinks((prev) => [link, ...prev]);
    });
  }

  async function handleCopy(slug: string) {
    try {
      await navigator.clipboard.writeText(publicUrl(slug));
      setCopied(slug);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  }

  async function handleToggle(link: ShareLink) {
    const updated = await updateShareLink(link.id, { enabled: !link.enabled });
    if (updated) {
      setLinks((prev) => prev.map((l) => (l.id === link.id ? updated : l)));
    }
  }

  async function handleDelete(id: string) {
    await deleteShareLink(id);
    setLinks((prev) => prev.filter((l) => l.id !== id));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Share a public link so others can book open time without signing in.
        </p>
        <Button
          size="sm"
          onClick={handleCreate}
          disabled={pending}
          className="gradient-primary border-0 text-primary-foreground"
        >
          <Plus className="mr-1 h-3 w-3" /> New link
        </Button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border/40 bg-muted/10 p-4 text-xs text-muted-foreground">
          Loading...
        </div>
      ) : links.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/40 bg-muted/10 p-5 text-center">
          <Link2 className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
          <p className="text-sm font-medium">No share links yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Create one to let anyone pick a time on your calendar.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {links.map((link) => {
            const url = publicUrl(link.slug);
            const wasCopied = copied === link.slug;
            return (
              <div
                key={link.id}
                className={`rounded-xl border p-3 ${
                  link.enabled ? "border-border/40 bg-card" : "border-border/20 bg-muted/10 opacity-60"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/15">
                    <Link2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{link.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {link.duration_minutes} min · next {link.days_ahead} days ·{" "}
                      {link.earliest_hour}:00–{link.latest_hour}:00
                    </p>
                    <button
                      onClick={() => handleCopy(link.slug)}
                      className="mt-2 flex w-full items-center gap-2 rounded-md border border-border/30 bg-muted/20 px-2 py-1 text-left text-xs hover:border-primary/40"
                    >
                      {wasCopied ? (
                        <Check className="h-3 w-3 flex-shrink-0 text-green-400" />
                      ) : (
                        <Copy className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                      )}
                      <span className="truncate font-mono">{url}</span>
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-3 w-3" /> Preview
                  </a>
                  <div className="flex-1" />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => handleToggle(link)}
                  >
                    {link.enabled ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-destructive/70 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDelete(link.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
