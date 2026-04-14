"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service (Sentry, etc.)
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 mb-6">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight mb-2">Something went wrong</h1>
        <p className="text-sm text-muted-foreground mb-1">
          Don&apos;t worry, your data is safe.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/60 font-mono mb-6">Error ID: {error.digest}</p>
        )}

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button onClick={reset} className="gradient-primary border-0 text-primary-foreground">
            <RefreshCw className="mr-2 h-4 w-4" />Try again
          </Button>
          <Link href="/">
            <Button variant="outline">
              <Home className="mr-2 h-4 w-4" />Go home
            </Button>
          </Link>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          If this keeps happening,{" "}
          <a href="mailto:support@kron.app" className="text-primary hover:underline">contact support</a>
        </p>
      </div>
    </div>
  );
}
