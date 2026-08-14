"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bell,
  Building2,
  CalendarClock,
  FolderHeart,
  Inbox,
  Home,
  Camera,
  MessageCircleMore,
  Plus,
  KeyRound,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import { signOut } from "@/app/auth-actions";
import { BrandMark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AGENT_INSTAGRAM_URL,
  AGENT_WHATSAPP_LINK,
  AGENT_WHATSAPP_NUMBER,
} from "@/lib/property-data";
import { cn } from "@/lib/utils";
import type { StudioProfile } from "@/lib/supabase/session";

interface StudioShellProps {
  children: React.ReactNode;
  profile: StudioProfile;
}

export function StudioShell({ children, profile }: StudioShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const navigation = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/listings", label: "Properties", icon: Building2 },
    { href: "/leads", label: "Leads", icon: Inbox },
    { href: "/site-visits", label: "Site visits", icon: CalendarClock },
    { href: "/collections", label: "Collections", icon: FolderHeart },
    ...(profile.role === "admin"
      ? [{ href: "/agents", label: "Agents", icon: UsersRound }]
      : []),
    { href: "/profile", label: "Profile", icon: UserRound },
  ];
  const mobileNavigation = [
    navigation[0],
    navigation[1],
    navigation.find((item) => item.href === "/site-visits")!,
    navigation.find((item) => item.href === "/profile")!,
  ];

  const openAddProject = () => {
    if (pathname === "/listings") {
      window.dispatchEvent(new Event("realty-by-rahul:add-project"));
      return;
    }
    router.push("/listings?new=1");
  };

  return (
    <div className="min-h-screen text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] overflow-y-auto border-r border-white/75 bg-white/70 p-4 shadow-[12px_0_45px_rgba(67,97,150,.045)] backdrop-blur-2xl lg:flex lg:flex-col">
        <BrandMark className="h-[66px] px-2" />
        <nav className="mt-4 space-y-1.5">
          {navigation.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                onMouseEnter={() => router.prefetch(item.href)}
                onFocus={() => router.prefetch(item.href)}
                className={cn(
                  "group relative flex h-12 items-center gap-3 rounded-2xl px-3 text-sm font-medium text-muted-foreground transition-all duration-300 hover:translate-x-0.5 hover:bg-white hover:text-foreground hover:shadow-[0_12px_34px_rgba(46,93,184,.08)]",
                  active &&
                    "bg-[linear-gradient(135deg,rgba(224,239,255,.95),rgba(255,255,255,.86))] text-primary shadow-[0_12px_34px_rgba(46,93,184,.11)]",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="realty-by-rahul-sidebar-indicator"
                    className="absolute inset-y-3 left-0 w-1 rounded-full bg-primary"
                  />
                )}
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-xl transition-colors group-hover:bg-primary/8 group-hover:text-primary",
                    active && "bg-primary/10 text-primary",
                  )}
                >
                  <item.icon className="size-4" />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Button
          onClick={openAddProject}
          className="mt-5 h-12 rounded-2xl bg-[linear-gradient(135deg,#3977ff,#1954db)] shadow-[0_15px_35px_rgba(36,101,232,.28)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(36,101,232,.34)]"
        >
          <Plus className="size-4" />
          Add project
        </Button>

        <div className="mt-auto pt-5">
          <div className="sunrise-surface overflow-hidden rounded-3xl border border-white/75 p-4 shadow-[0_18px_46px_rgba(67,97,150,.09)]">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-primary">
              Private advisory
            </p>
            <p className="mt-2 text-xs font-semibold leading-5">
              {profile.role === "admin"
                ? "Team activity and buyer enquiries stay in one place."
                : "Your listings, clients and viewing schedule stay connected."}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-9 min-w-0 gap-1.5 rounded-xl bg-white/80 px-2 text-[10px]"
              >
                <a
                  href={AGENT_WHATSAPP_NUMBER ? `https://wa.me/${AGENT_WHATSAPP_NUMBER}` : AGENT_WHATSAPP_LINK}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircleMore className="size-3.5 shrink-0" />
                  WhatsApp
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-9 min-w-0 gap-1.5 rounded-xl bg-white/80 px-2 text-[10px]"
              >
                <a href={AGENT_INSTAGRAM_URL} target="_blank" rel="noreferrer">
                  <Camera className="size-3.5 shrink-0" />
                  Instagram
                </a>
              </Button>
            </div>
          </div>
          {!profile.demo && (
            <form action={signOut} className="mt-2">
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="h-10 w-full justify-start rounded-xl px-3 text-xs text-muted-foreground hover:bg-white/80 hover:text-foreground"
              >
                <ShieldCheck className="size-4" />
                Sign out securely
              </Button>
            </form>
          )}
        </div>
      </aside>

      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/70 bg-white/76 backdrop-blur-2xl lg:left-[248px]">
        <div className="mx-auto flex h-[72px] max-w-[1240px] items-center px-4 sm:px-7 lg:h-[80px]">
          <BrandMark className="lg:hidden" />
          <div className="hidden lg:block">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
              Dubai portfolio workspace
            </p>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              {profile.role === "admin"
                ? "Curate, assign and track premium properties"
                : "Present properties and manage your viewings"}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="relative rounded-full border-white bg-white/78 shadow-[0_9px_26px_rgba(67,97,150,.09)] hover:-translate-y-0.5 hover:bg-white"
                  aria-label="Open notifications"
                >
                  <Bell className="size-4 text-[#465371]" />
                  <span className="absolute right-1.5 top-1.5 size-2 rounded-full border-2 border-white bg-primary" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                sideOffset={10}
                className="w-[min(340px,calc(100vw-24px))] rounded-2xl p-2 shadow-[0_20px_60px_rgba(35,64,124,.18)]"
              >
                <div className="px-2 py-2">
                  <p className="text-sm font-semibold">Notifications</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    Three portfolio updates need your attention.
                  </p>
                </div>
                {[
                  {
                    title: "New best-offer enquiry",
                    body: "Aisha viewed Bayview Residences.",
                    href: "/dashboard",
                  },
                  {
                    title: "Draft ready to publish",
                    body: "Complete the handover details.",
                    href: "/listings",
                  },
                  {
                    title: "Collection opened",
                    body: "Dubai Harbour shortlist was viewed.",
                    href: "/collections",
                  },
                ].map((notification) => (
                  <Link
                    key={notification.title}
                    href={notification.href}
                    className="flex gap-3 rounded-xl px-2.5 py-3 transition-colors hover:bg-primary/[0.06]"
                  >
                    <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                    <span>
                      <span className="block text-xs font-semibold">
                        {notification.title}
                      </span>
                      <span className="mt-1 block text-[10px] text-muted-foreground">
                        {notification.body}
                      </span>
                    </span>
                  </Link>
                ))}
              </PopoverContent>
            </Popover>
            <Link
              href="/profile"
              prefetch={false}
              onMouseEnter={() => router.prefetch("/profile")}
              onFocus={() => router.prefetch("/profile")}
              className="relative size-10 overflow-hidden rounded-full border-2 border-white shadow-[0_8px_22px_rgba(67,97,150,.16)] transition-transform hover:scale-105 lg:size-11"
              aria-label={`Open ${profile.fullName} profile`}
            >
              <Image
                src={profile.avatarUrl ?? "/rahul-profile.png"}
                alt={profile.fullName}
                fill
                sizes="44px"
                className="object-cover object-top"
                priority
              />
              <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white bg-emerald-500" />
            </Link>
          </div>
        </div>
      </header>

      <main className="min-h-screen pb-28 pt-[72px] lg:ml-[248px] lg:pb-8 lg:pt-[80px]">
        {profile.mustChangePassword && pathname !== "/profile/security" && (
          <div className="mx-auto max-w-[1240px] px-4 pt-4 sm:px-7 lg:px-9">
            <div className="flex flex-col gap-3 rounded-2xl border border-amber-200/80 bg-[linear-gradient(135deg,rgba(255,251,235,.96),rgba(255,255,255,.9))] px-4 py-3 shadow-[0_12px_32px_rgba(146,98,16,.08)] sm:flex-row sm:items-center">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <KeyRound className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-amber-950">
                  Secure your administrator account
                </p>
                <p className="mt-0.5 text-[10px] leading-5 text-amber-900/70">
                  You are using a temporary password. All workspace features remain
                  available while you choose a private one.
                </p>
              </div>
              <Button
                asChild
                size="sm"
                className="h-9 shrink-0 rounded-xl bg-amber-700 text-white hover:bg-amber-800"
              >
                <Link
                  href="/profile/security"
                  prefetch={false}
                  onMouseEnter={() => router.prefetch("/profile/security")}
                  onFocus={() => router.prefetch("/profile/security")}
                >
                  Change password
                </Link>
              </Button>
            </div>
          </div>
        )}
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </main>

      <nav className="fixed inset-x-3 bottom-3 z-50 grid h-[76px] grid-cols-5 items-center rounded-[26px] border border-white/80 bg-white/86 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_18px_55px_rgba(35,64,124,.18)] backdrop-blur-2xl lg:hidden">
        {mobileNavigation.slice(0, 2).map((item) => {
          const active =
            pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              onPointerEnter={() => router.prefetch(item.href)}
              className={cn(
                "flex h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[9px] font-medium text-muted-foreground transition-colors",
                active && "text-primary",
              )}
            >
              <item.icon className="size-[19px]" strokeWidth={active ? 2.5 : 1.8} />
              {item.label}
            </Link>
          );
        })}
        <Button
          size="icon"
          onClick={openAddProject}
          aria-label="Add project"
          className="-mt-7 size-14 justify-self-center rounded-full border-[5px] border-[#f7f9ff] bg-[linear-gradient(145deg,#4a86ff,#174ed7)] shadow-[0_14px_30px_rgba(31,93,222,.34)] transition-all hover:-translate-y-1 hover:scale-105"
        >
          <Plus className="size-6" />
        </Button>
        {mobileNavigation.slice(2).map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              onPointerEnter={() => router.prefetch(item.href)}
              className={cn(
                "flex h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[9px] font-medium text-muted-foreground transition-colors",
                active && "text-primary",
              )}
            >
              <item.icon className="size-[19px]" strokeWidth={active ? 2.5 : 1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>

    </div>
  );
}
