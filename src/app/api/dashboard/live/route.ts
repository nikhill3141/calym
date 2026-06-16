import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { integrationConnections } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getCorsairTenant } from "@/lib/corsair";

export const runtime = "nodejs";

type GmailMessage = {
  id?: string;
  threadId?: string;
  labelIds?: string[];
  snippet?: string;
  internalDate?: string | number | Date | null;
  payload?: {
    headers?: { name?: string; value?: string }[];
  };
};

type GmailListOutput = {
  messages?: GmailMessage[];
};

type CalendarEventsOutput = {
  items?: {
    id?: string;
    htmlLink?: string;
    summary?: string;
    start?: { date?: string; dateTime?: string; timeZone?: string };
    end?: { date?: string; dateTime?: string; timeZone?: string };
    attendees?: { email?: string; displayName?: string }[];
  }[];
};

function headerValue(message: GmailMessage, name: string) {
  return (
    message.payload?.headers?.find(
      (header) => header.name?.toLowerCase() === name.toLowerCase(),
    )?.value ?? ""
  );
}

function fallbackSubjectFromSnippet(snippet: string) {
  const cleaned = snippet
    .replace(/\s+/g, " ")
    .replace(/^(re|fw|fwd):\s*/i, "")
    .trim();

  if (!cleaned) {
    return "Email needs review";
  }

  const words = cleaned.split(" ").slice(0, 8).join(" ");
  const subject = words.length > 64 ? `${words.slice(0, 61)}...` : words;

  return `${subject[0]?.toUpperCase() ?? "E"}${subject.slice(1)}`;
}

function readableSender(fromHeader: string) {
  const cleaned = fromHeader.trim();

  if (!cleaned) {
    return "Sender needs review";
  }

  const quoted = cleaned.match(/"([^"]+)"/)?.[1];

  if (quoted) {
    return quoted;
  }

  const named = cleaned.match(/^([^<]+)</)?.[1]?.trim();

  if (named) {
    return named;
  }

  const email = cleaned.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];

  if (email) {
    return email.split("@")[0].replace(/[._-]+/g, " ");
  }

  return cleaned;
}

async function hasConnectedProvider(userId: string, provider: string) {
  const row = await db.query.integrationConnections.findFirst({
    where: and(
      eq(integrationConnections.userId, userId),
      eq(integrationConnections.provider, provider),
      eq(integrationConnections.status, "connected"),
    ),
  });

  return Boolean(row);
}

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [hasGmail, hasCalendar] = await Promise.all([
    hasConnectedProvider(session.user.id, "gmail"),
    hasConnectedProvider(session.user.id, "google_calendar"),
  ]);

  if (!hasGmail || !hasCalendar) {
    return NextResponse.json(
      { error: "Connect Gmail and Google Calendar first." },
      { status: 409 },
    );
  }

  const tenant = await getCorsairTenant(session.user.id);
  const today = new Date();
  const weekFromNow = new Date(today);

  weekFromNow.setDate(today.getDate() + 7);

  const [messageList, events] = await Promise.all([
    tenant.run<GmailListOutput>("gmail.api.messages.list", {
      maxResults: 8,
      q: "newer_than:30d",
      userId: "me",
    }),
    tenant.run<CalendarEventsOutput>("googlecalendar.api.events.getMany", {
      calendarId: "primary",
      maxResults: 8,
      orderBy: "startTime",
      singleEvents: true,
      timeMax: weekFromNow.toISOString(),
      timeMin: today.toISOString(),
    }),
  ]);

  if (!messageList.success) {
    return NextResponse.json(
      { error: "Gmail needs to be reconnected.", signInLink: messageList.signInLink },
      { status: 409 },
    );
  }

  if (!events.success) {
    return NextResponse.json(
      {
        error: "Google Calendar needs to be reconnected.",
        signInLink: events.signInLink,
      },
      { status: 409 },
    );
  }

  const messages = messageList.data.messages ?? [];
  const messageDetails = await Promise.all(
    messages
      .filter((message) => message.id)
      .slice(0, 8)
      .map((message) =>
        tenant.run<GmailMessage>("gmail.api.messages.get", {
          format: "metadata",
          id: message.id,
          metadataHeaders: ["From", "To", "Subject", "Date"],
          userId: "me",
        }),
      ),
  );

  const missingAuth = messageDetails.find((result) => !result.success);

  if (missingAuth && !missingAuth.success) {
    return NextResponse.json(
      { error: "Gmail needs to be reconnected.", signInLink: missingAuth.signInLink },
      { status: 409 },
    );
  }

  const emails = messageDetails
    .filter((result) => result.success)
    .map((result) => result.data)
    .map((message) => {
      const snippet = message.snippet ?? "";
      const subject = headerValue(message, "Subject").trim();

      return {
        date: headerValue(message, "Date"),
        from: readableSender(headerValue(message, "From")),
        id: message.id ?? crypto.randomUUID(),
        labels: message.labelIds ?? [],
        snippet,
        subject: subject || fallbackSubjectFromSnippet(snippet),
        threadId: message.threadId ?? "",
      };
    });

  const calendarEvents = (events.data.items ?? []).map((event) => ({
    attendees: event.attendees?.map((attendee) => attendee.email).filter(Boolean) ?? [],
    end: event.end?.dateTime ?? event.end?.date ?? "",
    htmlLink: event.htmlLink ?? "",
    id: event.id ?? crypto.randomUUID(),
    start: event.start?.dateTime ?? event.start?.date ?? "",
    title: event.summary ?? "Untitled event",
  }));

  return NextResponse.json({
    calendarEvents,
    emails,
    loadedAt: new Date().toISOString(),
  });
}
