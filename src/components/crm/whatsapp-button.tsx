"use client";

import { motion } from "framer-motion";
import { AGENT_WHATSAPP_LINK } from "@/lib/property-data";

/**
 * Direct line to Rahul, sitting under the AI assistant button.
 *
 * The link is his own wa.me short link rather than the l.instagram.com
 * wrapper it was shared from: that wrapper is an Instagram click-tracker and
 * carries an fbclid, so it is only dependable when followed from Instagram
 * itself. The short link is the same destination without that dependency.
 */
export function WhatsAppButton() {
  return (
    <motion.a
      href={AGENT_WHATSAPP_LINK}
      target="_blank"
      rel="noreferrer"
      aria-label="Message Rahul on WhatsApp"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 20 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      className="group fixed bottom-[9.5rem] right-4 z-[60] flex size-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-[0_16px_40px_rgba(37,211,102,.42)] sm:bottom-[5.5rem] sm:right-6"
    >
      {/* Steady pulse — a quiet cue that this one reaches a person. */}
      <span className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-[#25d366] opacity-20 [animation-duration:2.6s]" />
      <svg viewBox="0 0 24 24" fill="currentColor" className="relative size-7">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.174.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 016.988 2.896 9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.359.101 11.947c0 2.096.549 4.142 1.595 5.945L0 24l6.305-1.654a11.95 11.95 0 005.71 1.454h.006c6.585 0 11.946-5.36 11.949-11.949A11.88 11.88 0 0020.52 3.45" />
      </svg>
    </motion.a>
  );
}
