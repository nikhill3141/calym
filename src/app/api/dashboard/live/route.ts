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
    body?: { data?: string };
    headers?: { name?: string; value?: string }[];
    mimeType?: string;
    parts?: GmailMessage["payload"][];
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
  const cleaned = cleanEmailText(snippet)
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

function decodeHtmlEntities(value: string) {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: "\"",
    rsquo: "'",
    lsquo: "'",
    rdquo: "\"",
    ldquo: "\"",
    ndash: "-",
    mdash: "-",
  };

  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, code: string) => {
    const normalizedCode = code.toLowerCase();

    if (normalizedCode.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(normalizedCode.slice(2), 16));
    }

    if (normalizedCode.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(normalizedCode.slice(1), 10));
    }

    return namedEntities[normalizedCode] ?? entity;
  });
}

function stripHtml(value: string) {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
}

function cleanEmailText(value: string) {
  return decodeHtmlEntities(stripHtml(value))
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function stripQuotedReply(value: string) {
  return value
    .split(/\n\s*On .+ wrote:\s*/i)[0]
    .split(/\n\s*From:\s*/i)[0]
    .split(/\n\s*-{2,}\s*Original Message\s*-{2,}/i)[0]
    .split(/\n\s*_{6,}/)[0]
    .split(/\n\s*>/)[0]
    .trim();
}

function decodeBase64Url(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );

  return Buffer.from(padded, "base64").toString("utf8");
}

function extractMessageBody(payload: GmailMessage["payload"]): string {
  if (!payload) {
    return "";
  }

  if (payload.body?.data) {
    return cleanEmailText(decodeBase64Url(payload.body.data));
  }

  const parts = (payload.parts ?? []).filter(Boolean);
  const plainPart = parts.find((part) => part?.mimeType === "text/plain");
  const htmlPart = parts.find((part) => part?.mimeType === "text/html");

  if (plainPart?.body?.data) {
    return cleanEmailText(decodeBase64Url(plainPart.body.data));
  }

  if (htmlPart?.body?.data) {
    return cleanEmailText(decodeBase64Url(htmlPart.body.data));
  }

  for (const part of parts) {
    const body = extractMessageBody(part);

    if (body) {
      return body;
    }
  }

  return "";
}

function emailFromHeader(header: string) {
  return header.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
}

function readableContact(header: string, fallback: string) {
  const cleaned = header.trim();

  if (!cleaned) {
    return fallback;
  }

  const quoted = cleaned.match(/"([^"]+)"/)?.[1];

  if (quoted) {
    return quoted;
  }

  const named = cleaned.match(/^([^<]+)</)?.[1]?.trim();

  if (named) {
    return named;
  }

  const email = emailFromHeader(cleaned);

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
      maxResults: 15,
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
      .slice(0, 15)
      .map((message) =>
        tenant.run<GmailMessage>("gmail.api.messages.get", {
          format: "full",
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
      const snippet = cleanEmailText(message.snippet ?? "");
      const body = stripQuotedReply(extractMessageBody(message.payload) || snippet) || snippet;
      const subject = cleanEmailText(headerValue(message, "Subject"));
      const fromHeader = headerValue(message, "From");
      const toHeader = headerValue(message, "To");
      const fromEmail = emailFromHeader(fromHeader);
      const toEmail = emailFromHeader(toHeader);

      return {
        body,
        date: headerValue(message, "Date"),
        from: readableContact(fromHeader, fromEmail || "Unknown sender"),
        fromEmail,
        id: message.id ?? crypto.randomUUID(),
        labels: message.labelIds ?? [],
        snippet,
        subject: subject || fallbackSubjectFromSnippet(snippet),
        threadId: message.threadId ?? "",
        to: readableContact(toHeader, toEmail),
        toEmail,
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
