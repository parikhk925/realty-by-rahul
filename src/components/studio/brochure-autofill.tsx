"use client";

import { useState } from "react";
import { LoaderCircle, Sparkles, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ExtractedListing } from "@/lib/ai/brochure-extraction";
import type { ListingDraft } from "@/components/studio/listing-editor-dialog";

interface BrochureAutofillProps {
  draft: ListingDraft;
  onApply: (next: (current: ListingDraft) => ListingDraft) => void;
}

interface AssetsResponse {
  found?: boolean;
  source?: "upload" | "developer-site" | "web";
  brochureUrl?: string;
  brochure?: { url: string; name: string };
  needsVerification?: boolean;
  images?: string[];
  message?: string;
  error?: string;
}

interface FieldsResponse {
  fields?: ExtractedListing;
  brochureVerified?: boolean;
  message?: string;
  error?: string;
}

const MAX_IMAGES = 10;

/**
 * Only fills gaps. The admin's own typing always wins, so re-running after a
 * few manual corrections can never quietly undo them.
 */
function applyExtraction(
  current: ListingDraft,
  fields: ExtractedListing,
  images: string[],
  brochure?: { url: string; name: string },
): { next: ListingDraft; filled: string[] } {
  const next = { ...current };
  const filled: string[] = [];

  const setText = (
    key: "title" | "location" | "community" | "developer" | "price" | "paymentPlan" | "area" | "floor" | "parking" | "furnishing" | "description" | "permitNumber",
    value: string | undefined,
    label: string,
  ) => {
    if (!value || next[key].trim()) return;
    next[key] = value;
    filled.push(label);
  };

  setText("title", fields.title, "title");
  setText("developer", fields.developer, "developer");
  setText("community", fields.community, "community");
  setText("location", fields.location ?? fields.community, "location");
  setText("price", fields.price, "price");
  setText("paymentPlan", fields.paymentPlan, "payment plan");
  setText("area", fields.area, "area");
  setText("floor", fields.floor, "floor");
  setText("parking", fields.parking, "parking");
  setText("furnishing", fields.furnishing, "furnishing");
  setText("description", fields.description, "description");
  setText("permitNumber", fields.permitNumber, "permit");

  if (fields.priceQualifier && next.priceQualifier === "Price from") {
    next.priceQualifier = fields.priceQualifier;
    filled.push("price qualifier");
  }
  if (fields.type && next.type === "Apartment") {
    next.type = fields.type;
    filled.push("type");
  }
  if (fields.constructionStatus && next.constructionStatus === "Off-plan") {
    next.constructionStatus = fields.constructionStatus;
    filled.push("construction status");
  }
  if (fields.possessionMonth && !next.possessionMonth) {
    next.possessionMonth = fields.possessionMonth;
    filled.push("handover month");
  }
  if (fields.possessionYear && !next.possessionYear) {
    next.possessionYear = fields.possessionYear;
    filled.push("handover year");
  }
  // 2 is the form default rather than a deliberate choice, so treating it as
  // "unset" is what makes a studio or 4-bed brochure fill correctly.
  if (fields.bedrooms !== undefined && next.bedrooms === 2) {
    next.bedrooms = fields.bedrooms;
    filled.push("bedrooms");
  }
  if (fields.bathrooms !== undefined && next.bathrooms === 2) {
    next.bathrooms = fields.bathrooms;
    filled.push("bathrooms");
  }
  if (fields.postHandoverPaymentPlan && !next.postHandoverPaymentPlan) {
    next.postHandoverPaymentPlan = true;
    filled.push("post-handover plan");
  }
  if (fields.highlights?.length && next.highlights.length === 0) {
    next.highlights = fields.highlights;
    filled.push("highlights");
  }
  if (fields.amenities?.length && next.amenities.length === 0) {
    next.amenities = fields.amenities;
    filled.push("amenities");
  }
  if (fields.paymentMilestones?.length && next.paymentMilestones.length === 0) {
    next.paymentMilestones = fields.paymentMilestones;
    filled.push("payment milestones");
  }

  // Attaching it here is what puts the developer's own file behind the
  // customer-facing Download button, rather than the generated dossier.
  if (brochure && !next.brochure) {
    next.brochure = brochure;
    filled.push("brochure");
  }

  if (images.length > 0) {
    const merged = [...next.images];
    for (const image of images) {
      if (merged.length >= MAX_IMAGES) break;
      if (!merged.includes(image)) merged.push(image);
    }
    if (merged.length > next.images.length) {
      filled.push(`${merged.length - next.images.length} photos`);
      next.images = merged;
    }
  }

  return { next, filled };
}

