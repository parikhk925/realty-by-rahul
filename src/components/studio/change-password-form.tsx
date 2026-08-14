"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, LoaderCircle, ShieldCheck } from "lucide-react";
import { changePassword } from "@/app/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangePasswordForm({ demo }: { demo: boolean }) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string }>();

  const submit = async (formData: FormData) => {
    setPending(true);
    setMessage(undefined);
    const result = await changePassword(formData);
    setPending(false);
    if (result.error) {
      setMessage({ kind: "error", text: result.error });
      return;
    }
    setMessage({
      kind: "success",
      text: result.success ?? "Password changed. Opening your workspace…",
    });
    router.refresh();
    window.setTimeout(() => router.push("/dashboard"), 650);
  };

  return (
    <form action={submit} className="mt-5 space-y-4">
      {[
        {
          name: "currentPassword",
          label: "Current password",
          autoComplete: "current-password",
        },
        {
          name: "newPassword",
          label: "New password",
          autoComplete: "new-password",
        },
        {
          name: "confirmPassword",
          label: "Confirm new password",
          autoComplete: "new-password",
        },
      ].map((field) => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>{field.label}</Label>
          <div className="relative">
            <Input
              id={field.name}
              name={field.name}
              type={visible ? "text" : "password"}
              autoComplete={field.autoComplete}
              required
              minLength={field.name === "currentPassword" ? undefined : 10}
              className="h-12 rounded-xl bg-white pr-11"
            />
            <button
              type="button"
              onClick={() => setVisible((current) => !current)}
              className="absolute right-1 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
              aria-label={visible ? "Hide passwords" : "Show passwords"}
            >
              {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
      ))}
      <div className="rounded-xl bg-[#f6f9ff] p-3 text-[9px] leading-5 text-muted-foreground">
        Use 10 or more characters including uppercase, lowercase and a number.
      </div>
      {message && (
        <div
          role="status"
          className={
            message.kind === "success"
              ? "flex gap-2 rounded-xl bg-emerald-500/[0.08] p-3 text-[10px] font-medium text-emerald-700"
              : "flex gap-2 rounded-xl bg-destructive/[0.06] p-3 text-[10px] font-medium text-destructive"
          }
        >
          {message.kind === "success" ? (
            <CheckCircle2 className="size-4 shrink-0" />
          ) : (
            <ShieldCheck className="size-4 shrink-0" />
          )}
          {message.text}
        </div>
      )}
      <Button
        type="submit"
        disabled={pending || demo}
        className="h-12 w-full rounded-xl sm:w-auto"
      >
        {pending && <LoaderCircle className="animate-spin" />}
        {pending ? "Updating…" : "Change password"}
      </Button>
    </form>
  );
}
