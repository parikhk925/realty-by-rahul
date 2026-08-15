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
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FolderHeart,
  Camera,
  MapPin,
  MessageCircleMore,
  Ruler,
  Share2,
  WalletCards,
} from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AGENT_INSTAGRAM_URL,
  createWhatsAppUrl,
  getProjectCategory,
  Property,
  PropertyCollection,
} from "@/lib/property-data";
import { cn } from "@/lib/utils";

interface PublicCollectionExperienceProps {
  collection: PropertyCollection;
  collectionProperties: Property[];
}

export function PublicCollectionExperience({
  collection,
  collectionProperties,
}: PublicCollectionExperienceProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeImage, setActiveImage] = useState(0);
  const activeProperty = collectionProperties[activeIndex];

  const changeProperty = (index: number) => {
    setActiveIndex(index);
    setActiveImage(0);
  };

  const moveProperty = (direction: -1 | 1) => {
    if (collectionProperties.length === 0) return;
    changeProperty(
      (activeIndex + direction + collectionProperties.length) %
        collectionProperties.length,
    );
  };

  const moveImage = (direction: -1 | 1) => {
    if (!activeProperty) return;
    setActiveImage(
      (activeImage + direction + activeProperty.images.length) %
        activeProperty.images.length,
    );
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent, info: PanInfo) => {
    if (info.offset.x < -45) moveImage(1);
    if (info.offset.x > 45) moveImage(-1);
  };

  const shareCollection = async () => {
    const shareData = {
      title: collection.name,
      text: collection.description,
      url: window.location.href,
    };
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }
    await navigator.clipboard.writeText(window.location.href);
  };

  if (!activeProperty) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfcff] p-6">
        <div className="max-w-md rounded-[28px] border bg-white p-7 text-center shadow-xl">
          <FolderHeart className="mx-auto size-8 text-primary" />
          <h1 className="mt-4 text-xl font-semibold">Collection unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ask Rahul to share a refreshed property selection.
          </p>
        </div>
      </main>
    );
  }

  const whatsappUrl = createWhatsAppUrl(activeProperty);
  const category = getProjectCategory(activeProperty);

  return (
    <div className="min-h-screen bg-[#fbfcff] pb-28 text-foreground">
      <header className="sticky top-0 z-50 border-b border-white/75 bg-white/84 backdrop-blur-2xl">
        <div className="mx-auto flex h-[70px] max-w-[1180px] items-center gap-3 px-4 sm:px-6">
          <Button
            asChild
            variant="outline"
            size="icon"
            className="rounded-full border-white bg-white shadow-sm"
          >
            <Link href="/" aria-label="Back to Realty by Rahul">
              <ArrowLeft />
            </Link>
          </Button>
          <BrandMark className="min-w-0 flex-1" />
          <Button
            variant="outline"
            size="icon"
            className="rounded-full border-white bg-white shadow-sm"
            onClick={() => void shareCollection()}
            aria-label="Share collection"
          >
            <Share2 />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6 sm:py-7">
        <section className="sunrise-surface relative overflow-hidden rounded-[30px] border border-white/80 p-5 shadow-[0_24px_70px_rgba(44,78,145,.12)] sm:p-8">
          <div className="pointer-events-none absolute -right-14 -top-14 size-52 rounded-full bg-sky-200/45 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 left-6 size-44 rounded-full bg-orange-200/35 blur-3xl" />
          <div className="relative">
            <Badge className="border-0 bg-white/80 text-primary shadow-sm backdrop-blur-xl hover:bg-white/80">
              <FolderHeart className="size-3" />
              Private selection for you
            </Badge>
            <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-5xl">
              {collection.name}
            </h1>
            <p className="mt-3 max-w-2xl text-[11px] leading-6 text-muted-foreground sm:text-sm">
              {collection.description}
            </p>
            <div className="mt-5 flex items-center gap-3">
              <div className="relative size-11 overflow-hidden rounded-full border-2 border-white shadow-md">
                <Image
                  src="/rahul-profile.png"
                  alt="Rahul"
                  fill
                  sizes="44px"
                  className="object-cover object-top"
                />
              </div>
              <div>
                <p className="text-[10px] font-semibold">Selected by Rahul</p>
                <p className="mt-0.5 text-[9px] text-muted-foreground">
                  Dubai Property Advisor · {collectionProperties.length} options
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Your property shortlist</p>
              <p className="mt-0.5 text-[9px] text-muted-foreground">
                Tap any card to switch instantly
              </p>
            </div>
            <span className="text-[10px] font-semibold text-primary">
              {activeIndex + 1} of {collectionProperties.length}
            </span>
          </div>
          <div className="-mx-4 mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-3 hide-scrollbar sm:-mx-0 sm:px-0">
            {collectionProperties.map((property, index) => (
              <button
                key={property.id}
                type="button"
                onClick={() => changeProperty(index)}
                className={cn(
                  "group flex w-[250px] shrink-0 snap-start items-center gap-3 rounded-2xl border bg-white/74 p-2.5 text-left shadow-[0_10px_28px_rgba(51,82,142,.07)] backdrop-blur-xl transition-all hover:-translate-y-0.5",
                  activeIndex === index &&
                    "border-primary/35 bg-primary/[0.045] ring-4 ring-primary/[0.055]",
                )}
              >
                <div className="relative size-16 shrink-0 overflow-hidden rounded-xl">
                  <Image
                    src={property.images[0]}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] font-semibold">
                    {property.title}
                  </p>
                  <p className="mt-1 truncate text-[9px] text-muted-foreground">
                    {property.location}
                  </p>
                  <Badge
                    variant="outline"
                    className="mt-2 border-primary/15 bg-white text-[8px] text-primary"
                  >
                    {getProjectCategory(property)}
                  </Badge>
                </div>
                {activeIndex === index && (
                  <Check className="size-4 shrink-0 text-primary" />
                )}
              </button>
            ))}
          </div>
        </section>

        <motion.section
          key={activeProperty.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-2 overflow-hidden rounded-[30px] border border-white/80 bg-white/80 shadow-[0_24px_70px_rgba(44,77,143,.13)] backdrop-blur-xl"
        >
          <div className="relative aspect-[4/3] min-h-[320px] overflow-hidden sm:aspect-[2.1/1] sm:min-h-[470px]">
            <motion.div
              key={`${activeProperty.id}-${activeImage}`}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.16}
              onDragEnd={handleDragEnd}
              initial={{ opacity: 0.55, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
            >
              <Image
                src={activeProperty.images[activeImage]}
                alt={`${activeProperty.title} photo ${activeImage + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 1120px"
                className="pointer-events-none object-cover"
                priority
              />
            </motion.div>
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(15,31,64,.03),transparent_45%,rgba(15,31,64,.68))]" />
            <div className="absolute left-4 top-4 flex gap-2">
              <Badge className="border-white/50 bg-white/88 text-primary shadow-sm backdrop-blur-md hover:bg-white">
                {category}
              </Badge>
              <Badge className="border-white/35 bg-white/22 text-white backdrop-blur-md hover:bg-white/25">
                {activeProperty.projectStage ?? "Available"}
              </Badge>
            </div>
            {activeProperty.images.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => moveImage(-1)}
                  className="absolute left-3 top-1/2 size-10 -translate-y-1/2 rounded-full border-white/45 bg-white/30 text-white backdrop-blur-xl hover:bg-white/55 hover:text-white"
                  aria-label="Previous photo"
                >
                  <ChevronLeft />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => moveImage(1)}
                  className="absolute right-3 top-1/2 size-10 -translate-y-1/2 rounded-full border-white/45 bg-white/30 text-white backdrop-blur-xl hover:bg-white/55 hover:text-white"
                  aria-label="Next photo"
                >
                  <ChevronRight />
                </Button>
              </>
            )}
            <div className="absolute inset-x-5 bottom-5 text-white sm:inset-x-7 sm:bottom-7">
              <p className="flex items-center gap-1.5 text-[10px] text-white/75">
                <MapPin className="size-3.5" />
                {activeProperty.location}
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] sm:text-5xl">
                {activeProperty.title}
              </h2>
              <div className="mt-4 flex gap-1.5">
                {activeProperty.images.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    className={cn(
                      "h-1.5 rounded-full bg-white/45 transition-all",
                      activeImage === index ? "w-7 bg-white" : "w-1.5",
                    )}
                    aria-label={`Show photo ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-7">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {
                  label: "Bedrooms",
                  value: `${activeProperty.bedrooms}`,
                  icon: BedDouble,
                },
                {
                  label: "Bathrooms",
                  value: `${activeProperty.bathrooms}`,
                  icon: Bath,
                },
                {
                  label: "Area",
                  value: activeProperty.area,
                  icon: Ruler,
                },
                {
                  label: category === "Rent" ? "Available" : "Handover",
                  value: activeProperty.handover ?? "Ready",
                  icon: CalendarDays,
                },
              ].map((fact) => (
                <div
                  key={fact.label}
                  className="rounded-2xl bg-[#f7f9fd] p-3.5"
                >
                  <fact.icon className="size-4 text-primary" />
                  <p className="mt-2 text-[8px] text-muted-foreground">
                    {fact.label}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] font-semibold">
                    {fact.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_320px]">
              <div>
                <p className="text-[11px] leading-6 text-muted-foreground sm:text-sm sm:leading-7">
                  {activeProperty.description}
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {activeProperty.highlights.slice(0, 4).map((highlight) => (
                    <div
                      key={highlight}
                      className="flex items-center gap-2 rounded-xl bg-primary/[0.045] p-3 text-[9px] font-medium"
                    >
                      <Check className="size-3.5 shrink-0 text-primary" />
                      {highlight}
                    </div>
                  ))}
                </div>
              </div>
              <div className="sunrise-surface rounded-2xl border border-white/80 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[9px] text-muted-foreground">
                      {category === "Rent" ? "Rental terms" : "Payment plan"}
                    </p>
                    <p className="mt-1 text-xl font-semibold tracking-[-0.04em]">
                      {activeProperty.paymentPlan ?? "On request"}
                    </p>
                  </div>
                  <WalletCards className="size-5 text-primary" />
                </div>
                <Button
                  asChild
                  className="mt-4 h-12 w-full rounded-xl bg-[linear-gradient(135deg,#4381ff,#174fd7)] shadow-[0_12px_28px_rgba(34,96,220,.25)]"
                >
                  <a href={whatsappUrl} target="_blank" rel="noreferrer">
                    <MessageCircleMore />
                    Get best offer
                    <ArrowRight className="ml-auto" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </motion.section>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-12 rounded-2xl bg-white"
            onClick={() => moveProperty(-1)}
          >
            <ChevronLeft />
            Previous option
          </Button>
          <Button
            variant="outline"
            className="h-12 rounded-2xl bg-white"
            onClick={() => moveProperty(1)}
          >
            Next option
            <ChevronRight />
          </Button>
        </div>

        <section className="sunrise-surface mt-6 rounded-[28px] border border-white/80 p-5 shadow-[0_18px_50px_rgba(47,80,145,.09)] sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-7">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-primary">
              Personal advisory
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em]">
              Want a side-by-side recommendation?
            </h2>
            <p className="mt-2 max-w-xl text-[10px] leading-5 text-muted-foreground">
              Message Rahul with your preferred properties and receive the
              latest availability, incentives and a clear recommendation.
            </p>
          </div>
          <div className="mt-4 flex gap-2 sm:mt-0 sm:shrink-0">
            <Button asChild variant="outline" className="rounded-xl bg-white/75">
              <a href={AGENT_INSTAGRAM_URL} target="_blank" rel="noreferrer">
                <Camera />
                Instagram
              </a>
            </Button>
            <Button asChild className="rounded-xl">
              <a href={whatsappUrl} target="_blank" rel="noreferrer">
                <MessageCircleMore />
                Ask Rahul
              </a>
            </Button>
          </div>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/75 bg-white/90 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] shadow-[0_-18px_50px_rgba(42,73,133,.12)] backdrop-blur-2xl">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[9px] text-muted-foreground">
              Selected property
            </p>
            <p className="truncate text-[11px] font-semibold">
              {activeProperty.title}
            </p>
          </div>
          <Button
            asChild
            className="h-12 rounded-2xl bg-[linear-gradient(135deg,#4381ff,#174fd7)] px-5 shadow-[0_14px_32px_rgba(184,134,47,.3)]"
          >
            <a href={whatsappUrl} target="_blank" rel="noreferrer">
              <MessageCircleMore />
              Get best offer
              <ExternalLink />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
