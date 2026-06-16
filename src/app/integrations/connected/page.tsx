import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { integrationConnections } from "@/db/schema";
import { auth } from "@/lib/auth";

type IntegrationProvider = "gmail" | "google_calendar";

const providers = ["gmail", "google_calendar"] satisfies IntegrationProvider[];

async function markIntegrationConnected({
  provider,
  userId,
}: {
  provider: IntegrationProvider;
  userId: string;
}) {
  const [existingConnection] = await db
    .select()
    .from(integrationConnections)
    .where(
      and(
        eq(integrationConnections.userId, userId),
        eq(integrationConnections.provider, provider),
      ),
    )
    .limit(1);

  const now = new Date();

  if (existingConnection) {
    await db
      .update(integrationConnections)
      .set({
        status: "connected",
        connectedAt: now,
        updatedAt: now,
      })
      .where(eq(integrationConnections.id, existingConnection.id));
    return;
  }

  await db.insert(integrationConnections).values({
    userId,
    provider,
    status: "connected",
    connectedAt: now,
  });
}

async function hasAllConnections(userId: string) {
  const rows = await db.query.integrationConnections.findMany({
    where: eq(integrationConnections.userId, userId),
  });

  return providers.every((provider) =>
    rows.some(
      (row) => row.provider === provider && row.status === "connected",
    ),
  );
}

export default async function IntegrationConnectedPage({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  const { provider } = await searchParams;
  const isValidProvider = providers.includes(provider as IntegrationProvider);

  if (!provider || !isValidProvider) {
    redirect("/integrations");
  }

  await markIntegrationConnected({
    provider: provider as IntegrationProvider,
    userId: session.user.id,
  });

  if (await hasAllConnections(session.user.id)) {
    redirect("/dashboard");
  }

  redirect("/integrations");
}
