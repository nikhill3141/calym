"use client";

import {
  AlertCircle,
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
import Image from "next/image";
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

type InboxView = "draft_send" | "needs_action" | "received";

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

type PromptAlert = {
  events?: {
    end: string;
    start: string;
    title: string;
  }[];
  message: string;
  requestedTime?: string;
  tone: "warning" | "info";
  title: string;
};

type DashboardEmail = {
  action: string;
  category:
    | "Action needed"
    | "Delivery failed"
    | "Meeting"
    | "Negative reply"
    | "Positive reply"
    | "Reschedule"
    | "Review";
  date: string;
  direction: "incoming" | "outgoing";
  from: string;
  fromEmail: string;
  id: string;
  priority: "High" | "Medium" | "Normal";
  prompt: string;
  reason: string;
  snippet: string;
  subject: string;
  to: string;
  toEmail: string;
};

type DashboardEvent = {
  attendees: string[];
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
  emailSubject?: string;
  id: string;
  payload: Record<string, unknown>;
  recipientEmail?: string;
  risk: "low" | "high";
  sentBody?: string;
  sourceCommand?: string;
  title: string;
  type: "calendar_event" | "email_draft" | "email_send";
};

type DashboardInsights = {
  deliveryFailures: DashboardEmail[];
  needsAction: DashboardEmail[];
  nextMeetings: DashboardEvent[];
  priorityMeetings: DashboardEvent[];
  rejections: DashboardEmail[];
  reschedules: DashboardEmail[];
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
    body?: string;
    date: string;
    from: string;
    fromEmail?: string;
    id: string;
    labels: string[];
    snippet: string;
    subject: string;
    to: string;
    toEmail?: string;
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
    direction: "incoming",
    from: "Corsair Team",
    fromEmail: "demo@example.com",
    id: "fallback-corsair",
    priority: "High",
    prompt: "Draft a reply to Corsair about the API access checklist.",
    reason: "Needs setup attention before the next build step.",
    snippet: "Connect Gmail and refresh live data to replace this sample.",
    subject: "API access and integration checklist",
    to: "You",
    toEmail: "",
  },
  {
    action: "Schedule",
    category: "Meeting",
    date: "",
    direction: "incoming",
    from: "Aarav Mehta",
    fromEmail: "aarav@example.com",
    id: "fallback-review",
    priority: "High",
    prompt: "Schedule a follow-up with Aarav tomorrow and draft a confirmation.",
    reason: "Meeting-related thread with scheduling context.",
    snippet: "This is placeholder data until Corsair returns your real inbox.",
    subject: "Follow-up on tomorrow's product review",
    to: "You",
    toEmail: "",
  },
];

const fallbackAgenda: DashboardEvent[] = [
  {
    attendees: [],
    context: "Connect Calendar and refresh live data to replace this sample.",
    end: "",
    id: "fallback-oauth",
    start: "",
    time: "09:00",
    title: "Review Gmail connection flow",
  },
  {
    attendees: [],
    context: "Define create-invite and update-event prompt flows.",
    end: "",
    id: "fallback-calendar",
    start: "",
    time: "13:30",
    title: "Calendar automation planning",
  },
  {
    attendees: [],
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
    action: "compose",
    description: "Open the Gmail compose popup",
    key: "C",
    icon: Send,
    label: "Compose email",
  },
  {
    action: "search",
    description: "Focus inbox email search",
    key: "/",
    icon: Search,
    label: "Search email",
  },
  {
    action: "received",
    description: "Jump to received Gmail replies",
    key: "R",
    icon: Mail,
    label: "Received replies",
  },
  {
    action: "needs_action",
    description: "Open reschedules, rejections, and failures",
    key: "N",
    icon: AlertCircle,
    label: "Needs action",
  },
  {
    action: "agenda",
    description: "Open the Google Calendar agenda",
    key: "A",
    icon: CalendarDays,
    label: "Agenda",
  },
  {
    action: "prompt",
    description: "Prepare a calendar invite and email",
    key: "M",
    icon: Sparkles,
    label: "Create meeting",
    prompt:
      "Send a calendar invite to demo@example.com at 9 AM next Thursday. Send them an email too saying I look forward to our meeting.",
  },
  {
    action: "prompt",
    description: "Prepare a polite reschedule draft",
    key: "S",
    icon: RefreshCw,
    label: "Reschedule mail",
    prompt:
      "Create a Gmail draft to demo@example.com saying I need to reschedule our meeting and asking them to share a better time.",
  },
] as const;

