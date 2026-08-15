"use client";

import { usePathname } from "next/navigation";
import { LeadChatWidget } from "./lead-chat-widget";
import { WhatsAppButton } from "./whatsapp-button";

/**
 * The floating buttons belong to the buyer-facing site.
 *
 * They are deliberately absent from the Kaivan Tech deck — that document is a
 * proposal about the product, not an instance of it, and the buttons were
 * printing into the exported PDF.
 */
export function SiteWidgets() {
  const pathname = usePathname();
  if (pathname?.startsWith("/pitch")) return null;

  return (
    <>
      <WhatsAppButton />
      <LeadChatWidget />
    </>
  );
}
