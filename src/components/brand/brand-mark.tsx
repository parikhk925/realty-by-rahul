import { BRAND_MARK, BRAND_NAME, BRAND_TAGLINE } from "@/lib/property-data";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  compact?: boolean;
  className?: string;
}

/**
 * Set as text rather than drawn. The mark used to be a pair of hand-built
 * letterform paths, so the initials could not be changed without redrawing
 * them.
 *
 * When the name already opens with the initials, they are not repeated: the
 * gold sits on the first word of the wordmark instead of standing beside it,
 * which is what stopped the header reading "Rahul Realty by Rahul".
 */
export function BrandMark({ compact = false, className }: BrandMarkProps) {
  const leadsWithMark = BRAND_NAME.startsWith(BRAND_MARK);
  const rest = leadsWithMark ? BRAND_NAME.slice(BRAND_MARK.length).trim() : "";

  if (compact) {
    return (
      <span
        aria-label={BRAND_NAME}
        role="img"
        className={cn(
          "shrink-0 text-[26px] font-semibold leading-none tracking-[0.01em] text-[#B18134]",
          className,
        )}
      >
        {BRAND_MARK}
      </span>
    );
  }

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {!leadsWithMark && (
        <span
          aria-hidden
          className="shrink-0 text-[26px] font-semibold leading-none tracking-[0.01em] text-[#B18134]"
        >
          {BRAND_MARK}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-base font-semibold tracking-[-0.02em]">
          {leadsWithMark ? (
            <>
              <span className="text-[#B18134]">{BRAND_MARK}</span>
              {rest ? ` ${rest}` : ""}
            </>
          ) : (
            BRAND_NAME
          )}
        </p>
        {BRAND_TAGLINE && (
          <p className="truncate text-[9px] font-medium tracking-[0.04em] text-muted-foreground">
            {BRAND_TAGLINE}
          </p>
        )}
      </div>
    </div>
  );
}
