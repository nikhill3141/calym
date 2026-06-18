import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | CalyM Automation",
  description:
    "Terms for using CalyM Automation email and calendar management features.",
};

const updatedAt = "June 18, 2026";
const contactEmail = "self.improvement4131@gmail.com";

const summaryCards = [
  {
    label: "User control",
    text: "You are responsible for reviewing prompts, recipients, emails, and calendar actions before using CalyM.",
  },
  {
    label: "Google access",
    text: "Gmail and Calendar features require your authorized Google integration access.",
  },
  {
    label: "Responsible use",
    text: "Use CalyM lawfully and only for accounts, emails, and meetings you are permitted to manage.",
  },
];

const sections = [
  {
    title: "1. Acceptance of Terms",
    body: [
      "By accessing or using CalyM Automation, you agree to these Terms of Service. If you do not agree to these terms, do not use the application.",
      "These terms apply to the CalyM website, dashboard, Gmail integration, Google Calendar integration, and related automation features.",
    ],
  },
  {
    title: "2. Service Description",
    body: [
      "CalyM is an AI-powered meeting and email manager that helps users prepare and send Gmail messages, create and review Google Calendar events, detect scheduling conflicts, classify replies, and manage reschedule or rejection workflows.",
      "CalyM may generate drafts, suggested replies, meeting details, and action recommendations based on your prompts and connected account data.",
    ],
  },
  {
    title: "3. Account and Access",
    body: [
      "You may need to sign in with Google and authorize Gmail or Google Calendar access to use core features. You are responsible for maintaining the security of your account and for all activity that occurs through your account.",
      "You can revoke Google access at any time from your Google Account permissions page. If access is revoked, email and calendar features may stop working.",
    ],
  },
  {
    title: "4. User Responsibilities",
    body: [
      "You are responsible for ensuring that prompts, recipient addresses, meeting details, email content, and calendar actions are accurate before they are sent, created, updated, or approved.",
      "You agree not to use CalyM for spam, abusive messages, unlawful activity, unauthorized access, harassment, or any activity that violates applicable laws or third-party rights.",
    ],
  },
  {
    title: "5. AI-Generated Content and Human Review",
    body: [
      "CalyM may use AI to generate message suggestions, subjects, summaries, classifications, and scheduling recommendations. AI output can be incomplete or incorrect.",
      "You should review sensitive actions before sending emails, creating meetings, changing schedules, or responding to messages. CalyM is a productivity assistant, not a replacement for your judgment.",
    ],
  },
  {
    title: "6. Google Integrations",
    body: [
      "CalyM uses user-authorized Google integrations to provide Gmail and Google Calendar features. These integrations are used only to provide the user-facing functionality described in the product and privacy policy.",
      "Your use of Google services through CalyM is also subject to Google's applicable terms and policies.",
    ],
  },
  {
    title: "7. Availability and Changes",
    body: [
      "CalyM may change, suspend, or discontinue features as the product evolves. We may also update these terms from time to time and will post the updated version on this page.",
      "We try to keep CalyM reliable, but we do not guarantee that the service will be uninterrupted, error-free, or available at all times.",
    ],
  },
  {
    title: "8. No Warranty",
    body: [
      'CalyM is provided on an "as is" and "as available" basis. To the maximum extent permitted by law, we disclaim warranties of merchantability, fitness for a particular purpose, non-infringement, and uninterrupted operation.',
    ],
  },
  {
    title: "9. Limitation of Liability",
    body: [
      "To the maximum extent permitted by law, CalyM and its owner are not liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for loss of profits, data, goodwill, or business opportunities arising from use of the service.",
    ],
  },
  {
    title: "10. Contact",
    body: [
      `For questions about these terms, contact us at ${contactEmail}.`,
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f8ff] text-slate-950 dark:bg-[#070a13] dark:text-slate-50">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#f8fbff_0%,#edf4ff_44%,#eef2ff_100%)] dark:bg-[linear-gradient(135deg,#070a13_0%,#101426_52%,#111827_100%)]" />
        <div className="absolute right-[-12%] top-[-18%] h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-400/14" />
        <div className="absolute bottom-[-20%] left-[8%] h-[30rem] w-[30rem] rounded-full bg-cyan-500/18 blur-3xl dark:bg-cyan-500/12" />
      </div>

      <header className="border-b border-slate-200/70 bg-slate-50/76 px-4 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/58">
        <nav className="mx-auto flex h-20 max-w-6xl items-center justify-between">
          <Link className="flex h-14 items-center" href="/">
            <Image
              alt="CalyM Automation"
              className="h-12 w-auto object-contain dark:hidden"
              height={174}
              priority
              src="/calym-logo-light.png"
              width={389}
            />
            <Image
              alt="CalyM Automation"
              className="hidden h-12 w-auto object-contain dark:block"
              height={174}
              priority
              src="/calym-logo-dark.png"
              width={389}
            />
          </Link>
          <div className="flex items-center gap-3 text-base font-semibold">
            <Link
              className="rounded-full px-4 py-2 text-slate-600 transition hover:bg-slate-900/5 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white"
              href="/privacy"
            >
              Privacy
            </Link>
            <Link
              className="rounded-full bg-slate-950 px-5 py-2.5 text-white shadow-lg shadow-blue-500/10 dark:bg-white dark:text-slate-950"
              href="/"
            >
              Back home
            </Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-12 lg:py-16">
        <div className="rounded-[2rem] border border-slate-200/70 bg-slate-50/78 p-6 shadow-2xl shadow-blue-950/8 backdrop-blur-2xl dark:border-white/10 dark:bg-white/7 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-700 dark:text-indigo-200">
                CalyM Automation
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                Terms of Service
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                These terms explain the rules for using CalyM&apos;s email,
                calendar, and AI-assisted workflow features.
              </p>
            </div>
            <div className="rounded-3xl border border-indigo-200 bg-indigo-50 p-5 text-indigo-950 dark:border-indigo-300/20 dark:bg-indigo-400/10 dark:text-indigo-50">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-700 dark:text-indigo-200">
                Last updated
              </p>
              <p className="mt-2 text-3xl font-semibold">{updatedAt}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {summaryCards.map((card) => (
            <div
              className="rounded-3xl border border-slate-200/70 bg-white/78 p-5 shadow-xl shadow-blue-950/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/6"
              key={card.label}
            >
              <p className="text-base font-semibold text-indigo-700 dark:text-indigo-200">
                {card.label}
              </p>
              <p className="mt-3 text-base leading-7 text-slate-700 dark:text-slate-200">
                {card.text}
              </p>
            </div>
          ))}
        </div>

        <article className="mt-6 rounded-[2rem] border border-slate-200/70 bg-white/82 p-6 shadow-2xl shadow-blue-950/8 backdrop-blur-2xl dark:border-white/10 dark:bg-white/7 sm:p-10">
          <div className="grid gap-8">
            {sections.map((section) => (
              <section
                className="border-b border-slate-200 pb-8 last:border-0 last:pb-0 dark:border-white/10"
                key={section.title}
              >
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  {section.title}
                </h2>
                <div className="mt-4 grid gap-4 text-lg leading-8 text-slate-700 dark:text-slate-200">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
