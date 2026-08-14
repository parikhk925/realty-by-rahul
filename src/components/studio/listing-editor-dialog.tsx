"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CalendarClock,
  Check,
  KeyRound,
  MapPin,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BrochureAutofill } from "@/components/studio/brochure-autofill";
import { ListingImageUploader } from "@/components/studio/listing-image-uploader";
import { ListingPdfUploader } from "@/components/studio/listing-pdf-uploader";
import {
  ConstructionStatus,
  normalizePropertyAvailability,
  PaymentMilestone,
  possessionMonths,
  PossessionMonth,
  Property,
  PropertyPdf,
  PropertyPurpose,
  propertyTypes,
  PropertyType,
} from "@/lib/property-data";

export interface ListingDraft {
  title: string;
  location: string;
  community: string;
  developer: string;
  price: string;
  priceQualifier: string;
  originalPrice: string;
  paymentPlan: string;
  projectStage: string;
  permitNumber: string;
  purpose: PropertyPurpose;
  type: PropertyType;
  constructionStatus: ConstructionStatus;
  possessionMonth?: PossessionMonth;
  possessionYear?: number;
  bedrooms: number;
  bathrooms: number;
  area: string;
  floor: string;
  parking: string;
  furnishing: string;
  description: string;
  highlights: string[];
  images: string[];
  brochure?: PropertyPdf;
  floorPlan?: PropertyPdf;
  assignedAgentId?: string;
  status: "Live" | "Draft";
  commissionCovered: boolean;
  postHandoverPaymentPlan: boolean;
  // Populated by brochure auto-fill rather than typed by hand, but carried on
  // the draft so an edit cannot silently drop them from the saved listing.
  amenities: string[];
  paymentMilestones: PaymentMilestone[];
}

const emptyDraft: ListingDraft = {
  title: "",
  location: "",
  community: "",
  developer: "",
  price: "",
  priceQualifier: "Price from",
  originalPrice: "",
  paymentPlan: "",
  projectStage: "On sale",
  permitNumber: "",
  purpose: "For Sale",
  type: "Apartment",
  constructionStatus: "Off-plan",
  bedrooms: 2,
  bathrooms: 2,
  area: "",
  floor: "",
  parking: "",
  furnishing: "",
  description: "",
  highlights: [],
  images: [],
  brochure: undefined,
  floorPlan: undefined,
  assignedAgentId: undefined,
  status: "Draft",
  commissionCovered: false,
  postHandoverPaymentPlan: false,
  amenities: [],
  paymentMilestones: [],
};

/**
 * Handover lies in the future, so the options track today rather than a fixed
 * start year — a hardcoded list would keep offering years that have passed.
 * An existing listing keeps its saved year so editing it never loses the date.
 */
function getPossessionYears(savedYear?: number) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, index) => currentYear + index);
  if (savedYear && !years.includes(savedYear)) {
    return [savedYear, ...years].sort((left, right) => left - right);
  }
  return years;
}

interface ListingEditorDialogProps {
  open: boolean;
  property: Property | null;
  onOpenChange: (open: boolean) => void;
  onSave: (draft: ListingDraft, property: Property | null) => void;
  developerSuggestions?: string[];
  communitySuggestions?: string[];
  agents?: Array<{ id: string; fullName: string }>;
}