export function BrochureAutofill({ draft, onApply }: BrochureAutofillProps) {
  const [pending, setPending] = useState(false);
  const [reading, setReading] = useState(false);
  const [status, setStatus] = useState<
    { kind: "ok" | "info" | "error"; text: string } | undefined
  >();

  // An uploaded brochure is read directly, so it needs no title — the title
  // is one of the things it fills in. A title is only required for the search
  // path, where it is what identifies the project.
  const hasBrochure = Boolean(draft.brochure?.url);
  const canRun = (hasBrochure || Boolean(draft.title.trim())) && !pending;

  const run = async () => {
    setPending(true);
    setStatus(undefined);
    const filled: string[] = [];
    try {
      // Phase 1 — find and store the brochure and photos. No AI, so it stays
      // comfortably inside the function's time limit.
      const assetsResponse = await fetch("/api/listings/extract-brochure", {
        method: "POST",
        signal: AbortSignal.timeout(70_000),
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          developer: draft.developer,
          community: draft.community,
          brochureUrl: draft.brochure?.url,
        }),
      });
      // A timed-out function returns an HTML error page, so json() throws and
      // the real cause is lost. Read the status first and say which step failed.
      const assets = (await assetsResponse.json().catch(() => ({}))) as AssetsResponse;
      if (!assetsResponse.ok && !assets.error) {
        setStatus({
          kind: "error",
          text: `Finding the brochure failed (step 1, HTTP ${assetsResponse.status}). ${assetsResponse.status === 504 ? "It ran out of time." : ""}`.trim(),
        });
        return;
      }

      if (!assetsResponse.ok) {
        setStatus({ kind: "error", text: assets.error ?? "Auto-fill failed." });
        return;
      }
      if (!assets.found) {
        setStatus({
          kind: "info",
          text: assets.message ?? "Nothing found published for this project.",
        });
        return;
      }

      onApply((current) => {
        const { next, filled: got } = applyExtraction(
          current,
          {},
          assets.images ?? [],
          assets.brochure,
        );
        filled.push(...got);
        return next;
      });

      if (!assets.brochureUrl) {
        setStatus({
          kind: filled.length ? "ok" : "info",
          text: filled.length
            ? `Added ${filled.join(", ")}. No brochure was published, so the other fields need filling in by hand.`
            : "Found the project page, but nothing new to add.",
        });
        return;
      }

      // Phase 2 — read the stored brochure.
      setReading(true);
      const fieldsResponse = await fetch("/api/listings/extract-fields", {
        method: "POST",
        signal: AbortSignal.timeout(70_000),
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          brochureUrl: assets.brochureUrl,
          developer: draft.developer,
          needsVerification: assets.needsVerification,
        }),
      });
      const read = (await fieldsResponse.json().catch(() => ({}))) as FieldsResponse;

      if (!fieldsResponse.ok || !read.fields) {
        const why =
          read.error ??
          (fieldsResponse.status === 504
            ? "Reading it took too long — the brochure service was busy. Try again in a moment."
            : `Reading the brochure failed (step 2, HTTP ${fieldsResponse.status}).`);
        setStatus({
          kind: filled.length ? "info" : "error",
          text: filled.length
            ? `Added ${filled.join(", ")}. ${why}`
            : why,
        });
        return;
      }

      onApply((current) => {
        const { next, filled: got } = applyExtraction(
          current,
          read.fields ?? {},
          [],
          // Held back until the document confirmed whose brochure it is.
          assets.needsVerification && read.brochureVerified && assets.brochureUrl
            ? { url: assets.brochureUrl, name: `${draft.title} brochure.pdf` }
            : undefined,
        );
        filled.push(...got);
        return next;
      });

      const origin =
        assets.source === "upload"
          ? "the uploaded brochure"
          : assets.source === "web"
            ? "a brochure found online"
            : "the developer's brochure";
      const notice = read.message ? ` ${read.message}` : "";
      setStatus({
        kind: read.message ? "info" : filled.length ? "ok" : "info",
        text: filled.length
          ? `Filled ${filled.join(", ")} from ${origin}. Review before saving.${notice}`
          : `Read ${origin}, but every field was already filled in.${notice}`,
      });
    } catch (error) {
      // Name the step that was running, otherwise every cause looks identical
      // and there is nothing to act on.
      const step = reading ? "reading the brochure" : "finding the brochure";
      const timedOut =
        error instanceof DOMException && error.name === "TimeoutError";
      setStatus({
        kind: filled.length ? "info" : "error",
        text: timedOut
          ? `Timed out while ${step}. The brochure service is busy — try again, or fill the fields by hand.`
          : `Something went wrong while ${step}. Try again, or fill the fields by hand.`,
      });
    } finally {
      setPending(false);
      setReading(false);
    }
  };

  return (
    <section className="mb-4 rounded-2xl border border-amber-200/70 bg-[linear-gradient(135deg,rgba(255,250,240,.96),rgba(255,255,255,.96))] p-3.5">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <Sparkles className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-amber-950">
            Auto-fill from the developer brochure
          </p>
          <p className="mt-0.5 text-[9px] leading-4 text-amber-900/70">
            {draft.brochure
              ? "Reads the brochure you uploaded and fills the empty fields and photos."
              : "Enter the title and developer, and this looks for the official brochure and project photos on the developer's own site. Upload one above for the most reliable result."}
          </p>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="mt-3 h-10 w-full rounded-xl border-amber-300 bg-white text-[11px] text-amber-900 hover:bg-amber-50"
        disabled={!canRun}
        onClick={() => void run()}
      >
        {pending ? (
          <LoaderCircle className="animate-spin" />
        ) : (
          <WandSparkles className="size-4" />
        )}
        {pending ? (reading ? "Reading brochure…" : "Looking for the brochure…") : "Auto-fill from brochure"}
      </Button>

      {!canRun && !pending && (
        <p className="mt-2 text-[9px] text-amber-900/70">
          Upload the brochure above, or add the listing title to search for it.
        </p>
      )}

      {status && (
        <p
          role="status"
          className={
            status.kind === "error"
              ? "mt-2 text-[9px] font-medium text-destructive"
              : status.kind === "ok"
                ? "mt-2 text-[9px] font-medium text-emerald-700"
                : "mt-2 text-[9px] font-medium text-amber-900/80"
          }
        >
          {status.text}
        </p>
      )}
    </section>
  );
}
