import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | CalyM Automation",
  description:
    "How CalyM Automation handles account, Gmail, and Google Calendar data.",
};

const updatedAt = "June 18, 2026";
const contactEmail = "self.improvement4131@gmail.com";

const highlights = [
  "We use Google data only to power email and calendar actions you request.",
  "We do not sell Google user data or use it for advertising.",
  "You can revoke Google access from your Google Account at any time.",
];

const sections = [
  {
    title: "1. What CalyM Does",
    body: [
      "CalyM Automation is an AI-powered email and calendar manager. It helps users prepare Gmail messages, send approved emails, review replies, create Google Calendar events, detect scheduling conflicts, and manage reschedule or rejection workflows from one workspace.",
      "The app is designed to reduce repetitive email and meeting work while keeping the user in control of sensitive actions.",
    ],
  },
  {
    title: "2. Information We Collect",
    body: [
      "When you sign in with Google, CalyM may receive your basic profile information, including your name, email address, and profile image.",
      "When you connect Gmail or Google Calendar, CalyM may access the email and calendar data required to provide the features you request, such as message metadata, message content, recipient details, calendar availability, event details, and meeting attendees.",
    ],
  },
  {
    title: "3. How We Use Google User Data",
    body: [
      "CalyM uses Google user data to search and organize inbox items, prepare replies, send user-approved emails, create drafts, create calendar events, check for meeting conflicts, detect reply intent, and show scheduling status inside the dashboard.",
      "CalyM does not use Google user data for advertising. CalyM does not sell Google user data. CalyM does not transfer Google user data to third parties except as necessary to provide or improve user-facing features, comply with law, protect users, or when you explicitly direct us to do so.",
    ],
  },
  {
    title: "4. Google API Limited Use",
    body: [
      "CalyM's use and transfer of information received from Google APIs will adhere to the Google API Services User Data Policy, including the Limited Use requirements.",
      "Human access to Google user data is limited to cases where it is necessary for security, support, legal compliance, or with your explicit permission.",
    ],
  },
  {
    title: "5. Data Storage and Security",
    body: [
      "CalyM stores account, integration, and application data in secure infrastructure used to operate the product. We use reasonable technical and organizational safeguards to protect user data from unauthorized access, loss, misuse, or disclosure.",
      "No internet service can guarantee absolute security, but we design CalyM to limit data access to what is needed for product functionality and support.",
    ],
  },
  {
    title: "6. Data Retention and Deletion",
    body: [
      "CalyM keeps user data only as long as needed to provide the service, comply with legal obligations, resolve disputes, prevent abuse, or enforce agreements.",
      `You can request deletion of your CalyM account data by contacting ${contactEmail}. You can also disconnect integrations or revoke access directly from your Google Account permissions page.`,
    ],
  },
  {
    title: "7. Your Choices",
    body: [
      "You can choose not to connect Gmail or Google Calendar, although some features may not work without those integrations.",
      "You can revoke CalyM's Google access at any time from your Google Account. After access is revoked, CalyM will no longer be able to perform Gmail or Calendar actions for your account.",
    ],
  },
  {
    title: "8. Contact",
    body: [
      `For privacy questions, data deletion requests, or support, contact us at ${contactEmail}.`,
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f8ff] text-slate-950 dark:bg-[#070a13] dark:text-slate-50">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#f8fbff_0%,#edf4ff_44%,#eef2ff_100%)] dark:bg-[linear-gradient(135deg,#070a13_0%,#101426_52%,#111827_100%)]" />
        <div className="absolute left-[-12%] top-[-18%] h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-400/14" />
        <div className="absolute right-[-10%] top-[10%] h-[28rem] w-[28rem] rounded-full bg-violet-500/20 blur-3xl dark:bg-violet-500/16" />
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
              href="/terms"
            >
              Terms
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

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[0.85fr_1.15fr] lg:py-16">
        <aside className="lg:sticky lg:top-28 lg:h-fit">
          <div className="rounded-[2rem] border border-slate-200/70 bg-slate-50/78 p-6 shadow-2xl shadow-blue-950/8 backdrop-blur-2xl dark:border-white/10 dark:bg-white/7">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-700 dark:text-indigo-200">
              CalyM Automation
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Privacy Policy
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
              This policy explains what data CalyM uses, why we request Gmail
              and Google Calendar access, and how you stay in control.
            </p>
            <p className="mt-5 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-base font-semibold text-indigo-900 dark:border-indigo-300/20 dark:bg-indigo-400/10 dark:text-indigo-100">
              Last updated: {updatedAt}
            </p>
          </div>

          <div className="mt-5 grid gap-3">
            {highlights.map((highlight) => (
              <div
                className="rounded-2xl border border-slate-200/70 bg-white/76 p-4 text-base font-medium leading-7 text-slate-700 shadow-lg shadow-blue-950/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/6 dark:text-slate-200"
                key={highlight}
              >
                {highlight}
              </div>
            ))}
          </div>
        </aside>

        <article className="rounded-[2rem] border border-slate-200/70 bg-white/82 p-6 shadow-2xl shadow-blue-950/8 backdrop-blur-2xl dark:border-white/10 dark:bg-white/7 sm:p-10">
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
