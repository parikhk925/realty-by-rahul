"use client";

import { useId, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  Check,
  MessageCircle,
  Phone,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createMultiPropertyWhatsAppUrl,
  createPropertyShareWhatsAppUrl,
  Property,
} from "@/lib/property-data";

interface WhatsAppShareDialogProps {
  children: ReactNode;
  property?: Property;
  properties?: Property[];
}

function sanitizeMobile(value: string) {
  return value.replace(/\D/g, "").slice(0, 15);
}

function normalizeWhatsAppNumber(value: string) {
  const digits = sanitizeMobile(value);
  if (/^05\d{8}$/.test(digits)) return `971${digits.slice(1)}`;
  if (/^5\d{8}$/.test(digits)) return `971${digits}`;
  return digits;
}

function formatMobile(value: string) {
  if (value.startsWith("971") && value.length > 3) {
    const local = value.slice(3);
    return `+971 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 9)}`.trim();
  }
  return value ? `+${value}` : "";
}

export function WhatsAppShareDialog({
  children,
  property,
  properties,
}: WhatsAppShareDialogProps) {
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false);
  const [sent, setSent] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const shareProperties = property ? [property] : (properties ?? []);
  const recipient = normalizeWhatsAppNumber(phone);
  const isValid = /^\d{8,15}$/.test(recipient);
  const itemLabel =
    shareProperties.length === 1
      ? shareProperties[0].title
      : `${shareProperties.length} selected properties`;
  // Drafts cannot be published, and sending one anyway would hand the buyer a
  // working preview link to unfinished inventory.
  const draftProperties = shareProperties.filter(
    (item) => item.status !== "Live",
  );
  const hasDrafts = draftProperties.length > 0;

  const publishProject = async (project: Property) => {
    try {
      const response = await fetch("/api/projects/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property: project }),
      });
      if (!response.ok) return undefined;
      const result = (await response.json()) as { url?: string };
      return result.url;
    } catch {
      return undefined;
    }
  };

  const openWhatsApp = async () => {
    setTouched(true);
    if (!isValid || shareProperties.length === 0 || hasDrafts) return;

    setPreparing(true);
    const publishedUrls = await Promise.all(
      shareProperties.map((project) => publishProject(project)),
    );
    const whatsappUrl =
      shareProperties.length === 1
        ? createPropertyShareWhatsAppUrl(
            shareProperties[0],
            recipient,
            publishedUrls[0],
          )
        : createMultiPropertyWhatsAppUrl(
            shareProperties,
            recipient,
            publishedUrls,
          );

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setPreparing(false);
    setSent(true);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setTouched(false);
          setSent(false);
          setPhone("");
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="overflow-hidden p-0 sm:max-w-[440px]">
        <div className="border-b bg-gradient-to-br from-[#20b757]/12 via-card to-card p-5">
          <DialogHeader>
            <span className="mb-2 flex size-10 items-center justify-center rounded-xl bg-[#20b757]/12 text-[#169447]">
              {sent ? (
                <Check className="size-4.5" />
              ) : (
                <MessageCircle className="size-4.5" />
              )}
            </span>
            <DialogTitle>
              {sent ? "WhatsApp is ready" : "Send directly on WhatsApp"}
            </DialogTitle>
            <DialogDescription>
              {sent
                ? "The property message was prepared in the buyer's WhatsApp chat. WhatsApp controls the final send."
                : "Enter the buyer's mobile number with country code. UAE local numbers are recognized automatically."}
            </DialogDescription>
          </DialogHeader>
        </div>

        {sent ? (
          <div className="space-y-4 p-5 pt-4">
            <div className="flex items-center gap-3 rounded-xl border bg-[#20b757]/[0.07] p-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#20b757]/15 text-[#169447]">
                <Check className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold">Share prepared</p>
                <p className="mt-0.5 truncate text-[9px] text-muted-foreground">
                  {itemLabel}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                onClick={() => {
                  setSent(false);
                  setPhone("");
                }}
                variant="outline"
              >
                Share another
              </Button>
              <Button type="button" onClick={() => setOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form
            className="space-y-4 p-5 pt-4"
            onSubmit={(event) => {
              event.preventDefault();
              void openWhatsApp();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor={inputId}>Buyer&apos;s WhatsApp number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id={inputId}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={formatMobile(phone)}
                  onChange={(event) =>
                    setPhone(sanitizeMobile(event.target.value))
                  }
                  onBlur={() => setTouched(true)}
                  aria-invalid={touched && !isValid}
                  aria-describedby={`${inputId}-hint`}
                  className="pl-9 font-mono"
                  placeholder="+971 56 539 1223"
                  autoFocus
                />
              </div>
              <p
                id={`${inputId}-hint`}
                className={
                  touched && !isValid
                    ? "text-[10px] font-medium text-destructive"
                    : "text-[10px] text-muted-foreground"
                }
              >
                {touched && !isValid
                  ? "Enter a valid WhatsApp number with country code."
                  : "UAE 05 numbers automatically become +971. Other countries need their country code."}
              </p>
            </div>

            <div className="rounded-xl border bg-muted/35 p-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Sharing
              </p>
              <p className="mt-1 truncate text-[11px] font-medium">{itemLabel}</p>
            </div>

            {hasDrafts && (
              <div className="flex items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/[0.06] p-3 text-[10px] leading-4">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-destructive" />
                <span>
                  {draftProperties.length === 1
                    ? `${draftProperties[0].title} is still a draft.`
                    : `${draftProperties.length} of these projects are still drafts.`}{" "}
                  Set{" "}
                  {draftProperties.length === 1 ? "it" : "them"} live before
                  sending to a buyer.
                </span>
              </div>
            )}

            <div className="flex items-start gap-2 rounded-xl bg-[#20b757]/[0.07] p-3 text-[9px] leading-4 text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-[#169447]" />
              Realty by Rahul only uses this number to open the correct chat. WhatsApp
              will ask you to confirm the final send.
            </div>

            <DialogFooter className="pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  !isValid ||
                  shareProperties.length === 0 ||
                  preparing ||
                  hasDrafts
                }
                className="bg-[#20b757] text-white hover:bg-[#179e49]"
              >
                {preparing ? "Preparing short link…" : "Continue to WhatsApp"}
                <ArrowUpRight className="size-3.5" />
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
