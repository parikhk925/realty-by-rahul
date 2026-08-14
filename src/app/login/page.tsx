import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { signOut } from "@/app/auth-actions";
import { BrandMark } from "@/components/brand/brand-mark";
import { LoginForm } from "@/components/auth/login-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Agent sign in" };

export const dynamic = "force-dynamic";

/**
 * Reads the current session so an existing one is surfaced rather than acted
 * on. Reaching the workspace should always be a deliberate step, never
 * something that happens because a browser still held a token.
 */
async function getSignedInEmail() {
  if (!isSupabaseConfigured()) return undefined;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const email = data?.claims.email;
    return typeof email === "string" ? email : undefined;
  } catch {
    return undefined;
  }
}

export default async function LoginPage() {
  const configured = isSupabaseConfigured();
  const signedInEmail = await getSignedInEmail();

  return (
    <main className="relative grid min-h-screen overflow-hidden bg-[#fbfcff] lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden min-h-screen overflow-hidden lg:block">
        <Image
          src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1800&q=88"
          alt="Dubai skyline"
          fill
          sizes="55vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(20,50,110,.83),rgba(28,95,209,.43),rgba(247,181,83,.28))]" />
        <div className="absolute inset-x-10 bottom-12 rounded-[30px] border border-white/25 bg-white/14 p-7 text-white shadow-2xl backdrop-blur-2xl">
          <Badge className="border-white/30 bg-white/18 text-white">
            <Sparkles className="size-3" />
            Realty by Rahul
          </Badge>
          <h1 className="mt-4 max-w-xl text-5xl font-semibold leading-[.98] tracking-[-0.055em]">
            Your private Dubai property workspace
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-white/76">
            Manage live inventory, agents, site visits and client-ready
            presentations from one focused workspace.
          </p>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-[440px] rounded-[30px] border border-white/85 bg-white/78 p-5 shadow-[0_26px_80px_rgba(42,74,136,.14)] backdrop-blur-2xl sm:p-8">
          <BrandMark />
          <div className="mt-8 flex size-12 items-center justify-center rounded-2xl bg-primary/[0.08] text-primary">
            <Building2 className="size-5" />
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.05em]">
            Welcome back
          </h1>
          <p className="mt-2 text-[11px] leading-6 text-muted-foreground">
            Sign in with the credentials provided by your administrator.
          </p>

          {!configured && (
            <div className="mt-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-amber-900">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" />
              <p className="text-[10px] leading-5">
                Database connection is pending. The existing demo workspace
                remains available until production credentials are attached.
              </p>
            </div>
          )}

          {signedInEmail && (
            <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/[0.04] p-4">
              <p className="flex items-center gap-2 text-[11px] font-semibold">
                <UserRound className="size-3.5 text-primary" />
                Already signed in as {signedInEmail}
              </p>
              <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
                Continue only if this device is yours. Otherwise sign out, or
                sign in below as someone else.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button asChild size="sm" className="h-9 rounded-xl text-[10px]">
                  <Link href="/dashboard">
                    Continue
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
                <form action={signOut}>
                  <Button
                    type="submit"
                    size="sm"
                    variant="outline"
                    className="h-9 w-full rounded-xl bg-white text-[10px]"
                  >
                    Sign out
                  </Button>
                </form>
              </div>
            </div>
          )}

          <Suspense fallback={<div className="mt-7 h-72 animate-pulse rounded-2xl bg-muted" />}>
            <LoginForm configured={configured} />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
