"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, type PanInfo } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  FileDown,
  FileText,
  HandCoins,
  House,
  Camera,
  MapPin,
  Maximize2,
  MessageCircleMore,
  Phone,
  Ruler,
  Share2,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";
import { LeadCaptureForm } from "@/components/public/lead-capture-form";
import { MarketPriceCard } from "@/components/public/market-price-card";
import type { PriceContext } from "@/lib/price-context";
import { PropertyComparison } from "@/components/public/property-comparison";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AGENT_INSTAGRAM_URL,
  AGENT_WHATSAPP_DISPLAY,
  createSiteVisitWhatsAppUrl,
  createWhatsAppUrl,
  formatLayoutLabel,
  formatAreaWithSqm,
  formatPriceLabel,
  normalizeAreaInput,
  getBrochureUrl,
  getDossierUrl,
  getProjectCategory,
  isResidentialType,
  Property,
} from "@/lib/property-data";
import { cn } from "@/lib/utils";

interface PublicListingExperienceProps {
  property: Property;
  developerProperties?: Property[];
  similarProperties?: Property[];
  priceContext?: PriceContext;
}

export function PublicListingExperience({
  property,
  developerProperties = [],
  similarProperties = [],
  priceContext,
}: PublicListingExperienceProps) {
  const [activeImage, setActiveImage] = useState(0);
  const [copied, setCopied] = useState(false);
  const category = getProjectCategory(property);
  const whatsappUrl = createWhatsAppUrl(property);
  const siteVisitUrl = createSiteVisitWhatsAppUrl(property);
  const isRental = property.purpose === "For Rent";
  // Two separate documents: the developer's brochure exactly as they published
  // it, and the dossier this site generates. Both routed through our own
  // domain rather than linking Blob storage, so a buyer opening either sees
  // the site's URL. Those proxies only serve published inventory, so an admin
  // previewing a draft is linked straight at the stored file instead.
  const isLive = property.status === "Live";
  const brochureSource = getBrochureUrl(property);
  const brochureUrl = brochureSource
    ? isLive
      ? `/brochure/${encodeURIComponent(property.slug)}`
      : brochureSource
    : undefined;
  const dossierSource = getDossierUrl(property);
  const dossierUrl = dossierSource
    ? isLive
      ? `/dossier/${encodeURIComponent(property.slug)}`
      : dossierSource
    : undefined;
  const floorPlanUrl = property.floorPlan
    ? isLive
      ? `/floor-plan/${encodeURIComponent(property.slug)}`
      : property.floorPlan.url
    : undefined;

  // The bar at the foot of a phone has room for one download control, so the
  // three documents sit behind it rather than only the dossier being reachable.
  const documents = [
    { label: "Developer brochure", hint: "As published by the developer", href: brochureUrl },
    { label: "Listing details", hint: "Price, terms and location", href: dossierUrl },
    { label: "Floor plan", hint: "Layout and dimensions", href: floorPlanUrl },
  ].filter((document): document is { label: string; hint: string; href: string } =>
    Boolean(document.href),
  );
  const advisorName = property.assignedAgentName ?? "Rahul";
  const advisorWhatsapp = property.assignedAgentWhatsApp
    ? `+${property.assignedAgentWhatsApp}`
    : AGENT_WHATSAPP_DISPLAY;

  const moveImage = (direction: -1 | 1) => {
    setActiveImage((current) => {
      const next = current + direction;
      if (next < 0) return property.images.length - 1;
      if (next >= property.images.length) return 0;
      return next;
    });
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent, info: PanInfo) => {
    if (info.offset.x < -45) moveImage(1);
    if (info.offset.x > 45) moveImage(-1);
  };

  const sharePage = async () => {
    const shareData = {
      title: property.title,
      text: `Explore ${property.title} in ${property.location}`,
      url: window.location.href,
    };
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const facts = [
    // Commercial stock has no meaningful bed/bath count, and showing zeroes
    // reads as missing data rather than as an office.
    ...(isResidentialType(property.type)
      ? [
          { label: "Bedrooms", value: `${property.bedrooms}`, icon: BedDouble },
          { label: "Bathrooms", value: `${property.bathrooms}`, icon: Bath },
        ]
      : [
          { label: "Property type", value: property.type, icon: Building2 },
          { label: "Parking", value: property.parking, icon: Car },
        ]),
    { label: "Built-up area", value: formatAreaWithSqm(property.area), icon: Ruler },
    {
      label: category === "Rent" ? "Availability" : "Handover",
      value: property.handover ?? "Ready",
      icon: CalendarDays,
    },
  ];

  return (
    <div className="min-h-screen bg-[#fbfcff] pb-28 text-foreground sm:pb-12">
      <header className="sticky top-0 z-50 border-b border-white/75 bg-white/82 backdrop-blur-2xl">
        <div className="mx-auto flex h-[70px] max-w-[1180px] items-center gap-3 px-4 sm:px-6">
          <Button
            asChild
            variant="outline"
            size="icon"
            className="rounded-full border-white bg-white shadow-sm"
          >
            <Link href="/" aria-label="Back to Rahul's portfolio">
              <ArrowLeft />
            </Link>
          </Button>
          <BrandMark className="min-w-0 flex-1" />
          <Button
            variant="outline"
            size="icon"
            className="rounded-full border-white bg-white shadow-sm"
            onClick={() => void sharePage()}
            aria-label="Share property"
          >
            {copied ? <Check className="text-emerald-600" /> : <Share2 />}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] sm:px-6 sm:pt-6">
        <section className="sm:overflow-hidden sm:rounded-[32px] sm:border sm:border-white sm:bg-white sm:p-3 sm:shadow-[0_24px_70px_rgba(45,76,138,.12)]">
          <div className="relative aspect-[4/3] min-h-[330px] overflow-hidden bg-muted sm:aspect-[2.05/1] sm:min-h-[470px] sm:rounded-[24px]">
            <motion.div
              key={activeImage}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.16}
              onDragEnd={handleDragEnd}
              initial={{ opacity: 0.65, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.36 }}
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
            >
              <Image
                src={property.images[activeImage]}
                alt={`${property.title} photo ${activeImage + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 1120px"
                className="pointer-events-none object-cover"
                priority
              />
            </motion.div>
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(15,31,62,.05),transparent_52%,rgba(15,31,62,.44))]" />

            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              <Badge className="border-white/55 bg-white/88 text-primary shadow-sm backdrop-blur-md hover:bg-white">
                <Sparkles className="size-3" />
                Curated by Rahul
              </Badge>
              <Badge className="border-white/40 bg-white/22 text-white backdrop-blur-md hover:bg-white/28">
                {category}
              </Badge>
              <Badge
                className={cn(
                  "border-white/35 text-white shadow-sm backdrop-blur-md",
                  property.commissionCovered ? "bg-emerald-500/80" : "bg-[#16294e]/50",
                )}
              >
                <HandCoins className="size-3" />
                {property.commissionCovered ? "Covered" : "Not covered"}
              </Badge>
            </div>

            {property.images.length > 1 && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => moveImage(-1)}
                  className="absolute left-3 top-1/2 size-10 -translate-y-1/2 rounded-full border-white/50 bg-white/34 text-white shadow-lg backdrop-blur-xl hover:bg-white/55 hover:text-white sm:left-5"
                  aria-label="Previous image"
                >
                  <ChevronLeft />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => moveImage(1)}
                  className="absolute right-3 top-1/2 size-10 -translate-y-1/2 rounded-full border-white/50 bg-white/34 text-white shadow-lg backdrop-blur-xl hover:bg-white/55 hover:text-white sm:right-5"
                  aria-label="Next image"
                >
                  <ChevronRight />
                </Button>
              </>
            )}

            <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 text-white sm:inset-x-6 sm:bottom-6">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/72">
                  Swipe to explore
                </p>
                <div className="mt-2 flex gap-1.5">
                  {property.images.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      className={cn(
                        "h-1.5 rounded-full bg-white/45 transition-all",
                        activeImage === index ? "w-7 bg-white" : "w-1.5",
                      )}
                      aria-label={`Show image ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
              <span className="flex items-center gap-1.5 rounded-full border border-white/45 bg-white/24 px-3 py-2 text-[9px] font-semibold backdrop-blur-xl">
                <Maximize2 className="size-3" />
                {activeImage + 1} / {property.images.length}
              </span>
            </div>
          </div>

          <div className="hidden gap-2 px-1 pt-3 sm:flex">
            {property.images.slice(0, 6).map((image, index) => (
              <button
                key={image}
                type="button"
                onClick={() => setActiveImage(index)}
                className={cn(
                  "relative h-16 w-24 overflow-hidden rounded-xl border-2 transition-all",
                  activeImage === index
                    ? "border-primary shadow-[0_8px_20px_rgba(38,101,225,.18)]"
                    : "border-transparent opacity-70 hover:opacity-100",
                )}
              >
                <Image
                  src={image}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </section>

        <div className="grid gap-6 px-4 pt-5 sm:px-0 sm:pt-7 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            <section>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-primary/15 bg-primary/[0.06] text-primary"
                >
                  {property.projectStage ?? category}
                </Badge>
                {property.ownership && (
                  <Badge variant="outline">{property.ownership}</Badge>
                )}
                <Badge
                  variant="outline"
                  className="border-emerald-200 bg-emerald-50 text-emerald-700"
                >
                  <ShieldCheck className="size-3" />
                  Advisory checked
                </Badge>
              </div>
              <h1 className="mt-4 text-[34px] font-semibold leading-[1.02] tracking-[-0.055em] sm:text-5xl">
                {property.title}
              </h1>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
                <MapPin className="size-4 text-primary" />
                {property.location}, Dubai
              </p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-[linear-gradient(135deg,#fff8e9,#ffffff)] px-4 py-2.5 text-[10px] font-semibold text-amber-900 shadow-sm">
                <Sparkles className="size-3.5 text-[#c58b31]" />
                Best current offer shared privately on WhatsApp
              </div>
              <Button
                asChild
                variant="outline"
                className="mt-4 h-11 rounded-xl border-primary/15 bg-white/75 text-primary shadow-sm"
              >
                <Link href="/">
                  <Building2 />
                  Explore Rahul&apos;s portfolio
                  <ArrowRight />
                </Link>
              </Button>
            </section>

            <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {facts.map((fact) => (
                <div
                  key={fact.label}
                  className="rounded-2xl border border-white/80 bg-white/75 p-4 shadow-[0_14px_38px_rgba(74,62,40,.07)] backdrop-blur-xl"
                >
                  <fact.icon className="size-4 text-primary" />
                  <p className="mt-3 text-[9px] text-muted-foreground">{fact.label}</p>
                  <p className="mt-1 truncate text-[11px] font-semibold">{fact.value}</p>
                </div>
              ))}
            </section>

            <section className="mt-6 rounded-[28px] border border-white/80 bg-white/76 p-5 shadow-[0_18px_48px_rgba(50,82,145,.08)] backdrop-blur-xl sm:p-7">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-primary">
                The opportunity
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em]">
                A considered Dubai address
              </h2>
              <p className="mt-3 text-[11px] leading-6 text-muted-foreground sm:text-sm sm:leading-7">
                {property.description}
              </p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {property.highlights.map((highlight) => (
                  <div
                    key={highlight}
                    className="flex items-center gap-3 rounded-2xl bg-[#f7f9fd] p-3"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-primary/[0.08] text-primary">
                      <Check className="size-3.5" />
                    </span>
                    <p className="text-[10px] font-medium">{highlight}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="sunrise-surface mt-6 rounded-[28px] border border-white/80 p-5 shadow-[0_18px_48px_rgba(50,82,145,.08)] sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-primary">
                    {category === "Rent" ? "Rental terms" : "Payment plan"}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                    {property.paymentPlan ?? "Available on request"}
                  </h2>
                </div>
                <span className="flex size-11 items-center justify-center rounded-2xl bg-white/76 text-primary shadow-sm backdrop-blur-xl">
                  <WalletCards className="size-5" />
                </span>
              </div>
              {property.paymentMilestones &&
              property.paymentMilestones.length > 0 ? (
                <div className="mt-6 grid gap-2 sm:grid-cols-3">
                  {property.paymentMilestones.map((milestone) => (
                    <div
                      key={milestone.label}
                      className="rounded-2xl border border-white/80 bg-white/68 p-4 backdrop-blur-xl"
                    >
                      <p className="text-2xl font-semibold text-primary">
                        {milestone.percentage}%
                      </p>
                      <p className="mt-1 text-[9px] text-muted-foreground">
                        {milestone.label}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-[10px] leading-5 text-muted-foreground">
                  Ask {advisorName} for the latest terms, cheque options and negotiable
                  incentives.
                </p>
              )}
            </section>

            <section className="mt-6 rounded-[28px] border border-white/80 bg-white/76 p-5 shadow-[0_18px_48px_rgba(50,82,145,.08)] backdrop-blur-xl sm:p-7">
              <h2 className="text-xl font-semibold tracking-[-0.035em]">
                Project essentials
              </h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  ["Developer / owner", property.developer ?? "Private owner"],
                  ["Community", property.community ?? property.location],
                  ["Property type", property.type],
                  ["Furnishing", property.furnishing],
                  ["Parking", property.parking],
                  ["Floor / level", property.floor],
                  ["Ownership", property.ownership ?? "On request"],
                  [
                    "Permit status",
                    property.permitNumber === "Demo inventory"
                      ? "Demo — verify before publishing"
                      : property.permitNumber ?? "Pending verification",
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 rounded-2xl bg-[#f8faff] px-4 py-3"
                  >
                    <p className="text-[9px] text-muted-foreground">{label}</p>
                    <p className="text-right text-[10px] font-semibold">{value}</p>
                  </div>
                ))}
              </div>
            </section>

            {property.amenities && property.amenities.length > 0 && (
              <section className="mt-6">
                <h2 className="text-xl font-semibold tracking-[-0.035em]">
                  Lifestyle amenities
                </h2>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {property.amenities.map((amenity, index) => {
                    const icons = [House, Building2, Sparkles, ShieldCheck];
                    const Icon = icons[index % icons.length];
                    return (
                      <div
                        key={amenity}
                        className="rounded-2xl border border-white/80 bg-white/68 p-4 text-center shadow-sm backdrop-blur-xl"
                      >
                        <Icon className="mx-auto size-4 text-primary" />
                        <p className="mt-2 text-[9px] font-semibold">{amenity}</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {(property.brochure || property.floorPlan) && (
              <section className="mt-6">
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-primary">
                  Property documents
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em]">
                  View the official details
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {property.brochure && (
                    <div className="rounded-[24px] border border-white/80 bg-white/78 p-4 shadow-[0_16px_42px_rgba(50,82,145,.08)] backdrop-blur-xl">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-primary/[0.08] text-primary">
                        <FileText className="size-4" />
                      </span>
                      <p className="mt-4 text-[9px] uppercase tracking-[0.13em] text-muted-foreground">
                        Developer brochure
                      </p>
                      <p className="mt-1 truncate text-sm font-semibold">
                        {property.brochure.name}
                      </p>
                      <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
                        The developer&rsquo;s own document, exactly as published.
                      </p>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <Button asChild variant="outline" className="rounded-xl">
                          <a
                            href={brochureUrl ?? property.brochure.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink />
                            View
                          </a>
                        </Button>
                        <Button asChild className="rounded-xl">
                          <a href={brochureUrl ?? property.brochure.url} download>
                            <FileDown />
                            Download
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}

                  {property.floorPlan && (
                    <div className="rounded-[24px] border border-white/80 bg-white/78 p-4 shadow-[0_16px_42px_rgba(50,82,145,.08)] backdrop-blur-xl">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-[#fff6e7] text-[#b77918]">
                        <FileText className="size-4" />
                      </span>
                      <p className="mt-4 text-[9px] uppercase tracking-[0.13em] text-muted-foreground">
                        Floor plan
                      </p>
                      <p className="mt-1 truncate text-sm font-semibold">
                        {property.floorPlan.name}
                      </p>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <Button asChild variant="outline" className="rounded-xl">
                          <a
                            href={floorPlanUrl ?? property.floorPlan.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink />
                            View PDF
                          </a>
                        </Button>
                        <Button asChild className="rounded-xl">
                          <a href={floorPlanUrl ?? property.floorPlan.url} download>
                            <FileDown />
                            Download
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-[94px] overflow-hidden rounded-[30px] border border-white/80 bg-white/86 shadow-[0_26px_70px_rgba(74,62,40,.15)] backdrop-blur-2xl">
              <div className="sunrise-surface p-5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-primary">
                  {property.priceQualifier ?? (isRental ? "Annual rent" : "Guide price")}
                </p>
                <h2 className="mt-1.5 text-3xl font-semibold tracking-[-0.045em]">
                  {formatPriceLabel(property.price)}
                </h2>
                <p className="mt-2 text-[10px] leading-5 text-muted-foreground">
                  Live inventory, unit options and incentives change quickly.
                  {advisorName} will confirm the strongest current option directly.
                </p>
              </div>
              <div className="p-5">
                <Button
                  asChild
                  className="h-14 w-full rounded-2xl bg-[linear-gradient(135deg,#4280ff,#174ed6)] text-sm shadow-[0_16px_36px_rgba(184,134,47,.3)] hover:-translate-y-0.5"
                >
                  <a href={whatsappUrl} target="_blank" rel="noreferrer">
                    <MessageCircleMore className="size-5" />
                    Get best offer
                    <ArrowRight className="ml-auto size-4" />
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="mt-2.5 h-12 w-full rounded-2xl bg-white text-[11px]"
                >
                  <a href={siteVisitUrl} target="_blank" rel="noreferrer">
                    <CalendarDays className="size-4" />
                    {isRental ? "Book a viewing" : "Book a site visit"}
                  </a>
                </Button>
                {dossierUrl && (
                  <Button
                    asChild
                    className="mt-2.5 h-12 w-full rounded-2xl border border-[#e0862c]/30 bg-[linear-gradient(135deg,#fff3e2,#fff9ef)] text-[11px] font-semibold text-[#a3641b] shadow-sm hover:-translate-y-0.5 hover:bg-[linear-gradient(135deg,#ffe9cc,#fff3e2)]"
                  >
                    <a href={dossierUrl} target="_blank" rel="noreferrer">
                      <FileDown className="size-4" />
                      Download listing details (PDF)
                    </a>
                  </Button>
                )}
                <div className="my-5 h-px bg-border" />
                <div className="flex items-center gap-3">
                  {property.assignedAgentAvatarUrl || advisorName === "Rahul" ? (
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-md">
                      <Image
                        src={property.assignedAgentAvatarUrl ?? "/rahul-profile.png"}
                        alt={advisorName}
                        fill
                        sizes="56px"
                        className="object-cover object-top"
                      />
                    </div>
                  ) : (
                    <span className="flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-white bg-primary/[0.08] text-sm font-semibold text-primary shadow-md">
                      {advisorName
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{advisorName}</p>
                    <p className="mt-0.5 text-[9px] text-muted-foreground">
                      Dubai Property Advisor
                    </p>
                    <p className="mt-1 text-[9px] font-medium text-primary">
                      {advisorWhatsapp}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button asChild variant="outline" className="rounded-xl">
                    <a href={whatsappUrl} target="_blank" rel="noreferrer">
                      <Phone />
                      WhatsApp
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="rounded-xl">
                    <a
                      href={AGENT_INSTAGRAM_URL}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Camera />
                      Instagram
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {priceContext && (
          <MarketPriceCard
            slug={property.slug}
            title={property.title}
            context={priceContext}
            isRental={isRental}
            price={formatPriceLabel(property.price)}
            originalPrice={property.originalPrice}
          />
        )}

        <section
          id="register-interest"
          className="mx-4 mt-8 scroll-mt-24 overflow-hidden rounded-[28px] border border-white/80 bg-white/86 p-5 shadow-[0_20px_58px_rgba(74,62,40,.12)] backdrop-blur-2xl sm:mx-0 sm:p-7"
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-primary">
                Register your interest
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.045em]">
                Prefer not to message right now?
              </h2>
              <p className="mt-2 text-[10px] leading-5 text-muted-foreground">
                Leave your details and {advisorName} will send current
                availability, the latest pricing and the full payment plan for{" "}
                {property.title} — usually within a few hours.
              </p>
              <ul className="mt-4 space-y-2">
                {[
                  "Unit options and floor plans",
                  isRental ? "Available move-in dates" : "Current developer incentives",
                  "No obligation, no spam",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-[10px] font-medium"
                  >
                    <ShieldCheck className="size-3.5 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <LeadCaptureForm
              propertyId={property.id}
              propertyTitle={property.title}
              rental={isRental}
              source="listing"
            />
          </div>
        </section>

        <PropertyComparison
          property={property}
          candidates={[...developerProperties, ...similarProperties]}
        />

        {developerProperties.length > 0 && (
          <PropertyRail
            title={`More from ${property.developer}`}
            eyebrow="Developer collection"
            properties={developerProperties}
          />
        )}

        {similarProperties.length > 0 && (
          <PropertyRail
            title="Similar Dubai properties"
            eyebrow="Continue exploring"
            properties={similarProperties}
          />
        )}

        <section className="mx-4 mt-8 overflow-hidden rounded-[28px] border border-primary/10 bg-[linear-gradient(135deg,#eaf4ff,#fff9ee)] p-5 shadow-[0_18px_50px_rgba(43,77,143,.1)] sm:mx-0 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-7">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-primary">
              Curated around your requirements
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.045em]">
              Discover Rahul&apos;s complete portfolio
            </h2>
            <p className="mt-2 max-w-xl text-[10px] leading-5 text-muted-foreground">
              Compare off-plan launches, ready homes and rental options across
              Dubai from one easy-to-browse collection.
            </p>
          </div>
          <Button asChild className="mt-5 h-12 w-full rounded-xl sm:mt-0 sm:w-auto">
            <Link href="/">
              Explore portfolio
              <ArrowRight />
            </Link>
          </Button>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/75 bg-white/88 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] shadow-[0_-18px_50px_rgba(42,73,133,.12)] backdrop-blur-2xl lg:hidden">
        <div className="mx-auto max-w-lg">
          <div className="mb-2 flex items-baseline justify-between px-1">
            <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {property.priceQualifier ?? (isRental ? "Annual rent" : "Guide price")}
            </p>
            <p className="text-base font-semibold tracking-[-0.03em]">
              {formatPriceLabel(property.price)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-13 shrink-0 rounded-2xl bg-white"
              onClick={() => void sharePage()}
              aria-label="Share property"
            >
              {copied ? <Copy className="text-emerald-600" /> : <Share2 />}
            </Button>
            <Button
              asChild
              variant="outline"
              size="icon"
              className="size-13 shrink-0 rounded-2xl bg-white"
              aria-label={isRental ? "Book a viewing" : "Book a site visit"}
            >
              <a href={siteVisitUrl} target="_blank" rel="noreferrer">
                <CalendarDays />
              </a>
            </Button>
            {documents.length > 0 && (
              // A bottom sheet rather than a dropdown: a dropdown anchored to
              // a control this close to the edge of a phone opens unreliably
              // on touch, and a sheet gives each document room for a line
              // saying what it is.
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    size="icon"
                    className="size-13 shrink-0 rounded-2xl border border-[#e0862c]/30 bg-[linear-gradient(135deg,#fff3e2,#fff9ef)] text-[#a3641b] shadow-sm hover:bg-[linear-gradient(135deg,#ffe9cc,#fff3e2)]"
                    aria-label="Download documents"
                  >
                    <FileDown />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-[28px] px-5 pb-8">
                  <SheetHeader className="px-0">
                    <SheetTitle className="text-lg tracking-[-0.03em]">
                      Download documents
                    </SheetTitle>
                    <SheetDescription className="text-[11px]">
                      {property.title}
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-1 grid gap-2.5">
                    {documents.map((document) => (
                      <a
                        key={document.label}
                        href={document.href}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/80 p-3.5 shadow-[0_10px_28px_rgba(50,82,145,.07)] active:scale-[0.99]"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#fff3e2] text-[#a3641b]">
                          <FileDown className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-semibold">
                            {document.label}
                          </span>
                          <span className="block text-[10px] text-muted-foreground">
                            {document.hint}
                          </span>
                        </span>
                        <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
                      </a>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            )}
            <Button
              asChild
              className="h-13 flex-1 rounded-2xl bg-[linear-gradient(135deg,#4280ff,#174ed6)] text-sm shadow-[0_14px_32px_rgba(184,134,47,.3)]"
            >
              <a href={whatsappUrl} target="_blank" rel="noreferrer">
                <MessageCircleMore className="size-5" />
                Get best offer
                <ExternalLink className="ml-auto size-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PropertyRail({
  title,
  eyebrow,
  properties,
}: {
  title: string;
  eyebrow: string;
  properties: Property[];
}) {
  return (
    <section className="mt-9 px-4 sm:px-0">
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-primary">
        {eyebrow}
      </p>
      <div className="mt-1 flex items-end justify-between gap-3">
        <h2 className="text-2xl font-semibold tracking-[-0.045em]">{title}</h2>
        <p className="shrink-0 text-[9px] text-muted-foreground">
          Swipe to compare
        </p>
      </div>
      <div className="hide-scrollbar -mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
        {properties.map((item) => (
          <Link
            key={item.id}
            href={`/listing/${encodeURIComponent(item.slug)}`}
            className="group w-[82vw] max-w-[340px] shrink-0 snap-start overflow-hidden rounded-[24px] border border-white/85 bg-white/84 shadow-[0_16px_44px_rgba(43,76,138,.1)] backdrop-blur-xl transition-transform hover:-translate-y-1"
          >
            <div className="relative aspect-[1.55/1] overflow-hidden">
              <Image
                src={item.images[0]}
                alt={item.title}
                fill
                sizes="340px"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.045]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_42%,rgba(12,29,60,.68))]" />
              <div className="absolute left-3 top-3 flex gap-1.5">
                <Badge className="border-white/60 bg-white/88 text-foreground backdrop-blur-xl">
                  {item.projectStage ?? getProjectCategory(item)}
                </Badge>
                <Badge className="border-white/35 bg-white/20 text-white backdrop-blur-xl">
                  {getProjectCategory(item)}
                </Badge>
              </div>
              <div className="absolute inset-x-4 bottom-4 text-white">
                <p className="truncate text-base font-semibold tracking-[-0.03em]">
                  {item.title}
                </p>
                <p className="mt-1 flex items-center gap-1 text-[9px] text-white/76">
                  <MapPin className="size-3" />
                  {item.community ?? item.location}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate text-[9px] text-muted-foreground">
                  {item.developer ?? "Private owner"}
                </p>
                <p className="mt-1 truncate text-[10px] font-semibold">
                  {formatLayoutLabel(item)} · {normalizeAreaInput(item.area)} ·{" "}
                  {item.handover ?? "On request"}
                </p>
              </div>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/[0.08] text-primary">
                <ArrowRight className="size-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
