"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function GoogleSignInButton() {
  return (
    <Button
      className="h-14 px-8 text-lg"
      onClick={() =>
        authClient.signIn.social({
          provider: "google",
          callbackURL: "/integrations",
        })
      }
    >
      Continue with Google
    </Button>
  );
}
