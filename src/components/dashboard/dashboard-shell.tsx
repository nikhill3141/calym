"use client";

import {
  AlertCircle,
  Archive,
  Bot,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Command,
  ExternalLink,
  Home,
  Inbox,
  Link2,
  Loader2,
  Mail,
  Moon,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Sun,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DashboardProfile } from "@/components/dashboard/dashboard-profile";
import { Button } from "@/components/ui/button";

type DashboardShellProps = {
  connections: {
    connected: boolean;
    description: string;
    name: string;
    provider: "gmail" | "google_calendar";
  }[];
  user: {
    email: string;
    image?: string | null;
    name: string;
  };
};

type DashboardTab = "overview" | "inbox" | "agenda" | "agent" | "connections";

type ActivityItem = {
  id: string;
  message: string;
};

type ToastItem = {
  id: string;
  message: string;
  tone: "success" | "error" | "info";
  title: string;
};

type DashboardEmail = {
  action: string;
  category: "Action needed" | "Meeting" | "Negative reply" | "Reschedule" | "Review";
  date: string;
  from: string;
  id: string;
  priority: "High" | "Medium" | "Normal";
  prompt: string;
  reason: string;
  snippet: string;
  subject: string;
};

type DashboardEvent = {
  context: string;
  end: string;
  htmlLink?: string;
  id: string;
  start: string;
  time: string;
  title: string;
};

type PreparedAction = {
  category?: "positive" | "reschedule" | "decline" | "neutral";
  confirmationLabel: string;
  description: string;
  id: string;
  payload: Record<string, unknown>;
  risk: "low" | "high";
  title: string;
  type: "calendar_event" | "email_draft" | "email_send";
};

type LiveDataResponse = {
  calendarEvents?: {
    attendees: string[];
    end: string;
    htmlLink: string;
    id: string;
    start: string;
    title: string;
  }[];
  emails?: {
    date: string;
    from: string;
    id: string;
    labels: string[];
    snippet: string;
    subject: string;
  }[];
  error?: string;
  loadedAt?: string;
  signInLink?: string;
};

const navItems: {
  icon: typeof Home;
  label: string;
  tab: DashboardTab;
}[] = [
  { label: "Overview", tab: "overview", icon: Home },
  { label: "Priority inbox", tab: "inbox", icon: Inbox },
  { label: "Agenda", tab: "agenda", icon: CalendarDays },
  { label: "Agent actions", tab: "agent", icon: Bot },
  { label: "Connections", tab: "connections", icon: Link2 },
];

const fallbackEmails: DashboardEmail[] = [
  {
    action: "Draft reply",
    category: "Action needed",
    date: "",
    from: "Corsair Team",
    id: "fallback-corsair",
    priority: "High",
    prompt: "Draft a reply to Corsair about the API access checklist.",
    reason: "Needs setup attention before the next build step.",
    snippet: "Connect Gmail and refresh live data to replace this sample.",
    subject: "API access and integration checklist",
  },
  {
    action: "Schedule",
    category: "Meeting",
    date: "",
    from: "Aarav Mehta",
    id: "fallback-review",
    priority: "High",
    prompt: "Schedule a follow-up with Aarav tomorrow and draft a confirmation.",
    reason: "Meeting-related thread with scheduling context.",
    snippet: "This is placeholder data until Corsair returns your real inbox.",
    subject: "Follow-up on tomorrow's product review",
  },
];

const fallbackAgenda: DashboardEvent[] = [
  {
    context: "Connect Calendar and refresh live data to replace this sample.",
    end: "",
    id: "fallback-oauth",
    start: "",
    time: "09:00",
    title: "Review Gmail connection flow",
  },
  {
    context: "Define create-invite and update-event prompt flows.",
    end: "",
    id: "fallback-calendar",
    start: "",
    time: "13:30",
    title: "Calendar automation planning",
  },
  {
    context: "Show login, connect, prompt, confirmation, and dashboard.",
    end: "",
    id: "fallback-demo",
    start: "",
    time: "17:00",
    title: "Hackathon demo rehearsal",
  },
];

const fastActions = [
  {
    key: "C",
    label: "Compose email",
    icon: Send,
    prompt: "Create a Gmail draft to dev@corsair.dev saying I look forward to our meeting.",
  },
  {
    key: "/",
    label: "Search mail",
    icon: Search,
    prompt: "Find recent unread emails from Corsair.",
  },
  {
    key: "M",
    label: "Create meeting",
    icon: CalendarDays,
    prompt:
      "Send a calendar invite to dev@corsair.dev at 9 AM next Thursday. Send him an email too saying I look forward to our meeting.",
  },
  {
    key: "E",
    label: "Archive thread",
    icon: Archive,
    prompt: "Archive the selected thread after checking it is not urgent.",
  },
];

type FastAction = (typeof fastActions)[number];

const promptSuggestions = [
  "Send a calendar invite to dev@corsair.dev at 9 AM next Thursday. Send him an email too saying I look forward to our meeting.",
  "Create a Gmail draft to dev@corsair.dev saying the CalyM demo is ready.",
  "Find recent unread emails from Corsair.",
];

function connectionIcon(provider: DashboardShellProps["connections"][number]["provider"]) {
  return provider === "gmail" ? Mail : CalendarDays;
}

