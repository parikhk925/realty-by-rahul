import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LeadChatWidget } from "@/components/crm/lead-chat-widget";
import { WhatsAppButton } from "@/components/crm/whatsapp-button";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
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
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light">
          <TooltipProvider>
            {children}
            <WhatsAppButton />
            <LeadChatWidget />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
