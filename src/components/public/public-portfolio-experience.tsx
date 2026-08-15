"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BedDouble,
  Building2,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronDown,
  Compass,
  HandCoins,
  MapPin,
  MessageCircleMore,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  WalletCards,
} from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AGENT_WHATSAPP_LINK,
  AGENT_WHATSAPP_NUMBER,
  formatLayoutLabel,
  getProjectCategory,
  type ProjectCategory,
  type Property,
  type PropertyType,
  propertyTypes,
} from "@/lib/property-data";
import { cn } from "@/lib/utils";

interface PublicPortfolioExperienceProps {
  properties: Property[];
}

type BedroomFilter = "any" | "1" | "2" | "3" | "4-plus";

const categories: Array<"All" | ProjectCategory> = [
  "All",
  "Off-plan",
  "Secondary",
  "Rent",
];

const ease = [0.22, 1, 0.36, 1] as const;

function PropertyDeck({ properties }: { properties: Property[] }) {
  const reducedMotion = useReducedMotion();
  const primary = properties[0];
  const secondary = properties[1] ?? primary;

  if (!primary) return null;

  return (
    <div className="relative mx-auto h-[330px] w-full max-w-[390px] sm:h-[410px] sm:max-w-[470px] lg:h-[540px] lg:max-w-none">
      <div className="absolute left-1/2 top-[48%] h-[64%] w-[76%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/55 blur-3xl" />

      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0, x: 24, rotate: 8 }}
        animate={{ opacity: 1, x: 0, rotate: 6 }}
        transition={{ duration: 0.85, delay: 0.25, ease }}
        className="absolute right-[1%] top-[12%] h-[54%] w-[55%] overflow-hidden rounded-[28px] border border-white/75 bg-white/40 shadow-[0_28px_70px_rgba(24,74,133,.18)] [transform-origin:bottom_left] sm:rounded-[34px] lg:right-[3%] lg:top-[9%] lg:h-[59%]"
      >
        <Image
          src={secondary.images[0]}
          alt=""
          fill
          sizes="(max-width: 640px) 220px, 330px"
          className="object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-[linear-gradient(155deg,rgba(226,243,255,.04),rgba(26,84,142,.28))]" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 32, rotate: -5 }}
        animate={{ opacity: 1, y: reducedMotion ? 0 : [0, -7, 0], rotate: -4 }}
        transition={
          reducedMotion
            ? { duration: 0.8, delay: 0.1, ease }
            : {
                opacity: { duration: 0.8, delay: 0.1, ease },
                rotate: { duration: 0.8, delay: 0.1, ease },
                y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
              }
        }
        className="absolute left-[2%] top-[6%] z-10 h-[71%] w-[69%] overflow-hidden rounded-[30px] border border-white/80 bg-white/30 shadow-[0_35px_90px_rgba(72,60,38,.23)] backdrop-blur-sm sm:rounded-[38px] lg:left-[1%] lg:h-[74%]"
      >
        <Image
          src={primary.images[0]}
          alt={primary.title}
          fill
          priority
          sizes="(max-width: 640px) 270px, (max-width: 1024px) 330px, 430px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,42,75,.02)_35%,rgba(10,32,59,.68)_100%)]" />
        <div className="absolute inset-x-4 bottom-4 text-white sm:inset-x-5 sm:bottom-5">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/70">
            Featured residence
          </p>
          <p className="mt-1 text-lg font-semibold leading-tight tracking-[-0.04em] sm:text-2xl">
            {primary.title}
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-white/76 sm:text-xs">
            <MapPin className="size-3" />
            {primary.community ?? primary.location}
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.88, x: 16 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.48, ease }}
        className="absolute bottom-[5%] right-[2%] z-20 w-[61%] rounded-[22px] border border-white/85 bg-white/72 p-3 shadow-[0_22px_65px_rgba(70,58,37,.2)] backdrop-blur-2xl sm:bottom-[7%] sm:rounded-[26px] sm:p-4 lg:right-0"
      >
        <div className="flex items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#b8862f] text-white shadow-[0_8px_18px_rgba(184,134,47,.28)]">
            <Sparkles className="size-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-semibold text-[#17212e] sm:text-xs">
              Private shortlist
            </p>
            <p className="truncate text-[8px] text-[#6f6a5f] sm:text-[10px]">
              Matched to your requirements
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {["Verified", "Curated", "Direct"].map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/80 bg-white/65 px-1.5 py-1 text-center text-[7px] font-semibold text-[#5d5749] sm:text-[9px]"
            >
              {item}
            </span>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.65, ease }}
        className="absolute left-[1%] top-[69%] z-20 flex items-center gap-2 rounded-full border border-white/85 bg-white/72 py-2 pl-2 pr-3 shadow-[0_16px_45px_rgba(70,58,37,.16)] backdrop-blur-xl sm:top-[73%]"
      >
        <div className="relative size-8 overflow-hidden rounded-full ring-2 ring-white sm:size-10">
          <Image
            src="/rahul-profile.png"
            alt="Rahul"
            fill
            sizes="40px"
            className="object-cover object-top"
          />
        </div>
        <div>
          <p className="text-[8px] font-semibold text-[#17212e] sm:text-[10px]">
            Rahul
          </p>
          <p className="text-[7px] text-[#6f6a5f] sm:text-[9px]">
            Dubai property advisor
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function PortfolioPropertyCard({ property }: { property: Property }) {
  const category = getProjectCategory(property);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.45, ease }}
      className="portfolio-render group overflow-hidden rounded-[28px] border border-[#e9e1d3] bg-white shadow-[0_16px_50px_rgba(74,62,40,.08)] transition-[transform,box-shadow,border-color] duration-500 hover:-translate-y-2 hover:border-[#d6bf94] hover:shadow-[0_34px_84px_rgba(64,53,34,.22)] sm:rounded-[32px]"
    >
      <Link
        href={`/listing/${encodeURIComponent(property.slug)}`}
        className="block focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#c9a227]/20"
        aria-label={`Open ${property.title}`}
      >
        <div className="relative aspect-[1.23/1] min-h-[250px] overflow-hidden sm:aspect-[1.3/1]">
          <Image
            src={property.images[0]}
            alt={property.title}
            fill
            sizes="(max-width: 767px) 100vw, (max-width: 1180px) 50vw, 390px"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.045]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,37,66,.02),transparent_45%,rgba(9,30,54,.74))]" />
          <div className="absolute inset-x-3 top-3 flex flex-wrap gap-1.5">
            <Badge className="border-white/45 bg-white/78 text-[#1b2634] shadow-sm backdrop-blur-xl hover:bg-white/90">
              {category}
            </Badge>
            <Badge
              className={cn(
                "border-white/45 text-white shadow-sm backdrop-blur-xl",
                property.commissionCovered
                  ? "bg-emerald-600/82"
                  : "bg-[#1b2634]/72",
              )}
            >
              <HandCoins className="size-3" />
              {property.commissionCovered ? "Covered" : "Not covered"}
            </Badge>
            {property.postHandoverPaymentPlan && (
              <Badge className="border-white/60 bg-white/88 text-[#1b2634] shadow-sm backdrop-blur-xl hover:bg-white">
                <CalendarClock className="size-3" />
                Post-handover plan
              </Badge>
            )}
            {property.reraVerified && (
              <Badge className="border-white/45 bg-[#eafff5]/88 text-[#6f7a2e] shadow-sm backdrop-blur-xl hover:bg-[#eafff5]">
                <ShieldCheck className="size-3" /> Verified
              </Badge>
            )}
          </div>
          <span className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full border border-white/60 bg-white/78 text-[#1b2634] shadow-sm backdrop-blur-xl transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105">
            <ArrowUpRight className="size-4" />
          </span>
          <div className="absolute inset-x-4 bottom-4 text-white">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/70">
              {property.developer ?? "Private owner"}
            </p>
            <h2 className="mt-1 line-clamp-2 text-[22px] font-semibold leading-[1.05] tracking-[-0.045em]">
              {property.title}
            </h2>
            <p className="mt-2 flex items-center gap-1.5 text-[10px] text-white/78">
              <MapPin className="size-3" />
              {property.community ?? property.location}
            </p>
          </div>
        </div>
      </Link>

      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-3 divide-x divide-[#dfebf4] rounded-[18px] bg-[#f6faff] py-3.5">
          {[
            {
              icon: BedDouble,
              label: "Layout",
              value: formatLayoutLabel(property),
            },
            {
              icon: CalendarDays,
              label: category === "Rent" ? "Available" : "Handover",
              value: property.handover ?? "On request",
            },
            {
              icon: WalletCards,
              label: category === "Rent" ? "Terms" : "Plan",
              value: property.paymentPlan ?? "On request",
            },
          ].map((detail) => (
            <div key={detail.label} className="min-w-0 px-2 text-center">
              <detail.icon className="mx-auto size-3.5 text-[#8f6420]" />
              <p className="mt-1.5 text-[8px] text-[#6b6559]">{detail.label}</p>
              <p className="mt-0.5 truncate text-[9px] font-semibold text-[#173650]">
                {detail.value}
              </p>
            </div>
          ))}
        </div>
        <Button
          asChild
          className="mt-4 h-12 w-full rounded-[15px] bg-[#17212e] px-4 text-white shadow-[0_12px_28px_rgba(23,33,46,.15)] hover:bg-[#2a3543]"
        >
          <Link href={`/listing/${encodeURIComponent(property.slug)}`}>
            Explore residence
            <ArrowRight className="ml-auto transition-transform group-hover/button:translate-x-1" />
          </Link>
        </Button>
      </div>
    </motion.article>
  );
}