function connectionBrandClass(
  provider: DashboardShellProps["connections"][number]["provider"],
) {
  if (provider === "gmail") {
    return "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-200";
  }

  return "border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-500/30 dark:bg-blue-950/30 dark:text-blue-200";
}

function metricAccent(index: number) {
  const accents = [
    "calym-card border-l-4 border-l-indigo-500",
    "calym-card border-l-4 border-l-cyan-500",
    "calym-card border-l-4 border-l-amber-500",
    "calym-card border-l-4 border-l-violet-500",
  ];

  return accents[index % accents.length];
}

function priorityClass(priority: DashboardEmail["priority"]) {
  if (priority === "High") {
    return "bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:ring-rose-500/30";
  }

  if (priority === "Medium") {
    return "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-500/30";
  }

  return "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-200 dark:ring-indigo-500/30";
}

function emailCategoryClass(category: DashboardEmail["category"]) {
  if (category === "Reschedule") {
    return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-200";
  }

  if (category === "Negative reply") {
    return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-200";
  }

  if (category === "Meeting") {
    return "border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-500/30 dark:bg-cyan-950/40 dark:text-cyan-200";
  }

  if (category === "Action needed") {
    return "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-500/30 dark:bg-indigo-950/40 dark:text-indigo-200";
  }

  return "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-zinc-800 dark:text-slate-200";
}

function categoryClass(category: PreparedAction["category"]) {
  if (category === "reschedule") {
    return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-200";
  }

  if (category === "decline") {
    return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-200";
  }

  if (category === "positive") {
    return "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-500/30 dark:bg-indigo-950/40 dark:text-indigo-200";
  }

  return "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-zinc-800 dark:text-slate-200";
}

function inferEmailCategory(email: {
  labels: string[];
  snippet: string;
  subject: string;
}) {
  const text = `${email.subject} ${email.snippet}`.toLowerCase();

  if (
    /\b(reschedule|busy|unavailable|another time|different time|can't make|cannot make|not free|postpone)\b/.test(
      text,
    )
  ) {
    return "Reschedule" as const;
  }

  if (
    /\b(not interested|decline|pass on this|not a fit|not needed|unsubscribe|no thanks)\b/.test(
      text,
    )
  ) {
    return "Negative reply" as const;
  }

  if (/\b(meeting|calendar|invite|schedule|call|sync|demo)\b/.test(text)) {
    return "Meeting" as const;
  }

  if (email.labels.includes("IMPORTANT") || /\b(urgent|action|reply|confirm)\b/.test(text)) {
    return "Action needed" as const;
  }

  return "Review" as const;
}

