import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/src/components/layout/Logo";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Krowna — the AI calendar that rules your time.",
};

const EFFECTIVE_DATE = "April 11, 2026";

export default function TermsPage() {
  return (
    <div className="min-h-full bg-background">
      <header className="sticky top-0 z-10 border-b border-border/30 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
          </Link>
          <nav className="flex items-center gap-5 text-xs text-muted-foreground">
            <Link href="/legal/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/login" className="hover:text-foreground">Sign in</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-widest text-primary/80">Legal</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">Terms of Service</h1>
          <p className="mt-2 text-sm text-muted-foreground">Effective date: {EFFECTIVE_DATE}</p>
        </div>

        <article className="prose prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-3 prose-p:text-sm prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-sm prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary">
          <p>
            Welcome to Krowna. These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of
            the Krowna web and mobile applications, including any features, content, and services
            offered by Krowna (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;). By creating an account or using Krowna, you
            agree to these Terms.
          </p>

          <h2>1. Your Account</h2>
          <p>
            You must be at least 13 years old to use Krowna. You are responsible for maintaining the
            security of your account credentials and for all activity on your account. Notify us
            immediately at <a href="mailto:support@krowna.com">support@krowna.com</a> if you suspect
            unauthorized access.
          </p>

          <h2>2. Acceptable Use</h2>
          <ul>
            <li>Do not use Krowna to violate any law or third-party rights.</li>
            <li>Do not attempt to reverse engineer, disrupt, or overload our services.</li>
            <li>Do not submit content that is unlawful, abusive, or infringing.</li>
            <li>Do not use Krowna to send spam or unsolicited communications.</li>
          </ul>

          <h2>3. Subscriptions, Credits & Payments</h2>
          <p>
            Krowna offers free and paid plans, as well as optional AI credit packs. Payments are
            processed by Lemon Squeezy, who acts as the Merchant of Record and handles applicable
            taxes. Subscriptions renew automatically until cancelled. You can cancel at any time
            from Settings; access continues until the end of the current billing period.
          </p>
          <p>
            AI credits are non-refundable once consumed. Subscription fees are non-refundable except
            where required by law.
          </p>

          <h2>4. AI Features</h2>
          <p>
            Krowna uses third-party large language models (including OpenAI and Anthropic) to power
            scheduling, planning, and voice features. AI output may be inaccurate or incomplete.
            You are responsible for reviewing AI suggestions before relying on them.
          </p>

          <h2>5. Your Content</h2>
          <p>
            You retain ownership of the events, tasks, notes, and other data you create in Krowna
            (&ldquo;Your Content&rdquo;). You grant us a limited license to store, process, and display Your
            Content solely to operate the service. We do not sell Your Content.
          </p>

          <h2>6. Third-Party Integrations</h2>
          <p>
            Krowna can connect to external services such as Google Calendar. Your use of those
            integrations is also governed by their terms. Disconnecting an integration stops future
            syncing but does not delete data already imported.
          </p>

          <h2>7. Service Availability</h2>
          <p>
            We work to keep Krowna reliable but do not guarantee uninterrupted availability. Features
            may change or be removed. We may suspend accounts that violate these Terms.
          </p>

          <h2>8. Termination</h2>
          <p>
            You can delete your account at any time from Settings. We may terminate or suspend
            access for violations of these Terms. On termination, we will delete or anonymize your
            data in line with our Privacy Policy.
          </p>

          <h2>9. Disclaimers</h2>
          <p>
            Krowna is provided &ldquo;as is&rdquo; without warranties of any kind. To the maximum extent
            permitted by law, we disclaim all implied warranties of merchantability, fitness for a
            particular purpose, and non-infringement.
          </p>

          <h2>10. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, our aggregate liability arising from your use of
            Krowna is limited to the amount you paid us in the 12 months preceding the claim. We are
            not liable for indirect, incidental, or consequential damages.
          </p>

          <h2>11. Changes to these Terms</h2>
          <p>
            We may update these Terms from time to time. Material changes will be communicated via
            email or in-app notice. Continued use after the effective date constitutes acceptance.
          </p>

          <h2>12. Contact</h2>
          <p>
            Questions? Reach us at <a href="mailto:support@krowna.com">support@krowna.com</a>.
          </p>
        </article>

        <div className="mt-12 flex items-center justify-between border-t border-border/30 pt-6 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">&larr; Back to Krowna</Link>
          <Link href="/legal/privacy" className="hover:text-foreground">Privacy Policy &rarr;</Link>
        </div>
      </main>
    </div>
  );
}
