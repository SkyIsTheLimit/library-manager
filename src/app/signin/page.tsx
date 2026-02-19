"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Loader2 } from "lucide-react";
import { useState } from "react";

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });
    } catch (error) {
      console.error("Sign in failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-56px)] items-center justify-center p-4 bg-secondary/5">
      <Card className="w-full max-w-md border-none shadow-2xl bg-card/90 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="text-center pt-10">
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
            <BookOpen className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight">Welcome Back</CardTitle>
          <CardDescription className="text-muted-foreground font-medium">
            Sign in to sync your library across all your devices.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-2">
          <Button
            onClick={signInWithGoogle}
            disabled={isLoading}
            className="w-full h-14 rounded-2xl text-lg font-black uppercase tracking-widest gap-3 shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center"
          >
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </>
            )}
          </Button>
          <div className="mt-8 text-center">
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.4em] opacity-40">
              Personalized Library Manager
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