function formatDate(value: string) {
  if (!value) {
    return "No date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(date);
}

function formatTime(value: string) {
  if (!value) {
    return "Any time";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function mapLiveEmail(email: NonNullable<LiveDataResponse["emails"]>[number]) {
  const priority = email.labels.includes("IMPORTANT")
    ? "High"
    : email.labels.includes("CATEGORY_PRIMARY")
      ? "Medium"
      : "Normal";
  const category = inferEmailCategory(email);
  const action =
    category === "Reschedule"
      ? "Handle reschedule"
      : category === "Negative reply"
        ? "Review response"
        : category === "Meeting"
          ? "Prepare meeting"
          : "Draft reply";

  return {
    action,
    category,
    date: email.date,
    from: email.from,
    id: email.id,
    priority,
    prompt:
      category === "Reschedule"
        ? `Draft a reschedule reply to ${email.from} about "${email.subject}".`
        : category === "Negative reply"
          ? `Categorize and draft a respectful reply to ${email.from} about "${email.subject}".`
          : `Draft a reply to ${email.from} about "${email.subject}".`,
    reason: email.snippet || "Real Gmail message loaded through Corsair.",
    snippet: email.snippet,
    subject: email.subject,
  } satisfies DashboardEmail;
}

function mapLiveEvent(
  event: NonNullable<LiveDataResponse["calendarEvents"]>[number],
) {
  return {
    context:
      event.attendees.length > 0
        ? `With ${event.attendees.slice(0, 3).join(", ")}`
        : "Real Google Calendar event loaded through Corsair.",
    end: event.end,
    htmlLink: event.htmlLink,
    id: event.id,
    start: event.start,
    time: formatTime(event.start),
    title: event.title,
  } satisfies DashboardEvent;
}

export function DashboardShell({ connections, user }: DashboardShellProps) {
  const activityIdRef = useRef(0);
  const toastIdRef = useRef(0);
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [command, setCommand] = useState(
    "Send a calendar invite to dev@corsair.dev at 9 AM next Thursday. Send him an email too saying I look forward to our meeting.",
  );
  const [query, setQuery] = useState("");
  const [emails, setEmails] = useState<DashboardEmail[]>(fallbackEmails);
  const [events, setEvents] = useState<DashboardEvent[]>(fallbackAgenda);
  const [preparedActions, setPreparedActions] = useState<PreparedAction[]>([]);
  const [isLoadingLiveData, setIsLoadingLiveData] = useState(true);
  const [isPreparingPrompt, setIsPreparingPrompt] = useState(false);
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);
  const [liveLoadedAt, setLiveLoadedAt] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([
    {
      id: "initial",
      message: "Dashboard ready. Live data will load through Corsair.",
    },
  ]);

  const activeNav = navItems.find((item) => item.tab === activeTab);
  const connectedCount = connections.filter((connection) => connection.connected).length;

  const metrics = useMemo(
    () => [
      {
        label: "Real emails loaded",
        value: emails.length.toString(),
        helper: liveLoadedAt ? `Updated ${formatDate(liveLoadedAt)}` : "Loading from Gmail",
      },
      {
        label: "Upcoming events",
        value: events.length.toString(),
        helper: "Next 7 days from Google Calendar",
      },
      {
        label: "Prepared actions",
        value: preparedActions.length.toString(),
        helper: "Waiting for your confirmation",
      },
      {
        label: "Connections",
        value: `${connectedCount}/2`,
        helper: "Corsair tenant scoped to this user",
      },
    ],
    [connectedCount, emails.length, events.length, liveLoadedAt, preparedActions.length],
  );

  const visibleEmails = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return emails;
    }

    return emails.filter((email) =>
      [email.category, email.from, email.subject, email.reason, email.priority]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [emails, query]);

  const pushActivity = useCallback((message: string) => {
    activityIdRef.current += 1;
    setActivity((current) =>
      [{ id: `activity-${activityIdRef.current}`, message }, ...current].slice(
        0,
        10,
      ),
    );
  }, []);

  const pushToast = useCallback((toast: Omit<ToastItem, "id">) => {
    toastIdRef.current += 1;
    const id = `toast-${toastIdRef.current}`;

    setToasts((current) => [{ id, ...toast }, ...current].slice(0, 4));
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4500);
  }, []);

  const loadLiveData = useCallback(async () => {
    setIsLoadingLiveData(true);

    try {
      const response = await fetch("/api/dashboard/live", {
        headers: { Accept: "application/json" },
      });
      const data = (await response.json()) as LiveDataResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Could not load live dashboard data.");
      }

      setEmails(data.emails?.map(mapLiveEmail) ?? []);
      setEvents(data.calendarEvents?.map(mapLiveEvent) ?? []);
      setLiveLoadedAt(data.loadedAt ?? new Date().toISOString());
      pushActivity("Loaded real Gmail and Calendar data through Corsair.");
      pushToast({
        message: "Your inbox and agenda are now using live Corsair data.",
        title: "Live data loaded",
        tone: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not load live Gmail and Calendar data.";

      pushActivity(`Live data failed: ${message}`);
      pushToast({
        message,
        title: "Live data needs attention",
        tone: "error",
      });
    } finally {
      setIsLoadingLiveData(false);
    }
  }, [pushActivity, pushToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLiveData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadLiveData]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedTheme = window.localStorage.getItem("calym-theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const nextTheme = savedTheme === "dark" || (!savedTheme && prefersDark)
        ? "dark"
        : "light";

      setTheme(nextTheme);
      document.documentElement.classList.toggle("dark", nextTheme === "dark");
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function toggleTheme() {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === "dark" ? "light" : "dark";

      document.documentElement.classList.toggle("dark", nextTheme === "dark");
      window.localStorage.setItem("calym-theme", nextTheme);

      return nextTheme;
    });
  }

  function applyPrompt(prompt: string) {
    setCommand(prompt);
    setActiveTab("overview");
    pushActivity(`Prepared prompt: ${prompt}`);
    pushToast({
      message: "The prompt is ready in the command bar.",
      title: "Prompt selected",
      tone: "info",
    });
  }

  async function runCommand() {
    setIsPreparingPrompt(true);
    setPreparedActions([]);

    try {
      const response = await fetch("/api/dashboard/prompt", {
        body: JSON.stringify({
          command,
          mode: "prepare",
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const data = (await response.json()) as {
        actions?: PreparedAction[];
        error?: string;
        summary?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not prepare prompt actions.");
      }

      setPreparedActions(data.actions ?? []);
      setActiveTab("agent");
      pushActivity(data.summary ?? "Prompt prepared.");
      pushToast({
        message:
          data.actions && data.actions.length > 0
            ? "Review and confirm each action before CalyM executes it."
            : "No executable action was created yet.",
        title: data.actions?.length ? "Prompt actions ready" : "Prompt parsed",
        tone: data.actions?.length ? "success" : "info",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not prepare prompt.";

      pushActivity(`Prompt failed: ${message}`);
      pushToast({ message, title: "Prompt failed", tone: "error" });
    } finally {
      setIsPreparingPrompt(false);
    }
  }

  async function executePreparedAction(action: PreparedAction) {
    setExecutingActionId(action.id);

    try {
      const response = await fetch("/api/dashboard/prompt", {
        body: JSON.stringify({ action, mode: "execute" }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const data = (await response.json()) as {
        error?: string;
        message?: string;
        signInLink?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not execute this action.");
      }

      setPreparedActions((current) =>
        current.filter((currentAction) => currentAction.id !== action.id),
      );
      pushActivity(data.message ?? `${action.title} completed.`);
      pushToast({
        message: data.message ?? `${action.title} completed.`,
        title: "Action completed",
        tone: "success",
      });
      void loadLiveData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not execute action.";

      pushActivity(`${action.title} failed: ${message}`);
      pushToast({ message, title: "Action failed", tone: "error" });
    } finally {
      setExecutingActionId(null);
    }
  }

  return (
    <main className="calym-dashboard h-screen overflow-hidden">
      <ToastViewport toasts={toasts} />
      <div className="mx-auto flex h-screen max-w-[1680px] overflow-hidden">
        <aside className="calym-surface hidden h-screen w-[22rem] shrink-0 border-r px-6 py-6 backdrop-blur-xl xl:w-96 lg:flex lg:flex-col">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-xl font-semibold text-white shadow-lg shadow-indigo-500/25">
              C
            </div>
            <div>
              <p className="text-2xl font-semibold dark:text-white">CalyM</p>
              <p className="text-base text-indigo-700 dark:text-indigo-200">
                Mail + Calendar AI
              </p>
            </div>
          </div>

          <nav className="mt-7 flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.tab;

              return (
                <button
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left text-base font-medium transition-colors ${
                    isActive
                      ? "calym-primary-action"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                  key={item.tab}
                  onClick={() => setActiveTab(item.tab)}
                  type="button"
                >
                  <Icon className="size-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <ActivityRail activity={activity} />

          <div className="mt-auto">
            <DashboardProfile
              email={user.email}
              image={user.image}
              name={user.name}
            />
          </div>
        </aside>

        <section className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
          <header className="calym-surface z-10 shrink-0 border-b px-6 py-4 backdrop-blur-xl">
            <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
              <div>
                <p className="text-base font-medium text-muted-foreground">
                  {activeNav?.label ?? "Dashboard"}
                </p>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  Welcome, {user.name}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="lg:hidden">
                  <DashboardProfile
                    email={user.email}
                    image={user.image}
                    name={user.name}
                  />
                </div>
                <Button
                  aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                  className="calym-quiet-button h-12 px-4 text-base"
                  onClick={toggleTheme}
                  variant="outline"
                >
                  {theme === "dark" ? (
                    <Sun className="mr-2 size-4" />
                  ) : (
                    <Moon className="mr-2 size-4" />
                  )}
                  {theme === "dark" ? "Light" : "Dark"}
                </Button>
                <Button
                  className="calym-quiet-button h-12 px-5 text-base"
                  disabled={isLoadingLiveData}
                  onClick={loadLiveData}
                  variant="outline"
                >
                  {isLoadingLiveData ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 size-4" />
                  )}
                  Refresh live data
                </Button>
                <Button
                  className="calym-primary-action h-12 px-5 text-base"
                  onClick={() => setActiveTab("overview")}
                >
                  <Sparkles className="mr-2 size-4" />
                  Ask CalyM
                </Button>
              </div>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.tab;

                return (
                  <button
                    className={`flex shrink-0 items-center gap-2 rounded-lg border px-4 py-3 text-base font-medium ${
                      isActive
                        ? "calym-primary-action border-transparent"
                        : "border-indigo-100 bg-slate-50/80 text-slate-600 dark:border-white/10 dark:bg-zinc-900/80 dark:text-slate-300"
                    }`}
                    key={item.tab}
                    onClick={() => setActiveTab(item.tab)}
                    type="button"
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            <MobileActivity activity={activity} />
          </header>

          <div className="min-h-0 flex-1 overflow-hidden p-5">
            {activeTab === "overview" ? (
              <OverviewTab
                command={command}
                isPreparingPrompt={isPreparingPrompt}
                metrics={metrics}
                onCommandChange={setCommand}
                onPromptSelect={applyPrompt}
                onRunCommand={runCommand}
              />
            ) : null}

            {activeTab === "inbox" ? (
              <InboxTab
                emails={visibleEmails}
                isLoading={isLoadingLiveData}
                onPromptSelect={applyPrompt}
                onQueryChange={setQuery}
                query={query}
              />
            ) : null}

            {activeTab === "agenda" ? (
              <AgendaTab events={events} onPromptSelect={applyPrompt} />
            ) : null}

            {activeTab === "agent" ? (
              <AgentTab
                executingActionId={executingActionId}
                fastActions={fastActions}
                onExecuteAction={executePreparedAction}
                onPromptSelect={applyPrompt}
                preparedActions={preparedActions}
              />
            ) : null}

            {activeTab === "connections" ? (
              <ConnectionsTab connections={connections} />
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function MobileActivity({ activity }: { activity: ActivityItem[] }) {
  return (
    <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
      {activity.slice(0, 4).map((item, index) => (
        <div
          className="calym-card min-w-[300px] rounded-xl border p-4 text-base leading-7"
          key={item.id}
        >
          <div className="mb-2 flex items-center gap-2">
            <span
              className={`size-2 rounded-full ${
                index === 0 ? "bg-cyan-500" : "bg-indigo-300"
              }`}
            />
          </div>
          <p className="max-h-14 overflow-hidden calym-muted">{item.message}</p>
        </div>
      ))}
    </div>
  );
}

function ActivityRail({ activity }: { activity: ActivityItem[] }) {
  return (
    <section className="mt-6 flex min-h-0 flex-[1.35] flex-col rounded-2xl border p-5 calym-card">
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-indigo-600 dark:text-indigo-300" />
        <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
          Activity
        </h2>
      </div>
      <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
        {activity.map((item, index) => (
          <div
            className="rounded-xl border p-4 calym-card text-base leading-7 text-slate-600 dark:text-slate-300"
            key={item.id}
          >
            <div className="mb-2 flex items-center gap-2">
              <span
                className={`size-2 rounded-full ${
                  index === 0 ? "bg-cyan-500" : "bg-indigo-300"
                }`}
              />
            </div>
            {item.message}
          </div>
        ))}
      </div>
    </section>
  );
}

function OverviewTab({
  command,
  isPreparingPrompt,
  metrics,
  onCommandChange,
  onPromptSelect,
  onRunCommand,
}: {
  command: string;
  isPreparingPrompt: boolean;
  metrics: { helper: string; label: string; value: string }[];
  onCommandChange: (value: string) => void;
  onPromptSelect: (prompt: string) => void;
  onRunCommand: () => void;
}) {
  return (
    <div className="grid h-full min-h-0 gap-5 xl:grid-rows-[auto_1fr]">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => (
          <div
          className={`rounded-xl border p-4 ${metricAccent(index)}`}
            key={metric.label}
          >
            <p className="text-base font-medium text-slate-600 dark:text-slate-300">
              {metric.label}
            </p>
            <p className="mt-2 text-4xl font-semibold text-slate-950 dark:text-white">
              {metric.value}
            </p>
            <p className="mt-2 text-base leading-6 text-slate-500 dark:text-slate-400">
              {metric.helper}
            </p>
          </div>
        ))}
      </section>

      <section className="min-h-0 rounded-2xl border p-6 backdrop-blur calym-surface">
        <div className="flex h-full min-h-0 items-start gap-5">
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-950/30 dark:text-indigo-200">
            <Command className="size-7" />
          </div>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
              <div>
                <p className="text-base font-medium text-indigo-700">
                  Prompt composer
                </p>
                <h2 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  Prepare mail and meeting actions
                </h2>
              </div>
              <span className="w-fit rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-base font-medium text-cyan-800">
                Review before send
              </span>
            </div>
            <textarea
              className="calym-focus mt-5 min-h-0 flex-1 resize-none rounded-xl border p-5 text-xl leading-9 shadow-inner outline-none transition-colors placeholder:text-slate-400"
              onChange={(event) => onCommandChange(event.target.value)}
              value={command}
            />
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {promptSuggestions.map((prompt) => (
                <button
                  className="calym-quiet-button rounded-full border px-4 py-2.5 text-base shadow-sm transition-colors"
                  key={prompt}
                  onClick={() => onPromptSelect(prompt)}
                  type="button"
                >
                  {prompt}
                </button>
              ))}
              <Button
                className="ml-auto h-12 calym-primary-action px-6 text-base"
                disabled={isPreparingPrompt}
                onClick={onRunCommand}
              >
                {isPreparingPrompt ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 size-4" />
                )}
                Prepare real actions
              </Button>
            </div>
            <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
              CalyM detects reschedule, decline, and positive replies, then
              prepares safe actions for your confirmation.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function InboxTab({
  emails,
  isLoading,
  onPromptSelect,
  onQueryChange,
  query,
}: {
  emails: DashboardEmail[];
  isLoading: boolean;
  onPromptSelect: (prompt: string) => void;
  onQueryChange: (value: string) => void;
  query: string;
}) {
  const [mailView, setMailView] = useState<
    "draft_send" | "needs_action" | "received"
  >("received");
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const needsActionEmails = emails.filter((email) =>
    ["Action needed", "Negative reply", "Reschedule"].includes(email.category),
  );
  const displayEmails =
    mailView === "needs_action" ? needsActionEmails : emails;
  const selectedEmail =
    displayEmails.find((email) => email.id === selectedEmailId) ??
    displayEmails[0] ??
    null;
  const mailTabs = [
    {
      count: emails.length,
      helper: "All replies from Gmail",
      icon: Mail,
      id: "received" as const,
      label: "Received replies",
    },
    {
      count: needsActionEmails.length,
      helper: "Reschedule, decline, urgent",
      icon: AlertCircle,
      id: "needs_action" as const,
      label: "Needs action",
    },
    {
      count: emails.length,
      helper: "Draft or send with approval",
      icon: Send,
      id: "draft_send" as const,
      label: "Draft & send",
    },
  ];

  function replyInsight(email: DashboardEmail) {
    if (email.category === "Reschedule") {
      return "This reply looks like a reschedule request. CalyM should ask for approval before suggesting a new time.";
    }

    if (email.category === "Negative reply") {
      return "This reply sounds negative or not interested. Keep the response respectful and low-pressure.";
    }

    if (email.category === "Meeting") {
      return "This message has meeting context. Prepare the next step with calendar awareness.";
    }

    if (email.category === "Action needed") {
      return "This message needs a clear response. Draft the next action and keep the user in control.";
    }

    return "This reply is ready for review. CalyM can summarize it and prepare a safe response.";
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border p-6 backdrop-blur calym-surface">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-3 text-cyan-700 shadow-lg shadow-cyan-500/10 dark:border-cyan-300/20 dark:bg-cyan-400/10 dark:text-cyan-200">
            <Inbox className="size-6" />
          </div>
          <div>
            <h2 className="text-3xl font-semibold text-slate-950 dark:text-white">
              Mail command center
            </h2>
            <p className="mt-1 text-base text-slate-600 dark:text-slate-300">
              Track received replies, detect risky responses, and draft safe sends.
            </p>
          </div>
        </div>
        <input
          className="h-13 rounded-2xl border border-indigo-100 bg-slate-50/90 px-5 text-base text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 xl:w-[24rem] dark:border-white/10 dark:bg-white/7 dark:text-slate-100 dark:focus:ring-indigo-400/20"
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search sender, subject, category..."
          value={query}
        />
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {mailTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = mailView === tab.id;

          return (
            <button
              className={`rounded-2xl border p-4 text-left transition ${
                isActive
                  ? "border-cyan-300 bg-cyan-50 text-cyan-950 shadow-lg shadow-cyan-500/10 dark:border-cyan-300/30 dark:bg-cyan-400/12 dark:text-cyan-50"
                  : "calym-card hover:border-cyan-200 dark:hover:border-cyan-300/24"
              }`}
              key={tab.id}
              onClick={() => setMailView(tab.id)}
              type="button"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-3 text-lg font-semibold">
                  <span
                    className={`flex size-11 items-center justify-center rounded-xl ${
                      isActive
                        ? "bg-cyan-500 text-white"
                        : "bg-slate-100 text-slate-700 dark:bg-white/8 dark:text-slate-200"
                    }`}
                  >
                    <Icon className="size-5" />
                  </span>
                  {tab.label}
                </span>
                <span className="rounded-full border px-3 py-1 text-base font-semibold">
                  {tab.count}
                </span>
              </div>
              <p className="mt-3 text-base leading-6 opacity-75">{tab.helper}</p>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-cyan-100 bg-cyan-50 p-5 text-base text-cyan-800 dark:border-cyan-300/20 dark:bg-cyan-400/10 dark:text-cyan-100">
          <Loader2 className="size-5 animate-spin" />
          Loading your Gmail messages...
        </div>
      ) : null}

      <div className="mt-5 grid min-h-0 flex-1 gap-5 overflow-hidden xl:grid-cols-[minmax(22rem,0.92fr)_1.18fr]">
        <div className="calym-card min-h-0 overflow-y-auto rounded-2xl border p-3">
          {displayEmails.length === 0 ? (
            <div className="flex h-full min-h-[18rem] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-8 text-center dark:border-white/10">
              <CheckCircle2 className="size-10 text-cyan-500" />
              <h3 className="mt-4 text-2xl font-semibold">No replies here</h3>
              <p className="mt-2 max-w-sm text-base leading-7 calym-muted">
                This sub-tab is clear. New Gmail replies will appear after the
                next Corsair refresh.
              </p>
            </div>
          ) : null}

          <div className="grid gap-3">
            {displayEmails.map((email) => {
              const isSelected = selectedEmail?.id === email.id;

              return (
                <button
                  className={`rounded-2xl border p-4 text-left transition ${
                    isSelected
                      ? "border-cyan-300 bg-cyan-50/80 shadow-lg shadow-cyan-500/10 dark:border-cyan-300/30 dark:bg-cyan-400/12"
                      : "border-transparent bg-slate-50/70 hover:border-slate-200 dark:bg-white/5 dark:hover:border-white/12"
                  }`}
                  key={email.id}
                  onClick={() => setSelectedEmailId(email.id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-base font-semibold text-indigo-700 dark:text-indigo-200">
                          {email.from}
                        </p>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${emailCategoryClass(email.category)}`}
                        >
                          {email.category}
                        </span>
                      </div>
                      <h3 className="mt-2 line-clamp-2 text-lg font-semibold text-slate-950 dark:text-white">
                        {email.subject}
                      </h3>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${priorityClass(email.priority)}`}
                    >
                      {email.priority}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-base leading-7 text-slate-600 dark:text-slate-300">
                    {email.reason}
                  </p>
                  <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                    {formatDate(email.date)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="calym-card min-h-0 overflow-y-auto rounded-2xl border p-5">
          {selectedEmail ? (
            <div className="flex min-h-full flex-col">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div>
                  <p className="text-base font-semibold text-cyan-700 dark:text-cyan-200">
                    {mailView === "draft_send"
                      ? "Draft and send workspace"
                      : "Received reply detail"}
                  </p>
                  <h3 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                    {selectedEmail.subject}
                  </h3>
                  <p className="mt-2 text-lg font-medium text-slate-600 dark:text-slate-300">
                    From {selectedEmail.from}
                  </p>
                </div>
                <span
                  className={`w-fit rounded-full border px-4 py-2 text-base font-semibold ${emailCategoryClass(selectedEmail.category)}`}
                >
                  {selectedEmail.category}
                </span>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_16rem]">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 dark:border-white/10 dark:bg-white/6">
                  <p className="text-base font-semibold text-slate-500 dark:text-slate-400">
                    Reply body
                  </p>
                  <p className="mt-3 text-lg leading-9 text-slate-700 dark:text-slate-200">
                    {selectedEmail.reason}
                  </p>
                </div>
                <div className="rounded-2xl border border-cyan-200 bg-cyan-50/80 p-5 dark:border-cyan-300/20 dark:bg-cyan-400/10">
                  <Sparkles className="size-6 text-cyan-700 dark:text-cyan-200" />
                  <p className="mt-4 text-lg font-semibold text-cyan-950 dark:text-cyan-50">
                    AI read
                  </p>
                  <p className="mt-2 text-base leading-7 text-cyan-800 dark:text-cyan-100">
                    {replyInsight(selectedEmail)}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/6">
                  <p className="text-sm font-semibold uppercase tracking-wide calym-muted">
                    Reply status
                  </p>
                  <p className="mt-2 text-xl font-semibold">
                    {selectedEmail.category === "Reschedule"
                      ? "Reschedule"
                      : selectedEmail.category === "Negative reply"
                        ? "Careful reply"
                        : "Ready to handle"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/6">
                  <p className="text-sm font-semibold uppercase tracking-wide calym-muted">
                    Confidence
                  </p>
                  <p className="mt-2 text-xl font-semibold">
                    {selectedEmail.priority === "High" ? "High priority" : "Normal"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/6">
                  <p className="text-sm font-semibold uppercase tracking-wide calym-muted">
                    Received
                  </p>
                  <p className="mt-2 text-xl font-semibold">
                    {formatDate(selectedEmail.date)}
                  </p>
                </div>
              </div>

              <div className="mt-auto pt-5">
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50/80 p-5 dark:border-indigo-300/20 dark:bg-indigo-400/10">
                  <p className="text-base font-semibold text-indigo-800 dark:text-indigo-100">
                    Suggested command
                  </p>
                  <p className="mt-2 text-lg leading-8 text-indigo-950 dark:text-indigo-50">
                    {selectedEmail.prompt}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button
                      className="calym-primary-action h-12 px-5 text-base"
                      onClick={() => onPromptSelect(selectedEmail.prompt)}
                    >
                      <Sparkles className="mr-2 size-4" />
                      Draft smart reply
                    </Button>
                    <Button
                      className="calym-quiet-button h-12 px-5 text-base"
                      onClick={() =>
                        onPromptSelect(
                          `Summarize this reply from ${selectedEmail.from}: ${selectedEmail.subject}`,
                        )
                      }
                      variant="outline"
                    >
                      Summarize first
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function AgendaTab({
  events,
  onPromptSelect,
}: {
  events: DashboardEvent[];
  onPromptSelect: (prompt: string) => void;
}) {
  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border p-6 backdrop-blur calym-surface">
      <div className="flex items-center gap-3">
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-amber-700">
          <CalendarDays className="size-6" />
        </div>
        <div>
          <h2 className="text-3xl font-semibold text-slate-950 dark:text-white">
            Real Calendar agenda
          </h2>
          <p className="mt-1 text-base text-slate-600 dark:text-slate-300">
            Upcoming events from your primary Google Calendar.
          </p>
        </div>
      </div>
      <div className="mt-5 grid min-h-0 flex-1 gap-4 overflow-y-auto lg:grid-cols-3">
        {events.map((item) => (
          <div
            className="rounded-xl border border-amber-100 calym-card p-5 text-left"
            key={item.id}
          >
            <div className="flex items-center gap-2 text-base font-medium text-amber-700">
              <Clock3 className="size-5" />
              {item.time}
            </div>
            <h3 className="mt-3 text-xl font-semibold text-slate-950 dark:text-white">
              {item.title}
            </h3>
            <p className="mt-2 text-base leading-7 text-slate-600 dark:text-slate-300">
              {item.context}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                className="h-11 border-amber-200 bg-slate-50 text-base text-amber-900 dark:bg-zinc-900"
                onClick={() =>
                  onPromptSelect(`Prepare me for ${item.title} at ${item.time}.`)
                }
                variant="outline"
              >
                Prepare
              </Button>
              {item.htmlLink ? (
                <Button asChild className="h-11 text-base" variant="outline">
                  <a href={item.htmlLink} rel="noreferrer" target="_blank">
                    <ExternalLink className="mr-2 size-4" />
                    Open
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AgentTab({
  executingActionId,
  fastActions,
  onExecuteAction,
  onPromptSelect,
  preparedActions,
}: {
  executingActionId: string | null;
  fastActions: FastAction[];
  onExecuteAction: (action: PreparedAction) => void;
  onPromptSelect: (prompt: string) => void;
  preparedActions: PreparedAction[];
}) {
  return (
    <div className="grid h-full min-h-0 gap-5 lg:grid-cols-[1fr_0.8fr]">
      <section className="flex min-h-0 flex-col rounded-2xl border p-6 backdrop-blur calym-surface">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-violet-100 bg-violet-50 p-3 text-violet-700">
            <Bot className="size-6" />
          </div>
          <div>
            <h2 className="text-3xl font-semibold text-slate-950 dark:text-white">
              Prepared real actions
            </h2>
            <p className="mt-1 text-base text-slate-600 dark:text-slate-300">
              Confirm each item before CalyM writes to Gmail or Calendar.
            </p>
          </div>
        </div>

        <div className="mt-5 grid min-h-0 flex-1 gap-4 overflow-y-auto pr-1">
          {preparedActions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-violet-200 bg-violet-50/60 p-6 text-lg leading-8 text-violet-800">
              No prepared actions yet. Run a prompt from the Overview tab and
              supported Gmail or Calendar actions will appear here.
            </div>
          ) : null}

          {preparedActions.map((action) => {
            const isExecuting = executingActionId === action.id;
            const categoryLabel =
              action.category === "reschedule"
                ? "Reschedule"
                : action.category === "decline"
                  ? "Not interested"
                  : action.category === "positive"
                    ? "Positive"
                    : "Neutral";

            return (
              <div
                className="rounded-xl border border-violet-100 calym-card p-5"
                key={action.id}
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-2xl font-semibold">{action.title}</h3>
                      <span className={`rounded-full border px-3 py-1 text-sm font-medium ${categoryClass(action.category)}`}>
                        {categoryLabel}
                      </span>
                      {action.risk === "high" ? (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
                          Needs confirmation
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 text-lg leading-8 text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                  <Button
                    className={`h-12 px-5 text-base ${
                      action.risk === "high" ? "calym-primary-action" : ""
                    }`}
                    disabled={isExecuting}
                    onClick={() => onExecuteAction(action)}
                    variant={action.risk === "high" ? "default" : "outline"}
                  >
                    {isExecuting ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 size-4" />
                    )}
                    {action.confirmationLabel}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="flex min-h-0 flex-col rounded-2xl border p-6 backdrop-blur calym-surface">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-indigo-700">
            <Zap className="size-6" />
          </div>
          <div>
            <h2 className="text-3xl font-semibold text-slate-950 dark:text-white">Fast actions</h2>
            <p className="mt-1 text-base text-slate-600 dark:text-slate-300">
              Click one to place a real workflow prompt in the command bar.
            </p>
          </div>
        </div>
        <div className="mt-5 grid min-h-0 gap-3 overflow-y-auto pr-1">
          {fastActions.map((action) => {
            const Icon = action.icon;

            return (
              <button
                className="calym-quiet-button flex items-center justify-between rounded-xl border px-5 py-4 text-left shadow-sm transition-colors"
                key={action.key}
                onClick={() => onPromptSelect(action.prompt)}
                type="button"
              >
                <span className="flex items-center gap-3 text-lg font-medium text-slate-800 dark:text-slate-100">
                  <Icon className="size-5 text-indigo-700" />
                  {action.label}
                </span>
                <kbd className="rounded-md border border-indigo-100 bg-indigo-50 px-3 py-1 text-base font-semibold text-indigo-800">
                  {action.key}
                </kbd>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ConnectionsTab({ connections }: Pick<DashboardShellProps, "connections">) {
  return (
    <section className="h-full overflow-y-auto rounded-2xl border p-6 backdrop-blur calym-surface">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-indigo-700">
            <Link2 className="size-6" />
          </div>
          <div>
            <h2 className="text-3xl font-semibold text-slate-950 dark:text-white">Connections</h2>
            <p className="mt-1 text-base text-slate-600 dark:text-slate-300">
              Both integrations are scoped to your BetterAuth user id as the
              Corsair tenant id.
            </p>
          </div>
        </div>
        <Button
          asChild
          className="calym-quiet-button h-12 text-base"
          variant="outline"
        >
          <Link href="/integrations">Manage integrations</Link>
        </Button>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {connections.map((connection) => {
          const Icon = connectionIcon(connection.provider);

          return (
            <div
              className="rounded-2xl border calym-card p-6"
              key={connection.provider}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex size-14 items-center justify-center rounded-2xl border ${connectionBrandClass(connection.provider)}`}
                >
                  <Icon className="size-7" />
                </div>
                <div>
                  <span className="text-2xl font-semibold">
                    {connection.name}
                  </span>
                  <p className="mt-1 text-base calym-muted">
                    {connection.provider === "gmail"
                      ? "Google Mail workspace"
                      : "Google Calendar workspace"}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-base leading-7 calym-muted">
                {connection.description}
              </p>
              <div className="mt-5 flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-base font-medium text-indigo-800 dark:border-indigo-500/20 dark:bg-indigo-950/30 dark:text-indigo-200">
                <CheckCircle2 className="size-5" />
                {connection.connected ? "Connected through Corsair" : "Pending"}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ToastViewport({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div className="fixed right-5 top-5 z-50 flex w-[min(420px,calc(100vw-2.5rem))] flex-col gap-3">
      {toasts.map((toast) => (
        <div
          className={`rounded-lg border bg-background p-4 shadow-lg ${
            toast.tone === "success"
              ? "border-indigo-200"
              : toast.tone === "error"
                ? "border-destructive/30"
                : "border-border"
          }`}
          key={toast.id}
        >
          <div className="flex gap-3">
            {toast.tone === "success" ? (
              <CheckCircle2 className="mt-1 size-5 text-indigo-600" />
            ) : toast.tone === "error" ? (
              <AlertCircle className="mt-1 size-5 text-destructive" />
            ) : (
              <Sparkles className="mt-1 size-5 text-primary" />
            )}
            <div>
              <p className="text-base font-semibold">{toast.title}</p>
              <p className="mt-1 text-base leading-7 text-muted-foreground">
                {toast.message}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}




