"use client";

import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock3,
  Mail,
  MailCheck,
  Menu,
  Moon,
  PlayCircle,
  RefreshCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  Workflow,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion, type TargetAndTransition } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Workflow", href: "#workflow" },
  { label: "Use Cases", href: "#use-cases" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

const promptSteps = [
  "Understands intent",
  "Creates calendar meeting",
  "Sends follow-up email",
  "Tracks replies",
  "Notifies if rescheduling is needed",
];

const features: {
  description: string;
  icon: LucideIcon;
  title: string;
}[] = [
  {
    title: "Prompt-Based Scheduling",
    description: "Create meetings naturally using simple text prompts.",
    icon: CalendarPlus,
  },
  {
    title: "AI Follow-Up Emails",
    description: "Automatically send contextual follow-up emails after meetings.",
    icon: MailCheck,
  },
  {
    title: "Reschedule Detection",
    description: "Detect negative or reschedule replies and notify the user instantly.",
    icon: RefreshCcw,
  },
  {
    title: "Smart Notifications",
    description: "Get alerts inside CalyM when action is required.",
    icon: BellRing,
  },
  {
    title: "Email + Calendar Automation",
    description: "Connect your communication and scheduling into one AI workflow.",
    icon: Workflow,
  },
  {
    title: "Human-in-the-Loop Control",
    description: "CalyM asks before taking sensitive actions like rescheduling.",
    icon: ShieldCheck,
  },
];

const workflowSteps = [
  "User enters a natural language prompt",
  "CalyM understands meeting and email intent",
  "Meeting is created automatically",
  "Follow-up email is generated and sent",
  "Incoming replies are analyzed",
  "If reply is negative or asks to reschedule, CalyM notifies the user",
  "User can approve reschedule or send another email",
];

const useCases = [
  "Founders managing investor meetings",
  "Freelancers handling client calls",
  "Sales teams sending follow-ups",
  "Students scheduling project discussions",
  "Teams coordinating internal meetings",
  "Creators managing collaboration emails",
];

const faqs = [
  {
    question: "Can CalyM create meetings from prompts?",
    answer: "Yes, users can create meetings using simple natural language prompts.",
  },
  {
    question: "Can it send follow-up emails?",
    answer: "Yes, CalyM can generate and send contextual follow-up emails.",
  },
  {
    question: "What happens if someone replies negatively?",
    answer:
      "CalyM detects negative or reschedule replies and notifies the user for approval.",
  },
  {
    question: "Does CalyM support dark and light mode?",
    answer: "Yes, the landing page supports both modes with a smooth toggle.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 },
};

function cx(...classes: (false | null | string | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function CalymLandingPage() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") {
      return "dark";
    }

    const savedTheme = window.localStorage.getItem("calym-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    return savedTheme === "light" || (!savedTheme && !prefersDark)
      ? "light"
      : "dark";
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("calym-theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => {
      const nextTheme = current === "dark" ? "light" : "dark";

      document.documentElement.classList.toggle("dark", nextTheme === "dark");
      window.localStorage.setItem("calym-theme", nextTheme);

      return nextTheme;
    });
  }

  async function startAutomating() {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/integrations",
    });
  }

  const floatAnimation: TargetAndTransition | undefined = shouldReduceMotion
    ? undefined
    : {
        y: [0, -12, 0],
        transition: { duration: 6, repeat: Infinity, ease: "easeInOut" },
      };

  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f8ff] text-slate-950 dark:bg-[#070a13] dark:text-slate-50">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#f8fbff_0%,#edf4ff_44%,#eef2ff_100%)] dark:bg-[linear-gradient(135deg,#070a13_0%,#101426_52%,#111827_100%)]" />
        <div className="absolute left-[-10%] top-[-14%] h-80 w-80 rounded-full bg-cyan-400/25 blur-3xl dark:bg-cyan-400/18" />
        <div className="absolute right-[-12%] top-[8%] h-96 w-96 rounded-full bg-violet-500/25 blur-3xl dark:bg-violet-500/20" />
        <div className="absolute bottom-[-18%] left-[20%] h-[28rem] w-[28rem] rounded-full bg-blue-500/20 blur-3xl dark:bg-blue-500/16" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:72px_72px] opacity-50 dark:bg-[linear-gradient(rgba(248,250,252,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(248,250,252,0.05)_1px,transparent_1px)]" />
      </div>

      <Navbar
        isMenuOpen={isMenuOpen}
        onMenuToggle={() => setIsMenuOpen((current) => !current)}
        onStart={startAutomating}
        onThemeToggle={toggleTheme}
        theme={theme}
      />

      <HeroSection floatAnimation={floatAnimation} onStart={startAutomating} />
      <PromptDemo />
      <FeatureSection />
      <WorkflowSection />
      <UseCasesSection />
      <DashboardPreview floatAnimation={floatAnimation} />
      <PricingSection onStart={startAutomating} />
      <CTASection onStart={startAutomating} />
      <FAQSection />
      <Footer />
    </main>
  );
}

