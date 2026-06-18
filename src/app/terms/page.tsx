import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | CalyM",
  description: "Terms for using CalyM email and calendar automation.",
};

const updatedAt = "June 18, 2026";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f6f8ff] px-4 py-10 text-slate-950 dark:bg-[#070a13] dark:text-slate-50">
      <section className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-xl shadow-blue-950/5 backdrop-blur dark:border-white/10 dark:bg-white/7 sm:p-10">
        <Link
          className="text-base font-semibold text-indigo-700 dark:text-indigo-200"
          href="/"
        >
          Back to CalyM
        </Link>

        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.22em] text-indigo-700 dark:text-indigo-200">
          CalyM Automation
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Terms of Service
        </h1>
        <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
          Last updated: {updatedAt}
        </p>

        <div className="mt-8 grid gap-7 text-base leading-8 text-slate-700 dark:text-slate-200">
          <section>
            <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
              1. Acceptance of Terms
            </h2>
            <p className="mt-3">
              By using CalyM, you agree to these Terms of Service. If you do not
              agree, do not use the application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
              2. Service Description
            </h2>
            <p className="mt-3">
              CalyM helps users manage Gmail and Google Calendar workflows,
              including preparing emails, sending user-approved messages,
              reviewing replies, detecting reschedule or rejection messages, and
              creating calendar events.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
              3. User Responsibilities
            </h2>
            <p className="mt-3">You are responsible for:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Using CalyM lawfully and responsibly.</li>
              <li>Reviewing emails, calendar events, and automated actions before approval.</li>
              <li>Ensuring prompts and recipient information are accurate.</li>
              <li>Maintaining the security of your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
              4. Google Integrations
            </h2>
            <p className="mt-3">
              CalyM requires user-authorized access to Google services for Gmail
              and Calendar functionality. You can revoke access through your
              Google Account settings at any time. If access is revoked, some
              features may stop working.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
              5. Human Review
            </h2>
            <p className="mt-3">
              CalyM is designed to help prepare and execute productivity
              actions. You should review sensitive actions before sending
              emails, creating events, changing schedules, or responding to
              messages.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
              6. No Warranty
            </h2>
            <p className="mt-3">
              CalyM is provided on an &quot;as is&quot; and &quot;as
              available&quot; basis. We do not guarantee that the service will
              be uninterrupted, error-free, or always accurate.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
              7. Limitation of Liability
            </h2>
            <p className="mt-3">
              To the maximum extent permitted by law, CalyM and its owner are
              not liable for indirect, incidental, special, consequential, or
              punitive damages arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
              8. Changes to Terms
            </h2>
            <p className="mt-3">
              We may update these terms as the product changes. The updated
              version will be posted on this page with a revised date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
              9. Contact
            </h2>
            <p className="mt-3">
              For questions about these terms, contact the CalyM app owner using
              the support email listed in the Google OAuth consent screen.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
