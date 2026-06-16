"use client";

import { LogOut, UserRound } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

type DashboardProfileProps = {
  email: string;
  image?: string | null;
  name: string;
};

export function DashboardProfile({ email, image, name }: DashboardProfileProps) {
  const router = useRouter();
  const displayName =
    name && name.toLowerCase() !== "unknown user" ? name : email.split("@")[0];
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border p-3 calym-card">
      <div className="flex items-center gap-3">
        <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-sm font-semibold text-white shadow-lg shadow-indigo-500/15">
          {image ? (
            <Image
              alt={displayName}
              className="object-cover"
              fill
              sizes="40px"
              src={image}
            />
          ) : (
            <>
              <UserRound className="size-5" />
              <span className="sr-only">{initials}</span>
            </>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{displayName}</p>
          <p className="truncate text-xs calym-muted">{email}</p>
        </div>
      </div>
      <Button
        className="calym-quiet-button mt-3 h-9 w-full justify-start text-sm"
        onClick={handleSignOut}
        variant="outline"
      >
        <LogOut className="mr-2 size-3.5" />
        Sign out
      </Button>
    </div>
  );
}
