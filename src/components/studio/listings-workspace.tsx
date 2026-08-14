"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BedDouble,
  Building2,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Edit3,
  FileDown,
  HandCoins,
  Heart,
  ListFilter,
  Loader2,
  Map as MapIcon,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  ListingDraft,
  ListingEditorDialog,
} from "@/components/studio/listing-editor-dialog";
import { WhatsAppShareDialog } from "@/components/studio/whatsapp-share-dialog";
import { usePropertyStore } from "@/hooks/use-property-store";
import {
  formatPriceLabel,
  normalizeAreaInput,
  createPropertyPreviewUrl,
  formatLayoutLabel,
  getProjectCategory,
  normalizePropertyAvailability,
  ProjectCategory,
  Property,
  propertyTypes,
  PropertyType,
} from "@/lib/property-data";
import { cn } from "@/lib/utils";

type BudgetFilter = string;
type BedroomFilter = "any" | "1" | "2" | "3" | "4-plus";
type HandoverFilter = string;

const categories: ProjectCategory[] = ["Off-plan", "Secondary", "Rent"];
const communities = [
  "any",
  "Dubai Harbour",
  "Dubai Marina",
  "Dubai Creek Harbour",
  "Downtown Dubai",
  "Business Bay",
  "Dubailand",
  "Dubai South",
  "Jumeirah Park",
];

interface RangeOption {
  value: string;
  label: string;
  /** Bounds are in AED millions for sale, AED thousands per year for rent. */
  min: number;
  max: number | null;
}

const saleBudgetOptions: RangeOption[] = [
  { value: "under-1-5", label: "Under AED 1.5M", min: 0, max: 1.5 },
  { value: "1-5-3", label: "AED 1.5M–3M", min: 1.5, max: 3 },
  { value: "3-5", label: "AED 3M–5M", min: 3, max: 5 },
  { value: "5-plus", label: "AED 5M+", min: 5, max: null },
];

// Dubai annual rents sit two orders of magnitude below sale prices, so reusing
// the sale bands left three of the four options permanently empty.
const rentBudgetOptions: RangeOption[] = [
  { value: "under-100k", label: "Under AED 100k / year", min: 0, max: 100 },
  { value: "100k-200k", label: "AED 100k–200k / year", min: 100, max: 200 },
  { value: "200k-400k", label: "AED 200k–400k / year", min: 200, max: 400 },
  { value: "400k-plus", label: "AED 400k+ / year", min: 400, max: null },
];

function getBudgetOptions(category: ProjectCategory): RangeOption[] {
  return category === "Rent" ? rentBudgetOptions : saleBudgetOptions;
}

/** Off-plan is the only category with a future handover to filter on. */
function getHandoverOptions(category: ProjectCategory) {
  if (category !== "Off-plan") return [];
  const currentYear = new Date().getFullYear();
  return [
    { value: String(currentYear), label: String(currentYear) },
    { value: String(currentYear + 1), label: String(currentYear + 1) },
    { value: String(currentYear + 2), label: String(currentYear + 2) },
    { value: `${currentYear + 3}-plus`, label: `${currentYear + 3}+` },
  ];
}

/**
 * Prices are free text ("AED 1.59M", "AED 145K / year", "AED 950,000"), so
 * resolve them to plain AED before comparing rather than trusting a suffix.
 */
function priceInAed(price: string) {
  const value = Number.parseFloat(
    price.replace(/,/g, "").match(/[\d.]+/)?.[0] ?? "0",
  );
  if (!Number.isFinite(value)) return 0;
  if (/\dM\b/i.test(price.replace(/\s/g, ""))) return value * 1_000_000;
  if (/\dK\b/i.test(price.replace(/\s/g, ""))) return value * 1_000;
  return value;
}

function safeSlug(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 72) || `dubai-project-${Date.now()}`
  );
}

/**
 * The slug is the public URL and the published file name, so two projects
 * sharing a title and community would otherwise overwrite each other.
 */