export function PublicPortfolioExperience({
  properties,
}: PublicPortfolioExperienceProps) {
  const reducedMotion = useReducedMotion();
  const [category, setCategory] = useState<"All" | ProjectCategory>("All");
  const [query, setQuery] = useState("");
  const [bedrooms, setBedrooms] = useState<BedroomFilter>("any");
  const [propertyType, setPropertyType] = useState<"any" | PropertyType>("any");
  const [community, setCommunity] = useState("any");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const liveProperties = useMemo(
    () => properties.filter((property) => property.status === "Live"),
    [properties],
  );

  const communities = useMemo(
    () =>
      Array.from(
        new Set(
          liveProperties.map(
            (property) => property.community ?? property.location,
          ),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    [liveProperties],
  );

  const visibleProperties = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return liveProperties.filter((property) => {
      const searchTarget =
        `${property.title} ${property.location} ${property.community ?? ""} ${property.developer ?? ""}`.toLowerCase();
      const bedroomsMatch =
        bedrooms === "any" ||
        (bedrooms === "4-plus"
          ? property.bedrooms >= 4
          : property.bedrooms === Number(bedrooms));
      return (
        (category === "All" || getProjectCategory(property) === category) &&
        (community === "any" ||
          (property.community ?? property.location) === community) &&
        (propertyType === "any" || property.type === propertyType) &&
        bedroomsMatch &&
        searchTarget.includes(normalizedQuery)
      );
    });
  }, [bedrooms, category, community, liveProperties, propertyType, query]);

  const activeFilters = [community, bedrooms, propertyType].filter(
    (value) => value !== "any",
  ).length;
  const whatsappUrl = AGENT_WHATSAPP_NUMBER
    ? `https://wa.me/${AGENT_WHATSAPP_NUMBER}?text=${encodeURIComponent(
        "Hi Rahul, I am exploring your Dubai property portfolio. Please help me shortlist the best options.",
      )}`
    : AGENT_WHATSAPP_LINK;

  const scrollToPortfolio = () => {
    document
      .getElementById("portfolio")
      ?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-[#faf7f2] pb-28 text-[#17212e] sm:pb-0">
      <header className="absolute inset-x-0 top-0 z-50">
        <div className="mx-auto flex h-[76px] max-w-[1320px] items-center gap-3 px-5 sm:h-[86px] sm:px-8 lg:px-12">
          <BrandMark className="min-w-0 flex-1 text-white" />
          <nav className="hidden items-center gap-7 text-xs font-medium text-white/65 md:flex">
            <button type="button" onClick={scrollToPortfolio} className="transition-colors hover:text-white">
              Portfolio
            </button>
            <a href="#advisory" className="transition-colors hover:text-white">
              Advisory
            </a>
          </nav>
          <Link
            href="/login"
            aria-label="Agent login"
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.07] text-white/70 shadow-[0_8px_28px_rgba(0,0,0,.2)] backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white/15 hover:text-white"
          >
            <UserRound className="size-4" />
          </Link>
          <Button
            asChild
            className="btn-gold hidden h-10 rounded-full px-5 font-semibold sm:inline-flex"
          >
            <a href={whatsappUrl} target="_blank" rel="noreferrer">
              Ask Rahul <ArrowUpRight />
            </a>
          </Button>
        </div>
      </header>

      <main>
        <section className="px-2.5 pt-2.5 sm:px-4 sm:pt-4">
          <div className="grain relative mx-auto min-h-[760px] max-w-[1480px] overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(ellipse_at_18%_12%,rgba(224,184,120,.20),transparent_46%),radial-gradient(ellipse_at_88%_78%,rgba(64,120,190,.26),transparent_44%),linear-gradient(155deg,#0d1e33_0%,#112a44_44%,#0a1626_100%)] px-5 pb-6 pt-[104px] shadow-[0_28px_100px_rgba(10,22,38,.45)] sm:min-h-[820px] sm:rounded-[38px] sm:px-8 sm:pb-10 sm:pt-[124px] lg:min-h-[780px] lg:px-12 lg:pt-[132px]">
            {/* Aurora: three slow, offset drifts so the ground is never static. */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -left-1/4 top-[-20%] size-[720px] rounded-full bg-[radial-gradient(circle,rgba(217,169,79,.22),transparent_62%)] blur-2xl"
              animate={reducedMotion ? undefined : { x: [0, 70, 0], y: [0, 45, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 19, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -right-1/4 top-[10%] size-[640px] rounded-full bg-[radial-gradient(circle,rgba(56,132,214,.26),transparent_62%)] blur-2xl"
              animate={reducedMotion ? undefined : { x: [0, -60, 0], y: [0, 60, 0], scale: [1, 1.14, 1] }}
              transition={{ duration: 23, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            />
            <motion.div
              aria-hidden
              className="pointer-events-none absolute bottom-[-18%] left-[28%] size-[560px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,.20),transparent_64%)] blur-2xl"
              animate={reducedMotion ? undefined : { x: [0, 45, 0], y: [0, -40, 0], scale: [1, 1.09, 1] }}
              transition={{ duration: 26, repeat: Infinity, ease: "easeInOut", delay: 3 }}
            />

            <div className="pointer-events-none absolute -left-20 top-[30%] size-60 rounded-full border border-white/10" />
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -right-32 top-14 size-[390px] rounded-full border border-[#e0b878]/20"
              animate={reducedMotion ? undefined : { rotate: 360 }}
              transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
            />
            <div className="pointer-events-none absolute -left-10 bottom-[12%] size-[280px] rounded-full border border-white/[0.07]" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(circle_at_50%_35%,black,transparent_72%)]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(180deg,transparent,rgba(247,251,254,.10))]" />

            <div className="relative mx-auto grid max-w-[1240px] items-center gap-5 lg:grid-cols-[.94fr_1.06fr] lg:gap-10">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease }}
                className="relative z-20 text-center lg:text-left"
              >
                <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#e0b878]/30 bg-white/[0.07] px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#e8cfa4] shadow-[0_10px_30px_rgba(0,0,0,.25)] backdrop-blur-xl lg:mx-0">
                  <Sparkles className="size-3 text-[#e0b878]" />
                  Gurgaon → Dubai · Since 2019
                </div>
                <h1 className="font-display mx-auto mt-5 max-w-[720px] text-[44px] font-semibold leading-[.96] text-white sm:mt-6 sm:text-[64px] lg:mx-0 lg:text-[78px] xl:text-[88px]">
                  {/* Each word rises out of its own mask, so the line assembles
                      itself instead of simply appearing. */}
                  {[
                    { word: "Dubai", gold: false },
                    { word: "property,", gold: false },
                    { word: "without", gold: true },
                    { word: "the", gold: true },
                    { word: "guesswork.", gold: true },
                  ].map(({ word, gold }, i) => (
                    // The word gap is a margin, not whitespace: whitespace
                    // inside an inline-block mask collapses and the line runs
                    // together.
                    <span
                      key={word}
                      className={cn(
                        "inline-block overflow-hidden pb-[.08em] align-bottom",
                        i < 4 && "mr-[0.24em]",
                      )}
                    >
                      <motion.span
                        className={cn(
                          "inline-block",
                          gold &&
                            "bg-[linear-gradient(120deg,#f0d6a8,#e0b878_60%,#c99a4e)] bg-clip-text text-transparent",
                        )}
                        initial={reducedMotion ? false : { y: "108%" }}
                        animate={{ y: 0 }}
                        transition={{ duration: 0.8, delay: 0.12 * i, ease }}
                      >
                        {word}
                      </motion.span>
                    </span>
                  ))}
                </h1>
                <p className="mx-auto mt-5 max-w-[540px] text-[12px] leading-6 text-white/65 sm:text-sm sm:leading-7 lg:mx-0 lg:max-w-[470px]">
                  I&apos;m Rahul Jakhar. I place off-plan launches, ready homes
                  and investment stock across Dubai—and I tell you when a unit
                  isn&apos;t worth your money.
                </p>

                <div className="mx-auto mt-6 max-w-[520px] rounded-[22px] border border-white/15 bg-white/[0.07] p-2 shadow-[0_18px_55px_rgba(0,0,0,.3)] backdrop-blur-2xl sm:flex sm:items-center sm:rounded-full lg:mx-0">
                  <button
                    type="button"
                    onClick={scrollToPortfolio}
                    className="flex h-12 w-full items-center gap-3 rounded-[16px] px-3 text-left transition-colors hover:bg-white/[0.06] sm:min-w-0 sm:flex-1 sm:rounded-full"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e0b878]/15 text-[#e0b878]">
                      <Search className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[9px] font-semibold uppercase tracking-[0.12em] text-white/45">
                        Start exploring
                      </span>
                      <span className="block truncate text-[11px] font-semibold text-white sm:text-xs">
                        Off-plan · Ready homes · Investments
                      </span>
                    </span>
                  </button>
                  <Button
                    type="button"
                    onClick={scrollToPortfolio}
                    className="btn-gold mt-1 h-12 w-full rounded-[16px] px-6 font-semibold sm:mt-0 sm:w-auto sm:rounded-full"
                  >
                    View portfolio <ArrowRight />
                  </Button>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[9px] font-medium text-white/55 lg:justify-start">
                  {["RERA-aware selection", "Direct WhatsApp access", "Honest on the downside"].map(
                    (item) => (
                      <span key={item} className="flex items-center gap-1.5">
                        <span className="flex size-4 items-center justify-center rounded-full bg-[#e0b878]/15 text-[#e0b878]">
                          <Check className="size-2.5" />
                        </span>
                        {item}
                      </span>
                    ),
                  )}
                </div>
              </motion.div>

              <PropertyDeck properties={liveProperties} />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1180px] px-5 py-8 sm:px-8 sm:py-12">
          <div className="grid grid-cols-3 divide-x divide-[#e9e1d3] overflow-hidden rounded-[24px] border border-[#e9e1d3] bg-white/70 shadow-[0_16px_50px_rgba(74,62,40,.07)] backdrop-blur-xl sm:rounded-[28px]">
            {[
              ["Private", "One-to-one guidance"],
              [String(liveProperties.length), "Curated opportunities"],
              ["Dubai", "Market focused"],
            ].map(([value, label]) => (
              <div key={label} className="px-2 py-5 text-center sm:py-7">
                <p className="font-display text-gold text-2xl font-semibold sm:text-4xl">
                  {value}
                </p>
                <p className="mt-1.5 text-[8px] uppercase tracking-[0.14em] text-[#6b6559] sm:text-[10px]">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="portfolio" className="scroll-mt-4 px-4 pb-16 sm:px-6 sm:pb-24">
          <div className="mx-auto max-w-[1180px]">
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#8f6420]">
                  Rahul&apos;s portfolio
                </p>
                <h2 className="font-display mt-2.5 max-w-[620px] text-[34px] font-semibold leading-[1.02] text-[#17212e] sm:text-[46px]">
                  A sharper way to find your place in Dubai.
                </h2>
              </div>
              <p className="max-w-[360px] text-[10px] leading-5 text-[#6b6559] sm:text-xs sm:leading-6">
                Filter a focused collection of launches, resale homes and
                rentals. Every detail page is built for fast, confident review.
              </p>
            </div>

            <div className="sticky top-2 z-40 mt-7 rounded-[24px] border border-[#e9e1d3]/90 bg-white/88 p-2.5 shadow-[0_18px_50px_rgba(74,62,40,.11)] backdrop-blur-2xl sm:top-3 sm:rounded-[28px] sm:p-3">
              <div className="grid grid-cols-4 rounded-[18px] bg-[#f5efe4] p-1">
                {categories.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCategory(item)}
                    className={cn(
                      "relative h-10 rounded-[14px] text-[9px] font-semibold text-[#536d83] transition-colors sm:text-xs",
                      category === item && "text-[#8f6420]",
                    )}
                  >
                    {category === item && (
                      <motion.span
                        layoutId="portfolio-category"
                        className="absolute inset-0 rounded-[14px] border border-[#d9e8f5] bg-white shadow-[0_5px_16px_rgba(37,78,119,.08)]"
                        transition={{ duration: 0.32, ease }}
                      />
                    )}
                    <span className="relative">{item}</span>
                  </button>
                ))}
              </div>
              <div className="mt-2.5 flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6b6559]" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="h-12 rounded-[16px] border-[#dfeaf3] bg-[#faf7f2] pl-9 text-xs shadow-none placeholder:text-[#8ca1b3] focus-visible:bg-white"
                    placeholder="Search Dubai"
                  />
                </div>
                <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-12 rounded-[16px] border-[#dfeaf3] bg-white px-3 text-[10px] text-[#36546d] sm:px-4 sm:text-xs",
                        activeFilters > 0 && "border-[#80b6ef] text-[#1766ca]",
                      )}
                    >
                      Filters
                      {activeFilters > 0 && (
                        <span className="flex size-5 items-center justify-center rounded-full bg-[#8f6420] text-[8px] text-white">
                          {activeFilters}
                        </span>
                      )}
                      <ChevronDown className="size-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    sideOffset={10}
                    className="w-[min(92vw,370px)] rounded-[24px] border-[#e9e1d3] p-4 shadow-[0_24px_75px_rgba(26,68,111,.18)]"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex size-9 items-center justify-center rounded-full bg-[#eaf4ff] text-[#8f6420]">
                        <Compass className="size-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-[#163650]">Refine your search</p>
                        <p className="mt-0.5 text-[9px] text-[#6b6559]">Find the right fit, not more noise.</p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3">
                      <Select value={community} onValueChange={setCommunity}>
                        <SelectTrigger className="h-11 w-full rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any community</SelectItem>
                          {communities.map((item) => (
                            <SelectItem key={item} value={item}>{item}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={bedrooms} onValueChange={(value) => setBedrooms(value as BedroomFilter)}>
                        <SelectTrigger className="h-11 w-full rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any bedrooms</SelectItem>
                          <SelectItem value="1">1 bedroom</SelectItem>
                          <SelectItem value="2">2 bedrooms</SelectItem>
                          <SelectItem value="3">3 bedrooms</SelectItem>
                          <SelectItem value="4-plus">4+ bedrooms</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={propertyType} onValueChange={(value) => setPropertyType(value as "any" | PropertyType)}>
                        <SelectTrigger className="h-11 w-full rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any property type</SelectItem>
                          {propertyTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="mt-4 h-11 w-full rounded-xl bg-[#17212e] text-white hover:bg-[#2a3543]" onClick={() => setFiltersOpen(false)}>
                      Show {visibleProperties.length} properties
                    </Button>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="mt-7 flex items-end justify-between">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#8f6420]">Curated selection</p>
                <h3 className="mt-1 text-2xl font-semibold tracking-[-0.045em] text-[#143650]">
                  {category === "All" ? "All opportunities" : category}
                </h3>
              </div>
              <span className="text-[9px] text-[#6b6559] sm:text-[10px]">
                {visibleProperties.length} result{visibleProperties.length === 1 ? "" : "s"}
              </span>
            </div>

            <section className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {visibleProperties.map((property) => (
                  <PortfolioPropertyCard key={property.id} property={property} />
                ))}
              </AnimatePresence>
            </section>

            {visibleProperties.length === 0 && (
              <div className="mt-5 flex min-h-[300px] flex-col items-center justify-center rounded-[30px] border border-dashed border-[#cbddea] bg-white/70 p-8 text-center">
                <Search className="size-6 text-[#8f6420]" />
                <h2 className="mt-4 text-base font-semibold text-[#163650]">No matching properties</h2>
                <p className="mt-1 text-[10px] text-[#6b6559]">Try another category or remove a filter.</p>
              </div>
            )}
          </div>
        </section>

        <section id="advisory" className="px-3 pb-5 sm:px-5 sm:pb-8">
          <div className="relative mx-auto max-w-[1240px] overflow-hidden rounded-[32px] bg-[linear-gradient(145deg,#e7f5ff,#f7fbff_52%,#fff1df)] p-5 shadow-[0_26px_80px_rgba(38,79,121,.11)] sm:rounded-[42px] sm:p-10 lg:p-14">
            <div className="absolute -right-24 -top-24 size-72 rounded-full border border-white/70" />
            <div className="relative grid gap-7 lg:grid-cols-[.82fr_1.18fr] lg:items-center">
              <div className="relative mx-auto h-[330px] w-full max-w-[390px] overflow-hidden rounded-[28px] border border-white/90 bg-white/40 shadow-[0_26px_70px_rgba(27,67,108,.15)] sm:h-[430px] sm:rounded-[36px]">
                <Image src="/rahul-profile.png" alt="Rahul, Dubai Property Advisor" fill sizes="(max-width: 640px) 100vw, 390px" className="object-cover object-top" />
                <div className="absolute inset-x-3 bottom-3 rounded-[20px] border border-white/70 bg-white/72 p-4 backdrop-blur-xl sm:inset-x-5 sm:bottom-5">
                  <p className="text-sm font-semibold text-[#1b2634]">Rahul</p>
                  <p className="mt-1 text-[9px] text-[#627f96]">Private Dubai property advisory</p>
                </div>
              </div>
              <div>
                <Badge className="border-white/80 bg-white/68 text-[#236ebf] backdrop-blur-xl hover:bg-white/80">
                  <MessageCircleMore className="size-3" /> One advisor, end to end
                </Badge>
                <h2 className="mt-5 text-[36px] font-semibold leading-[.98] tracking-[-0.06em] text-[#17212e] sm:text-5xl lg:text-6xl">
                  Property decisions feel better when they feel personal.
                </h2>
                <p className="mt-5 max-w-[570px] text-[11px] leading-6 text-[#58758d] sm:text-sm sm:leading-7">
                  Tell Rahul what matters—budget, lifestyle, return expectations or move-in timing. Receive a human shortlist, clear project context and help through every next step.
                </p>
                <div className="mt-6 grid gap-2 sm:grid-cols-3">
                  {[
                    [Building2, "Curated", "Relevant opportunities"],
                    [CalendarClock, "Responsive", "Fast private guidance"],
                    [ShieldCheck, "Considered", "Details before pressure"],
                  ].map(([Icon, title, copy]) => {
                    const AdvisoryIcon = Icon as typeof Building2;
                    return (
                      <div key={String(title)} className="rounded-[20px] border border-white/80 bg-white/58 p-4 backdrop-blur-xl">
                        <AdvisoryIcon className="size-4 text-[#8f6420]" />
                        <p className="mt-3 text-[10px] font-semibold text-[#173650]">{String(title)}</p>
                        <p className="mt-1 text-[8px] text-[#6b6559]">{String(copy)}</p>
                      </div>
                    );
                  })}
                </div>
                <Button asChild className="mt-6 h-13 w-full rounded-[17px] bg-[#17212e] px-5 text-white shadow-[0_15px_35px_rgba(23,33,46,.2)] hover:bg-[#2a3543] sm:w-auto sm:rounded-full sm:px-7">
                  <a href={whatsappUrl} target="_blank" rel="noreferrer">
                    Start a private conversation <ArrowUpRight className="ml-1" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <footer className="mx-auto flex max-w-[1180px] flex-col gap-4 px-5 py-9 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-12">
          <BrandMark />
          <p className="max-w-sm text-[9px] leading-5 text-[#6b6559] sm:text-right">
            Curated Dubai property opportunities with personal guidance from first conversation to final decision.
          </p>
        </footer>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/75 bg-white/88 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] shadow-[0_-18px_48px_rgba(38,70,131,.12)] backdrop-blur-2xl sm:hidden">
        <Button asChild className="mx-auto h-13 w-full max-w-lg rounded-[17px] bg-[#17212e] px-4 text-sm text-white shadow-[0_14px_30px_rgba(23,33,46,.2)] hover:bg-[#2a3543]">
          <a href={whatsappUrl} target="_blank" rel="noreferrer">
            <MessageCircleMore className="size-5" /> Ask Rahul to shortlist <ArrowRight className="ml-auto" />
          </a>
        </Button>
      </div>
    </div>
  );
}
