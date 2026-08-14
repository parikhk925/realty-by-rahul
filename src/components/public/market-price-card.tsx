"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChartNoAxesCombined,
  ExternalLink,
  LoaderCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parsePriceToAed } from "@/lib/property-data";
import type { PriceContext } from "@/lib/price-context";

interface MarketPriceCardProps {
  slug: string;
  title: string;
  context: PriceContext;
  isRental: boolean;
  /** The asking price as written on the listing. */
  price: string;
  /** What the seller paid the developer, if the agent recorded it. */
  originalPrice?: string;
}

type Mode = "original" | "market";

interface Estimate {
  headline?: string;
  detail?: string;
  sources?: { title: string; url: string }[];
  error?: string;
}

function aed(value: number) {
  return `AED ${Math.round(value).toLocaleString("en-US")}`;
}

export function MarketPriceCard({
  slug,
  title,
  context,
  isRental,
  price,
  originalPrice,
}: MarketPriceCardProps) {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<Estimate | undefined>();
  const [open, setOpen] = useState(false);

  // Comparing against what the seller paid is only offered when the agent has
  // actually recorded it — an empty option would invite a click that can only
  // disappoint.
  const askingAed = parsePriceToAed(price);
  const originalAed = originalPrice ? parsePriceToAed(originalPrice) : 0;
  const hasOriginal = originalAed > 0 && askingAed > 0;

  const [mode, setMode] = useState<Mode>("market");

  const unit = isRental ? "per sq ft / year" : "per sq ft";
  const diff = context.differencePercent;

  // Arithmetic on two figures the agent typed. Negative means the asking price
  // sits under what the seller paid, which is the whole point of the listing.
  const againstOriginal = hasOriginal
    ? ((askingAed - originalAed) / originalAed) * 100
    : undefined;

  const showOriginal = () => {
    setOpen(true);
    setResult(undefined);
  };

  const run = async () => {
    setOpen(true);
    setPending(true);
    setResult(undefined);
    try {
      const response = await fetch(
        `/api/listings/market-price?slug=${encodeURIComponent(slug)}`,
      );
      const payload = (await response.json()) as Estimate;
      setResult(
        response.ok
          ? payload
          : { error: payload.error ?? "The estimate could not be prepared." },
      );
    } catch {
      setResult({ error: "Could not reach the market data service." });
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="mx-4 mt-8 sm:mx-0">
      <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,.86),rgba(238,243,255,.72))] p-5 shadow-[0_20px_58px_rgba(43,75,139,.12)] backdrop-blur-2xl sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-[radial-gradient(circle,rgba(207,229,255,.85),transparent_68%)]" />
        <div className="pointer-events-none absolute -bottom-24 -left-12 size-56 rounded-full bg-[radial-gradient(circle,rgba(255,236,205,.8),transparent_68%)]" />

        <div className="relative">
          <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-primary">
            <ChartNoAxesCombined className="size-3" />
            Price check
          </p>
          <h2 className="mt-2.5 text-xl font-semibold tracking-[-0.04em] sm:text-2xl">
            What is {title} worth today?
          </h2>
          <p className="mt-1.5 max-w-md text-[10px] leading-5 text-muted-foreground sm:text-xs">
            {mode === "original"
              ? "See how the asking price compares with what the seller originally paid the developer."
              : "Check this listing against current Dubai market sources and see how its rate per square foot compares."}
          </p>

          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <Select
              value={mode}
              onValueChange={(next) => {
                setMode(next as Mode);
                setOpen(false);
                setResult(undefined);
              }}
            >
              <SelectTrigger className="h-12 w-full rounded-2xl border-white/80 bg-white/75 text-[12px] backdrop-blur-xl sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="original">Original price</SelectItem>
                <SelectItem value="market">Market price</SelectItem>
              </SelectContent>
            </Select>

            <Button
              type="button"
              onClick={() => (mode === "original" ? showOriginal() : void run())}
              disabled={pending}
              className="h-12 w-full rounded-2xl bg-[linear-gradient(135deg,#4280ff,#174ed6)] text-[13px] shadow-[0_16px_36px_rgba(35,96,221,.3)] transition-transform hover:-translate-y-0.5 sm:w-auto sm:px-7"
            >
              {pending ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {pending
                ? "Checking the market…"
                : mode === "original"
                  ? "Compare with original price"
                  : "Compare with the market"}
            </Button>
          </div>

          <AnimatePresence>
            {open && (result || pending || mode === "original") && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="mt-5 rounded-2xl border border-white/80 bg-white/72 p-4 shadow-[0_14px_38px_rgba(50,81,142,.1)] backdrop-blur-xl sm:p-5"
              >
                {mode === "original" && !hasOriginal ? (
                  <>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Original price
                    </p>
                    <p className="mt-2 text-xl font-semibold tracking-[-0.04em]">
                      Not published for this unit
                    </p>
                    <p className="mt-2.5 text-[11px] leading-5 text-muted-foreground">
                      Ask Rahul what the seller originally paid the developer,
                      and how this asking price compares.
                    </p>
                  </>
                ) : mode === "original" ? (
                  <>
                    <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Original price
                        </p>
                        <p className="mt-1 text-base font-semibold tracking-[-0.03em]">
                          {originalPrice}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Asking now
                        </p>
                        <p className="mt-1 text-base font-semibold tracking-[-0.03em]">
                          {price}
                        </p>
                      </div>
                    </div>
                    <p
                      className={
                        againstOriginal !== undefined && againstOriginal <= 0
                          ? "mt-3.5 text-2xl font-semibold tracking-[-0.045em] text-emerald-600 sm:text-3xl"
                          : "mt-3.5 text-2xl font-semibold tracking-[-0.045em] sm:text-3xl"
                      }
                    >
                      {againstOriginal === undefined
                        ? "—"
                        : againstOriginal === 0
                          ? "At original price"
                          : `${Math.abs(againstOriginal).toFixed(1)}% ${
                              againstOriginal < 0 ? "below" : "above"
                            } original price`}
                    </p>
                    <p className="mt-2.5 text-[11px] leading-5 text-muted-foreground">
                      {aed(Math.abs(askingAed - originalAed))}{" "}
                      {askingAed < originalAed ? "less than" : "more than"} the
                      seller paid the developer.
                    </p>
                    <p className="mt-3 border-t border-dashed pt-3 text-[9px] leading-4 text-muted-foreground/80">
                      Original price supplied by the agent, not a public record.
                      Ask for the original purchase documents before making an
                      offer.
                    </p>
                  </>
                ) : pending ? (
                  <p className="text-[11px] text-muted-foreground">
                    Searching current Dubai listings and market reports…
                  </p>
                ) : result?.error ? (
                  <p className="text-[11px] font-medium text-muted-foreground">
                    {result.error}
                  </p>
                ) : (
                  <>
                    {context.pricePerSqft !== undefined && (
                      <div className="mb-3.5 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-dashed pb-3">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          This listing
                        </p>
                        <p className="text-base font-semibold tracking-[-0.03em]">
                          {aed(context.pricePerSqft)}{" "}
                          <span className="text-[9px] font-medium text-muted-foreground">
                            {unit}
                          </span>
                        </p>
                        {diff !== undefined && (
                          <p className="text-[10px] font-semibold text-muted-foreground">
                            {diff <= 0 ? "▼" : "▲"} {Math.abs(diff).toFixed(1)}%{" "}
                            {diff <= 0 ? "below" : "above"} {context.communityCount} other
                            listing{context.communityCount === 1 ? "" : "s"} in{" "}
                            {context.communityName}
                          </p>
                        )}
                      </div>
                    )}
                    <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Indicative market range
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.045em] sm:text-3xl">
                      {result?.headline}
                    </p>
                    {result?.detail && (
                      <p className="mt-2.5 text-[11px] leading-5 text-muted-foreground">
                        {result.detail}
                      </p>
                    )}
                    {result?.sources && result.sources.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Sources
                        </p>
                        {result.sources.map((source) => (
                          <a
                            key={source.url}
                            href={source.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="flex items-center gap-1.5 truncate text-[10px] text-primary hover:underline"
                          >
                            <ExternalLink className="size-3 shrink-0" />
                            <span className="truncate">{source.title}</span>
                          </a>
                        ))}
                      </div>
                    )}
                    {/* The range is read off third-party listings, not a survey
                        of completed sales, so it must not read as a valuation. */}
                    <p className="mt-3 border-t border-dashed pt-3 text-[9px] leading-4 text-muted-foreground/80">
                      Summarised from the public sources above — indicative
                      only, not a valuation. Ask for recent DLD transaction
                      data before making an offer.
                    </p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
