"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(
    searchParams.get("error") === "inactive"
      ? "This account has been deactivated. Contact the administrator."
      : "",
  );

  const login = async (formData: FormData) => {
    if (!configured) {
      setError("The production database is not connected yet.");
      return;
    }
    setPending(true);
    setError("");
    const supabase = createClient();
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: String(formData.get("email") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
    });
    if (loginError) {
      setPending(false);
      setError("The email or password is incorrect.");
      return;
    }
    const next = searchParams.get("next");
    router.replace(next?.startsWith("/") ? next : "/dashboard");
    router.refresh();
  };

  return (
    <form action={login} className="mt-7 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-email">Email address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="h-12 rounded-xl bg-white pl-10"
            placeholder="agent@realtybyrahul.ae"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-password">Password</Label>
        <div className="relative">
          <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className="h-12 rounded-xl bg-white px-10"
            placeholder="Enter your password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-1 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="rounded-xl bg-destructive/[0.06] p-3 text-[10px] font-medium text-destructive">
          {error}
        </p>
      )}
      <Button
        type="submit"
        disabled={pending || !configured}
        className="h-12 w-full rounded-xl bg-[linear-gradient(135deg,#4280ff,#174ed6)] text-sm shadow-[0_14px_32px_rgba(35,96,221,.25)]"
      >
        {pending && <LoaderCircle className="animate-spin" />}
        {pending ? "Signing in…" : "Sign in to workspace"}
      </Button>
    </form>
  );
}
