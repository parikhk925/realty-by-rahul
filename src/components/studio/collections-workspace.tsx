"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  FolderHeart,
  GripVertical,
  Link2,
  MapPin,
  MessageCircleMore,
  Phone,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { collectionSlug, useCollectionStore } from "@/hooks/use-collection-store";
import { usePropertyStore } from "@/hooks/use-property-store";
import {
  createCollectionPreviewUrl,
  getProjectCategory,
  Property,
  PropertyCollection,
} from "@/lib/property-data";
import { cn } from "@/lib/utils";

interface CollectionPreset {
  name: string;
  shortLabel: string;
  description: string;
  matches: (property: Property) => boolean;
}

const presets: CollectionPreset[] = [
  {
    name: "Off-plan under AED 2M",
    shortLabel: "Under AED 2M",
    description:
      "Flexible Dubai launches priced below AED 2 million, curated for first-time and portfolio buyers.",
    matches: (property) =>
      getProjectCategory(property) === "Off-plan" &&
      Number.parseFloat(property.price.match(/[\d.]+/)?.[0] ?? "99") < 2,
  },
  {
    name: "Handover in 2028",
    shortLabel: "2028 handover",
    description:
      "A focused shortlist of Dubai projects scheduled to hand over during 2028.",
    matches: (property) => property.possessionYear === 2028,
  },
  {
    name: "Dubai Marina ready homes",
    shortLabel: "Marina ready",
    description:
      "Ready residences around Dubai Marina for buyers who want immediate ownership.",
    matches: (property) =>
      property.location === "Dubai Marina" &&
      getProjectCategory(property) === "Secondary",
  },
  {
    name: "Best rental options",
    shortLabel: "Ready to lease",
    description:
      "Move-in-ready Dubai rental options with clear annual terms and direct advisory.",
    matches: (property) => getProjectCategory(property) === "Rent",
  },
];

function sanitizePhone(value: string) {
  return value.replace(/\D/g, "").slice(0, 15);
}

function normalizePhone(value: string) {
  const digits = sanitizePhone(value);
  if (/^05\d{8}$/.test(digits)) return `971${digits.slice(1)}`;
  if (/^5\d{8}$/.test(digits)) return `971${digits}`;
  return digits;
}

