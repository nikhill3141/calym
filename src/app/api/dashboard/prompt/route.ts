import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getCorsairTenant } from "@/lib/corsair";

export const runtime = "nodejs";

type ActionType = "calendar_event" | "email_draft" | "email_send";
type ReplyCategory = "positive" | "reschedule" | "decline" | "neutral";

type PreparedAction = {
  category?: ReplyCategory;
  confirmationLabel: string;
  description: string;
  id: string;
  payload: Record<string, unknown>;
  recipientEmail?: string;
  risk: "low" | "high";
  sourceCommand?: string;
  title: string;
  type: ActionType;
};

const weekdays = {
  friday: 5,
  monday: 1,
  saturday: 6,
  sunday: 0,
  thursday: 4,
  tuesday: 2,
  wednesday: 3,
} as const;

function base64Url(value: string) {
  return Buffer.from(value)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

function cleanHeader(value: string) {
  return value.replace(/[\r\n]/g, " ").trim();
}

function buildRawEmail({
  body,
  subject,
  to,
}: {
  body: string;
  subject: string;
  to: string;
}) {
  const mime = [
    `To: ${cleanHeader(to)}`,
    `Subject: ${cleanHeader(subject)}`,
    "Content-Type: text/plain; charset=UTF-8",
    "",
    body.trim(),
  ].join("\r\n");

  return base64Url(mime);
}

function extractEmail(command: string) {
  return command.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null;
}

function extractMessage(command: string) {
  const saying = command.match(/\bsaying\s+(.+?)(?:[.!?]?$|[.!?]\s)/i)?.[1];

  if (saying) {
    return saying.trim();
  }

  const replyLike = command.match(/\breply\s+(?:like|with)\s+(.+)$/i)?.[1];

  if (replyLike) {
    return replyLike.trim();
  }

  return "I look forward to our meeting.";
}

function classifyReplyIntent(message: string): ReplyCategory {
  const normalizedMessage = message.toLowerCase();

  if (
    /\b(reschedule|busy|unavailable|another time|different time|can't make|cannot make|not free|postpone)\b/.test(
      normalizedMessage,
    )
  ) {
    return "reschedule";
  }

  if (
    /\b(not interested|no longer interested|decline|pass on this|not a fit|not needed|unsubscribe)\b/.test(
      normalizedMessage,
    )
  ) {
    return "decline";
  }

  if (
    /\b(look forward|looking forward|sounds good|confirmed|great|happy to|see you)\b/.test(
      normalizedMessage,
    )
  ) {
    return "positive";
  }

  return "neutral";
}

function sentenceCase(value: string) {
  const cleaned = value.replace(/\s+/g, " ").trim();

  if (!cleaned) {
    return "";
  }

  return `${cleaned[0].toUpperCase()}${cleaned.slice(1)}`;
}

function generateEmailSubject({
  command,
  message,
  replyCategory,
}: {
  command: string;
  message: string;
  replyCategory: ReplyCategory;
}) {
  const normalizedCommand = command.toLowerCase();

  if (replyCategory === "reschedule") {
    return "Request to reschedule our meeting";
  }

  if (replyCategory === "decline") {
    return "Thank you for reaching out";
  }

  if (normalizedCommand.includes("demo")) {
    return "CalyM demo update";
  }

  if (normalizedCommand.includes("review")) {
    return "Follow-up on our review";
  }

  if (normalizedCommand.includes("meeting") || normalizedCommand.includes("invite")) {
    return replyCategory === "positive"
      ? "Looking forward to our meeting"
      : "Meeting follow-up";
  }

  const compactMessage = sentenceCase(message)
    .replace(/[.!?]+$/g, "")
    .split(" ")
    .slice(0, 7)
    .join(" ");

  return compactMessage || "Quick follow-up";
}

function buildReplyBody(message: string, replyCategory: ReplyCategory) {
  if (replyCategory === "reschedule") {
    return [
      "Thanks for reaching out.",
      "",
      message,
      "",
      "Could we please reschedule this meeting for another suitable time?",
    ].join("\r\n");
  }

  if (replyCategory === "decline") {
    return [
      "Thanks for reaching out.",
      "",
      message,
      "",
      "I appreciate the offer, but I will pass on this for now.",
    ].join("\r\n");
  }

  return message;
}

function extractTime(command: string) {
  const match = command.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  let hour = Number(match?.[1] ?? 10);
  const minute = Number(match?.[2] ?? 0);
  const meridiem = match?.[3]?.toLowerCase();

  if (meridiem === "pm" && hour < 12) {
    hour += 12;
  }

  if (meridiem === "am" && hour === 12) {
    hour = 0;
  }

  return { hour, minute };
}

function inferDate(command: string) {
  const now = new Date();
  const target = new Date(now);
  const lowerCommand = command.toLowerCase();

  if (lowerCommand.includes("tomorrow")) {
    target.setDate(now.getDate() + 1);
    return target;
  }

  for (const [weekday, index] of Object.entries(weekdays)) {
    if (lowerCommand.includes(weekday)) {
      const currentDay = now.getDay();
      let diff = index - currentDay;

      if (diff <= 0 || lowerCommand.includes(`next ${weekday}`)) {
        diff += 7;
      }

      target.setDate(now.getDate() + diff);
      return target;
    }
  }

  target.setDate(now.getDate() + 1);
  return target;
}

function buildEventWindow(command: string) {
  const date = inferDate(command);
  const { hour, minute } = extractTime(command);
  const start = new Date(date);
  const end = new Date(date);

  start.setHours(hour, minute, 0, 0);
  end.setHours(hour + 1, minute, 0, 0);

  return { end, start };
}

function prepareActions(command: string, timeZone: string) {
  const normalizedCommand = command.toLowerCase();
  const recipient = extractEmail(command);
  const actions: PreparedAction[] = [];

  if (!recipient) {
    return {
      actions,
      summary:
        "I need an email address in the prompt before I can prepare a real email or calendar action.",
    };
  }

  const message = extractMessage(command);
  const replyCategory = classifyReplyIntent(message);
  const wantsCalendar =
    normalizedCommand.includes("calendar") ||
    normalizedCommand.includes("invite") ||
    normalizedCommand.includes("meeting");
  const wantsEmail =
    normalizedCommand.includes("email") ||
    normalizedCommand.includes("mail") ||
    normalizedCommand.includes("reply") ||
    normalizedCommand.includes("reschedule") ||
    normalizedCommand.includes("not interested") ||
    (normalizedCommand.includes("send") &&
      (!wantsCalendar ||
        normalizedCommand.includes("saying") ||
        normalizedCommand.includes("message")));

  if (wantsCalendar && replyCategory !== "reschedule" && replyCategory !== "decline") {
    const { end, start } = buildEventWindow(command);

    actions.push({
      category: replyCategory,
      confirmationLabel: "Create calendar invite",
      description: `Create a one-hour invite with ${recipient}.`,
      id: crypto.randomUUID(),
      payload: {
        calendarId: "primary",
        event: {
          attendees: [{ email: recipient }],
          description: message,
          end: { dateTime: end.toISOString(), timeZone },
          start: { dateTime: start.toISOString(), timeZone },
          summary: `Meeting with ${recipient}`,
        },
        sendUpdates: "all",
      },
      recipientEmail: recipient,
      risk: "high",
      sourceCommand: command,
      title: "Calendar invite",
      type: "calendar_event",
    });
  }

  if (wantsEmail) {
    const subject = generateEmailSubject({
      command,
      message,
      replyCategory,
    });
    const raw = buildRawEmail({
      body: buildReplyBody(message, replyCategory),
      subject,
      to: recipient,
    });
    const shouldSend = normalizedCommand.includes("send");

    actions.push({
      category: replyCategory,
      confirmationLabel: shouldSend ? "Send email now" : "Create Gmail draft",
      description: `${shouldSend ? "Send" : "Create a draft for"} ${recipient} with subject "${subject}".`,
      id: crypto.randomUUID(),
      payload: shouldSend
        ? { raw, userId: "me" }
        : { draft: { message: { raw } }, userId: "me" },
      recipientEmail: recipient,
      risk: shouldSend ? "high" : "low",
      sourceCommand: command,
      title: shouldSend ? "Send email" : "Gmail draft",
      type: shouldSend ? "email_send" : "email_draft",
    });
  }

  return {
    actions,
    summary: actions.length
      ? `Prepared ${actions.length} real action${actions.length === 1 ? "" : "s"} from your prompt.`
      : "I understood the prompt, but it does not match a supported Gmail or Calendar action yet.",
  };
}

async function executeAction(action: PreparedAction) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenant = await getCorsairTenant(session.user.id);

  if (action.type === "calendar_event") {
    const result = await tenant.run("googlecalendar.api.events.create", action.payload);

    if (!result.success) {
      return NextResponse.json(
        { error: "Google Calendar needs to be reconnected.", signInLink: result.signInLink },
        { status: 409 },
      );
    }

    return NextResponse.json({
      message: "Calendar invite created and updates sent.",
      result: result.data,
    });
  }

  if (action.type === "email_draft") {
    const result = await tenant.run("gmail.api.drafts.create", action.payload);

    if (!result.success) {
      return NextResponse.json(
        { error: "Gmail needs to be reconnected.", signInLink: result.signInLink },
        { status: 409 },
      );
    }

    return NextResponse.json({
      message: "Gmail draft created.",
      result: result.data,
    });
  }

  if (action.type === "email_send") {
    const result = await tenant.run("gmail.api.messages.send", action.payload);

    if (!result.success) {
      return NextResponse.json(
        { error: "Gmail needs to be reconnected.", signInLink: result.signInLink },
        { status: 409 },
      );
    }

    return NextResponse.json({
      message: "Email sent.",
      result: result.data,
    });
  }

  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    action?: PreparedAction;
    command?: string;
    mode?: "execute" | "prepare";
    timeZone?: string;
  };

  if (body.mode === "execute" && body.action) {
    return executeAction(body.action);
  }

  if (!body.command?.trim()) {
    return NextResponse.json(
      { error: "Write a prompt before running CalyM." },
      { status: 400 },
    );
  }

  const prepared = prepareActions(
    body.command,
    body.timeZone || "Asia/Calcutta",
  );

  return NextResponse.json(prepared);
}
