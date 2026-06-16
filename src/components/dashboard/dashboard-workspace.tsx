"use client";

import {
  Archive,
  Bot,
  CalendarDays,
  Clock3,
  Command,
  Inbox,
  Search,
  Send,
  Sparkles,
  Zap,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

type ActivityItem = {
  id: string;
  message: string;
};

const priorityEmails = [
  {
    from: "Corsair Team",
    subject: "API access and integration checklist",
    reason: "Needs setup attention before the next build step.",
    priority: "High",
    action: "Draft reply",
    prompt: "Draft a reply to Corsair about the API access checklist.",
  },
  {
    from: "Aarav Mehta",
    subject: "Follow-up on tomorrow's product review",
    reason: "Meeting-related thread with scheduling context.",
    priority: "High",
    action: "Schedule",
    prompt: "Schedule a follow-up with Aarav tomorrow and draft a confirmation.",
  },
  {
    from: "Neon",
    subject: "Database usage digest",
    reason: "Useful, but not immediately blocking.",
    priority: "Medium",
    action: "Archive later",
    prompt: "Archive the Neon usage digest after noting it is not urgent.",
  },
];

const agendaItems = [
  {
    time: "09:00",
    title: "Review Gmail connection flow",
    context: "Check OAuth, tenant id, and Corsair plugin status.",
  },
  {
    time: "13:30",
    title: "Calendar automation planning",
    context: "Define create-invite and update-event prompt flows.",
  },
  {
    time: "17:00",
    title: "Hackathon demo rehearsal",
    context: "Show login, connect, prompt, confirmation, and dashboard.",
  },
];

const agentDrafts = [
  {
    title: "Reply draft",
    body: "Thanks for the update. I connected Gmail and Calendar, and I will share the demo flow shortly.",
    action: "Approve email",
  },
  {
    title: "Calendar invite",
    body: "Schedule a 30-minute review tomorrow morning and send a short confirmation email.",
    action: "Review invite",
  },
];

const fastActions = [
  {
    key: "C",
    label: "Compose email",
    icon: Send,
    prompt: "Compose a short follow-up email.",
  },
  {
    key: "/",
    label: "Search mail",
    icon: Search,
    prompt: "Search emails from Corsair about OAuth.",
  },
  {
    key: "M",
    label: "Create meeting",
    icon: CalendarDays,
    prompt: "Create a meeting tomorrow morning with a confirmation email.",
  },
  {
    key: "E",
    label: "Archive thread",
    icon: Archive,
    prompt: "Archive the selected thread after checking it is not urgent.",
  },
];

const promptSuggestions = [
  "Draft a reply and schedule a follow-up",
  "Find unread emails that need meetings",
  "Show calendar conflicts for tomorrow",
];

export function DashboardWorkspace() {
  const activityIdRef = useRef(0);
  const [command, setCommand] = useState(
    "Find my last email from Corsair, draft a reply, and schedule a follow-up tomorrow at 10 AM.",
  );
  const [activity, setActivity] = useState<ActivityItem[]>([
    {
      id: "initial",
      message: "Dashboard loaded with Gmail and Calendar connected.",
    },
  ]);
  const [approvedDrafts, setApprovedDrafts] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  const visibleEmails = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return priorityEmails;
    }

    return priorityEmails.filter((email) =>
      [email.from, email.subject, email.reason, email.priority]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query]);

  function pushActivity(message: string) {
    activityIdRef.current += 1;
    const id = `activity-${activityIdRef.current}`;

    setActivity((current) => [{ id, message }, ...current].slice(0, 5));
  }

  function applyPrompt(prompt: string) {
    setCommand(prompt);
    pushActivity(`Prepared prompt: ${prompt}`);
  }

  function runCommand() {
    pushActivity(`Command queued for confirmation: ${command}`);
  }

  function approveDraft(title: string) {
    setApprovedDrafts((current) =>
      current.includes(title) ? current : [...current, title],
    );
    pushActivity(`${title} moved to approved state.`);
  }

  return (
    <>
      <section className="rounded-lg border bg-background p-6" id="command">
        <div className="flex items-start gap-4">
          <div className="rounded-lg border bg-muted p-3">
            <Command className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-muted-foreground">
              Unified command bar
            </p>
            <h2 className="mt-1 text-3xl font-semibold">
              Ask CalyM to manage mail and meetings
            </h2>
            <textarea
              className="mt-5 min-h-28 w-full resize-none rounded-lg border bg-muted/50 p-5 text-lg outline-none transition-colors focus:border-primary"
              onChange={(event) => setCommand(event.target.value)}
              value={command}
            />
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {promptSuggestions.map((prompt) => (
                <button
                  className="rounded-full border bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  key={prompt}
                  onClick={() => applyPrompt(prompt)}
                  type="button"
                >
                  {prompt}
                </button>
              ))}
              <Button className="ml-auto h-10 px-5" onClick={runCommand}>
                <Sparkles className="mr-2 size-4" />
                Run preview
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="rounded-lg border bg-background p-6" id="inbox">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <Inbox className="size-6" />
              <h2 className="text-2xl font-semibold">Priority inbox</h2>
            </div>
            <input
              className="h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter emails..."
              value={query}
            />
          </div>
          <div className="mt-5 divide-y rounded-lg border">
            {visibleEmails.map((email) => (
              <div className="p-5" key={email.subject}>
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {email.from}
                    </p>
                    <h3 className="mt-1 text-xl font-semibold">
                      {email.subject}
                    </h3>
                    <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">
                      {email.reason}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
                      {email.priority}
                    </span>
                    <Button
                      onClick={() => applyPrompt(email.prompt)}
                      variant="outline"
                    >
                      {email.action}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border bg-background p-6" id="agenda">
          <div className="flex items-center gap-3">
            <CalendarDays className="size-6" />
            <h2 className="text-2xl font-semibold">Today agenda</h2>
          </div>
          <div className="mt-5 flex flex-col gap-4">
            {agendaItems.map((item) => (
              <button
                className="rounded-lg border bg-muted/40 p-4 text-left transition-colors hover:bg-muted"
                key={item.title}
                onClick={() =>
                  applyPrompt(`Prepare me for ${item.title} at ${item.time}.`)
                }
                type="button"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Clock3 className="size-4" />
                  {item.time}
                </div>
                <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.context}
                </p>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-lg border bg-background p-6" id="agent">
          <div className="flex items-center gap-3">
            <Bot className="size-6" />
            <h2 className="text-2xl font-semibold">Agent drafts</h2>
          </div>
          <div className="mt-5 flex flex-col gap-4">
            {agentDrafts.map((draft) => {
              const isApproved = approvedDrafts.includes(draft.title);

              return (
                <div className="rounded-lg border bg-muted/40 p-4" key={draft.title}>
                  <h3 className="text-lg font-semibold">{draft.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {draft.body}
                  </p>
                  <Button
                    className="mt-4"
                    disabled={isApproved}
                    onClick={() => approveDraft(draft.title)}
                    variant="outline"
                  >
                    {isApproved ? "Approved" : draft.action}
                  </Button>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border bg-background p-6">
          <div className="flex items-center gap-3">
            <Zap className="size-6" />
            <h2 className="text-2xl font-semibold">Fast actions</h2>
          </div>
          <div className="mt-5 grid gap-3">
            {fastActions.map((action) => {
              const Icon = action.icon;

              return (
                <button
                  className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3 text-left transition-colors hover:bg-muted"
                  key={action.key}
                  onClick={() => applyPrompt(action.prompt)}
                  type="button"
                >
                  <span className="flex items-center gap-3 text-base font-medium">
                    <Icon className="size-5" />
                    {action.label}
                  </span>
                  <kbd className="rounded-md border bg-background px-3 py-1 text-sm font-semibold">
                    {action.key}
                  </kbd>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border bg-background p-6">
          <div className="flex items-center gap-3">
            <Search className="size-6" />
            <h2 className="text-2xl font-semibold">Activity log</h2>
          </div>
          <div className="mt-5 flex flex-col gap-3">
            {activity.map((item) => (
              <div className="rounded-lg border bg-muted/40 p-3 text-sm" key={item.id}>
                {item.message}
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