export function CollectionsWorkspace() {
  const { properties } = usePropertyStore();
  const {
    collections,
    saveCollection,
    createCollection,
    removeCollection,
    hydrated,
  } = useCollectionStore();
  const [activePublicId, setActivePublicId] = useState<string>("");
  const collection =
    collections.find((item) => item.publicId === activePublicId) ??
    collections[0];
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState("");
  const [notice, setNotice] = useState("");

  // Load the active shortlist into the editor whenever it changes.
  useEffect(() => {
    if (!collection) return;
    setActivePublicId((current) => current || collection.publicId || "");
    setName(collection.name);
    setDescription(collection.description);
    setSelectedIds(collection.propertyIds);
    setPublishedUrl("");
  }, [collection]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2400);
    return () => window.clearTimeout(timer);
  }, [notice]);

  // Persist edits without waiting for a publish, so the switcher never shows a
  // different name or count from the editor, and nothing is lost on navigate.
  useEffect(() => {
    if (!collection?.publicId) return;
    const unchanged =
      name === collection.name &&
      description === collection.description &&
      selectedIds.join(",") === collection.propertyIds.join(",");
    if (unchanged) return;
    const timer = window.setTimeout(() => {
      saveCollection({
        ...collection,
        name: name.trim() || "Untitled collection",
        description: description.trim(),
        propertyIds: selectedIds,
      });
    }, 900);
    return () => window.clearTimeout(timer);
  }, [name, description, selectedIds, collection, saveCollection]);

  const selectedProperties = selectedIds
    .map((id) => properties.find((property) => property.id === id))
    .filter((property): property is Property => Boolean(property));
  const visibleProperties = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return properties;
    return properties.filter((property) =>
      `${property.title} ${property.location} ${property.developer} ${getProjectCategory(property)}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [properties, query]);

  const activePublic = collection?.publicId ?? "";
  const draftCollection: PropertyCollection = {
    id: collection?.id ?? "",
    // The token keeps this curator's buyer link distinct from anyone else who
    // happens to choose the same collection name.
    slug: collectionSlug(name.trim() || "Curated Dubai collection", activePublic),
    name: name.trim() || "Curated Dubai collection",
    description: description.trim(),
    propertyIds: selectedIds,
    status: "Published",
    publicId: activePublic,
  };
  const previewUrl = createCollectionPreviewUrl(
    draftCollection,
    selectedProperties,
  );

  const publishCollection = async () => {
    if (selectedProperties.length === 0) return "";
    setPublishing(true);
    try {
      const response = await fetch("/api/collections/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collection: draftCollection,
          properties: selectedProperties,
        }),
      });
      if (!response.ok) throw new Error("Publishing is not available yet.");
      const result = (await response.json()) as { url?: string };
      const url = result.url || previewUrl;
      setPublishedUrl(url);
      saveCollection(draftCollection);
      return url;
    } catch {
      setPublishedUrl(previewUrl);
      saveCollection(draftCollection);
      return previewUrl;
    } finally {
      setPublishing(false);
    }
  };

  const deleteActiveCollection = () => {
    if (!collection?.publicId) return;
    // The server refuses if it belongs to another agent; RLS is the authority.
    removeCollection(collection.publicId);
    setActivePublicId("");
    setNotice("Collection deleted.");
  };

  const startNewCollection = () => {
    const fresh = saveCollection({ ...createCollection(), name: "New collection" });
    setActivePublicId(fresh.publicId ?? "");
    setName("");
    setDescription("");
    setSelectedIds([]);
    setPublishedUrl("");
    setNotice("New collection started.");
  };

  const applyPreset = (preset: CollectionPreset) => {
    const matches = properties.filter(preset.matches).map((property) => property.id);
    setName(preset.name);
    setDescription(preset.description);
    setSelectedIds(matches);
    setPublishedUrl("");
    setNotice(`${matches.length} matching properties selected.`);
  };

  const copyCollectionLink = async () => {
    const url = publishedUrl || (await publishCollection());
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setNotice("Collection link copied.");
  };

  const shareCollection = async () => {
    const recipient = normalizePhone(phone);
    if (!/^\d{8,15}$/.test(recipient)) return;
    const url = publishedUrl || (await publishCollection());
    if (!url) return;
    const message = `Hi, Rahul has curated a private Dubai property collection for you:\n\n*${draftCollection.name}*\n${draftCollection.description}\n\nExplore all ${selectedProperties.length} options in one link:\n${url}\n\nReply with the properties you like and we'll share the best available price.`;
    window.open(
      `https://wa.me/${recipient}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
    setShareOpen(false);
    setNotice("WhatsApp share prepared.");
  };

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-6 sm:px-7 sm:py-8 lg:px-9">
      <header className="flex items-end justify-between gap-4">
        <div>
          <Badge
            variant="outline"
            className="border-primary/15 bg-primary/[0.06] text-primary"
          >
            <FolderHeart className="size-3" />
            One link, multiple properties
          </Badge>
          <h1 className="mt-3 text-[28px] font-semibold tracking-[-0.045em] sm:text-4xl">
            Curated collections
          </h1>
          <p className="mt-1 text-[11px] text-muted-foreground sm:text-sm">
            Build a private shortlist your buyer can browse without WhatsApp clutter.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="hidden rounded-xl bg-white sm:inline-flex"
            onClick={() => void copyCollectionLink()}
            disabled={publishing || selectedProperties.length === 0}
          >
            <Copy />
            Copy link
          </Button>
          {collections.length > 1 && collection && (
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl bg-white text-muted-foreground hover:text-destructive"
              onClick={deleteActiveCollection}
              aria-label={`Delete ${collection.name || "this collection"}`}
            >
              <Trash2 />
            </Button>
          )}
          <Button className="rounded-xl" onClick={startNewCollection}>
            <Plus />
            New collection
          </Button>
        </div>
      </header>

      {hydrated && collections.length > 0 && (
        <section className="mt-5">
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Your team&apos;s collections
          </p>
          <div className="hide-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
            {collections.map((item) => {
              const active = item.publicId === collection?.publicId;
              return (
                <button
                  key={item.publicId}
                  type="button"
                  onClick={() => setActivePublicId(item.publicId ?? "")}
                  className={cn(
                    "group flex min-w-[190px] shrink-0 flex-col rounded-2xl border bg-white/80 p-3 text-left shadow-sm backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:shadow-md",
                    active && "border-primary/40 bg-primary/[0.05] ring-2 ring-primary/10",
                  )}
                >
                  <span className="truncate text-[11px] font-semibold">
                    {item.name || "Untitled collection"}
                  </span>
                  <span className="mt-1 text-[9px] text-muted-foreground">
                    {item.propertyIds.length}{" "}
                    {item.propertyIds.length === 1 ? "property" : "properties"}
                  </span>
                  {item.ownerName && (
                    <span className="mt-1 truncate text-[8px] text-muted-foreground">
                      by {item.ownerName}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="sunrise-surface mt-6 rounded-[28px] border border-white/80 p-4 shadow-[0_20px_60px_rgba(52,87,155,.1)] sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/[0.08] text-primary">
            <Sparkles className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Start with a Dubai smart set</h2>
            <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
              Presets select matching inventory automatically. You can adjust the
              final shortlist below.
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {presets.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => applyPreset(preset)}
              className="shrink-0 rounded-full border border-white/80 bg-white/76 px-4 py-2.5 text-[9px] font-semibold shadow-sm backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:text-primary hover:shadow-md"
            >
              {preset.shortLabel}
            </button>
          ))}
        </div>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,.8fr)]">
        <section className="rounded-[28px] border border-white/80 bg-white/74 p-4 shadow-[0_18px_55px_rgba(50,82,144,.08)] backdrop-blur-xl sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="collection-name">Collection name</Label>
              <Input
                id="collection-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setPublishedUrl("");
                }}
                className="h-11 rounded-xl"
                placeholder="Off-plan under AED 2M"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="collection-description">Buyer note</Label>
              <Textarea
                id="collection-description"
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
                  setPublishedUrl("");
                }}
                className="min-h-24 rounded-xl"
                placeholder="Explain why these properties suit this buyer."
              />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Choose properties</h2>
              <p className="mt-0.5 text-[9px] text-muted-foreground">
                {selectedProperties.length} selected · drag-style ordering is
                preserved in the customer view
              </p>
            </div>
            <Badge className="border-0 bg-primary/10 text-primary shadow-none">
              {selectedProperties.length}
            </Badge>
          </div>

          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-10 rounded-xl bg-[#f8faff] pl-9"
              placeholder="Search inventory"
            />
          </div>

          <div className="mt-3 max-h-[620px] space-y-2 overflow-y-auto pr-1">
            {visibleProperties.map((property) => {
              const selected = selectedIds.includes(property.id);
              return (
                <div
                  key={property.id}
                  onClick={() => {
                    setSelectedIds((current) =>
                      selected
                        ? current.filter((id) => id !== property.id)
                        : [...current, property.id],
                    );
                    setPublishedUrl("");
                  }}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 rounded-2xl border p-2.5 text-left transition-all",
                    selected
                      ? "border-primary/25 bg-primary/[0.055] shadow-[0_9px_25px_rgba(47,100,204,.08)]"
                      : "border-border/70 bg-white/70 hover:border-primary/20 hover:bg-white",
                  )}
                >
                  <GripVertical className="size-4 shrink-0 text-muted-foreground/60" />
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-xl">
                    <Image
                      src={property.images[0]}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold">
                      {property.title}
                    </p>
                    <p className="mt-1 flex items-center gap-1 truncate text-[9px] text-muted-foreground">
                      <MapPin className="size-3" />
                      {property.location} · {getProjectCategory(property)}
                    </p>
                  </div>
                  <Checkbox
                    checked={selected}
                    aria-label={`Select ${property.title}`}
                    tabIndex={-1}
                  />
                </div>
              );
            })}
          </div>
        </section>

        <aside className="xl:sticky xl:top-[104px] xl:self-start">
          <div className="overflow-hidden rounded-[30px] border border-white/80 bg-white/80 shadow-[0_24px_70px_rgba(48,82,151,.14)] backdrop-blur-2xl">
            <div className="relative aspect-[1.7/1] min-h-[190px] overflow-hidden">
              {selectedProperties[0] ? (
                <Image
                  src={selectedProperties[0].images[0]}
                  alt=""
                  fill
                  sizes="420px"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 sunrise-surface" />
              )}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,38,78,.02),rgba(17,38,78,.58))]" />
              <Badge className="absolute left-4 top-4 border-white/45 bg-white/86 text-primary backdrop-blur-md hover:bg-white">
                Private collection
              </Badge>
              <div className="absolute inset-x-4 bottom-4 text-white">
                <p className="text-[9px] uppercase tracking-[0.16em] text-white/70">
                  Realty by Rahul
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-[-0.04em]">
                  {draftCollection.name}
                </h2>
              </div>
            </div>
            <div className="p-5">
              <p className="line-clamp-3 text-[10px] leading-5 text-muted-foreground">
                {draftCollection.description ||
                  "Add a short personal note explaining why you selected these Dubai properties."}
              </p>
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#f7f9fd] p-3">
                <div>
                  <p className="text-[9px] text-muted-foreground">Properties</p>
                  <p className="mt-0.5 text-sm font-semibold">
                    {selectedProperties.length} curated
                  </p>
                </div>
                <div className="flex -space-x-2">
                  {selectedProperties.slice(0, 4).map((property) => (
                    <div
                      key={property.id}
                      className="relative size-8 overflow-hidden rounded-full border-2 border-white"
                    >
                      <Image
                        src={property.images[0]}
                        alt=""
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => void copyCollectionLink()}
                  disabled={publishing || selectedProperties.length === 0}
                >
                  <Copy />
                  Copy link
                </Button>
                <Button
                  className="rounded-xl"
                  onClick={() => setShareOpen(true)}
                  disabled={selectedProperties.length === 0}
                >
                  <Send />
                  WhatsApp
                </Button>
              </div>

              <Button
                variant="ghost"
                className="mt-2 w-full rounded-xl text-primary"
                disabled={selectedProperties.length === 0}
                onClick={() =>
                  window.open(
                    publishedUrl || previewUrl,
                    "_blank",
                    "noopener,noreferrer",
                  )
                }
              >
                Preview customer view
                <ExternalLink />
              </Button>
            </div>
          </div>

          <div className="mt-3 flex items-start gap-3 rounded-2xl border border-emerald-200/70 bg-emerald-50/68 p-4 text-emerald-900">
            <Check className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="text-[10px] font-semibold">One clean buyer link</p>
              <p className="mt-1 text-[9px] leading-4 text-emerald-800/75">
                After production publishing, the collection uses a short URL
                instead of embedding every property inside WhatsApp.
              </p>
            </div>
          </div>
        </aside>
      </div>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <span className="mb-2 flex size-10 items-center justify-center rounded-xl bg-[#20b757]/10 text-[#169447]">
              <MessageCircleMore className="size-4" />
            </span>
            <DialogTitle>Share one collection link</DialogTitle>
            <DialogDescription>
              Enter the buyer&apos;s WhatsApp number. UAE local numbers are
              converted to +971 automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="collection-phone">Buyer&apos;s WhatsApp</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="collection-phone"
                value={phone}
                onChange={(event) => setPhone(sanitizePhone(event.target.value))}
                className="pl-9 font-mono"
                placeholder="971565391223"
                inputMode="tel"
              />
            </div>
            <p className="text-[9px] text-muted-foreground">
              Include country code for numbers outside the UAE.
            </p>
          </div>
          <div className="rounded-2xl border bg-muted/35 p-3">
            <p className="text-[9px] text-muted-foreground">Sharing</p>
            <p className="mt-1 truncate text-[11px] font-semibold">
              {draftCollection.name} · {selectedProperties.length} properties
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void shareCollection()}
              disabled={
                publishing ||
                !/^\d{8,15}$/.test(normalizePhone(phone)) ||
                selectedProperties.length === 0
              }
              className="bg-[#20b757] text-white hover:bg-[#169447]"
            >
              Continue to WhatsApp
              <ArrowRight />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {notice && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          role="status"
          className="fixed bottom-24 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/80 bg-white/94 px-4 py-2.5 text-[10px] font-semibold text-primary shadow-[0_18px_48px_rgba(47,84,159,.2)] backdrop-blur-xl lg:bottom-8"
        >
          <Link2 className="size-3.5" />
          {notice}
        </motion.div>
      )}
    </div>
  );
}
