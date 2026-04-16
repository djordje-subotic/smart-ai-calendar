import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/src/components/providers";
import { CookieBanner } from "@/src/components/CookieBanner";
import { THEME_BOOTSTRAP_SCRIPT } from "@/src/components/ThemeToggle";
import { Toaster } from "sonner";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://krowna.com";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Krowna — Rule Your Time",
    template: "%s · Krowna",
  },
  description: "The AI calendar that schedules your day, protects your focus, and adapts when plans change. Voice assistant, smart templates, focus mode, and more.",
  keywords: [
    "AI calendar",
    "smart calendar",
    "productivity app",
    "time management",
    "voice calendar",
    "schedule optimizer",
    "focus mode",
    "habit tracker",
    "task manager",
  ],
  authors: [{ name: "Krowna" }],
  creator: "Krowna",
  publisher: "Krowna",
  applicationName: "Krowna",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    title: "Krowna — Rule Your Time",
    description: "The AI calendar that rules your schedule so you don't have to.",
    siteName: "Krowna",
  },
  twitter: {
    card: "summary_large_image",
    title: "Krowna — Rule Your Time",
    description: "The AI calendar that rules your schedule so you don't have to.",
    creator: "@krownaapp",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  // Icons are auto-detected from app/icon.tsx and app/apple-icon.tsx
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0f0b15",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${jetbrains.variable} h-full dark`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body className="h-full bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              color: "hsl(var(--foreground))",
            },
          }}
        />
        <CookieBanner />
      </body>
    </html>
  );
}
