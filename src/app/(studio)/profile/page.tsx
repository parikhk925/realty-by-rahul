import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Camera,
  KeyRound,
  MapPin,
  MessageCircleMore,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AGENT_INSTAGRAM_URL,
  AGENT_WHATSAPP_DISPLAY,
  AGENT_WHATSAPP_LINK,
  AGENT_WHATSAPP_NUMBER,
} from "@/lib/property-data";
import { getStudioProfile } from "@/lib/supabase/session";

export default async function ProfilePage() {
  const profile = await getStudioProfile();
  const isBrandOwner = profile.role === "admin";
  const whatsappNumber = profile.whatsapp || AGENT_WHATSAPP_NUMBER;
  const whatsappDisplay =
    profile.phone || (isBrandOwner ? AGENT_WHATSAPP_DISPLAY : `+${whatsappNumber}`);
  return (
    <div className="mx-auto max-w-[1080px] px-4 py-6 sm:px-7 sm:py-8 lg:px-9">
      <Badge
        variant="outline"
        className="border-primary/15 bg-primary/[0.06] text-primary"
      >
        <BadgeCheck className="size-3" />
        Public advisory identity
      </Badge>
      <h1 className="mt-3 text-[28px] font-semibold tracking-[-0.045em] sm:text-4xl">
        {profile.fullName}&apos;s profile
      </h1>
      <p className="mt-1 text-[11px] text-muted-foreground sm:text-sm">
        The trust layer shown across every project and customer collection.
      </p>

      <section className="sunrise-surface relative mt-6 overflow-hidden rounded-[32px] border border-white/80 p-5 shadow-[0_24px_70px_rgba(74,62,40,.12)] sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-sky-200/50 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative mx-auto size-36 shrink-0 overflow-hidden rounded-[32px] border-4 border-white shadow-[0_20px_45px_rgba(74,62,40,.2)] sm:mx-0 sm:size-44">
            <Image
              src={profile.avatarUrl ?? "/rahul-profile.png"}
              alt={profile.fullName}
              fill
              sizes="176px"
              className="object-cover object-top"
              priority
            />
          </div>
          <div className="text-center sm:text-left">
            <BrandMark className="justify-center sm:justify-start" />
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
              {profile.fullName}
            </h2>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground sm:justify-start">
              <MapPin className="size-3.5 text-primary" />
              Dubai, United Arab Emirates
            </p>
            <p className="mt-4 max-w-xl text-[11px] leading-6 text-muted-foreground sm:text-sm">
              {isBrandOwner
                ? "Personal Dubai property advisory for off-plan opportunities, secondary homes and rental requirements—with direct WhatsApp guidance from shortlist to viewing."
                : "Dubai property advisor managing curated listings, buyer conversations and site visits through Realty by Rahul."}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Button asChild className="rounded-xl">
                <a
                  href={whatsappNumber ? `https://wa.me/${whatsappNumber}` : AGENT_WHATSAPP_LINK}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircleMore />
                  WhatsApp {profile.fullName.split(" ")[0]}
                </a>
              </Button>
              <Button asChild variant="outline" className="rounded-xl bg-white/75">
                <Link href="/profile/security">
                  <KeyRound />
                  Password & security
                  <ArrowUpRight />
                </Link>
              </Button>
              {isBrandOwner && (
                <Button asChild variant="outline" className="rounded-xl bg-white/75">
                  <a href={AGENT_INSTAGRAM_URL} target="_blank" rel="noreferrer">
                    <Camera />
                    @realtybyrahul.skyview
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <section className="rounded-[28px] border border-white/80 bg-white/72 p-5 shadow-[0_18px_50px_rgba(49,80,141,.08)] backdrop-blur-xl sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/[0.08] text-primary">
              <Phone className="size-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold">Direct contact</h2>
              <p className="mt-0.5 text-[9px] text-muted-foreground">
                Used by every customer CTA
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between rounded-2xl bg-[#f7f9fd] p-3">
              <span className="text-[9px] text-muted-foreground">WhatsApp</span>
              <span className="text-[10px] font-semibold">
                {whatsappDisplay}
              </span>
            </div>
            {isBrandOwner && (
              <div className="flex items-center justify-between rounded-2xl bg-[#f7f9fd] p-3">
                <span className="text-[9px] text-muted-foreground">Instagram</span>
                <span className="text-[10px] font-semibold">@realtybyrahul.skyview</span>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[28px] border border-white/80 bg-white/72 p-5 shadow-[0_18px_50px_rgba(49,80,141,.08)] backdrop-blur-xl sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700">
              <ShieldCheck className="size-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold">Dubai trust controls</h2>
              <p className="mt-0.5 text-[9px] text-muted-foreground">
                Safe-by-default presentation
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-2">
            {[
              {
                label: "DLD / RERA permit field",
                status: "Included",
              },
              {
                label: "Demo inventory disclosure",
                status: "Active",
              },
              {
                label: "Madmoun QR upload",
                status: "Phase 2",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-2xl bg-[#f7f9fd] p-3"
              >
                <span className="text-[9px] text-muted-foreground">{item.label}</span>
                <Badge
                  variant="outline"
                  className={
                    item.status === "Phase 2"
                      ? "text-muted-foreground"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }
                >
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-5 rounded-[28px] border border-amber-200/70 bg-amber-50/60 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <Building2 className="mt-0.5 size-4 shrink-0 text-amber-700" />
          <div>
            <h2 className="text-[11px] font-semibold text-amber-950">
              Compliance note
            </h2>
            <p className="mt-1 text-[9px] leading-5 text-amber-900/75">
              Phase 1 intentionally labels sample properties as demo inventory.
              Add Rahul&apos;s confirmed broker registration, project permit and
              official Madmoun QR only after those details are supplied and
              verified.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
