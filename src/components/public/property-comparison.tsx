import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Ruler, Scale, WalletCards } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  parseAreaToSqft,
  parsePriceToAed,
  type Property,
} from "@/lib/property-data";

interface PropertyComparisonProps {
  property: Property;
  candidates: Property[];
}

function formatAed(value: number) {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `AED ${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(2)}M`;
  }
  if (value >= 1_000) return `AED ${Math.round(value / 1_000)}K`;
  return `AED ${Math.round(value)}`;
}

function formatSqft(value: number) {
  return `${value.toLocaleString("en-US")} sq ft`;
}

/**
 * Picks the property that best illustrates "the next tier up" — larger and
 * pricier than the one being viewed, closest in scale rather than a random
 * outlier — so the comparison reads as a natural upgrade, not noise. Falls
 * back to the closest match overall if nothing scores as a genuine step up.
 */
function pickComparable(property: Property, candidates: Property[]) {
  const baseArea = parseAreaToSqft(property.area);
  const basePrice = parsePriceToAed(property.price);
  if (baseArea <= 0 || basePrice <= 0) return undefined;

  const scored = candidates
    .map((candidate) => {
      const area = parseAreaToSqft(candidate.area);
      const price = parsePriceToAed(candidate.price);
      if (area <= 0 || price <= 0) return undefined;
      const isUpgrade = area > baseArea && price > basePrice;
      const distance =
        Math.abs(area - baseArea) / baseArea + Math.abs(price - basePrice) / basePrice;
      return { candidate, area, price, isUpgrade, distance };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  if (scored.length === 0) return undefined;

  const upgrades = scored.filter((entry) => entry.isUpgrade);
  const pool = upgrades.length > 0 ? upgrades : scored;
  pool.sort((left, right) => left.distance - right.distance);
  return pool[0];
}

function PropertyThumb({
  property,
  label,
  accentClassName,
  highlight,
}: {
  property: Property;
  label: string;
  accentClassName: string;
  highlight?: boolean;
}) {
  return (
    <figure>
      <div
        className={`relative aspect-[4/3] overflow-hidden rounded-2xl ${
          highlight ? "ring-2 ring-[#e0862c]/45 ring-offset-2 ring-offset-white" : ""
        }`}
      >
        <Image
          src={property.images[0]}
          alt={property.title}
          fill
          sizes="(max-width: 640px) 45vw, 260px"
          className={`object-cover ${highlight ? "transition-transform duration-500 group-hover:scale-105" : ""}`}
        />
      </div>
      <figcaption className="mt-2.5 min-w-0">
        <p className={`truncate text-[10px] font-semibold ${accentClassName}`}>
          {property.title}
        </p>
        <p className="mt-0.5 truncate text-[9px] text-muted-foreground">{label}</p>
      </figcaption>
    </figure>
  );
}

function ComparisonRow({
  icon: Icon,
  label,
  baseValue,
  baseDisplay,
  compareValue,
  compareDisplay,
}: {
  icon: typeof Ruler;
  label: string;
  baseValue: number;
  baseDisplay: string;
  compareValue: number;
  compareDisplay: string;
}) {
  const peak = Math.max(baseValue, compareValue, 1);
  const basePercent = Math.max(8, Math.round((baseValue / peak) * 100));
  const comparePercent = Math.max(8, Math.round((compareValue / peak) * 100));

  return (
    <div className="py-3.5">
      <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <Icon className="size-3 text-primary" />
        {label}
      </p>
      <div className="mt-2.5 grid grid-cols-2 gap-4">
        <div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#eef3ff]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#4280ff,#174ed6)]"
              style={{ width: `${basePercent}%` }}
            />
          </div>
          <p className="mt-1.5 text-sm font-semibold tracking-[-0.02em]">
            {baseDisplay}
          </p>
        </div>
        <div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#fff3e2]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#f6b24a,#e0862c)]"
              style={{ width: `${comparePercent}%` }}
            />
          </div>
          <p className="mt-1.5 text-sm font-semibold tracking-[-0.02em]">
            {compareDisplay}
          </p>
        </div>
      </div>
    </div>
  );
}

export function PropertyComparison({ property, candidates }: PropertyComparisonProps) {
  const match = pickComparable(property, candidates);
  if (!match) return null;
  const { candidate, area, price, isUpgrade } = match;

  const baseArea = parseAreaToSqft(property.area);
  const basePrice = parsePriceToAed(property.price);

  return (
    <Link
      href={`/listing/${encodeURIComponent(candidate.slug)}`}
      aria-label={`Compare with ${candidate.title}`}
      className="group mx-4 mt-8 block overflow-hidden rounded-[28px] border border-white/85 bg-white/86 shadow-[0_20px_58px_rgba(43,75,139,.12)] backdrop-blur-2xl transition-all hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(43,75,139,.18)] sm:mx-0"
    >
      <div className="p-5 pb-0 sm:p-7 sm:pb-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Badge
              variant="outline"
              className="border-primary/20 bg-primary/[0.06] text-primary"
            >
              <Scale className="size-3" />
              How it compares
            </Badge>
            <h2 className="mt-2.5 text-xl font-semibold tracking-[-0.04em] sm:text-2xl">
              {isUpgrade ? "See the next tier up" : "See a comparable property"}
            </h2>
            <p className="mt-1.5 max-w-md text-[10px] leading-5 text-muted-foreground sm:text-xs">
              Size, price and how long each has been listed, side by side.
            </p>
          </div>
          <ArrowRight className="mt-1 size-4 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 px-5 sm:px-7">
        <PropertyThumb
          property={property}
          label="This property"
          accentClassName="text-primary"
        />
        <PropertyThumb
          property={candidate}
          label="Comparable option"
          accentClassName="text-[#c07a1e]"
          highlight
        />
      </div>

      <div className="mt-1 divide-y divide-dashed px-5 sm:px-7">
        <ComparisonRow
          icon={Ruler}
          label="Built-up area"
          baseValue={baseArea}
          baseDisplay={formatSqft(baseArea)}
          compareValue={area}
          compareDisplay={formatSqft(area)}
        />
        <ComparisonRow
          icon={WalletCards}
          label="Price"
          baseValue={basePrice}
          baseDisplay={formatAed(basePrice)}
          compareValue={price}
          compareDisplay={formatAed(price)}
        />
        <div className="grid grid-cols-2 gap-4 py-3.5">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Listed
            </p>
            <p className="mt-2 text-[11px] font-medium">{property.published}</p>
          </div>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Listed
            </p>
            <p className="mt-2 text-[11px] font-medium">{candidate.published}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-dashed border-border p-5 sm:p-7">
        <p className="text-[10px] text-muted-foreground">
          Tap to open{" "}
          <span className="font-semibold text-foreground">{candidate.title}</span>
        </p>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/[0.08] text-primary transition-transform group-hover:translate-x-0.5">
          <ArrowRight className="size-4" />
        </span>
      </div>
    </Link>
  );
}
