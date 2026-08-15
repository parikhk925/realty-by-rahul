"use client";

import { motion } from "framer-motion";
import { BRAND_MARK, BRAND_NAME, BRAND_TAGLINE } from "@/lib/property-data";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  compact?: boolean;
  className?: string;
  /** Skips the entrance animation where the mark is not the first thing seen. */
  static?: boolean;
}

/**
 * The monogram is a built tile rather than plain text: a gold-leaf gradient
 * with a light sweep across it, which reads as a mark at the small sizes the
 * header uses and still holds up on a white studio background.
 *
 * The wordmark splits so the name carries the accent rather than sitting
 * beside a second, competing gold element.
 */
export function BrandMark({
  compact = false,
  className,
  static: isStatic = false,
}: BrandMarkProps) {
  const [firstWord, ...restWords] = BRAND_NAME.split(" ");
  const rest = restWords.join(" ");

  const tile = (
    <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-[11px] bg-[linear-gradient(135deg,#f3d9a1_0%,#d9a94f_45%,#a9762a_100%)] shadow-[0_6px_16px_rgba(169,118,42,.35),inset_0_1px_0_rgba(255,255,255,.5)]">
      <span className="text-[13px] font-bold leading-none tracking-[0.02em] text-[#231603]">
        {BRAND_MARK}
      </span>
      {/* Slow specular sweep — catches the eye without asking for attention. */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-full w-full bg-[linear-gradient(100deg,transparent,rgba(255,255,255,.75),transparent)]"
        animate={{ left: ["-100%", "180%"] }}
        transition={{ duration: 3.4, repeat: Infinity, repeatDelay: 3.6, ease: "easeInOut" }}
      />
    </span>
  );

  if (compact) {
    return (
      <span aria-label={BRAND_NAME} role="img" className={cn("inline-flex", className)}>
        {tile}
      </span>
    );
  }

  return (
    <motion.div
      className={cn("flex items-center gap-2.5", className)}
      initial={isStatic ? false : { opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {tile}
      <div className="min-w-0 leading-tight">
        <p className="truncate text-base font-semibold tracking-[-0.02em]">
          {firstWord}
          {rest && (
            <>
              {" "}
              <span className="bg-[linear-gradient(120deg,#f0d6a8,#d9a94f_55%,#c08f38)] bg-clip-text text-transparent">
                {rest}
              </span>
            </>
          )}
        </p>
        {BRAND_TAGLINE && (
          <p className="truncate text-[9px] font-medium tracking-[0.04em] text-muted-foreground">
            {BRAND_TAGLINE}
          </p>
        )}
      </div>
    </motion.div>
  );
}
