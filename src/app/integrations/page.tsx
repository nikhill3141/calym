import { eq } from "drizzle-orm";
import { CalendarDays, CheckCircle2, Mail } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { integrationConnections } from "@/db/schema";
import { auth } from "@/lib/auth";
import {
  corsairPluginIds,
  ensureCorsairTenant,
  getAppBaseUrl,
  getCorsairInstance,
  type IntegrationProvider,
} from "@/lib/corsair";

const integrations = [
  {
    provider: "gmail",
    name: "Gmail",
    description: "Authorize Corsair to search, draft, and send email.",
    icon: Mail,
    connectedClass: "border-emerald-200 bg-emerald-50/80 text-emerald-950",
    pendingClass: "calym-card",
    badgeClass: "bg-emerald-100 text-emerald-700",
  },
  {
    provider: "google_calendar",
    name: "Google Calendar",
    description: "Authorize Corsair to create invites and manage events.",
    icon: CalendarDays,
    connectedClass: "border-emerald-200 bg-emerald-50/80 text-emerald-950",
    pendingClass: "calym-card",
    badgeClass: "bg-emerald-100 text-emerald-700",
  },
] as const;

async function createCorsairAuthorizeUrl({
  provider,
  tenantId,
}: {
  provider: IntegrationProvider;
  tenantId: string;
}) {
  const instance = getCorsairInstance();
  const pluginId = corsairPluginIds[provider];
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!googleClientId || !googleClientSecret) {
    throw new Error(
      "Google OAuth credentials are missing. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local.",
    );
  }

  await instance.plugins.upsert(pluginId, {
    authType: "oauth_2",
    mode: "cautious",
    useManaged: false,
  });

  const instanceDetail = await instance.get();
  await instance.plugins.credentials.setRoot(
    pluginId,
    "client_id",
    googleClientId,
  );
  await instance.plugins.credentials.setRoot(
    pluginId,
    "client_secret",
    googleClientSecret,
  );
  await instance.plugins.credentials.setRoot(
    pluginId,
    "redirect_url",
    instanceDetail.oauthCallbackUrl,
  );
  await instance.runtime.refresh();
  await ensureCorsairTenant(instance, tenantId);

  const returnTo = `${getAppBaseUrl()}/integrations/connected?provider=${provider}`;
  const { authorizeUrl } = await instance
    .tenant(tenantId)
    .plugins.oauth.authorizeUrl(pluginId, returnTo);

  return authorizeUrl;
}

async function getConnectionStatus(userId: string) {
  const rows = await db.query.integrationConnections.findMany({
    where: eq(integrationConnections.userId, userId),
  });

  return Object.fromEntries(
    integrations.map((integration) => [
      integration.provider,
      rows.some(
        (row) =>
          row.provider === integration.provider && row.status === "connected",
      ),
    ]),
  ) as Record<IntegrationProvider, boolean>;
}

async function connectIntegration(formData: FormData) {
  "use server";

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  const provider = formData.get("provider");
  const validProvider = integrations.some(
    (integration) => integration.provider === provider,
  );

  if (!validProvider || typeof provider !== "string") {
    redirect("/integrations");
  }

  let authorizeUrl: string;

  try {
    authorizeUrl = await createCorsairAuthorizeUrl({
      provider: provider as IntegrationProvider,
      tenantId: session.user.id,
    });
  } catch (error) {
    console.error(error);
    redirect(
      `/integrations?error=${encodeURIComponent(
        error instanceof Error
          ? error.message
          : "Could not create Corsair connection link.",
      )}`,
    );
  }

  redirect(authorizeUrl);
}

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  const status = await getConnectionStatus(session.user.id);
  const bothConnected = integrations.every(
    (integration) => status[integration.provider],
  );

  if (bothConnected) {
    redirect("/dashboard");
  }

  const params = await searchParams;

  return (
    <main className="calym-dashboard min-h-screen px-6 py-10">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col justify-center gap-8">
        <div className="max-w-3xl">
          <p className="text-lg font-medium calym-muted">
            Connect your workspace
          </p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight md:text-6xl">
            Link Gmail and Calendar
          </h1>
          <p className="mt-6 text-xl leading-9 calym-muted">
            CalyM needs both integrations before opening the dashboard. Each
            card creates a secure Corsair OAuth connection for your account.
          </p>
          {params.error ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-base text-rose-700">
              {params.error}
            </div>
          ) : null}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {integrations.map((integration) => {
            const Icon = integration.icon;
            const isConnected = status[integration.provider];

            return (
              <div
                className={`rounded-3xl border p-8 shadow-sm transition-colors md:p-10 ${
                  isConnected
                    ? integration.connectedClass
                    : integration.pendingClass
                }`}
                key={integration.provider}
              >
                <div className="flex flex-col gap-6">
                  <div className="flex items-start justify-between gap-5">
                    <div className="flex items-center gap-5">
                      <div className="rounded-2xl border bg-slate-50/80 p-4 dark:bg-white/8">
                        <Icon className="size-9" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-semibold">
                          {integration.name}
                        </h2>
                        <p className="mt-3 text-lg leading-8 calym-muted">
                          {integration.description}
                        </p>
                      </div>
                    </div>

                    {isConnected ? (
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-base font-medium ${integration.badgeClass}`}
                      >
                        <CheckCircle2 className="size-5" />
                        Connected
                      </span>
                    ) : (
                      <span className="rounded-full border px-4 py-2 text-base font-medium calym-muted">
                        Pending
                      </span>
                    )}
                  </div>

                  <form action={connectIntegration}>
                    <input
                      name="provider"
                      type="hidden"
                      value={integration.provider}
                    />
                    <Button
                      className={`h-14 w-full text-lg ${
                        isConnected ? "" : "calym-primary-action"
                      }`}
                      disabled={isConnected}
                    >
                      {isConnected
                        ? "Connected"
                        : `Connect ${integration.name}`}
                    </Button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
