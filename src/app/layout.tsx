import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteWidgets } from "@/components/crm/site-widgets";
import { IntroGate } from "@/components/marketing/intro-gate";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

/**
 * The display face. Optical sizing does the work at headline scale, and the
 * light `wonk` axis keeps it characterful rather than a generic Georgia
 * substitute — this is what stops the page reading as another Inter template.
 */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Realty by Rahul",
    template: "%s · Realty by Rahul",
  },
  description:
    "Curated Dubai properties, off-plan launches, payment plans, and private advisory from Realty by Rahul.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light">
          <TooltipProvider>
            <IntroGate />
            {children}
            <SiteWidgets />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
