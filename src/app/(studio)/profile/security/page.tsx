import { KeyRound, ShieldCheck } from "lucide-react";
import { ChangePasswordForm } from "@/components/studio/change-password-form";
import { Badge } from "@/components/ui/badge";
import { getStudioProfile } from "@/lib/supabase/session";

export const metadata = { title: "Password & security" };

export default async function ProfileSecurityPage() {
  const profile = await getStudioProfile();

  return (
    <div className="mx-auto max-w-[760px] px-4 py-6 sm:px-7 sm:py-8">
      <header>
        <Badge className="border-primary/15 bg-primary/[0.07] text-primary">
          <ShieldCheck className="size-3" />
          Account security
        </Badge>
        <h1 className="mt-4 text-[28px] font-semibold tracking-[-0.045em] sm:text-4xl">
          Password & security
        </h1>
        <p className="mt-2 text-[11px] leading-6 text-muted-foreground">
          Confirm your current password before replacing it with a stronger one.
        </p>
      </header>

      <section className="mt-6 rounded-[28px] border border-white/85 bg-white/78 p-5 shadow-[0_20px_58px_rgba(42,75,137,.1)] backdrop-blur-2xl sm:p-7">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/[0.08] text-primary">
            <KeyRound className="size-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold">Change your password</h2>
            <p className="mt-1 text-[9px] text-muted-foreground">{profile.email}</p>
          </div>
        </div>
        <ChangePasswordForm demo={profile.demo} />
      </section>
    </div>
  );
}
