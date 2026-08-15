"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BRAND_MARK, BRAND_NAME } from "@/lib/property-data";

/**
 * First-load reveal.
 *
 * Shown once per browser session, not on every route change — an intro that
 * replays each time a buyer opens a listing stops being a flourish and starts
 * being an obstacle. Skipped outright when the visitor prefers reduced motion.
 */
const SEEN_KEY = "realty-by-rahul:intro-seen";
const ease = [0.76, 0, 0.24, 1] as const;

export function IntroCurtain() {
  const reducedMotion = useReducedMotion();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (reducedMotion) return;
    if (sessionStorage.getItem(SEEN_KEY)) return;

    setShow(true);
    document.body.style.overflow = "hidden";

    const done = setTimeout(() => {
      sessionStorage.setItem(SEEN_KEY, "1");
      setShow(false);
      document.body.style.overflow = "";
    }, 2350);

    return () => {
      clearTimeout(done);
      document.body.style.overflow = "";
    };
  }, [reducedMotion]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-[#0a1626]"
          // The whole panel lifts away, so the hero is revealed from beneath
          // rather than cross-fading into place.
          exit={{ y: "-100%" }}
          transition={{ duration: 0.85, ease }}
        >
          {/* Colour wash that drifts while the mark settles. */}
          <motion.div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 25% 30%, rgba(217,169,79,.30), transparent 45%), radial-gradient(circle at 78% 70%, rgba(56,132,214,.30), transparent 48%), radial-gradient(circle at 50% 100%, rgba(139,92,246,.18), transparent 55%)",
            }}
            initial={{ scale: 1.25, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.6, ease }}
          />

          {/* Horizon lines sweeping outward — a skyline suggestion, not a picture. */}
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              aria-hidden
              className="absolute left-0 h-px w-full bg-[linear-gradient(90deg,transparent,rgba(217,169,79,.55),transparent)]"
              style={{ top: `${42 + i * 6}%` }}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, delay: 0.25 + i * 0.12, ease }}
            />
          ))}

          <div className="relative flex flex-col items-center">
            <motion.div
              className="grid size-24 place-items-center overflow-hidden rounded-[26px] bg-[linear-gradient(135deg,#f3d9a1_0%,#d9a94f_45%,#8f6420_100%)] shadow-[0_24px_60px_rgba(217,169,79,.4)]"
              initial={{ scale: 0.5, opacity: 0, rotate: -12 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 180, damping: 14, delay: 0.15 }}
            >
              <span className="text-4xl font-bold leading-none text-[#231603]">
                {BRAND_MARK}
              </span>
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 -left-full w-full bg-[linear-gradient(100deg,transparent,rgba(255,255,255,.85),transparent)]"
                animate={{ left: ["-100%", "180%"] }}
                transition={{ duration: 1.1, delay: 0.7, ease: "easeInOut" }}
              />
            </motion.div>

            <div className="mt-6 overflow-hidden">
              <motion.p
                className="text-lg font-semibold tracking-[-0.02em] text-white"
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.7, delay: 0.5, ease }}
              >
                {BRAND_NAME}
              </motion.p>
            </div>

            <div className="mt-2 overflow-hidden">
              <motion.p
                className="text-[10px] uppercase tracking-[0.34em] text-[#e8cfa4]"
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.7, delay: 0.65, ease }}
              >
                Dubai Real Estate
              </motion.p>
            </div>

            <motion.span
              aria-hidden
              className="mt-6 block h-px w-40 origin-left bg-[linear-gradient(90deg,transparent,#d9a94f,transparent)]"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.9, delay: 0.85, ease }}
            />
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