function uniqueSlug(base: string, taken: string[]) {
  if (!taken.includes(base)) return base;
  let suffix = 2;
  while (taken.includes(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

function matchesBudget(
  property: Property,
  budget: BudgetFilter,
  category: ProjectCategory,
) {
  if (budget === "any") return true;
  const option = getBudgetOptions(category).find(
    (item) => item.value === budget,
  );
  if (!option) return true;
  const unit = category === "Rent" ? 1_000 : 1_000_000;
  const amount = priceInAed(property.price) / unit;
  return amount >= option.min && (option.max === null || amount < option.max);
}

function ProjectCard({
  property,
  selected,
  favourite,
  onSelect,
  onFavourite,
  onEdit,
  onDelete,
}: {
  property: Property;
  selected: boolean;
  favourite: boolean;
  onSelect: (selected: boolean) => void;
  onFavourite: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const category = getProjectCategory(property);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      whileHover={{ y: -4 }}
      className={cn(
        "group overflow-hidden rounded-[26px] border bg-white/82 shadow-[0_15px_42px_rgba(56,88,148,.09)] backdrop-blur-xl transition-shadow hover:shadow-[0_22px_58px_rgba(47,86,165,.15)]",
        selected && "border-primary/40 ring-4 ring-primary/[0.07]",
      )}
    >
      <div className="relative aspect-[1.5/1] min-h-[205px] overflow-hidden">
        <Image
          src={property.images[0]}
          alt={property.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 390px"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,29,65,.04),rgba(11,29,65,.46))]" />
        <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            <Badge className="border-white/35 bg-white/22 text-white backdrop-blur-md hover:bg-white/28">
              {category}
            </Badge>
            <Badge
              className={cn(
                "border-white/50 text-white shadow-sm backdrop-blur-md",
                property.commissionCovered ? "bg-emerald-500/80" : "bg-black/35",
              )}
            >
              <HandCoins className="size-3" />
              {property.commissionCovered ? "Covered" : "Not covered"}
            </Badge>
            {property.postHandoverPaymentPlan && (
              <Badge className="border-white/50 bg-white/88 text-foreground shadow-sm backdrop-blur-md hover:bg-white">
                <CalendarClock className="size-3" />
                Post-handover
              </Badge>
            )}
          </div>
          <button
            type="button"
            onClick={onFavourite}
            className="flex size-9 items-center justify-center rounded-full border border-white/55 bg-white/82 text-muted-foreground shadow-sm backdrop-blur-md transition-all hover:scale-105 hover:text-rose-500"
            aria-label={favourite ? "Remove from saved" : "Save property"}
          >
            <Heart
              className={cn(
                "size-4",
                favourite && "fill-rose-500 text-rose-500",
              )}
            />
          </button>
        </div>
        <label className="absolute bottom-3 right-3 flex cursor-pointer items-center gap-2 rounded-full border border-white/45 bg-white/86 px-3 py-2 text-[9px] font-semibold shadow-sm backdrop-blur-md">
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => onSelect(checked === true)}
            aria-label={`Select ${property.title}`}
          />
          Select
        </label>
        <div className="pointer-events-none absolute inset-x-4 bottom-4 pr-24 text-white">
          <h2 className="truncate text-xl font-semibold tracking-[-0.035em]">
            {property.title}
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-[10px] text-white/80">
            <MapPin className="size-3" />
            {property.location}
          </p>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[9px] text-muted-foreground">
              {property.priceQualifier}
            </p>
            <p className="mt-0.5 text-lg font-semibold tracking-[-0.03em]">
              {formatPriceLabel(property.price)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-muted-foreground">Developer</p>
            <p className="mt-0.5 max-w-[145px] truncate text-[10px] font-semibold">
              {property.developer ?? "Private owner"}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 divide-x rounded-2xl bg-[#f7f9fd] py-3">
          {[
            {
              icon: CalendarDays,
              label: category === "Rent" ? "Available" : "Handover",
              value: property.handover ?? "Ready",
            },
            {
              icon: CircleDollarSign,
              label: category === "Rent" ? "Terms" : "Plan",
              value: property.paymentPlan ?? "On request",
            },
            {
              icon: BedDouble,
              label: "Layout",
              value: `${formatLayoutLabel(property)} · ${normalizeAreaInput(property.area)}`,
            },
          ].map((detail) => (
            <div key={detail.label} className="min-w-0 px-2 text-center">
              <detail.icon className="mx-auto size-3.5 text-primary" />
              <p className="mt-1.5 text-[8px] text-muted-foreground">{detail.label}</p>
              <p className="mt-0.5 truncate text-[9px] font-semibold">
                {detail.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Button asChild className="h-10 flex-1 rounded-xl">
            <Link href={createPropertyPreviewUrl(property, "")}>
              View details
              <ArrowRight />
            </Link>
          </Button>
          <WhatsAppShareDialog property={property}>
            <Button
              variant="outline"
              size="icon"
              className="size-10 rounded-xl bg-white"
              aria-label={`Share ${property.title}`}
            >
              <Send />
            </Button>
          </WhatsAppShareDialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="size-10 rounded-xl bg-white"
                aria-label={`More actions for ${property.title}`}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit3 />
                Edit project
              </DropdownMenuItem>
              {property.brochure ? (
                <DropdownMenuItem asChild>
                  <a href={property.brochure.url} target="_blank" rel="noreferrer">
                    <FileDown />
                    Download brochure
                  </a>
                </DropdownMenuItem>
              ) : property.pdfStatus === "generating" ? (
                <DropdownMenuItem disabled>
                  <Loader2 className="animate-spin" />
                  Preparing PDF…
                </DropdownMenuItem>
              ) : property.pdfUrl ? (
                <DropdownMenuItem asChild>
                  <a href={property.pdfUrl} target="_blank" rel="noreferrer">
                    <FileDown />
                    Download PDF
                  </a>
                </DropdownMenuItem>
              ) : property.status === "Live" ? (
                <DropdownMenuItem disabled>
                  <FileDown />
                  {property.pdfStatus === "failed"
                    ? "PDF failed — save again to retry"
                    : "PDF preparing…"}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem disabled>
                  <FileDown />
                  PDF available once live
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 />
                Delete project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.article>
  );
}

interface ListingsWorkspaceProps {
  agents?: Array<{
    id: string;
    fullName: string;
    whatsapp: string;
    avatarUrl?: string;
  }>;
  /** Preview mode only — real signed-in inventory must not look like a demo. */
  demo?: boolean;
}

export function ListingsWorkspace({ agents = [], demo }: ListingsWorkspaceProps) {
  const router = useRouter();
  const { properties, setProperties } = usePropertyStore();
  const [category, setCategory] = useState<ProjectCategory>("Off-plan");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"All" | "Live" | "Draft">("All");
  const [community, setCommunity] = useState("any");
  const [budget, setBudget] = useState<BudgetFilter>("any");
  const [bedrooms, setBedrooms] = useState<BedroomFilter>("any");
  const [propertyType, setPropertyType] = useState<"any" | PropertyType>("any");
  const [handover, setHandover] = useState<HandoverFilter>("any");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [favourites, setFavourites] = useState<Set<string>>(
    () => new Set(["bayview-residences"]),
  );
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [deletingProperty, setDeletingProperty] = useState<Property | null>(null);
  const [notice, setNotice] = useState("");

  // Generation runs after the save request already returned, so the card
  // starts in "generating" — this is the only way the UI learns it finished.
  const generatingSlugs = properties
    .filter((property) => property.pdfStatus === "generating")
    .map((property) => property.slug);
  const generatingKey = generatingSlugs.join(",");

  useEffect(() => {
    if (!generatingKey) return;
    const slugs = generatingKey.split(",");
    let cancelled = false;
    const poll = async () => {
      const results = await Promise.all(
        slugs.map(async (slug) => {
          try {
            const response = await fetch(`/api/projects/pdf-status?slug=${encodeURIComponent(slug)}`);
            if (!response.ok) return null;
            const payload = (await response.json()) as {
              pdfStatus?: string;
              pdfUrl?: string;
              pdfGeneratedAt?: string;
            };
            return { slug, ...payload };
          } catch {
            return null;
          }
        }),
      );
      if (cancelled) return;
      const updates = new Map(
        results.filter((r): r is NonNullable<typeof r> => Boolean(r)).map((r) => [r.slug, r]),
      );
      if (updates.size === 0) return;
      setProperties((current) =>
        current.map((item) => {
          const update = updates.get(item.slug);
          if (!update || update.pdfStatus === "generating") return item;
          return {
            ...item,
            pdfStatus: update.pdfStatus as Property["pdfStatus"],
            pdfUrl: update.pdfUrl ?? item.pdfUrl,
            pdfGeneratedAt: update.pdfGeneratedAt ?? item.pdfGeneratedAt,
          };
        }),
      );
    };
    const interval = window.setInterval(() => void poll(), 4000);
    void poll();
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [generatingKey, setProperties]);

  useEffect(() => {
    const openEditor = () => {
      setEditingProperty(null);
      setEditorOpen(true);
    };
    window.addEventListener("realty-by-rahul:add-project", openEditor);
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("new") === "1") {
      openEditor();
    }
    return () => window.removeEventListener("realty-by-rahul:add-project", openEditor);
  }, []);

  const clearNewProjectQuery = () => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("new")) return;
    url.searchParams.delete("new");
    const nextSearch = url.searchParams.toString();
    router.replace(`${url.pathname}${nextSearch ? `?${nextSearch}` : ""}`, {
      scroll: false,
    });
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingProperty(null);
    clearNewProjectQuery();
  };

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2400);
    return () => window.clearTimeout(timer);
  }, [notice]);

  // Budget bands and handover years differ per category, so a value carried
  // over from the previous tab would silently match nothing.
  useEffect(() => {
    setBudget((current) =>
      current === "any" ||
      getBudgetOptions(category).some((option) => option.value === current)
        ? current
        : "any",
    );
    setHandover((current) =>
      current === "any" ||
      getHandoverOptions(category).some((option) => option.value === current)
        ? current
        : "any",
    );
  }, [category]);

  const visibleProperties = useMemo(
    () =>
      properties.filter((property) => {
        const year = property.possessionYear ?? 0;
        const searchTarget =
          `${property.title} ${property.location} ${property.community} ${property.developer} ${property.type}`.toLowerCase();
        const matchesBedrooms =
          bedrooms === "any" ||
          (bedrooms === "4-plus"
            ? property.bedrooms >= 4
            : property.bedrooms === Number(bedrooms));
        const matchesHandover =
          handover === "any" ||
          (handover.endsWith("-plus")
            ? year >= Number(handover.replace("-plus", ""))
            : year === Number(handover));

        return (
          getProjectCategory(property) === category &&
          (status === "All" || property.status === status) &&
          (community === "any" || property.location === community) &&
          matchesBudget(property, budget, category) &&
          matchesBedrooms &&
          (propertyType === "any" || property.type === propertyType) &&
          matchesHandover &&
          searchTarget.includes(query.trim().toLowerCase())
        );
      }),
    [
      bedrooms,
      budget,
      category,
      community,
      handover,
      properties,
      propertyType,
      query,
      status,
    ],
  );

  const selectedProperties = properties.filter((property) =>
    selectedIds.has(property.id),
  );
  const activeFilterCount = [
    community,
    budget,
    bedrooms,
    propertyType,
    handover,
  ].filter((value) => value !== "any").length;

  const resetFilters = () => {
    setCommunity("any");
    setBudget("any");
    setBedrooms("any");
    setPropertyType("any");
    setHandover("any");
  };

  const saveListing = (draft: ListingDraft, property: Property | null) => {
    const normalized = normalizePropertyAvailability(draft);
    const now = Date.now();
    const id = property?.id ?? `project-${now}`;
    const slug =
      property?.slug ??
      uniqueSlug(
        safeSlug(`${draft.title}-${draft.location}`),
        properties.map((item) => item.slug),
      );
    const handoverLabel =
      normalized.purpose === "For Rent"
        ? "Available now"
        : normalized.constructionStatus === "Handed Over"
          ? "Ready"
          : normalized.possessionMonth && normalized.possessionYear
            ? `${normalized.possessionMonth} ${normalized.possessionYear}`
            : "On request";
    const nextProperty: Property = {
      id,
      slug,
      title: normalized.title.trim(),
      location: normalized.location.trim(),
      locality: `${normalized.location.trim()}, Dubai`,
      community: normalized.community.trim() || normalized.location.trim(),
      emirate: "Dubai",
      developer: normalized.developer.trim() || "Private owner",
      price: normalized.price.trim(),
      priceQualifier: normalized.priceQualifier.trim() || "Price from",
      originalPrice: formatPriceLabel(normalized.originalPrice) || undefined,
      purpose: normalized.purpose,
      type: normalized.type,
      constructionStatus: normalized.constructionStatus,
      possessionMonth: normalized.possessionMonth,
      possessionYear: normalized.possessionYear,
      handover: handoverLabel,
      paymentPlan: normalized.paymentPlan.trim() || "On request",
      projectStage:
        normalized.projectStage.trim() ||
        (normalized.purpose === "For Rent" ? "Available" : "On sale"),
      bedrooms: normalized.bedrooms,
      bathrooms: normalized.bathrooms,
      area: normalizeAreaInput(normalized.area) || "Area on request",
      floor: normalized.floor.trim() || "Multiple options",
      parking: normalized.parking.trim() || "On request",
      furnishing: normalized.furnishing.trim() || "Unfurnished",
      ownership: normalized.purpose === "For Rent" ? "Leasehold" : "Freehold",
      status: normalized.status,
      views: property?.views ?? 0,
      enquiries: property?.enquiries ?? 0,
      published: property ? "Updated just now" : "Created just now",
      description:
        normalized.description.trim() ||
        "A carefully selected Dubai property presented by Realty by Rahul.",
      highlights:
        normalized.highlights.length > 0
          ? normalized.highlights
          : ["Direct WhatsApp advisory", "Dubai market guidance"],
      amenities:
        normalized.amenities.length > 0
          ? normalized.amenities
          : (property?.amenities ?? []),
      paymentMilestones:
        normalized.paymentMilestones.length > 0
          ? normalized.paymentMilestones
          : property?.paymentMilestones,
      // Optional by design: a Trakheesi permit is often issued after the
      // listing is already live, so this stays a placeholder until entered.
      permitNumber: normalized.permitNumber.trim() || "Pending verification",
      reraVerified: property?.reraVerified ?? false,
      featured: property?.featured ?? false,
      commissionCovered: normalized.commissionCovered,
      postHandoverPaymentPlan: normalized.postHandoverPaymentPlan,
      images:
        normalized.images.length > 0
          ? normalized.images
          : [
              "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1800&q=88",
            ],
      brochure: normalized.brochure,
      floorPlan: normalized.floorPlan,
      // Carried across the edit rather than rebuilt. Dropping these wiped the
      // download link off a listing the moment it was edited: the generated
      // PDF stayed in storage but nothing pointed at it any more, and the
      // cleared content hash forced a needless re-render on every save. It
      // showed up worst on rentals, which rarely carry a developer brochure
      // to fall back on.
      pdfUrl: property?.pdfUrl,
      pdfStatus: property?.pdfStatus,
      pdfContentHash: property?.pdfContentHash,
      pdfGeneratedAt: property?.pdfGeneratedAt,
      assignedAgentId: normalized.assignedAgentId,
      assignedAgentName: agents.find(
        (agent) => agent.id === normalized.assignedAgentId,
      )?.fullName,
      assignedAgentWhatsApp: agents.find(
        (agent) => agent.id === normalized.assignedAgentId,
      )?.whatsapp,
      assignedAgentAvatarUrl: agents.find(
        (agent) => agent.id === normalized.assignedAgentId,
      )?.avatarUrl,
    };

    setProperties((current) =>
      property
        ? current.map((item) => (item.id === property.id ? nextProperty : item))
        : [nextProperty, ...current],
    );
    void fetch("/api/projects/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ property: nextProperty }),
    }).then(async (response) => {
      if (response.ok) return;
      const result = (await response.json()) as { error?: string };
      setNotice(
        result.error
          ? `Saved on this device. Cloud sync: ${result.error}`
          : "Saved on this device. Cloud sync is unavailable.",
      );
    });
    closeEditor();
    setCategory(getProjectCategory(nextProperty));
    setNotice(property ? "Project updated." : "Dubai project added.");
  };

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-6 sm:px-7 sm:py-8 lg:px-9">
      <header className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-primary/15 bg-primary/[0.06] text-primary"
            >
              <Sparkles className="size-3" />
              Curated Dubai inventory
            </Badge>
            {demo && (
              <Badge
                variant="outline"
                className="border-amber-300/60 bg-amber-50/70 text-amber-800"
              >
                Demo data
              </Badge>
            )}
          </div>
          <h1 className="mt-3 text-[28px] font-semibold tracking-[-0.045em] sm:text-4xl">
            Explore properties
          </h1>
          <p className="mt-1 text-[11px] text-muted-foreground sm:text-sm">
            Search, shortlist and send multiple options in one WhatsApp flow.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingProperty(null);
            setEditorOpen(true);
          }}
          className="hidden rounded-xl sm:inline-flex"
        >
          <Plus />
          Add project
        </Button>
      </header>

      <div className="mt-6 grid grid-cols-3 rounded-[22px] border bg-white/56 p-1.5 backdrop-blur-xl">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setCategory(item);
              setSelectedIds(new Set());
            }}
            className={cn(
              "relative h-11 rounded-[17px] text-[11px] font-semibold text-muted-foreground sm:text-sm",
              category === item && "text-primary",
            )}
          >
            {category === item && (
              <motion.span
                layoutId="project-category"
                className="absolute inset-0 rounded-[17px] border border-primary/20 bg-[linear-gradient(135deg,rgba(222,239,255,.94),rgba(255,255,255,.95))] shadow-[0_8px_24px_rgba(43,106,230,.13)]"
              />
            )}
            <span className="relative">{item}</span>
          </button>
        ))}
      </div>

      <div className="sticky top-[72px] z-30 -mx-1 mt-4 rounded-[24px] border border-white/80 bg-white/83 p-3 shadow-[0_16px_42px_rgba(50,83,145,.09)] backdrop-blur-2xl lg:top-[80px]">
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-11 rounded-xl bg-[#f8faff] pl-9"
              placeholder="Search project, community or developer"
            />
          </div>
          <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-11 rounded-xl bg-white",
                  activeFilterCount > 0 && "border-primary/30 text-primary",
                )}
              >
                <ListFilter />
                <span className="hidden sm:inline">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[9px] text-white">
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown className="hidden size-3 sm:block" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-[min(92vw,440px)] rounded-2xl p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Search filters</p>
                  <p className="mt-0.5 text-[9px] text-muted-foreground">
                    Sub-categories appear only inside this menu.
                  </p>
                </div>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={resetFilters}>
                    Reset
                  </Button>
                )}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Select value={community} onValueChange={setCommunity}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {communities.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item === "any" ? "Any community" : item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={budget}
                  onValueChange={(value) => setBudget(value as BudgetFilter)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any price</SelectItem>
                    {getBudgetOptions(category).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={bedrooms}
                  onValueChange={(value) =>
                    setBedrooms(value as BedroomFilter)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any bedrooms</SelectItem>
                    <SelectItem value="1">1 bedroom</SelectItem>
                    <SelectItem value="2">2 bedrooms</SelectItem>
                    <SelectItem value="3">3 bedrooms</SelectItem>
                    <SelectItem value="4-plus">4+ bedrooms</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={propertyType}
                  onValueChange={(value) =>
                    setPropertyType(value as "any" | PropertyType)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any property type</SelectItem>
                    {propertyTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {getHandoverOptions(category).length > 0 && (
                  <Select
                    value={handover}
                    onValueChange={(value) =>
                      setHandover(value as HandoverFilter)
                    }
                  >
                    <SelectTrigger className="w-full sm:col-span-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any handover</SelectItem>
                      {getHandoverOptions(category).map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <Button
                className="mt-4 w-full"
                onClick={() => setFiltersOpen(false)}
              >
                Show {visibleProperties.length}{" "}
                {visibleProperties.length === 1 ? "property" : "properties"}
              </Button>
            </PopoverContent>
          </Popover>
          <Button
            variant="outline"
            className={cn(
              "h-11 rounded-xl bg-white",
              mapOpen && "border-primary/30 text-primary",
            )}
            onClick={() => setMapOpen((current) => !current)}
          >
            <MapIcon />
            <span className="hidden sm:inline">Map</span>
          </Button>
        </div>
        <div className="mt-2.5 flex items-center gap-2 overflow-x-auto pb-0.5 hide-scrollbar">
          {(["All", "Live", "Draft"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStatus(item)}
              className={cn(
                "h-8 shrink-0 rounded-full border px-3 text-[9px] font-semibold transition-colors",
                status === item
                  ? "border-primary/25 bg-primary/[0.08] text-primary"
                  : "border-border bg-white text-muted-foreground hover:text-foreground",
              )}
            >
              {item}
            </button>
          ))}
          <span className="ml-auto shrink-0 text-[9px] text-muted-foreground">
            {visibleProperties.length} result
            {visibleProperties.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {selectedProperties.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-4 flex items-center gap-3 rounded-2xl border border-primary/20 bg-[linear-gradient(135deg,rgba(226,241,255,.94),rgba(255,255,255,.92))] p-3 shadow-[0_12px_35px_rgba(44,102,210,.1)]"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-white">
              <Check className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold">
                {selectedProperties.length} selected
              </p>
              <p className="truncate text-[9px] text-muted-foreground">
                Send multiple properties in one WhatsApp message
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setSelectedIds(new Set())}
              aria-label="Clear selection"
            >
              <X />
            </Button>
            <WhatsAppShareDialog properties={selectedProperties}>
              <Button className="rounded-xl">
                <Send />
                <span className="hidden sm:inline">Share selection</span>
                <span className="sm:hidden">Share</span>
              </Button>
            </WhatsAppShareDialog>
          </motion.div>
        )}
      </AnimatePresence>

      {mapOpen && (
        <motion.section
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="relative mt-4 min-h-[310px] overflow-hidden rounded-[28px] border border-white/80 bg-[linear-gradient(145deg,#eef6ff,#fff9f0)] shadow-[0_20px_55px_rgba(55,91,158,.11)]"
        >
          <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(63,108,191,.13)_1px,transparent_1px),linear-gradient(90deg,rgba(63,108,191,.13)_1px,transparent_1px)] [background-size:34px_34px]" />
          <div className="relative p-5">
            <Badge className="border-0 bg-white/88 text-primary shadow-sm">
              <MapPin className="size-3" />
              Dubai portfolio map
            </Badge>
            <p className="mt-2 max-w-md text-[10px] leading-4 text-muted-foreground">
              Phase 1 map preview groups your current inventory by community.
              Interactive map data can be connected in Phase 2.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from(
                new Map(
                  visibleProperties.map((property) => [
                    property.location,
                    property,
                  ]),
                ).values(),
              ).map((property, index) => (
                <Link
                  key={property.location}
                  href={createPropertyPreviewUrl(property, "")}
                  className="relative rounded-2xl border border-white/80 bg-white/82 p-3 shadow-sm backdrop-blur-xl transition-transform hover:-translate-y-1"
                  style={{ transform: `translateY(${(index % 2) * 8}px)` }}
                >
                  <MapPin className="size-4 text-primary" />
                  <p className="mt-2 truncate text-[10px] font-semibold">
                    {property.location}
                  </p>
                  <p className="mt-0.5 text-[9px] text-muted-foreground">
                    From {formatPriceLabel(property.price)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {visibleProperties.map((property) => (
            <ProjectCard
              key={property.id}
              property={property}
              selected={selectedIds.has(property.id)}
              favourite={favourites.has(property.id)}
              onSelect={(selected) =>
                setSelectedIds((current) => {
                  const next = new Set(current);
                  if (selected) next.add(property.id);
                  else next.delete(property.id);
                  return next;
                })
              }
              onFavourite={() =>
                setFavourites((current) => {
                  const next = new Set(current);
                  if (next.has(property.id)) next.delete(property.id);
                  else next.add(property.id);
                  return next;
                })
              }
              onEdit={() => {
                setEditingProperty(property);
                setEditorOpen(true);
              }}
              onDelete={() => setDeletingProperty(property)}
            />
          ))}
        </AnimatePresence>
      </section>

      {visibleProperties.length === 0 && (
        <div className="mt-5 flex min-h-[320px] flex-col items-center justify-center rounded-[28px] border border-dashed bg-white/55 p-8 text-center backdrop-blur-xl">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/[0.07] text-primary">
            <Building2 className="size-5" />
          </span>
          <h2 className="mt-4 text-base font-semibold">No matching projects</h2>
          <p className="mt-1 max-w-sm text-[10px] leading-5 text-muted-foreground">
            Try another category or reset the hidden filter options.
          </p>
          <Button variant="outline" className="mt-4" onClick={resetFilters}>
            Reset filters
          </Button>
        </div>
      )}

      <ListingEditorDialog
        open={editorOpen}
        property={editingProperty}
        developerSuggestions={Array.from(
          new Set(
            properties
              .map((item) => item.developer?.trim())
              .filter((value): value is string => Boolean(value)),
          ),
        ).sort((left, right) => left.localeCompare(right))}
        communitySuggestions={Array.from(
          new Set(
            properties
              .map((item) => item.community?.trim())
              .filter((value): value is string => Boolean(value)),
          ),
        ).sort((left, right) => left.localeCompare(right))}
        agents={agents.map(({ id, fullName }) => ({ id, fullName }))}
        onOpenChange={(open) => {
          if (open) setEditorOpen(true);
          else closeEditor();
        }}
        onSave={saveListing}
      />

      <AlertDialog
        open={Boolean(deletingProperty)}
        onOpenChange={(open) => {
          if (!open) setDeletingProperty(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingProperty?.title} will be removed from this device and from
              future collection selections.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (!deletingProperty) return;
                const removedId = deletingProperty.id;
                setProperties((current) =>
                  current.filter((item) => item.id !== removedId),
                );
                setSelectedIds((current) => {
                  const next = new Set(current);
                  next.delete(removedId);
                  return next;
                });
                // Without this the project returns on the next load, because the
                // studio now hydrates from the shared inventory.
                void fetch("/api/projects/delete", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ propertyId: removedId }),
                }).then(async (response) => {
                  if (response.ok) return;
                  const result = (await response.json()) as { error?: string };
                  setNotice(
                    result.error
                      ? `Removed on this device. Cloud sync: ${result.error}`
                      : "Removed on this device. Cloud sync is unavailable.",
                  );
                });
                setDeletingProperty(null);
                setNotice("Project deleted.");
              }}
            >
              Delete project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
            role="status"
            className="fixed bottom-24 left-1/2 z-[70] -translate-x-1/2 rounded-full border border-white/80 bg-white/92 px-4 py-2.5 text-[10px] font-semibold text-primary shadow-[0_18px_48px_rgba(47,84,159,.2)] backdrop-blur-xl lg:bottom-8"
          >
            {notice}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
