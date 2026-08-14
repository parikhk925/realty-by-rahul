"use client";

import { useMemo, useState, useTransition } from "react";
import {
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  CircleX,
  LoaderCircle,
  MapPin,
  MessageCircleMore,
  MoreHorizontal,
  Target,
  Trash2,
  UserRoundX,
} from "lucide-react";
import {
  deleteSiteVisit,
  scheduleSiteVisit,
  setSiteVisitTarget,
  updateSiteVisitStatus,
  type SiteVisitStatus,
} from "@/app/(studio)/site-visits/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface SiteVisitRow {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyLocation: string;
  agentId: string;
  agentName: string;
  customerName: string;
  customerPhone: string;
  scheduledAt: string;
  status: SiteVisitStatus;
  notes?: string;
}

export interface SiteVisitTargetRow {
  id: string;
  agentId: string;
  agentName: string;
  periodStart: string;
  periodEnd: string;
  targetCount: number;
}

interface SiteVisitsWorkspaceProps {
  visits: SiteVisitRow[];
  targets: SiteVisitTargetRow[];
  properties: Array<{ id: string; title: string; location: string }>;
  agents: Array<{ id: string; fullName: string }>;
  currentAgentId: string;
  isAdmin: boolean;
  demo: boolean;
}

const statusLabel: Record<SiteVisitStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
};

function toLocalInput(value: Date) {
  const local = new Date(value);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().slice(0, 16);
}

function localInputTomorrow() {
  const value = new Date();
  value.setDate(value.getDate() + 1);
  value.setHours(11, 0, 0, 0);
  return toLocalInput(value);
}

/** A viewing can only be arranged for a time that has not already passed. */
function localInputNow() {
  return toLocalInput(new Date());
}

