import type { Metadata } from "next";
import { Poppins } from "next/font/google";

/** The face used across Kaivan Tech's service sheets. */
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Concierge AI — by Kaivan Tech",
  description:
    "An AI conversation layer that qualifies every inbound enquiry, scores it, and drops it into your CRM ready to act on. Built by Kaivan Tech.",
};

/**
 * The deck sits outside the Realty by Rahul brand: it is Kaivan Tech's
 * document, shown to a prospect, and carries its own palette and type.
 */
export default function PitchLayout({ children }: { children: React.ReactNode }) {
  return <div className={`kt-root ${poppins.variable}`}>{children}</div>;
}
