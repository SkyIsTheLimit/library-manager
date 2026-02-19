"use client";

import { useEffect } from "react";
import { syncService } from "@/lib/sync";
import { authClient } from "@/lib/auth-client";
import { db } from "@/lib/database/dexie";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

export function AuthNav() {
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (session) {
      syncService.startAutoSync(session);
    }
  }, [session]);

  const signIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
    });
  };

  const signOut = async () => {
    syncService.stopAutoSync();
    await db.clearAll();
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/signin";
        },
      },
    });
  };

  if (isPending) return null;

  if (!session) {
    return (
      <Button variant="ghost" size="sm" onClick={signIn}>
        Sign In with Google
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        {session.user.image ? (
          <img
            src={session.user.image}
            alt={session.user.name}
            className="h-6 w-6 rounded-full"
          />
        ) : (
          <User className="h-4 w-4" />
        )}
        <span className="text-xs font-medium hidden sm:inline-block">
          {session.user.name}
        </span>
      </div>
      <Button variant="ghost" size="icon" onClick={signOut} className="h-8 w-8">
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