function todayInput() {
  return toLocalInput(new Date()).slice(0, 10);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-AE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function SiteVisitsWorkspace({
  visits,
  targets,
  properties,
  agents,
  currentAgentId,
  isAdmin,
  demo,
}: SiteVisitsWorkspaceProps) {
  const [filter, setFilter] = useState<"all" | SiteVisitStatus>("all");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [targetOpen, setTargetOpen] = useState(false);
  const [propertyId, setPropertyId] = useState("");
  const [scheduledAt, setScheduledAt] = useState(localInputTomorrow);
  const [periodStart, setPeriodStart] = useState(todayInput);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const visible = visits.filter(
    (visit) => filter === "all" || visit.status === filter,
  );
  const relevantTargets = isAdmin
    ? targets
    : targets.filter((target) => target.agentId === currentAgentId);
  const progress = useMemo(
    () =>
      relevantTargets.map((target) => {
        const completed = visits.filter(
          (visit) =>
            visit.agentId === target.agentId &&
            visit.status === "completed" &&
            visit.scheduledAt.slice(0, 10) >= target.periodStart &&
            visit.scheduledAt.slice(0, 10) <= target.periodEnd,
        ).length;
        return {
          ...target,
          completed,
          percent: Math.min(100, Math.round((completed / target.targetCount) * 100)),
        };
      }),
    [relevantTargets, visits],
  );

  const run = (action: () => Promise<{ error?: string }>) => {
    startTransition(async () => {
      setError("");
      const result = await action();
      if (result.error) setError(result.error);
    });
  };

  const submitVisit = (formData: FormData) => {
    formData.set("propertyId", propertyId);
    formData.set("scheduledAt", scheduledAt);
    startTransition(async () => {
      setError("");
      const result = await scheduleSiteVisit(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setScheduleOpen(false);
      setPropertyId("");
      setScheduledAt(localInputTomorrow());
    });
  };

  const submitTarget = (formData: FormData) => {
    startTransition(async () => {
      setError("");
      const result = await setSiteVisitTarget(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setTargetOpen(false);
    });
  };

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-7 sm:py-8">
      <header className="flex items-end justify-between gap-3">
        <div>
          <Badge className="border-primary/15 bg-primary/[0.07] text-primary">
            <CalendarClock className="size-3" />
            {visits.filter((visit) => visit.status === "scheduled").length} upcoming
          </Badge>
          <h1 className="mt-4 text-[28px] font-semibold tracking-[-0.045em] sm:text-4xl">
            Site visits
          </h1>
          <p className="mt-1 text-[10px] text-muted-foreground sm:text-xs">
            Schedule viewings and keep every customer hand-off accountable.
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button
              variant="outline"
              onClick={() => setTargetOpen(true)}
              className="hidden h-11 rounded-xl sm:inline-flex"
            >
              <Target />
              Set target
            </Button>
          )}
          <Button
            aria-label="Schedule visit"
            onClick={() => setScheduleOpen(true)}
            className="h-11 rounded-xl"
          >
            <CalendarPlus />
            <span className="hidden sm:inline">Schedule visit</span>
          </Button>
        </div>
      </header>

      {demo && (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/75 p-4 text-[10px] leading-5 text-amber-900">
          Preview mode is showing sample visits. Scheduling becomes live after
          the database connection is enabled.
        </div>
      )}
      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-destructive/[0.06] p-3 text-[10px] text-destructive">
          {error}
        </p>
      )}

      {progress.length > 0 && (
        <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {progress.map((target) => (
            <div
              key={target.id}
              className="rounded-[24px] border border-white/85 bg-white/78 p-4 shadow-[0_16px_42px_rgba(42,75,137,.08)] backdrop-blur-xl"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-[10px] font-semibold">
                  {isAdmin ? target.agentName : "Your visit target"}
                </p>
                <Badge variant="outline">
                  {target.periodStart} – {target.periodEnd}
                </Badge>
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
                {target.completed}
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}
                  / {target.targetCount}
                </span>
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary/10">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#4381ff,#20b77a)]"
                  style={{ width: `${target.percent}%` }}
                />
              </div>
            </div>
          ))}
        </section>
      )}

      <div className="hide-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1">
        {(["all", "scheduled", "completed", "cancelled", "no_show"] as const).map(
          (status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              className={cn(
                "h-9 shrink-0 rounded-full border bg-white px-3 text-[9px] font-semibold text-muted-foreground transition",
                filter === status &&
                  "border-primary/25 bg-primary/[0.08] text-primary",
              )}
            >
              {status === "all" ? "All" : statusLabel[status]}{" "}
              {status === "all"
                ? visits.length
                : visits.filter((visit) => visit.status === status).length}
            </button>
          ),
        )}
      </div>

      <section className="mt-4 grid gap-3 lg:grid-cols-2">
        {visible.map((visit) => (
          <article
            key={visit.id}
            className="rounded-[24px] border border-white/85 bg-white/80 p-4 shadow-[0_16px_44px_rgba(42,75,137,.08)] backdrop-blur-xl"
          >
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/[0.08] text-primary">
                <CalendarClock className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {visit.propertyTitle}
                </p>
                <p className="mt-1 flex items-center gap-1 text-[9px] text-muted-foreground">
                  <MapPin className="size-3" />
                  {visit.propertyLocation}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label={`Manage ${visit.propertyTitle} visit`}>
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    disabled={pending || visit.status === "completed"}
                    onSelect={() =>
                      run(() => updateSiteVisitStatus(visit.id, "completed"))
                    }
                  >
                    <CheckCircle2 />
                    Mark completed
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={pending || visit.status === "no_show"}
                    onSelect={() =>
                      run(() => updateSiteVisitStatus(visit.id, "no_show"))
                    }
                  >
                    <UserRoundX />
                    Mark no show
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={pending || visit.status === "cancelled"}
                    onSelect={() =>
                      run(() => updateSiteVisitStatus(visit.id, "cancelled"))
                    }
                  >
                    <CircleX />
                    Cancel
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={pending}
                    onSelect={() => run(() => deleteSiteVisit(visit.id))}
                  >
                    <Trash2 />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="mt-4 grid grid-cols-[1fr_auto] gap-3 rounded-2xl bg-[#f6f9ff] p-3">
              <div>
                <p className="text-xs font-semibold">{visit.customerName}</p>
                <p className="mt-1 font-mono text-[9px] text-primary">
                  +{visit.customerPhone}
                </p>
              </div>
              <Badge
                className={cn(
                  "border-0",
                  visit.status === "completed"
                    ? "bg-emerald-500/10 text-emerald-700"
                    : visit.status === "scheduled"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {statusLabel[visit.status]}
              </Badge>
              <p className="col-span-2 text-[10px] font-semibold">
                {formatDate(visit.scheduledAt)}
              </p>
              {isAdmin && (
                <p className="col-span-2 text-[9px] text-muted-foreground">
                  Assigned to {visit.agentName}
                </p>
              )}
            </div>
            {visit.notes && (
              <p className="mt-3 text-[9px] leading-5 text-muted-foreground">
                {visit.notes}
              </p>
            )}
            <Button asChild variant="outline" className="mt-3 h-10 w-full rounded-xl">
              <a
                href={`https://wa.me/${visit.customerPhone}?text=${encodeURIComponent(
                  `Hi ${visit.customerName.split(" ")[0]}, confirming your property viewing for ${visit.propertyTitle} on ${formatDate(visit.scheduledAt)}.`,
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircleMore />
                Confirm on WhatsApp
              </a>
            </Button>
          </article>
        ))}
      </section>

      {visible.length === 0 && (
        <div className="mt-4 flex min-h-[280px] flex-col items-center justify-center rounded-[28px] border border-dashed bg-white/55 text-center">
          <CalendarClock className="size-6 text-primary" />
          <p className="mt-3 text-sm font-semibold">No visits in this view</p>
          <p className="mt-1 text-[9px] text-muted-foreground">
            Schedule a property viewing or choose another status.
          </p>
        </div>
      )}

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-[26px] sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule a site visit</DialogTitle>
            <DialogDescription>
              Link the customer, property and responsible agent in one step.
            </DialogDescription>
          </DialogHeader>
          <form action={submitVisit} className="space-y-4">
            <div className="space-y-2">
              <Label>Property</Label>
              <Select value={propertyId} onValueChange={setPropertyId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="visit-customer">Customer name</Label>
              <Input id="visit-customer" name="customerName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visit-phone">WhatsApp number</Label>
              <Input
                id="visit-phone"
                name="customerPhone"
                type="tel"
                inputMode="tel"
                placeholder="+971 50 123 4567"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visit-date">Date and time</Label>
              <Input
                id="visit-date"
                type="datetime-local"
                min={localInputNow()}
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visit-notes">Notes</Label>
              <Textarea
                id="visit-notes"
                name="notes"
                placeholder="Meeting point, access instructions or customer preferences…"
              />
            </div>
            {error && <p className="text-[10px] text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setScheduleOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending || demo || !propertyId}>
                {pending ? <LoaderCircle className="animate-spin" /> : <CalendarPlus />}
                {pending ? "Scheduling…" : "Schedule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={targetOpen} onOpenChange={setTargetOpen}>
        <DialogContent className="rounded-[26px] sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Assign a site-visit target</DialogTitle>
            <DialogDescription>
              Set a clear viewing target for an active agent and date range.
            </DialogDescription>
          </DialogHeader>
          <form action={submitTarget} className="space-y-4">
            <div className="space-y-2">
              <Label>Agent</Label>
              <Select name="agentId" required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose an agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-count">Completed visits target</Label>
              <Input id="target-count" name="targetCount" type="number" min={1} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="target-start">Start</Label>
                <Input
                  id="target-start"
                  name="periodStart"
                  type="date"
                  value={periodStart}
                  onChange={(event) => setPeriodStart(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target-end">End</Label>
                <Input
                  id="target-end"
                  name="periodEnd"
                  type="date"
                  // A period cannot finish before it starts.
                  min={periodStart || undefined}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTargetOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending || demo}>
                {pending ? <LoaderCircle className="animate-spin" /> : <Target />}
                Set target
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
