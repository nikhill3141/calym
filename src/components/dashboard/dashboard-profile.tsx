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
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="relative flex size-12 items-center justify-center overflow-hidden rounded-lg bg-muted text-base font-semibold">
          {image ? (
            <Image alt={displayName} fill sizes="48px" src={image} />
          ) : (
            <>
              <UserRound className="size-5" />
              <span className="sr-only">{initials}</span>
            </>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">{displayName}</p>
          <p className="truncate text-sm text-muted-foreground">{email}</p>
        </div>
      </div>
      <Button
        className="mt-4 w-full justify-start"
        onClick={handleSignOut}
        variant="outline"
      >
        <LogOut className="mr-2 size-4" />
        Sign out
      </Button>
    </div>
  );
}
