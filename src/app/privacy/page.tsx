import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | CalyM",
  description: "How CalyM handles Gmail, Google Calendar, and account data.",
};

const updatedAt = "June 18, 2026";

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
          Last updated: {updatedAt}
        </p>

        <div className="mt-8 grid gap-7 text-base leading-8 text-slate-700 dark:text-slate-200">
          <section>
            <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
              1. What CalyM Does
            </h2>
            <p className="mt-3">
              CalyM is an email and calendar automation tool that helps users
              search mail, prepare replies, send emails, create calendar events,
              review meeting conflicts, and manage scheduling workflows.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
              2. Information We Collect
            </h2>
            <p className="mt-3">
              When you sign in with Google, CalyM may receive basic account
              information such as your name, email address, and profile image.
              When you connect integrations, CalyM may access Gmail and Google
              Calendar data needed to provide the product features you request.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
              3. Google User Data
            </h2>
            <p className="mt-3">
              CalyM uses Google user data only to provide user-facing email and
              calendar functionality. This may include reading message metadata
              and message content, sending emails you approve, creating drafts,
              reading calendar availability, and creating or reviewing calendar
              events.
            </p>
            <p className="mt-3">
              CalyM does not sell Google user data. CalyM does not use Google
              user data for advertising. CalyM does not transfer Google user
              data to third parties except as necessary to provide and operate
              the application, comply with law, protect users, or with your
              explicit direction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
              4. How We Use Information
            </h2>
            <p className="mt-3">We use information to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Authenticate your account.</li>
              <li>Connect Gmail and Google Calendar integrations.</li>
              <li>Prepare and send user-approved emails.</li>
              <li>Create, inspect, and manage calendar events.</li>
              <li>Detect replies that may require action, such as rejection or reschedule requests.</li>
              <li>Improve reliability, security, and product experience.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
              5. Data Storage and Security
            </h2>
            <p className="mt-3">
              CalyM stores account, integration, and application data in its
              database. We use reasonable technical and organizational measures
              to protect user data. No internet service can guarantee absolute
              security, but we work to limit access to data based on product
              need.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
              6. Data Retention and Deletion
            </h2>
            <p className="mt-3">
              CalyM keeps user data only as long as needed to provide the
              service, meet legal obligations, resolve disputes, or enforce
              agreements. You may disconnect integrations or request deletion of
              your account data by contacting the app owner.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
              7. Your Choices
            </h2>
            <p className="mt-3">
              You can revoke CalyM&apos;s Google access at any time from your
              Google Account permissions page. You can also stop using the
              service or request deletion of application data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
              8. Contact
            </h2>
            <p className="mt-3">
              For privacy questions or deletion requests, contact the CalyM app
              owner using the support email listed in the Google OAuth consent
              screen.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