export function ListingEditorDialog({
  open,
  property,
  onOpenChange,
  onSave,
  developerSuggestions = [],
  communitySuggestions = [],
  agents = [],
}: ListingEditorDialogProps) {
  const [draft, setDraft] = useState<ListingDraft>(emptyDraft);

  useEffect(() => {
    if (!open) return;
    setDraft(
      property
        ? normalizePropertyAvailability({
            title: property.title,
            location: property.location,
            community: property.community ?? property.location,
            developer: property.developer ?? "",
            price: property.price,
            priceQualifier: property.priceQualifier,
            originalPrice: property.originalPrice ?? "",
            paymentPlan: property.paymentPlan ?? "",
            projectStage: property.projectStage ?? "On sale",
            // Seed rows carry a placeholder rather than a real permit; treat it
            // as empty so the agent is prompted to enter the Trakheesi number.
            permitNumber:
              property.permitNumber && property.permitNumber !== "Demo inventory"
                ? property.permitNumber
                : "",
            purpose: property.purpose,
            type: property.type,
            constructionStatus: property.constructionStatus,
            possessionMonth: property.possessionMonth,
            possessionYear: property.possessionYear,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            area: property.area,
            floor: property.floor,
            parking: property.parking,
            furnishing: property.furnishing,
            description: property.description,
            highlights: property.highlights,
            images: property.images,
            brochure: property.brochure,
            floorPlan: property.floorPlan,
            assignedAgentId: property.assignedAgentId,
            status: property.status,
            commissionCovered: property.commissionCovered ?? false,
            postHandoverPaymentPlan: property.postHandoverPaymentPlan ?? false,
            amenities: property.amenities ?? [],
            paymentMilestones: property.paymentMilestones ?? [],
          })
        : emptyDraft,
    );
  }, [open, property]);

  const possessionYears = useMemo(
    () => getPossessionYears(property?.possessionYear),
    [property?.possessionYear],
  );
  // Within the current year only the months still ahead are valid handovers.
  const selectableMonths = useMemo(() => {
    const now = new Date();
    return draft.possessionYear === now.getFullYear()
      ? possessionMonths.slice(now.getMonth())
      : possessionMonths;
  }, [draft.possessionYear]);

  useEffect(() => {
    if (!draft.possessionMonth) return;
    if (selectableMonths.includes(draft.possessionMonth)) return;
    // Moving the year back to the current one can strand a month already gone.
    setDraft((current) => ({ ...current, possessionMonth: undefined }));
  }, [draft.possessionMonth, selectableMonths]);

  const hasPossessionDate =
    draft.purpose === "For Rent" ||
    draft.constructionStatus === "Handed Over" ||
    Boolean(draft.possessionMonth && draft.possessionYear);
  const canSave = Boolean(
    draft.title.trim() &&
      draft.location.trim() &&
      draft.price.trim() &&
      draft.originalPrice.trim() &&
      hasPossessionDate &&
      draft.images.every((image) => /^https?:\/\//i.test(image)),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        // The native file picker and the datalist dropdowns render outside
        // this dialog's DOM, so Radix counts opening one as an interaction
        // outside and dismisses — losing everything typed. Closing is now
        // only ever deliberate, through the X or Cancel button.
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
        className="inset-0 top-0 left-0 h-[100dvh] max-h-none max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-none p-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-[min(92dvh,900px)] sm:max-w-[680px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px]"
      >
        <form
          className="flex h-full min-h-0 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSave) onSave(draft, property);
          }}
        >
          <DialogHeader className="shrink-0 border-b bg-white/95 px-4 pt-[max(14px,env(safe-area-inset-top))] pb-4 text-left backdrop-blur-xl sm:px-6 sm:pt-5">
            <div className="flex items-start gap-3 pr-12">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Building2 className="size-4" />
              </div>
              <div className="min-w-0 pt-0.5">
                <DialogTitle>
                  {property ? "Edit Dubai project" : "Add a Dubai project"}
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs leading-5 sm:text-sm">
                  Add essentials, payment terms and mobile-ready photos. Rental
                  inventory is always kept ready for possession.
                </DialogDescription>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Close property editor"
              onClick={() => onOpenChange(false)}
              className="absolute top-[max(10px,env(safe-area-inset-top))] right-3 size-11 rounded-full border bg-white shadow-sm sm:top-4 sm:right-4"
            >
              <X className="size-5" />
            </Button>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 [-webkit-overflow-scrolling:touch] sm:px-6">
            <div className="mb-4 flex items-center justify-between rounded-2xl border border-primary/10 bg-primary/[0.045] px-3.5 py-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-primary">
                  Project details
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  Required fields are marked by the save button state.
                </p>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-semibold text-muted-foreground shadow-sm">
                {property ? "Editing" : "New"}
              </span>
            </div>
            <div className="mb-4 space-y-3">
              <ListingPdfUploader
                label="Property brochure"
                description="Start here. The developer's brochure fills the fields below and is what customers download."
                value={draft.brochure}
                onChange={(brochure) =>
                  setDraft((current) => ({ ...current, brochure }))
                }
              />
              <BrochureAutofill draft={draft} onApply={setDraft} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="listing-title">Listing title</Label>
            <Input
              id="listing-title"
              value={draft.title}
              onChange={(event) =>
                setDraft((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="Bayview Residences"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="listing-location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="listing-location"
                value={draft.location}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    location: event.target.value,
                  }))
                }
                className="pl-9"
                placeholder="Dubai Harbour"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="listing-community">Community</Label>
            <Input
              id="listing-community"
              list="listing-community-options"
              value={draft.community}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  community: event.target.value,
                }))
              }
              placeholder="Dubai Marina"
            />
            <datalist id="listing-community-options">
              {communitySuggestions.map((community) => (
                <option key={community} value={community} />
              ))}
            </datalist>
            <p className="text-[8px] leading-4 text-muted-foreground">
              Saved communities appear as you type.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="listing-developer">Developer / owner</Label>
            <Input
              id="listing-developer"
              list="listing-developer-options"
              value={draft.developer}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  developer: event.target.value,
                }))
              }
              placeholder="Developer name"
            />
            <datalist id="listing-developer-options">
              {developerSuggestions.map((developer) => (
                <option key={developer} value={developer} />
              ))}
            </datalist>
            <p className="text-[8px] leading-4 text-muted-foreground">
              Saved developers appear as you type.
            </p>
          </div>
          {agents.length > 0 && (
            <div className="space-y-2 sm:col-span-2">
              <Label>Assigned agent</Label>
              <Select
                value={draft.assignedAgentId ?? "unassigned"}
                onValueChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    assignedAgentId:
                      value === "unassigned" ? undefined : value,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">
                    Rahul / unassigned
                  </SelectItem>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[8px] leading-4 text-muted-foreground">
                Public WhatsApp enquiries route to this agent. Unassigned
                enquiries fall back to Rahul.
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="listing-price">Price (AED)</Label>
            <Input
              id="listing-price"
              value={draft.price}
              onChange={(event) =>
                setDraft((current) => ({ ...current, price: event.target.value }))
              }
              placeholder="1.59"
            />
            <p className="text-[9px] leading-4 text-muted-foreground">
              Just the number - 1.59 for AED 1.59M, or the full 1490444. No
              need to type AED or M; the listing writes it in millions.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="listing-original-price">Original price (OP)</Label>
            <Input
              id="listing-original-price"
              value={draft.originalPrice}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  originalPrice: event.target.value,
                }))
              }
              placeholder="1.72"
            />
            <p className="text-[9px] leading-4 text-muted-foreground">
              What the seller paid the developer. Buyers compare the asking
              price against it. Same format as the price - 1.72 for AED 1.72M.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="listing-qualifier">Price label</Label>
            <Input
              id="listing-qualifier"
              value={draft.priceQualifier}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  priceQualifier: event.target.value,
                }))
              }
              placeholder="Price from"
            />
          </div>
          <div className="space-y-2">
            <Label>Listing purpose</Label>
            <Select
              value={draft.purpose}
              onValueChange={(value: PropertyPurpose) =>
                setDraft((current) => {
                  const currentQualifier = current.priceQualifier
                    .trim()
                    .toLowerCase();
                  const priceQualifier =
                    value === "For Rent" &&
                    (currentQualifier === "for sale" ||
                      currentQualifier === "price from")
                      ? "Annual rent"
                      : value === "For Sale" &&
                          (currentQualifier === "for rent" ||
                            currentQualifier === "annual rent")
                        ? "Price from"
                        : current.priceQualifier;

                  return normalizePropertyAvailability({
                    ...current,
                    purpose: value,
                    priceQualifier,
                  });
                })
              }
            >
              <SelectTrigger
                className="w-full"
                aria-label="Listing purpose"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="For Sale">For sale</SelectItem>
                <SelectItem value="For Rent">For rent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="listing-payment-plan">
              {draft.purpose === "For Rent" ? "Rent terms" : "Payment plan"}
            </Label>
            <Input
              id="listing-payment-plan"
              value={draft.paymentPlan}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  paymentPlan: event.target.value,
                }))
              }
              placeholder={draft.purpose === "For Rent" ? "1–4 cheques" : "60/40"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="listing-stage">Sale status</Label>
            <Input
              id="listing-stage"
              value={draft.projectStage}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  projectStage: event.target.value,
                }))
              }
              placeholder="New launch"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="listing-permit">
              RERA / Trakheesi permit number{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="listing-permit"
              value={draft.permitNumber}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  permitNumber: event.target.value,
                }))
              }
              placeholder="e.g. 7129384756"
            />
            <p className="text-[9px] leading-4 text-muted-foreground">
              {draft.status === "Live"
                ? "This listing is live. Dubai advertising rules expect a permit number — add or correct it here at any time."
                : "Leave blank until Trakheesi issues the permit. You can add it after the listing goes live."}
            </p>
          </div>
          <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
            <label
              htmlFor="listing-commission-covered"
              className="group flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors has-data-checked:border-primary has-data-checked:bg-primary/[0.04]"
            >
              <Checkbox
                id="listing-commission-covered"
                checked={draft.commissionCovered}
                onCheckedChange={(checked) =>
                  setDraft((current) => ({
                    ...current,
                    commissionCovered: checked === true,
                  }))
                }
                className="mt-0.5"
              />
              <div>
                <p className="text-[11px] font-medium">Covered</p>
                <p className="mt-0.5 text-[9px] leading-4 text-muted-foreground">
                  Developer or seller pays the agent&apos;s fee. Leave
                  unchecked if it is not covered.
                </p>
              </div>
            </label>
            <label
              htmlFor="listing-post-handover"
              className="group flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors has-data-checked:border-primary has-data-checked:bg-primary/[0.04]"
            >
              <Checkbox
                id="listing-post-handover"
                checked={draft.postHandoverPaymentPlan}
                onCheckedChange={(checked) =>
                  setDraft((current) => ({
                    ...current,
                    postHandoverPaymentPlan: checked === true,
                  }))
                }
                className="mt-0.5"
              />
              <div>
                <p className="text-[11px] font-medium">Post-handover plan</p>
                <p className="mt-0.5 text-[9px] leading-4 text-muted-foreground">
                  Developer offers a payment schedule that continues after
                  handover.
                </p>
              </div>
            </label>
          </div>
          <div className="space-y-2">
            <Label>Property type</Label>
            <Select
              value={draft.type}
              onValueChange={(value: PropertyType) =>
                setDraft((current) => ({ ...current, type: value }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {propertyTypes.map((propertyType) => (
                  <SelectItem key={propertyType} value={propertyType}>
                    {propertyType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            {draft.purpose === "For Rent" ? (
              <>
                <Label>Availability</Label>
                <div
                  role="status"
                  className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3.5"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <KeyRound className="size-4" />
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold text-foreground">
                      Ready for immediate possession
                    </p>
                    <p className="mt-0.5 text-[9px] leading-4 text-muted-foreground">
                      Dubai rental inventory must be available for tenants to move
                      in, so off-plan construction dates do not apply.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Label>Construction status</Label>
                <Select
                  value={draft.constructionStatus}
                  onValueChange={(value: ConstructionStatus) =>
                    setDraft((current) => ({
                      ...current,
                      constructionStatus: value,
                      possessionMonth:
                        value === "Off-plan"
                          ? current.possessionMonth
                          : undefined,
                      possessionYear:
                        value === "Off-plan"
                          ? current.possessionYear
                          : undefined,
                    }))
                  }
                >
                  <SelectTrigger
                    className="w-full"
                    aria-label="Construction status"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Handed Over">
                      Handed over
                    </SelectItem>
                    <SelectItem value="Off-plan">
                      Off-plan
                    </SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
          </div>

          {draft.purpose === "For Sale" &&
            draft.constructionStatus === "Off-plan" && (
            <div className="grid gap-3 rounded-xl border border-primary/15 bg-primary/[0.035] p-3 sm:col-span-2 sm:grid-cols-[auto_1fr_1fr] sm:items-end">
              <div className="flex items-center gap-2 pb-1 text-[10px] font-semibold text-primary sm:self-center sm:pb-0 sm:pr-2">
                <CalendarClock className="size-4" />
                Handover by
              </div>
              <div className="space-y-2">
                <Label>Month</Label>
                <Select
                  value={draft.possessionMonth}
                  onValueChange={(value: PossessionMonth) =>
                    setDraft((current) => ({
                      ...current,
                      possessionMonth: value,
                    }))
                  }
                >
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectableMonths.map((month) => (
                      <SelectItem key={month} value={month}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Select
                  value={draft.possessionYear?.toString()}
                  onValueChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      possessionYear: Number(value),
                    }))
                  }
                >
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {possessionYears.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label>Bedrooms</Label>
            <Select
              value={String(draft.bedrooms)}
              onValueChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  bedrooms: Number(value),
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((count) => (
                  <SelectItem key={count} value={String(count)}>
                    {count} bedroom{count > 1 ? "s" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Bathrooms</Label>
            <Select
              value={String(draft.bathrooms)}
              onValueChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  bathrooms: Number(value),
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((count) => (
                  <SelectItem key={count} value={String(count)}>
                    {count} bathrooms
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="listing-area">Area (sq ft)</Label>
            <Input
              id="listing-area"
              value={draft.area}
              onChange={(event) =>
                setDraft((current) => ({ ...current, area: event.target.value }))
              }
              placeholder="1,120 sq ft"
            />
            <p className="text-[9px] leading-4 text-muted-foreground">
              Square feet. A plain number is taken as sq ft, and the listing
              shows the square-metre equivalent alongside it.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={draft.status}
              onValueChange={(value: "Live" | "Draft") =>
                setDraft((current) => ({ ...current, status: value }))
              }
            >
              <SelectTrigger className="w-full" aria-label="Listing status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Draft">Save as draft</SelectItem>
                <SelectItem value="Live">Publish live</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="listing-floor">Floor</Label>
            <Input
              id="listing-floor"
              value={draft.floor}
              onChange={(event) =>
                setDraft((current) => ({ ...current, floor: event.target.value }))
              }
              placeholder="28th floor"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="listing-parking">Parking</Label>
            <Input
              id="listing-parking"
              value={draft.parking}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  parking: event.target.value,
                }))
              }
              placeholder="1 covered"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="listing-furnishing">Furnishing</Label>
            <Input
              id="listing-furnishing"
              value={draft.furnishing}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  furnishing: event.target.value,
                }))
              }
              placeholder="Semi-furnished"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <ListingImageUploader
              images={draft.images}
              onChange={(images) =>
                setDraft((current) => ({ ...current, images }))
              }
            />
            <Label htmlFor="listing-images" className="text-[9px] text-muted-foreground">
              Or add image URLs
            </Label>
            <Textarea
              id="listing-images"
              value={draft.images.join("\n")}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  images: event.target.value
                    .split(/\r?\n/)
                    .map((image) => image.trim())
                    .filter(Boolean)
                    .slice(0, 8),
                }))
              }
              className="min-h-16 resize-y bg-muted/25 font-mono text-[9px]"
              placeholder={"https://images.example.com/living-room.jpg\nhttps://images.example.com/bedroom.jpg"}
            />
            <p className="text-[9px] leading-4 text-muted-foreground">
              Leave empty to use a polished default cover. You can add up to eight
              photos from your phone or by URL.
            </p>
          </div>
          <div className="space-y-3 sm:col-span-2">
            <div>
              <p className="text-[11px] font-semibold">Property documents</p>
              <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
                Add either document only when it is available. Empty sections
                never appear on the customer preview.
              </p>
            </div>
            <div className="grid gap-3">
              <ListingPdfUploader
                label="Floor plan"
                description="One optional floor-plan PDF. No extra plan fields are required."
                value={draft.floorPlan}
                onChange={(floorPlan) =>
                  setDraft((current) => ({ ...current, floorPlan }))
                }
              />
            </div>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="listing-highlights">
              Highlights{" "}
              <span className="font-normal text-muted-foreground">
                (one per line)
              </span>
            </Label>
            <Textarea
              id="listing-highlights"
              value={draft.highlights.join("\n")}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  highlights: event.target.value
                    .split(/\r?\n/)
                    .map((highlight) => highlight.trim())
                    .filter(Boolean)
                    .slice(0, 8),
                }))
              }
              className="min-h-20 resize-y"
              placeholder={"Waterfront view\nFlexible payment plan\nFreehold ownership"}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="listing-description">Short description</Label>
            <Textarea
              id="listing-description"
              value={draft.description}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              className="min-h-24 resize-none"
              placeholder="Describe the project, community and buyer fit…"
            />
          </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-xl bg-primary/[0.06] p-3 text-[10px] text-muted-foreground">
              <Sparkles className="size-3.5 shrink-0 text-primary" />
              Realty by Rahul creates an enquiry-ready mobile page and a direct
              WhatsApp hand-off from these details.
            </div>
          </div>

          <div className="shrink-0 border-t bg-white/96 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-[0_-12px_35px_rgba(32,56,98,.08)] backdrop-blur-xl sm:flex sm:justify-end sm:gap-2 sm:px-6 sm:pb-4">
            <div className="grid grid-cols-[0.8fr_1.2fr] gap-2 sm:flex">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-12 sm:h-10"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!canSave} className="h-12 sm:h-10">
                <Check className="size-3.5" />
                {property ? "Save changes" : "Add project"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
