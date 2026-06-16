import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { CalymLandingPage } from "@/components/landing/calym-landing-page";
import { db } from "@/db";
import { integrationConnections } from "@/db/schema";
import { auth } from "@/lib/auth";

async function hasCompletedIntegrations(userId: string) {
  const connections = await db.query.integrationConnections.findMany({
    where: eq(integrationConnections.userId, userId),
  });

  const hasGmail = connections.some(
    (connection) =>
      connection.provider === "gmail" && connection.status === "connected",
  );
  const hasCalendar = connections.some(
    (connection) =>
      connection.provider === "google_calendar" &&
      connection.status === "connected",
  );

  return hasGmail && hasCalendar;
}

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    if (await hasCompletedIntegrations(session.user.id)) {
      redirect("/dashboard");
    }

    redirect("/integrations");
  }

  return <CalymLandingPage />;
}
