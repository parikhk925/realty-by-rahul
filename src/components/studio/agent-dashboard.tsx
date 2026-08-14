"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  ExternalLink,
  FolderHeart,
  House,
  MapPin,
  MessageCircleMore,
  Phone,
  Plus,
  Send,
  ShieldCheck,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { usePropertyStore } from "@/hooks/use-property-store";
import {
  createPropertyPreviewUrl,
  getProjectCategory,
  ProjectCategory,
} from "@/lib/property-data";
import { cn } from "@/lib/utils";

const categories: ProjectCategory[] = ["Off-plan", "Secondary", "Rent"];

const reveal = {
  hidden: { opacity: 0, y: 16 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.055,
      duration: 0.46,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

const enquiries = [
  {
    id: "lead-aisha",
    name: "Aisha Al Mansoori",
    detail: "Interested in 2–3BR off-plan",
    time: "10m ago",
    status: "New",
    phone: "971501234567",
    phoneDisplay: "+971 50 123 4567",
    budget: "AED 2.5M–3.2M",
    location: "Dubai Creek Harbour",
    propertyType: "2–3 bedroom apartment",
    source: "Private collection link",
    timeline: [
      "Opened the Off-plan under AED 3M collection",
      "Viewed Bayview Residences twice",
      "Requested current availability",
    ],
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
  },
  {
    id: "lead-omar",
    name: "Omar Hassan",
    detail: "Asked about payment plans",
    time: "1h ago",
    status: "Replied",
    phone: "971552345678",
    phoneDisplay: "+971 55 234 5678",
    budget: "AED 4M–5M",
    location: "Dubai Harbour",
    propertyType: "3 bedroom waterfront apartment",
    source: "Shared property page",
    timeline: [
      "Viewed Bayview Residences",
      "Tapped Get best offer",
      "Asked for a 60/40 payment plan",
    ],
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
  },
  {
    id: "lead-eleanor",
    name: "Eleanor James",
    detail: "Requested a Marina viewing",
    time: "3h ago",
    status: "Visit set",
    phone: "971563456789",
    phoneDisplay: "+971 56 345 6789",
    budget: "AED 180K–220K yearly",
    location: "Dubai Marina",
    propertyType: "2 bedroom ready apartment",
    source: "Instagram",
    timeline: [
      "Opened the Dubai Marina collection",
      "Shortlisted two ready properties",
      "Requested a viewing for tomorrow",
    ],
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
  },
];

export function AgentDashboard({ demo }: { demo?: boolean }) {
  const { properties } = usePropertyStore();
  const [category, setCategory] = useState<ProjectCategory>("Off-plan");
  const [leadPanelOpen, setLeadPanelOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] =
    useState<(typeof enquiries)[number] | null>(null);
  const liveProperties = properties.filter((property) => property.status === "Live");
  const totalEnquiries = properties.reduce(
    (total, property) => total + property.enquiries,
    0,
  );
  const matchingProperties = properties.filter(
    (property) => getProjectCategory(property) === category,
  );
  const featuredProperty =
    matchingProperties.find((property) => property.featured) ??
    matchingProperties[0] ??
    properties[0];

  const metrics = [
    {
      label: "Active projects",
      value: liveProperties.length,
      icon: Building2,
    },
    {
      label: "Client enquiries",
      value: totalEnquiries,
      icon: UsersRound,
    },
    {
      label: "Collections shared",
      value: 7,
      icon: Send,
    },
  ];

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-6 sm:px-7 sm:py-8 lg:px-9">
      <motion.header
        variants={reveal}
        initial="hidden"
        animate="visible"
        custom={0}
      >
        <div className="flex items-center gap-2">
          <Badge className="border-0 bg-emerald-500/10 text-emerald-700 shadow-none hover:bg-emerald-500/10">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Portfolio live
          </Badge>
          {demo && (
            <Badge
              variant="outline"
              className="border-amber-300/60 bg-amber-50/70 text-amber-800"
            >
              Demo inventory
            </Badge>
          )}
        </div>
        <h1 className="mt-4 text-[28px] font-semibold tracking-[-0.045em] sm:text-4xl">
          Good morning, <span className="text-primary">Rahul</span>{" "}
          <span aria-hidden="true">👋</span>
        </h1>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          Let&apos;s grow your Dubai portfolio today.
        </p>
      </motion.header>

      <motion.section
        variants={reveal}
        initial="hidden"
        animate="visible"
        custom={1}
        className="sunrise-surface relative mt-6 min-h-[250px] overflow-hidden rounded-[30px] border border-white/80 shadow-[0_24px_75px_rgba(45,89,172,.12)] sm:min-h-[310px]"
      >
        <Image
          src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1800&q=88"
          alt="Dubai skyline"
          fill
          sizes="(max-width: 1024px) 100vw, 950px"
          className="object-cover object-[72%_center] opacity-[0.86]"
          priority
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,.96)_0%,rgba(255,255,255,.83)_42%,rgba(255,255,255,.22)_78%,rgba(255,255,255,.04)_100%)]" />
        <div className="relative flex min-h-[250px] max-w-[540px] flex-col justify-center p-6 sm:min-h-[310px] sm:p-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b18134]">
            Dubai Sunrise collection
          </p>
          <h2 className="mt-3 text-4xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-6xl">
            Your Dubai
            <span className="block text-primary">Portfolio</span>
          </h2>
          <p className="mt-4 max-w-[300px] text-xs leading-5 text-muted-foreground sm:text-sm">
            Manage projects, curated collections and buyer conversations in one
            calm workspace.
          </p>
          <Button
            asChild
            className="mt-6 h-12 w-fit rounded-full bg-[linear-gradient(135deg,#4484ff,#1550d8)] px-6 shadow-[0_14px_34px_rgba(34,97,224,.28)] transition-all hover:-translate-y-0.5"
          >
            <Link href="/listings">
              Explore portfolio
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </motion.section>

      <motion.section
        variants={reveal}
        initial="hidden"
        animate="visible"
        custom={2}
        className="glass-panel mt-4 grid grid-cols-3 overflow-hidden rounded-[26px]"
      >
        {metrics.map((metric, index) => (
          <div
            key={metric.label}
            className={cn(
              "relative flex min-h-[114px] flex-col items-center justify-center px-2 text-center sm:min-h-[128px]",
              index > 0 &&
                "before:absolute before:inset-y-6 before:left-0 before:w-px before:bg-border/80",
            )}
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/[0.07] text-primary sm:size-10">
              <metric.icon className="size-4" />
            </span>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
              {metric.value}
            </p>
            <p className="mt-0.5 text-[9px] text-muted-foreground sm:text-[11px]">
              {metric.label}
            </p>
          </div>
        ))}
      </motion.section>

      <motion.div
        variants={reveal}
        initial="hidden"
        animate="visible"
        custom={3}
        className="mt-5"
      >
        <div
          className="grid grid-cols-3 rounded-[22px] border bg-white/55 p-1.5 shadow-[0_12px_40px_rgba(54,89,150,.06)] backdrop-blur-xl"
          role="tablist"
          aria-label="Project category"
        >
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={category === item}
              onClick={() => setCategory(item)}
              className={cn(
                "relative h-11 rounded-[17px] text-[11px] font-semibold text-muted-foreground transition-colors sm:text-sm",
                category === item && "text-primary",
              )}
            >
              {category === item && (
                <motion.span
                  layoutId="dashboard-category"
                  className="absolute inset-0 rounded-[17px] border border-primary/20 bg-[linear-gradient(135deg,rgba(222,239,255,.9),rgba(255,255,255,.94))] shadow-[0_8px_24px_rgba(43,106,230,.13)]"
                />
              )}
              <span className="relative">{item}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {[
            {
              label: "Add project",
              icon: Plus,
              href: "/listings?new=1",
            },
            {
              label: "Create collection",
              icon: FolderHeart,
              href: "/collections",
            },
            {
              label: "Share portfolio",
              icon: Send,
              href: "/collections",
            },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="glass-panel group flex min-h-[82px] flex-col items-center justify-center gap-2 rounded-2xl px-2 text-center text-[9px] font-semibold transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:text-primary hover:shadow-[0_18px_45px_rgba(43,98,200,.14)] sm:min-h-[94px] sm:flex-row sm:text-xs"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/[0.07] text-primary transition-transform group-hover:scale-110">
                <action.icon className="size-4" />
              </span>
              {action.label}
            </Link>
          ))}
        </div>
      </motion.div>

      {featuredProperty && (
        <motion.section
          key={featuredProperty.id}
          variants={reveal}
          initial="hidden"
          animate="visible"
          custom={4}
          className="mt-5 overflow-hidden rounded-[28px] border border-white/80 bg-white/80 shadow-[0_22px_60px_rgba(51,86,151,.12)] backdrop-blur-xl"
        >
          <Link
            href={createPropertyPreviewUrl(featuredProperty, "")}
            className="group block"
          >
            <div className="relative aspect-[1.6/1] min-h-[220px] overflow-hidden sm:aspect-[2.55/1]">
              <Image
                src={featuredProperty.images[0]}
                alt={featuredProperty.title}
                fill
                sizes="(max-width: 1024px) 100vw, 950px"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.035]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(20,36,70,.58),rgba(20,36,70,.04)_70%)]" />
              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                <Badge className="border-white/55 bg-white/88 text-[#9a6c23] shadow-sm backdrop-blur-md hover:bg-white">
                  ✦ Featured
                </Badge>
                <Badge className="border-white/40 bg-white/20 text-white backdrop-blur-md hover:bg-white/25">
                  {featuredProperty.projectStage ?? category}
                </Badge>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
                <h2 className="text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
                  {featuredProperty.title}
                </h2>
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-white/80">
                  <MapPin className="size-3.5" />
                  {featuredProperty.location}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1 px-3 py-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:px-5">
              {[
                {
                  label: category === "Rent" ? "Availability" : "Handover",
                  value: featuredProperty.handover ?? "Ready",
                  icon: CalendarDays,
                },
                {
                  label: category === "Rent" ? "Terms" : "Payment plan",
                  value: featuredProperty.paymentPlan ?? "On request",
                  icon: MessageCircleMore,
                },
                {
                  label: "From",
                  value: featuredProperty.price,
                  icon: Building2,
                },
              ].map((detail, index) => (
                <div
                  key={detail.label}
                  className={cn(
                    "flex min-w-0 items-center gap-2 px-2 py-1 sm:px-3",
                    index > 0 && "border-l",
                  )}
                >
                  <span className="hidden size-8 shrink-0 items-center justify-center rounded-xl bg-primary/[0.07] text-primary sm:flex">
                    <detail.icon className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[8px] text-muted-foreground sm:text-[9px]">
                      {detail.label}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] font-semibold sm:text-xs">
                      {detail.value}
                    </p>
                  </div>
                </div>
              ))}
              <span className="col-span-3 mt-2 flex h-10 items-center justify-center gap-2 rounded-xl bg-primary/[0.07] text-[10px] font-semibold text-primary transition-colors group-hover:bg-primary group-hover:text-white sm:col-span-1 sm:mt-0 sm:px-4">
                View details
                <ArrowRight className="size-3.5" />
              </span>
            </div>
          </Link>
        </motion.section>
      )}

      <motion.section
        variants={reveal}
        initial="hidden"
        animate="visible"
        custom={5}
        className="mt-7"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.03em]">
              Recent enquiries
            </h2>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Buyer activity across your shared portfolio
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary"
            onClick={() => {
              setSelectedEnquiry(null);
              setLeadPanelOpen(true);
            }}
          >
            View all <ArrowRight />
          </Button>
        </div>
        <div className="mt-3 space-y-2.5">
          {enquiries.map((enquiry) => (
            <button
              key={enquiry.id}
              type="button"
              onClick={() => {
                setSelectedEnquiry(enquiry);
                setLeadPanelOpen(true);
              }}
              aria-label={`Open enquiry from ${enquiry.name}`}
              className="glass-panel group flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/15 hover:shadow-[0_15px_38px_rgba(47,91,180,.12)]"
            >
              <div className="relative size-11 shrink-0 overflow-hidden rounded-full">
                <Image
                  src={enquiry.avatar}
                  alt=""
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">{enquiry.name}</p>
                <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                  {enquiry.detail}
                </p>
              </div>
              <div className="hidden items-center gap-1 text-[9px] text-muted-foreground sm:flex">
                <Clock3 className="size-3" />
                {enquiry.time}
              </div>
              <Badge
                className={cn(
                  "border-0 shadow-none",
                  enquiry.status === "New"
                    ? "bg-primary/10 text-primary"
                    : enquiry.status === "Visit set"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-700",
                )}
              >
                {enquiry.status}
              </Badge>
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
            </button>
          ))}
        </div>
      </motion.section>

      <motion.section
        variants={reveal}
        initial="hidden"
        animate="visible"
        custom={6}
        className="mt-5 grid gap-3 sm:grid-cols-3"
      >
        {[
          {
            icon: ShieldCheck,
            title: "DLD-ready records",
            body: "Keep permit references attached to every project.",
          },
          {
            icon: CheckCircle2,
            title: "Verified presentation",
            body: "Use trust badges only after your own compliance check.",
          },
          {
            icon: MessageCircleMore,
            title: "Direct WhatsApp",
            body: "Best-price enquiries route to Rahul automatically.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-white/75 bg-white/58 p-4 backdrop-blur-xl"
          >
            <item.icon className="size-4 text-primary" />
            <p className="mt-3 text-xs font-semibold">{item.title}</p>
            <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
              {item.body}
            </p>
          </div>
        ))}
      </motion.section>

      <Sheet
        open={leadPanelOpen}
        onOpenChange={(open) => {
          setLeadPanelOpen(open);
          if (!open) setSelectedEnquiry(null);
        }}
      >
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-full max-w-none gap-0 border-0 bg-[#fbfcff] p-0 data-[side=right]:w-full sm:max-w-[460px] sm:border-l"
        >
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 border-b bg-white/94 px-4 pt-[max(14px,env(safe-area-inset-top))] pb-4 backdrop-blur-xl sm:px-5 sm:pt-5">
              <div className="flex min-h-11 items-center gap-2 pr-12">
                {selectedEnquiry && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="-ml-2 rounded-full"
                    aria-label="Back to all enquiries"
                    onClick={() => setSelectedEnquiry(null)}
                  >
                    <ChevronLeft className="size-5" />
                  </Button>
                )}
                <div>
                  <SheetTitle>
                    {selectedEnquiry ? "Enquiry details" : "All enquiries"}
                  </SheetTitle>
                  <SheetDescription className="mt-1 text-xs">
                    {selectedEnquiry
                      ? "Buyer context and next best actions"
                      : "Recent activity across your shared portfolio"}
                  </SheetDescription>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close enquiries"
                onClick={() => {
                  setLeadPanelOpen(false);
                  setSelectedEnquiry(null);
                }}
                className="absolute top-[max(10px,env(safe-area-inset-top))] right-3 size-11 rounded-full border bg-white shadow-sm sm:top-4"
              >
                <X className="size-5" />
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 [-webkit-overflow-scrolling:touch] sm:px-5">
              {selectedEnquiry ? (
                <div>
                  <div className="rounded-[24px] border bg-white p-4 shadow-[0_18px_45px_rgba(37,67,125,.08)]">
                    <div className="flex items-center gap-3">
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-full ring-4 ring-primary/[0.07]">
                        <Image
                          src={selectedEnquiry.avatar}
                          alt={selectedEnquiry.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-semibold">
                          {selectedEnquiry.name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {selectedEnquiry.phoneDisplay}
                        </p>
                      </div>
                      <Badge
                        className={cn(
                          "border-0 shadow-none",
                          selectedEnquiry.status === "New"
                            ? "bg-primary/10 text-primary"
                            : selectedEnquiry.status === "Visit set"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-700",
                        )}
                      >
                        {selectedEnquiry.status}
                      </Badge>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Button asChild className="h-11">
                        <a
                          href={`https://wa.me/${selectedEnquiry.phone}?text=${encodeURIComponent(
                            `Hi ${selectedEnquiry.name.split(" ")[0]}, Rahul here. I’m following up on your Dubai property enquiry.`,
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MessageCircleMore />
                          WhatsApp
                        </a>
                      </Button>
                      <Button asChild variant="outline" className="h-11">
                        <a href={`tel:+${selectedEnquiry.phone}`}>
                          <Phone />
                          Call lead
                        </a>
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-[22px] border bg-white">
                    {[
                      {
                        icon: WalletCards,
                        label: "Budget",
                        value: selectedEnquiry.budget,
                      },
                      {
                        icon: MapPin,
                        label: "Preferred area",
                        value: selectedEnquiry.location,
                      },
                      {
                        icon: House,
                        label: "Looking for",
                        value: selectedEnquiry.propertyType,
                      },
                      {
                        icon: ExternalLink,
                        label: "Lead source",
                        value: selectedEnquiry.source,
                      },
                    ].map((item, index) => (
                      <div
                        key={item.label}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3.5",
                          index > 0 && "border-t",
                        )}
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/[0.07] text-primary">
                          <item.icon className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                            {item.label}
                          </p>
                          <p className="mt-1 text-xs font-semibold">
                            {item.value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-[22px] border bg-white p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Activity timeline</h3>
                      <span className="text-[10px] text-muted-foreground">
                        {selectedEnquiry.time}
                      </span>
                    </div>
                    <div className="mt-4 space-y-0">
                      {selectedEnquiry.timeline.map((event, index) => (
                        <div key={event} className="relative flex gap-3 pb-4 last:pb-0">
                          {index < selectedEnquiry.timeline.length - 1 && (
                            <span className="absolute top-3 bottom-0 left-[5px] w-px bg-border" />
                          )}
                          <span className="relative mt-1.5 size-[11px] shrink-0 rounded-full border-2 border-white bg-primary shadow-[0_0_0_2px_rgba(57,119,255,.12)]" />
                          <p className="text-xs leading-5 text-muted-foreground">
                            {event}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button asChild variant="outline" className="mt-4 h-12 w-full">
                    <a
                      href={`https://wa.me/${selectedEnquiry.phone}?text=${encodeURIComponent(
                        `Hi ${selectedEnquiry.name.split(" ")[0]}, shall I arrange a convenient property viewing for you?`,
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <CalendarDays />
                      Schedule a viewing
                    </a>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {enquiries.map((enquiry) => (
                    <button
                      key={enquiry.id}
                      type="button"
                      onClick={() => setSelectedEnquiry(enquiry)}
                      className="flex w-full items-center gap-3 rounded-[20px] border bg-white p-3 text-left shadow-[0_12px_32px_rgba(37,67,125,.06)] transition hover:-translate-y-0.5 hover:border-primary/20"
                    >
                      <div className="relative size-11 shrink-0 overflow-hidden rounded-full">
                        <Image
                          src={enquiry.avatar}
                          alt=""
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold">
                          {enquiry.name}
                        </p>
                        <p className="mt-1 truncate text-[10px] text-muted-foreground">
                          {enquiry.detail}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-muted-foreground">
                          {enquiry.time}
                        </p>
                        <ArrowRight className="mt-2 ml-auto size-4 text-primary" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
