"use client";

import { useMemo, useState, useTransition } from "react";
import {
  CircleUserRound,
  Inbox,
  MessageCircleMore,
  MoreHorizontal,
  Phone,
  Trash2,
} from "lucide-react";
import { assignLead, deleteLead, updateLeadStatus } from "@/app/lead-actions";
import { leadStatuses, type LeadStatus } from "@/lib/leads";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface LeadRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  budget: string | null;
  timeline: string | null;
  message: string | null;
  propertyTitle: string | null;
  source: string;
  status: LeadStatus;
  assignedAgentId: string | null;
  assignedAgentName: string | null;
  createdAt: string;
}

interface LeadsWorkspaceProps {
  leads: LeadRow[];
  agents: { id: string; fullName: string }[];
  demo?: boolean;
}

const statusLabels: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  viewing: "Viewing",
  negotiating: "Negotiating",
  won: "Won",
  lost: "Lost",
};

const statusStyles: Record<LeadStatus, string> = {
  new: "border-0 bg-primary/12 text-primary",
  contacted: "border-0 bg-sky-500/12 text-sky-700 dark:text-sky-400",
  viewing: "border-0 bg-violet-500/12 text-violet-700 dark:text-violet-400",
  negotiating: "border-0 bg-amber-500/14 text-amber-700 dark:text-amber-400",
  won: "border-0 bg-emerald-500/14 text-emerald-700 dark:text-emerald-400",
  lost: "border-0 bg-muted text-muted-foreground",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

export function LeadsWorkspace({ leads, agents, demo }: LeadsWorkspaceProps) {
  const [tab, setTab] = useState<"all" | LeadStatus>("all");
  const [isPending, startTransition] = useTransition();

  const counts = useMemo(() => {
    const base: Record<string, number> = { all: leads.length };
    leadStatuses.forEach((status) => {
      base[status] = leads.filter((lead) => lead.status === status).length;
    });
    return base;
  }, [leads]);

  const visible = leads.filter((lead) => tab === "all" || lead.status === tab);
  const openCount = leads.filter(
    (lead) => lead.status !== "won" && lead.status !== "lost",
  ).length;

  const run = (fn: () => Promise<unknown>) => startTransition(() => void fn());

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-7 sm:py-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[28px] font-semibold tracking-[-0.045em] sm:text-4xl">
              Leads
            </h1>
            <Badge className="border-primary/15 bg-primary/[0.07] text-primary">
              {openCount} open
            </Badge>
          </div>
          <p className="mt-2 text-[11px] leading-6 text-muted-foreground">
            Buyers who registered interest from a property page instead of
            messaging on WhatsApp.
          </p>
        </div>
      </header>

      {demo && (
        <p className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/[0.07] p-3 text-[10px] leading-5 text-amber-800 dark:text-amber-300">
          Preview mode — these are sample leads. Connect the database to capture
          real enquiries.
        </p>
      )}

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as typeof tab)}
        className="mt-6"
      >
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">All {counts.all}</TabsTrigger>
          {leadStatuses.map((status) => (
            <TabsTrigger key={status} value={status}>
              {statusLabels[status]} {counts[status]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {visible.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-[28px] border border-dashed border-primary/20 bg-white/70 p-14 text-center">
          <Inbox className="size-6 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">
            {leads.length === 0 ? "No leads yet" : "Nothing in this stage"}
          </p>
          <p className="mt-1 max-w-sm text-[10px] leading-5 text-muted-foreground">
            {leads.length === 0
              ? "When a buyer fills in the Register interest form on a property page, they appear here."
              : "Try another stage to see the rest of your leads."}
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {visible.map((lead) => (
            <article
              key={lead.id}
              className="rounded-[24px] border border-white/85 bg-white/85 p-4 shadow-[0_14px_40px_rgba(43,75,139,.08)] backdrop-blur-xl sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold">{lead.name}</h2>
                    <Badge className={cn("text-[9px]", statusStyles[lead.status])}>
                      {statusLabels[lead.status]}
                    </Badge>
                    <span className="text-[9px] text-muted-foreground">
                      {timeAgo(lead.createdAt)}
                    </span>
                  </div>
                  {lead.propertyTitle && (
                    <p className="mt-1 truncate text-[10px] text-muted-foreground">
                      Interested in{" "}
                      <span className="font-medium text-foreground">
                        {lead.propertyTitle}
                      </span>
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    asChild
                    size="sm"
                    className="h-9 rounded-xl bg-[#20b757] text-[10px] text-white hover:bg-[#179e49]"
                  >
                    <a
                      href={`https://wa.me/${lead.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                        `Hi ${lead.name.split(" ")[0]}, thanks for your interest${
                          lead.propertyTitle ? ` in ${lead.propertyTitle}` : ""
                        }. I'd be happy to share the details.`,
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircleMore className="size-3.5" />
                      WhatsApp
                    </a>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-9 rounded-xl bg-white"
                        aria-label={`Manage lead from ${lead.name}`}
                      >
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuLabel>Move to stage</DropdownMenuLabel>
                      {leadStatuses.map((status) => (
                        <DropdownMenuItem
                          key={status}
                          disabled={isPending || demo || lead.status === status}
                          onSelect={() => run(() => updateLeadStatus(lead.id, status))}
                        >
                          {statusLabels[status]}
                        </DropdownMenuItem>
                      ))}
                      {agents.length > 0 && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Assign to</DropdownMenuLabel>
                          {agents.map((agent) => (
                            <DropdownMenuItem
                              key={agent.id}
                              disabled={isPending || demo}
                              onSelect={() => run(() => assignLead(lead.id, agent.id))}
                            >
                              <CircleUserRound /> {agent.fullName}
                            </DropdownMenuItem>
                          ))}
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        disabled={isPending || demo}
                        onSelect={() => run(() => deleteLead(lead.id))}
                      >
                        <Trash2 /> Delete lead
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <dl className="mt-4 grid gap-3 border-t pt-3 text-[10px] sm:grid-cols-4">
                <div>
                  <dt className="text-muted-foreground">Mobile</dt>
                  <dd className="mt-0.5 flex items-center gap-1 font-mono font-medium">
                    <Phone className="size-3 text-primary" />+{lead.phone}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Budget</dt>
                  <dd className="mt-0.5 font-medium">{lead.budget ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Timeline</dt>
                  <dd className="mt-0.5 font-medium">{lead.timeline ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Owner</dt>
                  <dd className="mt-0.5 font-medium">
                    {lead.assignedAgentName ?? "Unassigned"}
                  </dd>
                </div>
              </dl>

              {(lead.message || lead.email) && (
                <div className="mt-3 space-y-1 rounded-xl bg-muted/40 p-3 text-[10px] leading-5">
                  {lead.email && (
                    <p className="text-muted-foreground">{lead.email}</p>
                  )}
                  {lead.message && <p>{lead.message}</p>}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