function Navbar({
  isMenuOpen,
  onMenuToggle,
  onStart,
  onThemeToggle,
  theme,
}: {
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  onStart: () => void;
  onThemeToggle: () => void;
  theme: "dark" | "light";
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-slate-50/72 px-4 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/58">
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between">
        <a className="flex h-16 items-center" href="#">
          <Image
            alt="CalyM Automation"
            className="h-14 w-auto object-contain dark:hidden"
            height={174}
            priority
            src="/calym-logo-light.png"
            width={389}
          />
          <Image
            alt="CalyM Automation"
            className="hidden h-14 w-auto object-contain dark:block"
            height={174}
            priority
            src="/calym-logo-dark.png"
            width={389}
          />
        </a>

        <div className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <a
              className="text-base font-medium text-slate-600 transition-colors hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle onToggle={onThemeToggle} theme={theme} />
          <button
            className="rounded-full bg-slate-950 px-5 py-3 text-base font-semibold text-slate-50 shadow-xl shadow-blue-500/10 transition hover:-translate-y-0.5 hover:shadow-blue-500/20 dark:bg-slate-50 dark:text-slate-950"
            onClick={onStart}
            type="button"
          >
            Start Automating
          </button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle onToggle={onThemeToggle} theme={theme} />
          <button
            aria-label="Toggle navigation menu"
            className="rounded-full border border-slate-200 bg-slate-50/80 p-3 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
            onClick={onMenuToggle}
            type="button"
          >
            {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {isMenuOpen ? (
        <div className="mx-auto grid max-w-7xl gap-3 border-t border-slate-200/70 py-4 lg:hidden dark:border-white/10">
          {navLinks.map((link) => (
            <a
              className="rounded-2xl px-4 py-3 text-base font-medium text-slate-700 dark:text-slate-200"
              href={link.href}
              key={link.href}
              onClick={onMenuToggle}
            >
              {link.label}
            </a>
          ))}
          <button
            className="mt-2 rounded-2xl bg-slate-950 px-5 py-4 text-base font-semibold text-slate-50 dark:bg-slate-50 dark:text-slate-950"
            onClick={onStart}
            type="button"
          >
            Start Automating
          </button>
        </div>
      ) : null}
    </header>
  );
}

function ThemeToggle({
  onToggle,
  theme,
}: {
  onToggle: () => void;
  theme: "dark" | "light";
}) {
  return (
    <button
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="relative flex h-12 w-[6.4rem] items-center rounded-full border border-slate-200 bg-slate-100 p-1 shadow-inner dark:border-white/10 dark:bg-white/8"
      onClick={onToggle}
      type="button"
    >
      <motion.span
        className="absolute top-1 size-10 rounded-full bg-slate-50 shadow-lg shadow-blue-500/20 dark:bg-slate-900"
        layout
        animate={{ left: theme === "dark" ? "3.55rem" : "0.25rem" }}
        transition={{ type: "spring", stiffness: 420, damping: 30 }}
      />
      <span className="relative z-10 flex w-full items-center justify-between px-2 text-slate-600 dark:text-slate-300">
        <Sun className="size-4" />
        <Moon className="size-4" />
      </span>
    </button>
  );
}

function HeroSection({
  floatAnimation,
  onStart,
}: {
  floatAnimation: TargetAndTransition | undefined;
  onStart: () => void;
}) {
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-16 sm:pt-24 lg:grid-cols-[1fr_0.95fr] lg:pb-28">
      <motion.div
        animate="show"
        className="max-w-4xl"
        initial="hidden"
        transition={{ staggerChildren: 0.09 }}
      >
        <motion.div
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-4 py-2 text-base font-medium text-blue-700 shadow-sm dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200"
          variants={fadeUp}
        >
          <Sparkles className="size-4" />
          Prompt-first calendar and email automation
        </motion.div>
        <motion.h1
          className="text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl dark:text-white"
          variants={fadeUp}
        >
          Manage Meetings & Emails With Just a Prompt
        </motion.h1>
        <motion.p
          className="mt-6 max-w-2xl text-xl leading-9 text-slate-600 dark:text-slate-300"
          variants={fadeUp}
        >
          CalyM is your AI meeting and email manager that schedules meetings,
          sends follow-up emails, detects reschedule replies, and notifies you
          when action is needed.
        </motion.p>
        <motion.div
          className="mt-9 flex flex-col gap-3 sm:flex-row"
          variants={fadeUp}
        >
          <button
            className="group inline-flex h-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 via-violet-600 to-cyan-500 px-7 text-lg font-semibold text-white shadow-2xl shadow-blue-500/25 transition hover:-translate-y-0.5"
            onClick={onStart}
            type="button"
          >
            Try CalyM Free
            <ArrowRight className="ml-2 size-5 transition group-hover:translate-x-1" />
          </button>
          <a
            className="inline-flex h-14 items-center justify-center rounded-full border border-slate-200 bg-slate-50/80 px-7 text-lg font-semibold text-slate-800 shadow-sm backdrop-blur transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/6 dark:text-slate-100"
            href="#demo"
          >
            <PlayCircle className="mr-2 size-5" />
            Watch Demo
          </a>
        </motion.div>
      </motion.div>

      <div className="relative min-h-[620px]">
        <motion.div
          animate={floatAnimation}
          className="absolute left-0 top-8 z-20 hidden rounded-3xl border border-white/50 bg-slate-50/76 p-4 shadow-2xl shadow-blue-500/10 backdrop-blur-2xl sm:block dark:border-white/10 dark:bg-white/8"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200">
              <CalendarDays className="size-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Meeting created
              </p>
              <p className="text-base font-semibold">Rahul, tomorrow 5 PM</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          animate={floatAnimation}
          className="absolute bottom-16 right-0 z-20 hidden max-w-xs rounded-3xl border border-white/50 bg-slate-50/76 p-4 shadow-2xl shadow-violet-500/10 backdrop-blur-2xl md:block dark:border-white/10 dark:bg-white/8"
          transition={{ delay: 0.7 }}
        >
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200">
              <MailCheck className="size-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Follow-up ready
              </p>
              <p className="text-base font-semibold">Context added from meeting</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="relative mx-auto max-w-xl rounded-[2rem] border border-white/60 bg-slate-50/78 p-4 shadow-2xl shadow-blue-950/10 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/68 dark:shadow-blue-500/10"
          initial={{ opacity: 0, scale: 0.94, y: 26 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
        >
          <div className="rounded-[1.5rem] border border-slate-200/70 bg-[#f8fafc] p-5 dark:border-white/10 dark:bg-[#0d1220]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-medium text-slate-500 dark:text-slate-400">
                  AI command
                </p>
                <h2 className="mt-1 text-2xl font-semibold">Tell CalyM what to do</h2>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 dark:bg-emerald-400/12 dark:text-emerald-200">
                Ready
              </span>
            </div>
            <div className="mt-6 rounded-3xl border border-blue-100 bg-slate-50 p-5 shadow-inner dark:border-blue-400/20 dark:bg-slate-950">
              <p className="text-lg leading-8 text-slate-700 dark:text-slate-200">
                Schedule a meeting with Rahul tomorrow at 5 PM and send a
                follow-up email after the meeting.
              </p>
            </div>
            <div className="mt-5 grid gap-3">
              {promptSteps.slice(0, 4).map((step, index) => (
                <motion.div
                  className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-slate-100/70 p-4 dark:border-white/10 dark:bg-white/5"
                  initial={{ opacity: 0, x: -16 }}
                  key={step}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileInView={{ opacity: 1, x: 0 }}
                >
                  <CheckCircle2 className="size-5 text-cyan-600 dark:text-cyan-300" />
                  <span className="text-base font-medium">{step}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          animate={floatAnimation}
          className="absolute right-10 top-0 z-20 rounded-3xl border border-amber-200/80 bg-amber-50/90 p-4 shadow-2xl shadow-amber-500/10 backdrop-blur-xl dark:border-amber-400/20 dark:bg-amber-400/10"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-5 text-amber-600 dark:text-amber-300" />
            <p className="text-base font-semibold">Reschedule reply detected</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function PromptDemo() {
  return (
    <SectionShell
      eyebrow="Prompt Demo"
      id="demo"
      title="One Prompt. Complete Workflow."
    >
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <motion.div
          className="rounded-[2rem] border border-slate-200/70 bg-slate-50/76 p-6 shadow-2xl shadow-blue-950/8 backdrop-blur-2xl dark:border-white/10 dark:bg-white/7"
          initial={{ opacity: 0, y: 24 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <p className="text-base font-semibold text-blue-700 dark:text-blue-200">
            Example prompt
          </p>
          <p className="mt-4 text-2xl font-semibold leading-10">
            Schedule a meeting with Rahul tomorrow at 5 PM and send a follow-up
            email after the meeting.
          </p>
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-cyan-200 bg-cyan-50/80 p-4 text-cyan-800 dark:border-cyan-300/20 dark:bg-cyan-400/10 dark:text-cyan-100">
            <Zap className="size-5" />
            <span className="text-base font-medium">
              CalyM converts one request into calendar, email, and reply-tracking actions.
            </span>
          </div>
        </motion.div>

        <div className="rounded-[2rem] border border-slate-200/70 bg-slate-950 p-3 shadow-2xl shadow-blue-500/10 dark:border-white/10">
          <div className="rounded-[1.55rem] bg-[#0b1020] p-5">
            {promptSteps.map((step, index) => (
              <motion.div
                className="relative flex gap-4 pb-6 last:pb-0"
                initial={{ opacity: 0, y: 18 }}
                key={step}
                transition={{ delay: index * 0.08 }}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                {index < promptSteps.length - 1 ? (
                  <span className="absolute left-[1.05rem] top-9 h-[calc(100%-1rem)] w-px bg-gradient-to-b from-cyan-400 to-violet-400" />
                ) : null}
                <span className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-xl font-semibold text-white">{step}</h3>
                  <p className="mt-1 text-base leading-7 text-slate-400">
                    Step {index + 1} runs with user context and waits for approval
                    when the action is sensitive.
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

function FeatureSection() {
  return (
    <SectionShell
      eyebrow="Features"
      id="features"
      title="Everything Your Calendar & Inbox Should Do Automatically"
    >
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <FeatureCard feature={feature} index={index} key={feature.title} />
        ))}
      </div>
    </SectionShell>
  );
}

function FeatureCard({
  feature,
  index,
}: {
  feature: { description: string; icon: LucideIcon; title: string };
  index: number;
}) {
  const Icon = feature.icon;

  return (
    <motion.article
      className="group rounded-[1.75rem] border border-slate-200/70 bg-slate-50/76 p-6 shadow-xl shadow-blue-950/5 backdrop-blur-2xl transition hover:-translate-y-1 hover:shadow-blue-500/10 dark:border-white/10 dark:bg-white/7"
      initial={{ opacity: 0, y: 24 }}
      transition={{ delay: index * 0.04 }}
      viewport={{ once: true, margin: "-60px" }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <div className="flex size-13 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600/12 to-cyan-500/12 text-blue-700 ring-1 ring-blue-200 transition group-hover:scale-105 dark:text-cyan-200 dark:ring-white/10">
        <Icon className="size-6" />
      </div>
      <h3 className="mt-6 text-2xl font-semibold">{feature.title}</h3>
      <p className="mt-3 text-lg leading-8 text-slate-600 dark:text-slate-300">
        {feature.description}
      </p>
    </motion.article>
  );
}

function WorkflowSection() {
  return (
    <SectionShell eyebrow="Workflow" id="workflow" title="How CalyM Works">
      <div className="mx-auto max-w-4xl">
        {workflowSteps.map((step, index) => (
          <motion.div
            className="relative flex gap-5 pb-8 last:pb-0"
            initial={{ opacity: 0, x: -24 }}
            key={step}
            transition={{ delay: index * 0.04 }}
            viewport={{ once: true, margin: "-80px" }}
            whileInView={{ opacity: 1, x: 0 }}
          >
            {index < workflowSteps.length - 1 ? (
              <span className="absolute left-6 top-14 h-[calc(100%-3rem)] w-px bg-gradient-to-b from-blue-400 via-violet-400 to-cyan-400" />
            ) : null}
            <span className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-base font-bold text-white shadow-xl shadow-blue-500/15 dark:bg-white dark:text-slate-950">
              {index + 1}
            </span>
            <div className="rounded-[1.5rem] border border-slate-200/70 bg-slate-50/74 p-5 shadow-lg shadow-blue-950/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/7">
              <p className="text-xl font-semibold">{step}</p>
              <p className="mt-2 text-base leading-7 text-slate-600 dark:text-slate-300">
                Each step turns repetitive communication work into a clear,
                confirmable action.
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </SectionShell>
  );
}

function UseCasesSection() {
  return (
    <SectionShell
      eyebrow="Use Cases"
      id="use-cases"
      title="Built For Busy Professionals"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {useCases.map((item, index) => (
          <motion.div
            className="rounded-3xl border border-slate-200/70 bg-slate-50/76 p-5 text-lg font-semibold shadow-lg shadow-blue-950/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/7"
            initial={{ opacity: 0, y: 20 }}
            key={item}
            transition={{ delay: index * 0.04 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <CheckCircle2 className="mb-4 size-6 text-cyan-600 dark:text-cyan-300" />
            {item}
          </motion.div>
        ))}
      </div>
    </SectionShell>
  );
}

function DashboardPreview({
  floatAnimation,
}: {
  floatAnimation: TargetAndTransition | undefined;
}) {
  return (
    <SectionShell
      eyebrow="Dashboard Preview"
      id="dashboard-preview"
      title="A Command Center For Meetings, Follow-Ups, And Replies"
    >
      <div className="relative">
        <motion.div
          animate={floatAnimation}
          className="absolute -left-4 top-20 z-10 hidden rounded-3xl border border-cyan-200 bg-cyan-50/90 p-4 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl lg:block dark:border-cyan-300/20 dark:bg-cyan-400/10"
        >
          <p className="text-base font-semibold text-cyan-800 dark:text-cyan-100">
            Follow-up sent
          </p>
          <p className="mt-1 text-sm text-cyan-700 dark:text-cyan-200">
            Investor sync recap
          </p>
        </motion.div>
        <motion.div
          animate={floatAnimation}
          className="absolute -right-4 bottom-16 z-10 hidden rounded-3xl border border-amber-200 bg-amber-50/95 p-4 shadow-2xl shadow-amber-500/10 backdrop-blur-xl lg:block dark:border-amber-300/20 dark:bg-amber-400/10"
        >
          <p className="text-base font-semibold text-amber-800 dark:text-amber-100">
            Approval needed
          </p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-200">
            Rahul asked to reschedule
          </p>
        </motion.div>

        <motion.div
          className="mx-auto max-w-6xl rounded-[2rem] border border-slate-200/70 bg-slate-50/80 p-4 shadow-2xl shadow-blue-950/10 backdrop-blur-2xl dark:border-white/10 dark:bg-white/7"
          initial={{ opacity: 0, scale: 0.96, y: 24 }}
          viewport={{ once: true, margin: "-80px" }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
        >
          <div className="grid gap-4 rounded-[1.5rem] bg-[#eef3fb] p-4 dark:bg-[#0b1020] lg:grid-cols-[16rem_1fr]">
            <aside className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
                  C
                </span>
                <div>
                  <p className="font-semibold">CalyM</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    AI workspace
                  </p>
                </div>
              </div>
              <div className="mt-6 grid gap-2">
                {["Prompt", "Meetings", "Inbox", "Alerts"].map((item, index) => (
                  <div
                    className={cx(
                      "rounded-2xl px-4 py-3 text-base font-medium",
                      index === 0
                        ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                        : "text-slate-600 dark:text-slate-300",
                    )}
                    key={item}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </aside>

            <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
              <div className="grid gap-4">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
                  <p className="text-base font-medium text-blue-700 dark:text-blue-200">
                    AI prompt command bar
                  </p>
                  <div className="mt-3 rounded-2xl border border-blue-100 bg-slate-100 p-4 text-lg font-medium dark:border-blue-300/20 dark:bg-slate-950">
                    Reschedule Rahul to Friday and send a polite update.
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <PreviewCard
                    icon={CalendarDays}
                    title="Upcoming meetings"
                    value="4 today"
                  />
                  <PreviewCard
                    icon={Mail}
                    title="Email follow-up"
                    value="2 waiting"
                  />
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xl font-semibold">Meeting list</h3>
                    <Clock3 className="size-5 text-slate-500" />
                  </div>
                  {["Investor check-in", "Client onboarding", "Team planning"].map(
                    (item, index) => (
                      <div
                        className="mt-4 flex items-center justify-between rounded-2xl bg-slate-100 p-4 dark:bg-white/6"
                        key={item}
                      >
                        <span className="text-base font-medium">{item}</span>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {index + 2}:00 PM
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-300/20 dark:bg-amber-400/10">
                  <BellRing className="size-6 text-amber-600 dark:text-amber-300" />
                  <h3 className="mt-4 text-xl font-semibold">Reschedule alert</h3>
                  <p className="mt-2 text-base leading-7 text-amber-800 dark:text-amber-100">
                    Rahul is busy at that time. Approve a new slot before CalyM
                    sends an update.
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
                  <Send className="size-6 text-violet-600 dark:text-violet-300" />
                  <h3 className="mt-4 text-xl font-semibold">Follow-up status</h3>
                  <p className="mt-2 text-base text-slate-600 dark:text-slate-300">
                    7 emails generated. 5 sent. 2 need confirmation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </SectionShell>
  );
}

function PreviewCard({
  icon: Icon,
  title,
  value,
}: {
  icon: LucideIcon;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
      <Icon className="size-6 text-blue-600 dark:text-cyan-300" />
      <p className="mt-5 text-base text-slate-500 dark:text-slate-400">{title}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function PricingSection({ onStart }: { onStart: () => void }) {
  return (
    <SectionShell eyebrow="Pricing" id="pricing" title="Start With A Free Hackathon Build">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200/70 bg-slate-50/78 p-7 shadow-2xl shadow-blue-950/8 backdrop-blur-2xl dark:border-white/10 dark:bg-white/7">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-base font-semibold text-blue-700 dark:text-blue-200">
              Free during the build
            </p>
            <h3 className="mt-2 text-4xl font-semibold">Prompt automation MVP</h3>
            <p className="mt-3 text-lg leading-8 text-slate-600 dark:text-slate-300">
              Connect Gmail and Calendar, test prompts, and approve sensitive actions.
            </p>
          </div>
          <button
            className="rounded-full bg-slate-950 px-6 py-4 text-base font-semibold text-white dark:bg-white dark:text-slate-950"
            onClick={onStart}
            type="button"
          >
            Start Automating
          </button>
        </div>
      </div>
    </SectionShell>
  );
}

function CTASection({ onStart }: { onStart: () => void }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20">
      <motion.div
        className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 via-violet-600 to-cyan-500 p-8 text-white shadow-2xl shadow-blue-500/25 sm:p-12 lg:p-16"
        initial={{ opacity: 0, y: 24 }}
        viewport={{ once: true }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <div className="absolute right-[-10%] top-[-30%] h-80 w-80 rounded-full bg-white/20 blur-3xl" />
        <div className="relative z-10 max-w-3xl">
          <p className="text-base font-semibold text-cyan-100">
            Stop Managing Meetings Manually
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Let CalyM handle scheduling, follow-ups, and reply tracking while you
            focus on real work.
          </h2>
          <button
            className="mt-8 rounded-full bg-white px-7 py-4 text-lg font-semibold text-slate-950 shadow-xl transition hover:-translate-y-0.5"
            onClick={onStart}
            type="button"
          >
            Start Automating Now
          </button>
        </div>
      </motion.div>
    </section>
  );
}

function FAQSection() {
  return (
    <SectionShell eyebrow="FAQ" id="faq" title="Questions Before You Automate">
      <div className="mx-auto grid max-w-4xl gap-4">
        {faqs.map((faq) => (
          <details
            className="group rounded-3xl border border-slate-200/70 bg-slate-50/78 p-6 shadow-lg shadow-blue-950/5 backdrop-blur-xl open:border-blue-200 dark:border-white/10 dark:bg-white/7 dark:open:border-blue-300/20"
            key={faq.question}
          >
            <summary className="cursor-pointer list-none text-xl font-semibold">
              {faq.question}
            </summary>
            <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </SectionShell>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200/70 bg-slate-50/60 px-4 py-10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/40">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1fr_auto]">
        <div>
          <div className="flex h-14 items-center">
            <Image
              alt="CalyM Automation"
              className="h-12 w-auto object-contain dark:hidden"
              height={174}
              src="/calym-logo-light.png"
              width={389}
            />
            <Image
              alt="CalyM Automation"
              className="hidden h-12 w-auto object-contain dark:block"
              height={174}
              src="/calym-logo-dark.png"
              width={389}
            />
          </div>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
            A prompt-powered meeting and email manager for scheduling,
            follow-ups, reschedule detection, and human-approved automation.
          </p>
        </div>
        <div className="grid gap-3 text-base font-medium text-slate-600 sm:grid-cols-4 dark:text-slate-300">
          {["Product", "Features", "Privacy", "Contact"].map((link) => (
            <a href="#" key={link}>
              {link}
            </a>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-8 flex max-w-7xl flex-col gap-4 border-t border-slate-200/70 pt-6 text-base text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:text-slate-400">
        <p>Copyright 2026 CalyM. All rights reserved.</p>
        <div className="flex gap-3">
          {["X", "in", "gh"].map((item) => (
            <span
              className="flex size-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 font-semibold dark:border-white/10 dark:bg-white/5"
              key={item}
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}

function SectionShell({
  children,
  eyebrow,
  id,
  title,
}: {
  children: React.ReactNode;
  eyebrow: string;
  id: string;
  title: string;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20" id={id}>
      <motion.div
        className="mx-auto mb-12 max-w-3xl text-center"
        initial={{ opacity: 0, y: 22 }}
        viewport={{ once: true, margin: "-80px" }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <p className="text-base font-semibold uppercase tracking-[0.22em] text-blue-700 dark:text-cyan-200">
          {eyebrow}
        </p>
        <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          {title}
        </h2>
      </motion.div>
      {children}
    </section>
  );
}
