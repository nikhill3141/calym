import {
  CorsairApiError,
  createClient,
  type InstanceScope,
  type PluginId,
  type RunResult,
  type TenantScope,
} from "@corsair-dev/app";

export type IntegrationProvider = "gmail" | "google_calendar";

export const corsairPluginIds = {
  gmail: "gmail",
  google_calendar: "googlecalendar",
} satisfies Record<IntegrationProvider, PluginId>;

export function getAppBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.BETTER_AUTH_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function getCorsairInstance() {
  const apiKey = process.env.CORSAIR_DEV_KEY;
  const instanceId = process.env.CORSAIR_INSTANCE_ID;

  if (!apiKey || !instanceId) {
    throw new Error(
      "Corsair is not configured. Set CORSAIR_DEV_KEY and CORSAIR_INSTANCE_ID in .env.local.",
    );
  }

  return createClient({ apiKey }).instance(instanceId);
}

export async function ensureCorsairTenant(
  instance: InstanceScope,
  tenantId: string,
) {
  try {
    return await instance.tenant(tenantId).get();
  } catch (error) {
    if (error instanceof CorsairApiError && error.status !== 404) {
      throw error;
    }

    return instance.tenants.create(tenantId);
  }
}

export async function getCorsairTenant(tenantId: string) {
  const instance = getCorsairInstance();

  await ensureCorsairTenant(instance, tenantId);

  return instance.tenant(tenantId);
}

export async function runCorsair<T>(
  tenant: TenantScope,
  path: string,
  input?: Record<string, unknown>,
) {
  const result = await tenant.run<T>(path, input);

  if (!result.success) {
    return {
      data: null,
      signInLink: result.signInLink,
      success: false,
    } as const;
  }

  return {
    data: result.data,
    signInLink: null,
    success: true,
  } as const;
}

export function isMissingCorsairAuth<T>(
  result: RunResult<T>,
): result is Extract<RunResult<T>, { success: false }> {
  return !result.success;
}
