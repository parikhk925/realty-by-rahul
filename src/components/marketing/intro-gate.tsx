"use client";

import { usePathname } from "next/navigation";
import { IntroCurtain } from "./intro-curtain";

/**
 * The intro belongs to the buyer-facing storefront only. An agent opening the
 * studio, or a buyer following a shared listing link, should land on the
 * content immediately.
 */
export function IntroGate() {
  const pathname = usePathname();
  if (pathname !== "/") return null;
  return <IntroCurtain />;
}
