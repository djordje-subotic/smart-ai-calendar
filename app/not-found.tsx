import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md text-center">
        <h1 className="text-7xl font-black gradient-text mb-2">404</h1>
        <p className="text-xl font-bold tracking-tight mb-2">Page not found</p>
        <p className="text-sm text-muted-foreground mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link href="/calendar">
            <Button className="gradient-primary border-0 text-primary-foreground">
              <Home className="mr-2 h-4 w-4" />Go to calendar
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