type FastAction = (typeof fastActions)[number];

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
  if (category === "Delivery failed") {
    return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-200";
  }

  if (category === "Reschedule") {
    return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-200";
  }

  if (category === "Negative reply") {
    return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-200";
  }

  if (category === "Positive reply") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-200";
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
  from?: string;
  fromEmail?: string;
  labels: string[];
  snippet: string;
  subject: string;
}) {
  const latestReplyText = email.snippet
    .split(/\n\s*On .+ wrote:\s*/i)[0]
    .split(/\n\s*>/)[0]
    .trim();
  const text = `${email.from ?? ""} ${email.fromEmail ?? ""} ${email.subject} ${latestReplyText || email.snippet}`.toLowerCase();

  if (
    /\b(mailer-daemon|mail delivery subsystem|delivery status notification|address not found|message wasn't delivered|couldn'?t be delivered|550 5\.1\.1|nosuchuser|no such user|recipient address rejected)\b/.test(
      text,
    )
  ) {
    return "Delivery failed" as const;
  }

  if (
    /\b(reschedule|busy|unavailable|another time|different time|can't make|cannot make|not free|postpone|move this|move the meeting|new time|different slot)\b/.test(
      text,
    )
  ) {
    return "Reschedule" as const;
  }

  if (
    /\b(not interested|not intrested|no longer interested|no longer intrested|decline|declined|pass on this|not a fit|not needed|unsubscribe|no thanks|not for me|not looking|stop emailing)\b/.test(
      text,
    )
  ) {
    return "Negative reply" as const;
  }

  if (
    /\b(accepted|confirmed|confirming|sounds good|works for me|that works|looking forward|look forward|see you then|yes,?|great,?|happy to)\b/.test(
      text,
    )
  ) {
    return "Positive reply" as const;
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
  const rawMessageBody = email.body || email.snippet || "";
  const priority = email.labels.includes("IMPORTANT")
    ? "High"
    : email.labels.includes("CATEGORY_PRIMARY")
      ? "Medium"
      : "Normal";
  const category = inferEmailCategory({
    from: email.from,
    fromEmail: email.fromEmail,
    labels: email.labels,
    snippet: rawMessageBody,
    subject: email.subject,
  });
  const failedRecipient =
    extractEmailAddress(rawMessageBody) ||
    extractEmailAddress(email.subject) ||
    email.toEmail ||
    email.to;
  const messageBody =
    category === "Delivery failed"
      ? `Email was not delivered${failedRecipient ? ` to ${failedRecipient}` : ""}. Please check the recipient address and try again.`
      : rawMessageBody;
  const direction = email.labels.includes("SENT") ? "outgoing" : "incoming";
  const contact = direction === "outgoing" ? email.to : email.from;
  const action =
    category === "Reschedule"
      ? "Handle reschedule"
      : category === "Delivery failed"
        ? "Check address"
        : category === "Negative reply"
          ? "Review response"
          : category === "Positive reply"
            ? "No action needed"
            : category === "Meeting"
              ? "Prepare meeting"
              : "Draft reply";

  return {
    action,
    category,
    date: email.date,
    direction,
    from: email.from,
    fromEmail: email.fromEmail ?? "",
    id: email.id,
    priority,
    prompt:
      category === "Reschedule"
        ? `Draft a reschedule reply to ${contact} about "${email.subject}".`
        : category === "Negative reply"
          ? `Categorize and draft a respectful reply to ${contact} about "${email.subject}".`
          : `Draft a reply to ${contact} about "${email.subject}".`,
    reason: messageBody,
    snippet: messageBody,
    subject: email.subject,
    to: email.to,
    toEmail: email.toEmail ?? "",
  } satisfies DashboardEmail;
}

function mapLiveEvent(
  event: NonNullable<LiveDataResponse["calendarEvents"]>[number],
) {
  return {
    attendees: event.attendees,
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

function contactDisplayName(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "Recipient";
  }

  const namedMatch = trimmedValue.match(/^"?([^"<]+?)"?\s*<[^>]+>$/);

  if (namedMatch?.[1]) {
    return namedMatch[1].trim();
  }

  if (trimmedValue.includes("@")) {
    return trimmedValue.split("@")[0].replace(/[._-]+/g, " ");
  }

  return trimmedValue;
}

function contactInitial(value: string) {
  return contactDisplayName(value).charAt(0).toUpperCase() || "U";
}

function extractEmailAddress(value: string) {
  return value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
}

function usableContact(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  if (/^(unknown|sender needs review|recipient needs review)$/i.test(trimmedValue)) {
    return "";
  }

  return trimmedValue;
}

function sendToLabel(email: DashboardEmail) {
  const promptEmail = extractEmailAddress(
    [email.prompt, email.reason, email.snippet, email.subject].join(" "),
  );

  return (
    usableContact(email.toEmail) ||
    usableContact(email.to) ||
    promptEmail ||
    "Recipient"
  );
}

function receivedFromLabel(email: DashboardEmail) {
  return usableContact(email.fromEmail) || usableContact(email.from) || "Sender unavailable";
}

function requestRecipientLabel(email: DashboardEmail) {
  if (email.direction === "outgoing") {
    return sendToLabel(email);
  }

  const promptEmail = extractEmailAddress(
    [email.prompt, email.reason, email.snippet, email.subject].join(" "),
  );

  return usableContact(email.fromEmail) || promptEmail || usableContact(email.from) || "Recipient unavailable";
}

function requestEmailBody(email: DashboardEmail) {
  return email.reason || email.snippet || email.subject;
}

function subjectFromCommand(command: string, actions: PreparedAction[]) {
  const emailSubject = actions.find((action) => action.emailSubject)?.emailSubject;

  if (emailSubject) {
    return emailSubject;
  }

  const normalizedCommand = command.toLowerCase();

  if (normalizedCommand.includes("reschedule")) {
    return "Request to reschedule our meeting";
  }

  if (normalizedCommand.includes("demo")) {
    return "CalyM demo update";
  }

  if (actions.some((action) => action.type === "calendar_event")) {
    return "Meeting invitation prepared";
  }

  return "Email prepared by CalyM";
}

function buildPromptOutboxEmail({
  actions,
  command,
  user,
}: {
  actions: PreparedAction[];
  command: string;
  user: DashboardShellProps["user"];
}) {
  if (actions.length === 0) {
    return null;
  }

  const recipientEmail =
    actions.find((action) => action.recipientEmail)?.recipientEmail ||
    extractEmailAddress(command);

  if (!recipientEmail) {
    return null;
  }

  const hasCalendarAction = actions.some(
    (action) => action.type === "calendar_event",
  );
  const hasEmailAction = actions.some((action) => action.type !== "calendar_event");
  const actionLabel = hasCalendarAction
    ? hasEmailAction
      ? "Meeting + email"
      : "Schedule"
    : "Draft reply";
  const userDisplayName = user.name.trim() || user.email;
  const subject = subjectFromCommand(command, actions);
  const sentBody =
    actions.find((action) => action.sentBody)?.sentBody ||
    actions.find((action) => action.sourceCommand)?.sourceCommand ||
    command;

  return {
    action: actionLabel,
    category: hasCalendarAction ? "Meeting" : "Action needed",
    date: new Date().toISOString(),
    direction: "outgoing",
    from: userDisplayName,
    fromEmail: user.email,
    id: `prompt-outbox-${recipientEmail}-${Date.now()}`,
    priority: hasCalendarAction ? "High" : "Medium",
    prompt: command,
    reason: sentBody,
    snippet: sentBody,
    subject,
    to: recipientEmail,
    toEmail: recipientEmail,
  } satisfies DashboardEmail;
}

export function DashboardShell({ connections, user }: DashboardShellProps) {
  const activityIdRef = useRef(0);
  const toastIdRef = useRef(0);
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [composeRequestId, setComposeRequestId] = useState<number | null>(null);
  const [searchFocusRequestId, setSearchFocusRequestId] = useState<number | null>(null);
  const [command, setCommand] = useState(
    "Send a calendar invite to demo@example.com at 9 AM next Thursday. Send them an email too saying I look forward to our meeting.",
  );
  const [query, setQuery] = useState("");
  const [emails, setEmails] = useState<DashboardEmail[]>(fallbackEmails);
  const [events, setEvents] = useState<DashboardEvent[]>(fallbackAgenda);
  const [dashboardNow, setDashboardNow] = useState(() => Date.now());
  const [promptOutboxEmails, setPromptOutboxEmails] = useState<DashboardEmail[]>([]);
  const [preparedActions, setPreparedActions] = useState<PreparedAction[]>([]);
  const [promptAlert, setPromptAlert] = useState<PromptAlert | null>(null);
  const [isLoadingLiveData, setIsLoadingLiveData] = useState(true);
  const [isPreparingPrompt, setIsPreparingPrompt] = useState(false);
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);
  const [liveLoadedAt, setLiveLoadedAt] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [inboxViewRequest, setInboxViewRequest] = useState<{
    id: number;
    view: InboxView;
  }>({ id: 0, view: "needs_action" });
  const [activity, setActivity] = useState<ActivityItem[]>([
    {
      id: "initial",
      message: "Dashboard ready. Live data will load through Corsair.",
    },
  ]);

  const activeNav = navItems.find((item) => item.tab === activeTab);
  const connectedCount = connections.filter((connection) => connection.connected).length;
  const inboxEmails = useMemo(
    () => [...promptOutboxEmails, ...emails],
    [emails, promptOutboxEmails],
  );

  const metrics = useMemo(
    () => [
      {
        label: "Inbox threads",
        value: inboxEmails.length.toString(),
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
    [connectedCount, events.length, inboxEmails.length, liveLoadedAt, preparedActions.length],
  );

  const dashboardInsights = useMemo<DashboardInsights>(() => {
    const received = inboxEmails.filter((email) => email.direction === "incoming");
    const needsAction = received.filter((email) =>
      ["Action needed", "Delivery failed", "Negative reply", "Reschedule"].includes(email.category),
    );
    const now = dashboardNow;
    const sortedMeetings = [...events]
      .filter((event) => {
        const start = new Date(event.start);

        return !Number.isNaN(start.getTime()) && start.getTime() >= now;
      })
      .sort(
        (first, second) =>
          new Date(first.start).getTime() - new Date(second.start).getTime(),
      );
    const priorityMeetings = sortedMeetings.filter((event) => {
      const start = new Date(event.start);
      const hoursAway = (start.getTime() - now) / 36e5;

      return hoursAway <= 72;
    });

    return {
      deliveryFailures: needsAction.filter((email) => email.category === "Delivery failed"),
      needsAction,
      nextMeetings: sortedMeetings.slice(0, 3),
      priorityMeetings,
      rejections: needsAction.filter((email) => email.category === "Negative reply"),
      reschedules: needsAction.filter((email) => email.category === "Reschedule"),
    };
  }, [dashboardNow, events, inboxEmails]);

  const visibleEmails = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return inboxEmails;
    }

    return inboxEmails.filter((email) =>
      [email.category, email.from, email.to, email.subject, email.reason, email.priority]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [inboxEmails, query]);

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

  const loadLiveData = useCallback(async (options?: { silent?: boolean }) => {
    const isSilent = options?.silent ?? false;

    if (!isSilent) {
      setIsLoadingLiveData(true);
    }

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
      setDashboardNow(Date.now());
      setLiveLoadedAt(data.loadedAt ?? new Date().toISOString());

      if (!isSilent) {
        pushActivity("Loaded real Gmail and Calendar data through Corsair.");
        pushToast({
          message: "Your inbox and agenda are now using live Corsair data.",
          title: "Live data loaded",
          tone: "success",
        });
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not load live Gmail and Calendar data.";

      if (!isSilent) {
        pushActivity(`Live data failed: ${message}`);
        pushToast({
          message,
          title: "Live data needs attention",
          tone: "error",
        });
      }
    } finally {
      if (!isSilent) {
        setIsLoadingLiveData(false);
      }
    }
  }, [pushActivity, pushToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLiveData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadLiveData]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadLiveData({ silent: true });
    }, 30000);

    return () => window.clearInterval(interval);
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

  const applyPrompt = useCallback((prompt: string) => {
    setCommand(prompt);
    setPromptAlert(null);
    setActiveTab("overview");
    pushActivity(`Prepared prompt: ${prompt}`);
    pushToast({
      message: "The prompt is ready in the command bar.",
      title: "Prompt selected",
      tone: "info",
    });
  }, [pushActivity, pushToast]);

  const openInbox = useCallback((view: InboxView) => {
    setActiveTab("inbox");
    setInboxViewRequest((current) => ({ id: current.id + 1, view }));
  }, []);

  const openComposeShortcut = useCallback(() => {
    openInbox("draft_send");
    setComposeRequestId(Date.now());
    pushActivity("Opened the Gmail compose shortcut.");
  }, [openInbox, pushActivity]);

  const runFastAction = useCallback((action: FastAction) => {
    if (action.action === "compose") {
      openComposeShortcut();
      return;
    }

    if (action.action === "search") {
      openInbox("received");
      setSearchFocusRequestId(Date.now());
      return;
    }

    if (action.action === "received" || action.action === "needs_action") {
      openInbox(action.action);
      return;
    }

    if (action.action === "agenda") {
      setActiveTab("agenda");
      return;
    }

    if (action.action === "prompt") {
      applyPrompt(action.prompt);
    }
  }, [applyPrompt, openComposeShortcut, openInbox]);

  useEffect(() => {
    function isTypingTarget(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) {
        return false;
      }

      const tagName = target.tagName.toLowerCase();

      return (
        tagName === "input" ||
        tagName === "select" ||
        tagName === "textarea" ||
        target.isContentEditable
      );
    }

    function handleShortcut(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) {
        return;
      }

      if (isTypingTarget(event.target)) {
        return;
      }

      const action = fastActions.find(
        (item) => item.key.toLowerCase() === event.key.toLowerCase(),
      );

      if (!action) {
        return;
      }

      event.preventDefault();
      runFastAction(action);
    }

    window.addEventListener("keydown", handleShortcut);

    return () => window.removeEventListener("keydown", handleShortcut);
  }, [runFastAction]);

  async function runCommand() {
    setIsPreparingPrompt(true);
    setPreparedActions([]);
    setPromptAlert(null);

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
        conflict?: {
          events: {
            end: string;
            start: string;
            title: string;
          }[];
          message: string;
          requestedTime: string;
        };
        error?: string;
        summary?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not prepare prompt actions.");
      }

      const actions = data.actions ?? [];

      if (data.conflict) {
        setPreparedActions([]);
        setPromptAlert({
          events: data.conflict.events,
          message: data.conflict.message,
          requestedTime: data.conflict.requestedTime,
          title: "This time is already booked",
          tone: "warning",
        });
        setActiveTab("overview");
        return;
      }

      const promptOutboxEmail = buildPromptOutboxEmail({
        actions,
        command,
        user,
      });

      setPreparedActions(actions);

      if (promptOutboxEmail) {
        setPromptOutboxEmails((current) =>
          [
            promptOutboxEmail,
            ...current.filter(
              (email) =>
                email.toEmail !== promptOutboxEmail.toEmail ||
                email.prompt !== promptOutboxEmail.prompt,
            ),
          ].slice(0, 8),
        );
      }

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
        <aside className="calym-surface hidden h-screen w-[22rem] shrink-0 border-r px-5 py-5 backdrop-blur-xl xl:w-96 lg:flex lg:flex-col">
          <div className="flex h-14 items-center px-4">
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
          </div>

          <nav className="mt-4 flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.tab;

              return (
                <button
                  className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-left text-base font-medium transition-colors ${
                    isActive ? "calym-active-tab" : "text-slate-600 dark:text-slate-300"
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

          <div className="mt-4 shrink-0">
            <DashboardProfile
              email={user.email}
              image={user.image}
              name={user.name}
            />
          </div>
        </aside>

        <section className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
          <header className="calym-surface z-10 shrink-0 border-b px-6 py-3 backdrop-blur-xl">
            <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {activeNav?.label ?? "Dashboard"}
                </p>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
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
                  className="calym-quiet-button h-10 px-4 text-base"
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
                  className="calym-quiet-button h-10 px-4 text-base"
                  disabled={isLoadingLiveData}
                  onClick={() => loadLiveData()}
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
                  className="calym-primary-action h-10 px-4 text-base"
                  onClick={() => setActiveTab("overview")}
                >
                  <Sparkles className="mr-2 size-4" />
                  Ask CalyM
                </Button>
              </div>
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.tab;

                return (
                  <button
                    className={`flex shrink-0 items-center gap-2 rounded-lg border px-4 py-3 text-base font-medium ${
                      isActive
                        ? "calym-active-tab border-transparent"
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
                insights={dashboardInsights}
                isPreparingPrompt={isPreparingPrompt}
                metrics={metrics}
                onCommandChange={(value) => {
                  setCommand(value);
                  setPromptAlert(null);
                }}
                onOpenAgenda={() => setActiveTab("agenda")}
                onOpenInbox={openInbox}
                onRunCommand={runCommand}
                promptAlert={promptAlert}
                onPromptAlertDismiss={() => setPromptAlert(null)}
              />
            ) : null}

            {activeTab === "inbox" ? (
              <InboxTab
                composeRequestId={composeRequestId}
                emails={visibleEmails}
                inboxViewRequest={inboxViewRequest}
                isLoading={isLoadingLiveData}
                onComposeRequestHandled={() => setComposeRequestId(null)}
                onPromptSelect={applyPrompt}
                onQueryChange={setQuery}
                onSearchFocusHandled={() => setSearchFocusRequestId(null)}
                query={query}
                searchFocusRequestId={searchFocusRequestId}
                user={user}
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
    <section className="mt-5 flex min-h-0 flex-1 flex-col border-t border-slate-200 pt-4 dark:border-white/10">
      <div className="flex shrink-0 items-center gap-2">
        <Sparkles className="size-4 text-indigo-600 dark:text-indigo-300" />
        <h2 className="text-base font-semibold text-slate-950 dark:text-white">
          Activity
        </h2>
      </div>
      <div className="calym-scrollbar mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
        {activity.map((item, index) => (
          <div
            className="relative border-l border-slate-200 pb-4 pl-4 text-sm leading-6 text-slate-600 last:pb-0 dark:border-white/10 dark:text-slate-300"
            key={item.id}
          >
            <span
              className={`absolute -left-[5px] top-1 size-2.5 rounded-full ring-4 ring-slate-50 dark:ring-[#0b1020] ${
                index === 0 ? "bg-cyan-500" : "bg-indigo-300"
              }`}
            />
            <p className="line-clamp-3">{item.message}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function OverviewTab({
  command,
  insights,
  isPreparingPrompt,
  metrics,
  onCommandChange,
  onOpenAgenda,
  onOpenInbox,
  onPromptAlertDismiss,
  onRunCommand,
  promptAlert,
}: {
  command: string;
  insights: DashboardInsights;
  isPreparingPrompt: boolean;
  metrics: { helper: string; label: string; value: string }[];
  onCommandChange: (value: string) => void;
  onOpenAgenda: () => void;
  onOpenInbox: (view: InboxView) => void;
  onPromptAlertDismiss: () => void;
  onRunCommand: () => void;
  promptAlert: PromptAlert | null;
}) {
  const focusCards = [
    {
      action: () => onOpenInbox("needs_action"),
      helper: "Replies that need a decision",
      label: "Needs action",
      tone: "border-l-rose-500",
      value: insights.needsAction.length,
    },
    {
      action: () => onOpenInbox("needs_action"),
      helper: "People asking for a new time",
      label: "Reschedules",
      tone: "border-l-amber-500",
      value: insights.reschedules.length,
    },
    {
      action: () => onOpenInbox("needs_action"),
      helper: "Declined or not interested",
      label: "Rejected replies",
      tone: "border-l-violet-500",
      value: insights.rejections.length,
    },
    {
      action: onOpenAgenda,
      helper: "Meetings in the next 72 hours",
      label: "Priority meetings",
      tone: "border-l-cyan-500",
      value: insights.priorityMeetings.length,
    },
  ];

  return (
    <div className="grid h-full min-h-0 gap-3 xl:grid-rows-[auto_minmax(0,1fr)_auto]">
      <section className="grid shrink-0 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {focusCards.map((card) => (
          <button
            className={`calym-card rounded-xl border border-l-4 p-3 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${card.tone}`}
            key={card.label}
            onClick={card.action}
            type="button"
          >
            <p className="text-base font-semibold text-slate-700 dark:text-slate-200">
              {card.label}
            </p>
            <p className="mt-1 text-3xl font-semibold text-slate-950 dark:text-white">
              {card.value}
            </p>
            <p className="mt-1 line-clamp-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {card.helper}
            </p>
          </button>
        ))}
      </section>

      <section className="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
        <div className="calym-card flex min-h-0 flex-col overflow-hidden rounded-2xl border p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide calym-muted">
                Priority inbox
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">
                What needs your attention
              </h2>
            </div>
            <Button
              className="calym-quiet-button h-10 px-4 text-base"
              onClick={() => onOpenInbox("needs_action")}
              variant="outline"
            >
              Open inbox
            </Button>
          </div>

          <div className="calym-scrollbar mt-4 grid min-h-0 flex-1 content-start gap-3 overflow-y-auto pr-1">
            {insights.needsAction.slice(0, 4).map((email) => (
              <button
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50/70 dark:border-white/10 dark:bg-white/5 dark:hover:border-indigo-300/20 dark:hover:bg-indigo-400/10"
                key={email.id}
                onClick={() => onOpenInbox("needs_action")}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-slate-950 dark:text-white">
                      {email.subject}
                    </p>
                    <p className="mt-1 truncate text-sm calym-muted">
                      {email.category} from {contactDisplayName(receivedFromLabel(email))}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${emailCategoryClass(email.category)}`}>
                    {email.priority}
                  </span>
                </div>
              </button>
            ))}

            {insights.needsAction.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-center dark:border-white/10">
                <CheckCircle2 className="mx-auto size-8 text-cyan-500" />
                <p className="mt-3 text-lg font-semibold text-slate-950 dark:text-white">
                  No urgent replies right now
                </p>
                <p className="mt-1 text-base calym-muted">
                  Reschedules, rejections, and delivery failures will appear here.
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-4">
          <div className="calym-card flex min-h-0 flex-col overflow-hidden rounded-2xl border p-4">
            <div className="flex shrink-0 items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-300/20 dark:bg-cyan-400/10 dark:text-cyan-100">
                  <CalendarDays className="size-4" />
                </span>
                <p className="truncate text-base font-semibold text-slate-950 dark:text-white">
                  Next meetings
                </p>
              </div>
              <Button
                className="calym-quiet-button h-9 shrink-0 px-3 text-sm"
                onClick={onOpenAgenda}
                variant="outline"
              >
                Agenda
              </Button>
            </div>
            <div className="calym-scrollbar mt-3 grid min-h-0 flex-1 content-start gap-2 overflow-y-auto pr-1">
              {insights.nextMeetings.slice(0, 2).map((event) => (
                <div
                  className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 dark:border-white/10 dark:bg-white/5"
                  key={event.id}
                >
                  <p className="truncate text-base font-semibold text-slate-950 dark:text-white">
                    {event.title}
                  </p>
                  <p className="text-sm calym-muted">
                    {formatDate(event.start)} at {formatTime(event.start)}
                  </p>
                </div>
              ))}
              {insights.nextMeetings.length === 0 ? (
                <p className="text-base calym-muted">No upcoming meetings loaded.</p>
              ) : null}
            </div>
          </div>

          <div className="calym-card flex min-h-0 flex-col overflow-hidden rounded-2xl border p-4">
            <div className="flex shrink-0 items-center gap-2">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-300/20 dark:bg-indigo-400/10 dark:text-indigo-100">
                <Zap className="size-4" />
              </span>
              <p className="text-base font-semibold text-slate-950 dark:text-white">
                System pulse
              </p>
            </div>
            <div className="calym-scrollbar mt-3 grid min-h-0 flex-1 grid-cols-2 content-start gap-2 overflow-y-auto pr-1">
              {metrics.map((metric) => {
                const MetricIcon =
                  metric.label === "Inbox threads"
                    ? Inbox
                    : metric.label === "Upcoming events"
                      ? CalendarDays
                      : metric.label === "Prepared actions"
                        ? Bot
                        : Link2;

                return (
                  <div
                    className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 dark:border-white/10 dark:bg-white/5"
                    key={metric.label}
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-indigo-100 bg-white text-indigo-700 dark:border-white/10 dark:bg-white/8 dark:text-indigo-200">
                      <MetricIcon className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xl font-semibold leading-none text-slate-950 dark:text-white">
                        {metric.value}
                      </span>
                      <span className="mt-1 block truncate text-xs font-medium calym-muted">
                        {metric.label}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="shrink-0 rounded-2xl border p-3 backdrop-blur calym-surface">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex items-center gap-3 lg:w-64">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-950/30 dark:text-indigo-200">
              <Command className="size-6" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-medium text-indigo-700 dark:text-indigo-200">
                Prompt composer
              </p>
              <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
                Ask CalyM
              </h2>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div>
                <textarea
                  className="calym-focus min-h-16 w-full resize-none rounded-xl border p-3 text-base leading-6 text-slate-800 shadow-inner outline-none transition-colors placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                  onChange={(event) => onCommandChange(event.target.value)}
                  placeholder="Ask CalyM to schedule a meeting, reply to an email, reschedule, or summarize what needs attention..."
                  value={command}
                />
              </div>
              <Button
                className="h-12 calym-primary-action px-6 text-base"
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
            {promptAlert ? (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm dark:bg-black/45"
                onClick={onPromptAlertDismiss}
                role="presentation"
              >
                <div
                  aria-labelledby="calendar-conflict-title"
                  aria-modal="true"
                  className="w-full max-w-2xl rounded-3xl border border-indigo-200 bg-slate-50 p-5 text-slate-950 shadow-2xl shadow-indigo-950/12 dark:border-indigo-300/20 dark:bg-[#0b1020] dark:text-slate-50"
                  onClick={(event) => event.stopPropagation()}
                  role="dialog"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-300/20 dark:bg-cyan-400/10 dark:text-cyan-100">
                      <AlertCircle className="size-6" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-2xl font-semibold tracking-tight"
                        id="calendar-conflict-title"
                      >
                        {promptAlert.title}
                      </p>
                      <p className="mt-2 text-base leading-7">
                        {promptAlert.message} No email or calendar invite was prepared.
                      </p>
                    </div>
                  </div>

                  {promptAlert.events?.length ? (
                    <div className="mt-5 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 dark:border-indigo-300/20 dark:bg-indigo-400/10">
                      <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-200">
                        Meetings on this day
                      </p>
                      <div className="mt-3 grid gap-2">
                        {promptAlert.events.map((event) => (
                          <div
                            className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-base dark:border-white/10 dark:bg-white/7 sm:flex-row sm:items-center sm:justify-between"
                            key={`${event.title}-${event.start}`}
                          >
                            <span className="font-semibold">{event.title}</span>
                            <span className="text-cyan-700 dark:text-cyan-100">
                              {formatTime(event.start)} - {formatTime(event.end)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-base font-medium">
                      Change the date or time in your prompt, then prepare again.
                    </p>
                    <Button
                      className="calym-quiet-button h-11 px-5 text-base"
                      onClick={onPromptAlertDismiss}
                      variant="outline"
                    >
                      Back to prompt
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
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
  composeRequestId,
  emails,
  inboxViewRequest,
  isLoading,
  onComposeRequestHandled,
  onPromptSelect,
  onQueryChange,
  onSearchFocusHandled,
  query,
  searchFocusRequestId,
  user,
}: {
  composeRequestId: number | null;
  emails: DashboardEmail[];
  inboxViewRequest: { id: number; view: InboxView };
  isLoading: boolean;
  onComposeRequestHandled: () => void;
  onPromptSelect: (prompt: string) => void;
  onQueryChange: (value: string) => void;
  onSearchFocusHandled: () => void;
  query: string;
  searchFocusRequestId: number | null;
  user: DashboardShellProps["user"];
}) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [mailView, setMailView] = useState<InboxView>("needs_action");
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const receivedEmails = emails.filter((email) => email.direction === "incoming");
  const sentEmails = emails.filter((email) => email.direction === "outgoing");
  const needsActionEmails = receivedEmails.filter((email) =>
    ["Action needed", "Delivery failed", "Negative reply", "Reschedule"].includes(email.category),
  );
  const displayEmails = mailView === "needs_action"
    ? needsActionEmails
    : mailView === "draft_send"
      ? sentEmails
      : receivedEmails;
  const selectedEmail =
    displayEmails.find((email) => email.id === selectedEmailId) ??
    displayEmails[0] ??
    null;
  const [customEmail, setCustomEmail] = useState({
    body: "",
    subject: "",
    to: "",
  });
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [customEmailStatus, setCustomEmailStatus] = useState<{
    message: string;
    tone: "error" | "sent";
  } | null>(null);
  const [isSendingCustomEmail, setIsSendingCustomEmail] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyStatus, setReplyStatus] = useState<Record<
    string,
    { message: string; tone: "error" | "sent" }
  >>({});
  const [sentThreadReplies, setSentThreadReplies] = useState<Record<
    string,
    {
      body: string;
      date: string;
      id: string;
      subject: string;
      to: string;
    }[]
  >>({});
  const [sendingReplyId, setSendingReplyId] = useState<string | null>(null);
  const userDisplayName = user.name.trim() || user.email;
  const isDraftView = mailView === "draft_send";

  useEffect(() => {
    if (inboxViewRequest.id > 0) {
      setMailView(inboxViewRequest.view);

      if (inboxViewRequest.view !== "draft_send") {
        setIsComposerOpen(false);
      }
    }
  }, [inboxViewRequest]);

  useEffect(() => {
    if (composeRequestId !== null) {
      setMailView("draft_send");
      setIsComposerOpen(true);
      onComposeRequestHandled();
    }
  }, [composeRequestId, onComposeRequestHandled]);

  useEffect(() => {
    if (searchFocusRequestId !== null) {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
      onSearchFocusHandled();
    }
  }, [onSearchFocusHandled, searchFocusRequestId]);
  const mailTabs = [
    {
      count: sentEmails.length,
      helper: "Mail prepared or sent from CalyM",
      icon: Send,
      id: "draft_send" as const,
      label: "Draft & send",
    },
    {
      count: receivedEmails.length,
      helper: "Real incoming Gmail replies",
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
  ];

  function replyInsight(email: DashboardEmail) {
    if (email.category === "Reschedule") {
      return "Reschedule reply detected. Pick a new time before sending an update.";
    }

    if (email.category === "Negative reply") {
      return "Rejection or not-interested reply detected. Keep the next response short and respectful.";
    }

    if (email.category === "Meeting") {
      return "Meeting-related message. Check your calendar before taking action.";
    }

    if (email.category === "Action needed") {
      return "This message needs a response or a decision.";
    }

    return email.direction === "outgoing"
      ? "This is the exact message prepared from your prompt."
      : "This is the exact reply received from Gmail.";
  }

  function emptyStateText() {
    if (mailView === "received") {
      return {
        title: "No replies yet",
        body: "When someone replies to your email, it will appear here.",
      };
    }

    if (mailView === "needs_action") {
      return {
        title: "No replies need action",
        body: "Delivery failures, reschedules, and rejection replies will appear here.",
      };
    }

    return {
      title: "No sent messages yet",
      body: "Messages prepared or sent from CalyM will appear here.",
    };
  }

  function replyStatusLabel(email: DashboardEmail) {
    if (email.category === "Delivery failed") {
      return "Delivery failed";
    }

    if (email.category === "Positive reply") {
      return "Positive";
    }

    if (email.category === "Negative reply") {
      return "Rejected";
    }

    if (email.category === "Reschedule") {
      return "Reschedule";
    }

    if (email.category === "Action needed") {
      return "Needs action";
    }

    return email.direction === "incoming" ? "Reply" : "Sent";
  }

  function replyRecipientEmail(email: DashboardEmail) {
    return (
      usableContact(email.fromEmail) ||
      extractEmailAddress(email.from) ||
      extractEmailAddress(receivedFromLabel(email))
    );
  }

  function relatedSentMessages(email: DashboardEmail) {
    const fromEmail = replyRecipientEmail(email).toLowerCase();
    const fromName = contactDisplayName(receivedFromLabel(email)).toLowerCase();
    const normalizedSubject = email.subject
      .replace(/^re:\s*/i, "")
      .trim()
      .toLowerCase();

    return sentEmails
      .filter((sentEmail) => {
        const toLabel = sendToLabel(sentEmail).toLowerCase();
        const sentSubject = sentEmail.subject
          .replace(/^re:\s*/i, "")
          .trim()
          .toLowerCase();

        return (
          (fromEmail && toLabel.includes(fromEmail)) ||
          (fromName && toLabel.includes(fromName)) ||
          (normalizedSubject && sentSubject === normalizedSubject)
        );
      })
      .slice(0, 2);
  }

  async function sendCustomEmail() {
    setCustomEmailStatus(null);

    if (!customEmail.to.trim() || !customEmail.subject.trim() || !customEmail.body.trim()) {
      setCustomEmailStatus({
        message: "Add recipient, subject, and message before sending.",
        tone: "error",
      });
      return;
    }

    setIsSendingCustomEmail(true);

    try {
      const response = await fetch("/api/dashboard/prompt", {
        body: JSON.stringify({
          body: customEmail.body,
          mode: "send_custom_email",
          recipientEmail: customEmail.to.trim(),
          subject: customEmail.subject,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const data = (await response.json()) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not send email.");
      }

      setCustomEmail({
        body: "",
        subject: "",
        to: customEmail.to,
      });
      setCustomEmailStatus({
        message: data.message ?? "Email sent.",
        tone: "sent",
      });
    } catch (error) {
      setCustomEmailStatus({
        message: error instanceof Error ? error.message : "Could not send email.",
        tone: "error",
      });
    } finally {
      setIsSendingCustomEmail(false);
    }
  }

  async function sendInlineReply(email: DashboardEmail) {
    const body = replyDrafts[email.id]?.trim() ?? "";
    const recipientEmail = replyRecipientEmail(email);

    setReplyStatus((current) => ({
      ...current,
      [email.id]: { message: "", tone: "sent" },
    }));

    if (!recipientEmail || !body) {
      setReplyStatus((current) => ({
        ...current,
        [email.id]: {
          message: "Write a reply and make sure the sender email is available.",
          tone: "error",
        },
      }));
      return;
    }

    setSendingReplyId(email.id);

    try {
      const subject = email.subject.toLowerCase().startsWith("re:")
        ? email.subject
        : `Re: ${email.subject}`;
      const response = await fetch("/api/dashboard/prompt", {
        body: JSON.stringify({
          body,
          mode: "send_custom_email",
          recipientEmail,
          subject,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const data = (await response.json()) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not send reply.");
      }

      setSentThreadReplies((current) => ({
        ...current,
        [email.id]: [
          ...(current[email.id] ?? []),
          {
            body,
            date: new Date().toISOString(),
            id: `reply-${email.id}-${Date.now()}`,
            subject,
            to: recipientEmail,
          },
        ],
      }));
      setReplyDrafts((current) => ({
        ...current,
        [email.id]: "",
      }));
      setReplyStatus((current) => ({
        ...current,
        [email.id]: {
          message: data.message ?? "Reply sent.",
          tone: "sent",
        },
      }));
    } catch (error) {
      setReplyStatus((current) => ({
        ...current,
        [email.id]: {
          message: error instanceof Error ? error.message : "Could not send reply.",
          tone: "error",
        },
      }));
    } finally {
      setSendingReplyId(null);
    }
  }

  const emptyCopy = emptyStateText();

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border p-5 backdrop-blur calym-surface">
      <div className="grid shrink-0 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(15rem,24rem)] xl:items-center">
        <div className="calym-card calym-scrollbar flex w-full min-w-0 gap-1 overflow-x-auto rounded-2xl border p-1.5">
          {mailTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = mailView === tab.id;

            return (
              <button
                aria-label={`${tab.label}: ${tab.helper}`}
                className={`flex min-w-fit flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-semibold transition ${
                  isActive
                    ? "calym-active-tab"
                    : "text-slate-600 hover:bg-slate-100/70 dark:text-slate-300 dark:hover:bg-white/6"
                }`}
                key={tab.id}
                onClick={() => setMailView(tab.id)}
                type="button"
              >
                <Icon className="size-4 shrink-0" />
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-sm ${
                    isActive
                      ? "bg-slate-950/8 text-current dark:bg-white/10"
                      : "bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-200"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row xl:justify-end">
          <input
            className="h-12 min-w-0 rounded-2xl border border-indigo-100 bg-slate-50/90 px-4 text-base text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 sm:w-40 xl:w-44 dark:border-white/10 dark:bg-white/7 dark:text-slate-100 dark:focus:ring-indigo-400/20"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search mail..."
            ref={searchInputRef}
            value={query}
          />
          <Button
            className="calym-primary-action h-12 px-5 text-base"
            onClick={() => {
              setMailView("draft_send");
              setIsComposerOpen(true);
            }}
          >
            <Send className="mr-2 size-4" />
            New email
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-4 flex shrink-0 items-center gap-3 rounded-2xl border border-cyan-100 bg-cyan-50 p-4 text-base text-cyan-800 dark:border-cyan-300/20 dark:bg-cyan-400/10 dark:text-cyan-100">
          <Loader2 className="size-5 animate-spin" />
          Loading your Gmail messages...
        </div>
      ) : null}

      {isComposerOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm dark:bg-black/50"
          onClick={() => setIsComposerOpen(false)}
          role="presentation"
        >
          <div
            aria-labelledby="new-email-title"
            aria-modal="true"
            className="w-full max-w-3xl rounded-3xl border border-indigo-200 bg-slate-50 p-5 text-slate-950 shadow-2xl shadow-indigo-950/15 dark:border-indigo-300/20 dark:bg-[#0b1020] dark:text-slate-50"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p
                  className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white"
                  id="new-email-title"
                >
                  Send a custom email
                </p>
                <p className="mt-1 text-base calym-muted">
                  Write the exact message you want CalyM to send from Gmail.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {customEmailStatus ? (
                  <p
                    className={`rounded-full border px-3 py-1 text-sm font-semibold ${
                      customEmailStatus.tone === "sent"
                        ? "border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-300/20 dark:bg-cyan-400/10 dark:text-cyan-100"
                        : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-100"
                    }`}
                  >
                    {customEmailStatus.message}
                  </p>
                ) : null}
                <Button
                  className="calym-quiet-button h-10 px-4 text-base"
                  onClick={() => setIsComposerOpen(false)}
                  variant="outline"
                >
                  Close
                </Button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(13rem,0.42fr)_1fr]">
              <div className="grid gap-3">
                <label className="grid gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Send to
                  <input
                    className="h-11 rounded-xl border border-indigo-100 bg-white px-3 text-base text-slate-900 outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-white/8 dark:text-slate-50"
                    onChange={(event) => {
                      setCustomEmail((current) => ({
                        ...current,
                        to: event.target.value,
                      }));
                      setCustomEmailStatus(null);
                    }}
                    placeholder="demo@example.com"
                    value={customEmail.to}
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Subject
                  <input
                    className="h-11 rounded-xl border border-indigo-100 bg-white px-3 text-base text-slate-900 outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-white/8 dark:text-slate-50"
                    onChange={(event) => {
                      setCustomEmail((current) => ({
                        ...current,
                        subject: event.target.value,
                      }));
                      setCustomEmailStatus(null);
                    }}
                    placeholder="Meeting update"
                    value={customEmail.subject}
                  />
                </label>
              </div>
              <label className="grid gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                Message
                <textarea
                  className="min-h-44 resize-none rounded-xl border border-indigo-100 bg-white px-3 py-3 text-base leading-7 text-slate-900 outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-white/8 dark:text-slate-50"
                  onChange={(event) => {
                    setCustomEmail((current) => ({
                      ...current,
                      body: event.target.value,
                    }));
                    setCustomEmailStatus(null);
                  }}
                  placeholder="Hi, I wanted to share a quick update..."
                  value={customEmail.body}
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end">
              <Button
                className="calym-primary-action h-11 px-5 text-base"
                disabled={isSendingCustomEmail}
                onClick={sendCustomEmail}
              >
                {isSendingCustomEmail ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Send className="mr-2 size-4" />
                )}
                Send email
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-3 grid min-h-0 flex-1 gap-4 overflow-hidden xl:grid-cols-[minmax(18rem,0.68fr)_1.32fr]">
        <div className="calym-card calym-scrollbar min-h-0 overflow-y-auto rounded-2xl border p-2.5">
          {displayEmails.length === 0 ? (
            <div className="flex h-full min-h-[18rem] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-8 text-center dark:border-white/10">
              <CheckCircle2 className="size-10 text-cyan-500" />
              <h3 className="mt-4 text-2xl font-semibold">{emptyCopy.title}</h3>
              <p className="mt-2 max-w-sm text-base leading-7 calym-muted">
                {emptyCopy.body}
              </p>
            </div>
          ) : null}

          <div className="grid gap-2.5">
            {displayEmails.map((email) => {
              const isSelected = selectedEmail?.id === email.id;
              const isOutgoing = isDraftView || email.direction === "outgoing";
              const participantLabel = email.category === "Delivery failed"
                ? "Delivery failed"
                : isOutgoing
                ? sendToLabel(email)
                : contactDisplayName(receivedFromLabel(email));
              const participantPrefix = isDraftView
                ? "Send to"
                : email.direction === "outgoing"
                  ? "Sent to"
                  : "From";
              const secondaryLabel = isOutgoing
                ? `From ${userDisplayName}`
                : formatDate(email.date);
              const statusLabel = replyStatusLabel(email);

              return (
                <button
                  className={`rounded-xl border p-3 text-left transition ${
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
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-sm font-semibold text-white">
                          {participantLabel.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide calym-muted">
                            {participantPrefix}
                          </p>
                          <p className="truncate text-base font-semibold text-indigo-700 dark:text-indigo-200">
                            {participantLabel}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <p className="line-clamp-1 min-w-0 flex-1 text-base font-semibold text-slate-950 dark:text-white">
                          {email.subject}
                        </p>
                        <span
                          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${emailCategoryClass(email.category)}`}
                        >
                          {statusLabel}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${priorityClass(email.priority)}`}
                    >
                      {email.priority}
                    </span>
                  </div>
                  <p className="mt-2 truncate text-sm font-medium text-slate-500 dark:text-slate-400">
                    {secondaryLabel}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="calym-card flex min-h-0 overflow-hidden rounded-2xl border p-4">
          {selectedEmail ? (
            <div className="flex h-full min-h-0 w-full flex-col">
              <div className="shrink-0 flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-center dark:border-white/10">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-lg font-semibold text-white">
                    {selectedEmail.direction === "outgoing"
                      ? contactInitial(userDisplayName)
                      : contactInitial(receivedFromLabel(selectedEmail))}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-200">
                      Conversation detail
                    </p>
                    <h3 className="mt-1 line-clamp-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                      {selectedEmail.subject}
                    </h3>
                    <p className="mt-1 text-base font-medium text-slate-600 dark:text-slate-300">
                      {selectedEmail.category === "Delivery failed"
                        ? "Delivery failed. Check the address before sending again."
                        : selectedEmail.direction === "outgoing"
                          ? `You sent this to ${sendToLabel(selectedEmail)}`
                          : `${contactDisplayName(receivedFromLabel(selectedEmail))} replied to you`}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-300">
                    {formatDate(selectedEmail.date)}
                  </span>
                  <span
                    className={`w-fit rounded-full border px-4 py-2 text-base font-semibold ${emailCategoryClass(selectedEmail.category)}`}
                  >
                    {replyStatusLabel(selectedEmail)}
                  </span>
                </div>
              </div>

              <div className="calym-scrollbar mt-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-white/10 dark:bg-black/10">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold uppercase tracking-wide calym-muted">
                    Email thread
                  </p>
                  <span className="text-sm font-medium calym-muted">
                    {selectedEmail.direction === "incoming"
                      ? "Oldest to newest"
                      : "Sent message"}
                  </span>
                </div>

                {selectedEmail.direction === "outgoing" ? (
                  <div className="ml-auto max-w-[min(82%,44rem)] rounded-2xl rounded-tr-md border border-indigo-200 bg-indigo-50/90 p-4 shadow-sm dark:border-indigo-300/20 dark:bg-indigo-400/10">
                  <div className="flex flex-col gap-3 border-b border-indigo-200/70 pb-3 md:flex-row md:items-start md:justify-between dark:border-indigo-300/15">
                    <div className="flex items-start gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-base font-semibold text-white">
                        {contactInitial(userDisplayName)}
                      </span>
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-200">
                          Message prepared
                        </p>
                        <p className="mt-1 text-base font-semibold text-slate-950 dark:text-white">
                          From {userDisplayName}
                        </p>
                        <p className="text-base text-slate-600 dark:text-slate-300">
                          To{" "}
                          {selectedEmail.direction === "outgoing"
                            ? sendToLabel(selectedEmail)
                            : requestRecipientLabel(selectedEmail)}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-xl border border-indigo-200 bg-white/70 px-3 py-2 text-sm font-medium text-indigo-800 dark:border-indigo-300/15 dark:bg-white/8 dark:text-indigo-100">
                      Sent text
                    </div>
                  </div>
                  <p className="mt-3 text-base leading-7 text-slate-800 dark:text-slate-100">
                    {requestEmailBody(selectedEmail)}
                  </p>
                  </div>
                ) : null}

                {selectedEmail.direction === "incoming"
                  ? relatedSentMessages(selectedEmail).map((sentEmail) => (
                      <div
                        className="ml-auto max-w-[min(82%,44rem)] rounded-2xl rounded-tr-md border border-indigo-200 bg-indigo-50/90 p-4 shadow-sm dark:border-indigo-300/20 dark:bg-indigo-400/10"
                        key={`related-${selectedEmail.id}-${sentEmail.id}`}
                      >
                        <div className="flex flex-col gap-3 border-b border-indigo-200/70 pb-3 md:flex-row md:items-start md:justify-between dark:border-indigo-300/15">
                          <div className="flex items-start gap-3">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-base font-semibold text-white">
                              {contactInitial(userDisplayName)}
                            </span>
                            <div>
                              <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-200">
                                You sent
                              </p>
                              <p className="mt-1 text-base font-semibold text-slate-950 dark:text-white">
                                From {userDisplayName}
                              </p>
                              <p className="text-base text-slate-600 dark:text-slate-300">
                                To {sendToLabel(sentEmail)}
                              </p>
                            </div>
                          </div>
                          <div className="rounded-xl border border-indigo-200 bg-white/70 px-3 py-2 text-sm font-medium text-indigo-800 dark:border-indigo-300/15 dark:bg-white/8 dark:text-indigo-100">
                            {formatDate(sentEmail.date)}
                          </div>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-slate-800 dark:text-slate-100">
                          {requestEmailBody(sentEmail)}
                        </p>
                      </div>
                    ))
                  : null}

                {selectedEmail.direction === "incoming" ? (
                  <div className="mr-auto max-w-[min(82%,44rem)] rounded-2xl rounded-tl-md border border-slate-200 bg-white p-4 text-slate-800 shadow-sm dark:border-white/10 dark:bg-white/8 dark:text-slate-100">
                    <div className="flex flex-col gap-3 border-b border-slate-200 pb-3 md:flex-row md:items-start md:justify-between dark:border-white/10">
                      <div className="flex items-start gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-base font-semibold text-slate-700 dark:bg-white/12 dark:text-slate-100">
                          {contactInitial(receivedFromLabel(selectedEmail))}
                        </span>
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-wide calym-muted">
                            Received reply
                          </p>
                          <p className="mt-1 text-base font-semibold text-slate-950 dark:text-white">
                            From{" "}
                            {selectedEmail.category === "Delivery failed"
                              ? "Delivery system"
                              : contactDisplayName(receivedFromLabel(selectedEmail))}
                          </p>
                          <p className="text-base text-slate-600 dark:text-slate-300">
                            To {userDisplayName}
                          </p>
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 dark:border-white/10 dark:bg-white/6 dark:text-slate-300">
                        {formatDate(selectedEmail.date)}
                      </div>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-base leading-7">
                      {selectedEmail.reason}
                    </p>
                  </div>
                ) : null}

                {selectedEmail.direction === "incoming"
                  ? (sentThreadReplies[selectedEmail.id] ?? []).map((reply) => (
                      <div
                        className="ml-auto max-w-[min(82%,44rem)] rounded-2xl rounded-tr-md border border-cyan-200 bg-cyan-50/90 p-4 text-slate-800 shadow-sm dark:border-cyan-300/20 dark:bg-cyan-400/10 dark:text-slate-100"
                        key={reply.id}
                      >
                        <div className="flex flex-col gap-3 border-b border-cyan-200/70 pb-3 md:flex-row md:items-start md:justify-between dark:border-cyan-300/15">
                          <div className="flex items-start gap-3">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-base font-semibold text-white">
                              {contactInitial(userDisplayName)}
                            </span>
                            <div>
                              <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-200">
                                Reply sent
                              </p>
                              <p className="mt-1 text-base font-semibold text-slate-950 dark:text-white">
                                From {userDisplayName}
                              </p>
                              <p className="text-base text-slate-600 dark:text-slate-300">
                                To {reply.to}
                              </p>
                            </div>
                          </div>
                          <div className="rounded-xl border border-cyan-200 bg-white/70 px-3 py-2 text-sm font-medium text-cyan-800 dark:border-cyan-300/15 dark:bg-white/8 dark:text-cyan-100">
                            {formatDate(reply.date)}
                          </div>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-base leading-7">
                          {reply.body}
                        </p>
                      </div>
                    ))
                  : null}

              </div>

              {selectedEmail.direction === "incoming" &&
              selectedEmail.category !== "Delivery failed" ? (
                <div className="z-10 mt-2 shrink-0 rounded-2xl border border-indigo-200 bg-indigo-50/95 p-2.5 shadow-lg shadow-indigo-950/8 backdrop-blur dark:border-indigo-300/20 dark:bg-[#11182d]/95 dark:shadow-black/20">
                  <div className="flex flex-col justify-between gap-1.5 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-sm font-semibold text-slate-950 dark:text-white">
                        Reply to {contactDisplayName(receivedFromLabel(selectedEmail))}
                      </p>
                      <p className="text-xs font-medium calym-muted">
                        {replyRecipientEmail(selectedEmail) || "Sender email unavailable"}
                      </p>
                    </div>
                    {replyStatus[selectedEmail.id]?.message ? (
                      <p
                        className={`rounded-full border px-3 py-1 text-sm font-semibold ${
                          replyStatus[selectedEmail.id].tone === "sent"
                            ? "border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-300/20 dark:bg-cyan-400/10 dark:text-cyan-100"
                            : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-100"
                        }`}
                      >
                        {replyStatus[selectedEmail.id].message}
                      </p>
                    ) : null}
                  </div>
                  <div className="mt-2 flex flex-col gap-2 md:flex-row">
                    <textarea
                      className="min-h-10 flex-1 resize-none rounded-xl border border-indigo-100 bg-white px-3 py-2 text-sm leading-6 text-slate-900 outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-white/8 dark:text-slate-50"
                      onChange={(event) => {
                        setReplyDrafts((current) => ({
                          ...current,
                          [selectedEmail.id]: event.target.value,
                        }));
                        setReplyStatus((current) => ({
                          ...current,
                          [selectedEmail.id]: { message: "", tone: "sent" },
                        }));
                      }}
                      placeholder="Write a short reply..."
                      value={replyDrafts[selectedEmail.id] ?? ""}
                    />
                    <Button
                      className="calym-primary-action h-10 px-4 text-sm md:self-end"
                      disabled={
                        sendingReplyId === selectedEmail.id ||
                        !replyRecipientEmail(selectedEmail) ||
                        !(replyDrafts[selectedEmail.id] ?? "").trim()
                      }
                      onClick={() => sendInlineReply(selectedEmail)}
                    >
                      {sendingReplyId === selectedEmail.id ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 size-4" />
                      )}
                      Send reply
                    </Button>
                  </div>
                </div>
              ) : null}

              {selectedEmail.direction === "outgoing" ? (
                <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50/80 p-3.5 dark:border-indigo-300/20 dark:bg-indigo-400/10">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <p className="line-clamp-2 text-base leading-7 text-indigo-950 dark:text-indigo-50">
                    {replyInsight(selectedEmail)}
                  </p>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      className="calym-primary-action h-11 px-4 text-base"
                      onClick={() => onPromptSelect(selectedEmail.prompt)}
                    >
                      <Sparkles className="mr-2 size-4" />
                      Draft reply
                    </Button>
                    <Button
                      className="calym-quiet-button h-11 px-4 text-base"
                      onClick={() =>
                        onPromptSelect(
                          `Summarize this message with ${
                            selectedEmail.direction === "outgoing"
                              ? sendToLabel(selectedEmail)
                              : contactDisplayName(receivedFromLabel(selectedEmail))
                          }: ${selectedEmail.subject}`,
                        )
                      }
                      variant="outline"
                    >
                      Summarize
                    </Button>
                  </div>
                </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

type AgendaEmailDraft = {
  body: string;
  date: string;
  eventId: string;
  kind: "email" | "reject" | "reschedule";
  status?: "error" | "sent";
  statusMessage?: string;
  subject: string;
  time: string;
};

function AgendaTab({
  events,
}: {
  events: DashboardEvent[];
  onPromptSelect: (prompt: string) => void;
}) {
  const [agendaEmailDraft, setAgendaEmailDraft] = useState<AgendaEmailDraft | null>(null);
  const [sendingAgendaEmailId, setSendingAgendaEmailId] = useState<string | null>(null);

  function attendeeLabel(event: DashboardEvent) {
    return event.attendees[0] || "No attendee email";
  }

  function dateInputValue(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toISOString().slice(0, 10);
  }

  function timeInputValue(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "10:00";
    }

    return date.toTimeString().slice(0, 5);
  }

  function eventPriority(event: DashboardEvent) {
    const start = new Date(event.start);
    const now = new Date();

    if (Number.isNaN(start.getTime())) {
      return "Normal";
    }

    const hoursAway = (start.getTime() - now.getTime()) / 36e5;

    if (hoursAway <= 24) {
      return "High priority";
    }

    if (hoursAway <= 72) {
      return "Upcoming";
    }

    return "Scheduled";
  }

  function promptRecipient(event: DashboardEvent) {
    return event.attendees[0] || "";
  }

  function selectedDateTimeLabel(draft: Pick<AgendaEmailDraft, "date" | "time">) {
    if (!draft.date || !draft.time) {
      return "the new selected time";
    }

    const date = new Date(`${draft.date}T${draft.time}`);

    if (Number.isNaN(date.getTime())) {
      return "the new selected time";
    }

    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }

  function rescheduleMessage(event: DashboardEvent, draft: Pick<AgendaEmailDraft, "date" | "time">) {
    return [
      "Hi,",
      "",
      `I need to reschedule "${event.title}". Could we move it to ${selectedDateTimeLabel(draft)}?`,
      "",
      "Thank you.",
    ].join("\n");
  }

  function rejectionMessage(event: DashboardEvent) {
    return [
      "Hi,",
      "",
      `I am sorry, but I need to decline "${event.title}" and will not be able to attend.`,
      "",
      "Thank you.",
    ].join("\n");
  }

  function followUpMessage(event: DashboardEvent) {
    return [
      "Hi,",
      "",
      `I wanted to follow up on our meeting "${event.title}".`,
      "",
      "Thank you.",
    ].join("\n");
  }

  function openAgendaEmail(event: DashboardEvent, kind: AgendaEmailDraft["kind"]) {
    const draftBase = {
      date: dateInputValue(event.start),
      eventId: event.id,
      kind,
      status: undefined,
      statusMessage: undefined,
      time: timeInputValue(event.start),
    };

    if (kind === "reject") {
      setAgendaEmailDraft({
        ...draftBase,
        body: rejectionMessage(event),
        subject: `Meeting declined: ${event.title}`,
      });
      return;
    }

    if (kind === "email") {
      setAgendaEmailDraft({
        ...draftBase,
        body: followUpMessage(event),
        subject: `Follow-up: ${event.title}`,
      });
      return;
    }

    setAgendaEmailDraft({
      ...draftBase,
      body: rescheduleMessage(event, draftBase),
      subject: `Reschedule request: ${event.title}`,
    });
  }

  function draftTitle(kind: AgendaEmailDraft["kind"]) {
    if (kind === "reject") {
      return "Reject this meeting";
    }

    if (kind === "email") {
      return "Send meeting email";
    }

    return "Reschedule this meeting";
  }

  function draftHelpText(event: DashboardEvent, kind: AgendaEmailDraft["kind"]) {
    if (kind === "reject") {
      return `Review the rejection message before sending it to ${attendeeLabel(event)}.`;
    }

    if (kind === "email") {
      return `Write a custom meeting email for ${attendeeLabel(event)}.`;
    }

    return `Pick a new date and time, then send the reschedule email to ${attendeeLabel(event)}.`;
  }

  function draftSendLabel(kind: AgendaEmailDraft["kind"]) {
    if (kind === "reject") {
      return "Send rejection email";
    }

    if (kind === "email") {
      return "Send email";
    }

    return "Send reschedule email";
  }

  async function sendAgendaEmail(event: DashboardEvent) {
    if (!agendaEmailDraft) {
      return;
    }

    const recipientEmail = promptRecipient(event);

    if (!recipientEmail) {
      setAgendaEmailDraft((current) =>
        current
          ? {
              ...current,
              status: "error",
              statusMessage: "This event has no attendee email to send to.",
            }
          : current,
      );
      return;
    }

    setSendingAgendaEmailId(event.id);

    try {
      const response = await fetch("/api/dashboard/prompt", {
        body: JSON.stringify({
          body: agendaEmailDraft.body,
          eventTitle: event.title,
          mode: "send_custom_email",
          newDateTime: selectedDateTimeLabel(agendaEmailDraft),
          recipientEmail,
          subject: agendaEmailDraft.subject,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const data = (await response.json()) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not send email.");
      }

      setAgendaEmailDraft({
        ...agendaEmailDraft,
        status: "sent",
        statusMessage: data.message ?? "Email sent.",
      });
    } catch (error) {
      setAgendaEmailDraft({
        ...agendaEmailDraft,
        status: "error",
        statusMessage:
          error instanceof Error ? error.message : "Could not send email.",
      });
    } finally {
      setSendingAgendaEmailId(null);
    }
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border p-5 backdrop-blur calym-surface">
      <div className="grid shrink-0 gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="calym-card flex min-w-0 items-center gap-4 rounded-2xl border p-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-300/20 dark:bg-cyan-400/10 dark:text-cyan-100">
            <CalendarDays className="size-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wide calym-muted">
              Calendar agenda
            </p>
            <h2 className="truncate text-2xl font-semibold text-slate-950 dark:text-white">
              {events.length} upcoming event{events.length === 1 ? "" : "s"}
            </h2>
          </div>
        </div>
        <div className="calym-card flex items-center gap-3 rounded-2xl border px-4 py-3 text-base font-medium calym-muted">
          <span className="size-2 rounded-full bg-cyan-400" />
          Synced from Google Calendar
        </div>
      </div>

      <div className="calym-scrollbar mt-4 min-h-0 flex-1 overflow-y-auto rounded-2xl border p-3 calym-card">
        {events.map((item) => (
          <div
            className="group grid gap-4 rounded-2xl border border-transparent p-4 transition-colors hover:border-cyan-200/70 hover:bg-cyan-50/50 xl:grid-cols-[7rem_1fr_25rem] xl:items-center dark:hover:border-cyan-300/16 dark:hover:bg-cyan-400/6"
            key={item.id}
          >
            <div className="flex items-center gap-3 lg:block">
              <div className="flex size-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-cyan-700 dark:border-white/10 dark:bg-white/6 dark:text-cyan-100">
                <Clock3 className="size-5" />
              </div>
              <div className="lg:mt-2">
                <p className="text-lg font-semibold text-slate-950 dark:text-white">
                  {item.time}
                </p>
                <p className="text-sm font-medium calym-muted">
                  {formatDate(item.start)}
                </p>
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="line-clamp-1 text-2xl font-semibold text-slate-950 dark:text-white">
                  {item.title}
                </h3>
                <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-800 dark:border-indigo-300/20 dark:bg-indigo-400/10 dark:text-indigo-100">
                  {eventPriority(item)}
                </span>
              </div>
              <div className="mt-2 grid gap-1 text-base leading-7 calym-muted">
                <p>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    Attendee:
                  </span>{" "}
                  {attendeeLabel(item)}
                </p>
                <p>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    Status:
                  </span>{" "}
                  Scheduled in Google Calendar
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 xl:justify-end">
              <Button
                className="calym-quiet-button h-11 px-4 text-base"
                onClick={() => openAgendaEmail(item, "reschedule")}
                variant="outline"
              >
                Reschedule
              </Button>
              <Button
                className="calym-quiet-button h-11 px-4 text-base"
                onClick={() => openAgendaEmail(item, "email")}
                variant="outline"
              >
                <Mail className="mr-2 size-4" />
                Send email
              </Button>
              <Button
                className="h-11 border-rose-200 bg-rose-50 px-4 text-base font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-200 dark:hover:bg-rose-950/50"
                onClick={() => openAgendaEmail(item, "reject")}
                variant="outline"
              >
                Reject
              </Button>
              {item.htmlLink ? (
                <Button
                  asChild
                  className="calym-primary-action h-11 px-4 text-base"
                >
                  <a href={item.htmlLink} rel="noreferrer" target="_blank">
                    <ExternalLink className="mr-2 size-4" />
                    Open
                  </a>
                </Button>
              ) : null}
            </div>

            {agendaEmailDraft?.eventId === item.id ? (
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 xl:col-span-3 dark:border-indigo-300/20 dark:bg-indigo-400/10">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-950 dark:text-white">
                      {draftTitle(agendaEmailDraft.kind)}
                    </p>
                    <p className="mt-1 text-base calym-muted">
                      {draftHelpText(item, agendaEmailDraft.kind)}
                    </p>
                  </div>
                  <Button
                    className="calym-quiet-button h-10 px-4 text-base"
                    onClick={() => setAgendaEmailDraft(null)}
                    variant="outline"
                  >
                    Close
                  </Button>
                </div>

                {agendaEmailDraft.kind === "reschedule" ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <label className="grid gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      New date
                      <input
                        className="h-11 rounded-xl border border-indigo-100 bg-white px-3 text-base text-slate-900 outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-white/8 dark:text-slate-50"
                        onChange={(event) =>
                          setAgendaEmailDraft((current) => {
                            if (!current) {
                              return current;
                            }

                            const next = {
                              ...current,
                              date: event.target.value,
                              status: undefined,
                              statusMessage: undefined,
                            };

                            return {
                              ...next,
                              body: rescheduleMessage(item, next),
                            };
                          })
                        }
                        type="date"
                        value={agendaEmailDraft.date}
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      New time
                      <input
                        className="h-11 rounded-xl border border-indigo-100 bg-white px-3 text-base text-slate-900 outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-white/8 dark:text-slate-50"
                        onChange={(event) =>
                          setAgendaEmailDraft((current) => {
                            if (!current) {
                              return current;
                            }

                            const next = {
                              ...current,
                              status: undefined,
                              statusMessage: undefined,
                              time: event.target.value,
                            };

                            return {
                              ...next,
                              body: rescheduleMessage(item, next),
                            };
                          })
                        }
                        type="time"
                        value={agendaEmailDraft.time}
                      />
                    </label>
                  </div>
                ) : null}

                <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(14rem,0.45fr)_1fr]">
                  <label className="grid gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Subject
                    <input
                      className="h-11 rounded-xl border border-indigo-100 bg-white px-3 text-base text-slate-900 outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-white/8 dark:text-slate-50"
                      onChange={(event) =>
                        setAgendaEmailDraft((current) =>
                          current
                            ? {
                                ...current,
                                status: undefined,
                                statusMessage: undefined,
                                subject: event.target.value,
                              }
                            : current,
                        )
                      }
                      value={agendaEmailDraft.subject}
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Message
                    <textarea
                      className="min-h-32 resize-none rounded-xl border border-indigo-100 bg-white px-3 py-3 text-base leading-7 text-slate-900 outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-white/8 dark:text-slate-50"
                      onChange={(event) =>
                        setAgendaEmailDraft((current) =>
                          current
                            ? {
                                ...current,
                                body: event.target.value,
                                status: undefined,
                                statusMessage: undefined,
                              }
                            : current,
                        )
                      }
                      value={agendaEmailDraft.body}
                    />
                  </label>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {agendaEmailDraft.statusMessage ? (
                    <p
                      className={`text-base font-semibold ${
                        agendaEmailDraft.status === "sent"
                          ? "text-cyan-700 dark:text-cyan-200"
                          : "text-rose-700 dark:text-rose-200"
                      }`}
                    >
                      {agendaEmailDraft.statusMessage}
                    </p>
                  ) : (
                    <p className="text-base calym-muted">
                      This sends a Gmail message directly to the meeting attendee.
                    </p>
                  )}
                  <Button
                    className="calym-primary-action h-11 px-5 text-base"
                    disabled={
                      sendingAgendaEmailId === item.id ||
                      !promptRecipient(item) ||
                      !agendaEmailDraft.subject.trim() ||
                      !agendaEmailDraft.body.trim()
                    }
                    onClick={() => sendAgendaEmail(item)}
                  >
                    {sendingAgendaEmailId === item.id ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 size-4" />
                    )}
                    {draftSendLabel(agendaEmailDraft.kind)}
                  </Button>
                </div>
              </div>
            ) : null}
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
  preparedActions,
}: {
  executingActionId: string | null;
  fastActions: readonly FastAction[];
  onExecuteAction: (action: PreparedAction) => void;
  preparedActions: PreparedAction[];
}) {
  return (
    <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[1fr_24rem]">
      <section className="flex min-h-0 flex-col overflow-hidden rounded-3xl border p-5 backdrop-blur calym-surface">
        <div className="grid shrink-0 gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="calym-card flex min-w-0 items-center gap-4 rounded-2xl border p-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-300/20 dark:bg-indigo-400/10 dark:text-indigo-100">
              <Bot className="size-6" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-wide calym-muted">
                Action queue
              </p>
              <h2 className="truncate text-2xl font-semibold text-slate-950 dark:text-white">
                {preparedActions.length
                  ? `${preparedActions.length} ready for approval`
                  : "No actions waiting"}
              </h2>
            </div>
          </div>
          <div className="calym-card flex items-center gap-3 rounded-2xl border px-4 py-3 text-base font-medium calym-muted">
            <CheckCircle2 className="size-5 text-cyan-500" />
            Review before write
          </div>
        </div>

        <div className="calym-scrollbar mt-4 grid min-h-0 flex-1 content-start gap-3 overflow-y-auto rounded-2xl border p-3 calym-card">
          {preparedActions.length === 0 ? (
            <div className="flex min-h-[20rem] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-8 text-center dark:border-white/10">
              <Sparkles className="size-10 text-cyan-500" />
              <h3 className="mt-4 text-2xl font-semibold text-slate-950 dark:text-white">
                Prompt actions appear here
              </h3>
              <p className="mt-2 max-w-md text-base leading-7 calym-muted">
                Run a workflow prompt from Overview, then approve each Gmail or
                Calendar action before CalyM executes it.
              </p>
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
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-sm dark:border-white/10 dark:bg-white/5"
                key={action.id}
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex size-10 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-300/20 dark:bg-indigo-400/10 dark:text-indigo-100">
                        {action.type === "calendar_event" ? (
                          <CalendarDays className="size-5" />
                        ) : (
                          <Mail className="size-5" />
                        )}
                      </span>
                      <h3 className="text-2xl font-semibold text-slate-950 dark:text-white">
                        {action.title}
                      </h3>
                      <span className={`rounded-full border px-3 py-1 text-sm font-medium ${categoryClass(action.category)}`}>
                        {categoryLabel}
                      </span>
                      {action.risk === "high" ? (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-100">
                          Needs confirmation
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 text-base leading-7 calym-muted">
                      {action.description}
                    </p>
                    {action.recipientEmail ? (
                      <p className="mt-2 text-base font-medium text-slate-700 dark:text-slate-200">
                        To {action.recipientEmail}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    className={`h-12 shrink-0 px-5 text-base ${
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

      <section className="flex min-h-0 flex-col overflow-hidden rounded-3xl border p-5 backdrop-blur calym-surface">
        <div className="calym-card flex items-center gap-4 rounded-2xl border p-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-300/20 dark:bg-cyan-400/10 dark:text-cyan-100">
            <Zap className="size-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-wide calym-muted">
              Keyboard shortcuts
            </p>
            <h2 className="truncate text-2xl font-semibold text-slate-950 dark:text-white">
              Press a key
            </h2>
          </div>
        </div>
        <p className="mt-3 text-base leading-7 calym-muted">
          Use these keys anywhere on the dashboard. Shortcuts pause while you are typing.
        </p>
        <div className="calym-scrollbar mt-4 grid min-h-0 content-start gap-3 overflow-y-auto rounded-2xl border p-3 calym-card">
          {fastActions.map((action) => {
            const Icon = action.icon;

            return (
              <div
                className="flex items-center justify-between gap-3 rounded-2xl border border-transparent bg-slate-50/70 px-4 py-4 text-left dark:bg-white/5"
                key={action.key}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-300/20 dark:bg-indigo-400/10 dark:text-indigo-100">
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-lg font-semibold text-slate-900 dark:text-white">
                      {action.label}
                    </span>
                    <span className="mt-0.5 block line-clamp-1 text-sm calym-muted">
                      {action.description}
                    </span>
                  </span>
                </span>
                <kbd className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1 text-base font-semibold text-slate-700 dark:border-white/10 dark:bg-white/8 dark:text-slate-100">
                  {action.key}
                </kbd>
              </div>
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




