import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { db } from "@/db";
import { integrationConnections } from "@/db/schema";
import { auth } from "@/lib/auth";

const requiredConnections = [
  {
    provider: "gmail",
    name: "Gmail",
    description: "Mail search, drafts, send, labels, and inbox automation.",
  },
  {
    provider: "google_calendar",
    name: "Google Calendar",
    description: "Meeting creation, invite updates, and schedule context.",
  },
] as const;

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  const connections = await db.query.integrationConnections.findMany({
    where: eq(integrationConnections.userId, session.user.id),
  });

  const connectionStatus = requiredConnections.map((connection) => ({
    ...connection,
    connected: connections.some(
      (row) =>
        row.provider === connection.provider && row.status === "connected",
    ),
  }));

  if (!connectionStatus.every((connection) => connection.connected)) {
    redirect("/integrations");
  }

  const displayName =
    session.user.name && session.user.name.toLowerCase() !== "unknown user"
      ? session.user.name
      : session.user.email.split("@")[0];

  return (
    <DashboardShell
      connections={connectionStatus}
      user={{
        email: session.user.email,
        image: session.user.image,
        name: displayName,
      }}
    />
  );
}
