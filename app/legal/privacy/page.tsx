import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/src/components/layout/Logo";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Krowna collects, uses, and protects your data.",
};

const EFFECTIVE_DATE = "April 11, 2026";

export default function PrivacyPage() {
  return (
    <div className="min-h-full bg-background">
      <header className="sticky top-0 z-10 border-b border-border/30 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
          </Link>
          <nav className="flex items-center gap-5 text-xs text-muted-foreground">
            <Link href="/legal/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/login" className="hover:text-foreground">Sign in</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-widest text-primary/80">Legal</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">Privacy Policy</h1>
          <p className="mt-2 text-sm text-muted-foreground">Effective date: {EFFECTIVE_DATE}</p>
        </div>

        <article className="prose prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-3 prose-p:text-sm prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-sm prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary">
          <p>
            This Privacy Policy explains how Krowna (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) collects, uses, and
            protects your information when you use the Krowna web and mobile apps. We designed Krowna
            to collect the minimum data required to deliver the service.
          </p>

          <h2>1. Information We Collect</h2>
          <ul>
            <li><strong>Account data:</strong> email address, hashed password, display name, avatar.</li>
            <li><strong>Calendar data:</strong> events, tasks, habits, goals, notes, and reminders you create.</li>
            <li><strong>Profile data:</strong> working hours, focus preferences, goals, and other details you share with the AI.</li>
            <li><strong>Connected accounts:</strong> tokens and metadata from integrations you enable (e.g., Google Calendar).</li>
            <li><strong>Usage data:</strong> feature interactions, device type, crash logs, and diagnostic events.</li>
            <li><strong>Billing data:</strong> plan tier, credits balance, and payment receipts. Card details are handled by Lemon Squeezy; we never see them.</li>
          </ul>

          <h2>2. How We Use Your Data</h2>
          <ul>
            <li>To operate and improve the service.</li>
            <li>To power AI scheduling, planning, and voice features on your behalf.</li>
            <li>To communicate about your account, billing, and product updates.</li>
            <li>To detect abuse, debug issues, and secure the platform.</li>
          </ul>

          <h2>3. AI Processing</h2>
          <p>
            When you use AI features, we send the minimum context required (such as your prompt,
            relevant events, and profile snippets) to our model providers — OpenAI and Anthropic.
            Both providers operate under zero-retention agreements for API traffic and do not train
            their models on your content. Your raw calendar is never uploaded in bulk.
          </p>

          <h2>4. Sharing</h2>
          <p>We share data only with the service providers required to run Krowna:</p>
          <ul>
            <li><strong>Supabase</strong> — database and authentication hosting (EU/US regions).</li>
            <li><strong>OpenAI & Anthropic</strong> — AI inference for your requests.</li>
            <li><strong>Lemon Squeezy</strong> — payment processing and Merchant of Record for taxes.</li>
            <li><strong>Google</strong> — calendar sync (only if you connect it).</li>
            <li><strong>Vercel</strong> — web hosting and edge delivery.</li>
          </ul>
          <p>We do not sell or rent your personal data.</p>

          <h2>5. Cookies & Local Storage</h2>
          <p>
            We use strictly necessary cookies for authentication and essential app state. We also
            store small preferences (e.g., completed onboarding, view settings) in your browser&apos;s
            local storage. We do not use third-party advertising cookies.
          </p>

          <h2>6. Data Retention</h2>
          <p>
            We keep your data while your account is active. On deletion, personal data is removed
            or anonymized within 30 days, except where retention is required by law (e.g., invoices).
          </p>

          <h2>7. Your Rights</h2>
          <p>
            Depending on where you live (EEA, UK, California, and other jurisdictions), you may
            have rights to access, correct, export, or delete your personal data. You can exercise
            most of these rights directly from Settings, or by emailing
            <a href="mailto:privacy@krowna.com"> privacy@krowna.com</a>.
          </p>

          <h2>8. International Transfers</h2>
          <p>
            Your data may be processed in countries outside your own. When transferring data out of
            the EEA or UK, we rely on appropriate safeguards such as Standard Contractual Clauses.
          </p>

          <h2>9. Security</h2>
          <p>
            We use TLS in transit, encryption at rest, row-level security, and least-privilege
            access controls. No system is perfectly secure — if you suspect a vulnerability, please
            report it to <a href="mailto:security@krowna.com">security@krowna.com</a>.
          </p>

          <h2>10. Children</h2>
          <p>
            Krowna is not directed at children under 13. If we learn we have collected data from a
            child under 13, we will delete it.
          </p>

          <h2>11. Changes</h2>
          <p>
            We may update this Privacy Policy. Material changes will be announced by email or
            in-app notice at least 14 days before taking effect.
          </p>

          <h2>12. Contact</h2>
          <p>
            Questions about privacy? Email <a href="mailto:privacy@krowna.com">privacy@krowna.com</a>.
          </p>
        </article>

        <div className="mt-12 flex items-center justify-between border-t border-border/30 pt-6 text-xs text-muted-foreground">
          <Link href="/legal/terms" className="hover:text-foreground">&larr; Terms of Service</Link>
          <Link href="/" className="hover:text-foreground">Back to Krowna &rarr;</Link>
        </div>
      </main>
    </div>
  );
}
