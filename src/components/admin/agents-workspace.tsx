"use client";

import { useState, useTransition } from "react";
import {
  Check,
  Copy,
  KeyRound,
  LoaderCircle,
  MessageCircleMore,
  MoreHorizontal,
  Plus,
  Power,
  ShieldCheck,
  UserPlus,
  UsersRound,
} from "lucide-react";
import {
  createAgent,
  resetAgentPassword,
  setAgentActive,
  type AgentCredentials,
} from "@/app/(studio)/agents/actions";
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
import { cn } from "@/lib/utils";

export interface AgentRow {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  active: boolean;
  shares: number;
  customers: number;
  visits: number;
  completedVisits: number;
  listings: number;
}

interface AgentsWorkspaceProps {
  agents: AgentRow[];
  demo: boolean;
}

function CredentialsPanel({
  credentials,
}: {
  credentials: AgentCredentials;
}) {
  const [copied, setCopied] = useState(false);
  const message = `Welcome to Realty by Rahul.\n\nEmail: ${credentials.email}\nTemporary password: ${credentials.temporaryPassword}\n\nPlease sign in and change your password immediately.`;
  const copy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
      <div className="flex items-center gap-2 text-emerald-700">
        <ShieldCheck className="size-4" />
        <p className="text-xs font-semibold">Temporary credentials ready</p>
      </div>
      <div className="mt-3 rounded-xl bg-white p-3 font-mono text-[10px] leading-5">
        <p>{credentials.email}</p>
        <p>{credentials.temporaryPassword}</p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={() => void copy()}>
          {copied ? <Check /> : <Copy />}
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button asChild type="button">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircleMore />
            WhatsApp
          </a>
        </Button>
      </div>
    </div>
  );
}

export function AgentsWorkspace({ agents, demo }: AgentsWorkspaceProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [credentials, setCredentials] = useState<AgentCredentials>();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = (formData: FormData) => {
    startTransition(async () => {
      setError("");
      const result = await createAgent(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setCredentials(result.credentials);
    });
  };

  const manage = (
    action: () => Promise<{
      error?: string;
      credentials?: AgentCredentials;
    }>,
  ) => {
    startTransition(async () => {
      setError("");
      const result = await action();
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.credentials) {
        setCredentials(result.credentials);
        setDialogOpen(true);
      }
    });
  };

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-7 sm:py-8">
      <header className="flex items-end justify-between gap-4">
        <div>
          <Badge className="border-primary/15 bg-primary/[0.07] text-primary">
            <UsersRound className="size-3" />
            Team administration
          </Badge>
          <h1 className="mt-4 text-[28px] font-semibold tracking-[-0.045em] sm:text-4xl">
            Agents
          </h1>
          <p className="mt-1 text-[10px] text-muted-foreground sm:text-xs">
            Create accounts, review ownership and track client activity.
          </p>
        </div>
        <Button
          aria-label="Add agent"
          onClick={() => {
            setCredentials(undefined);
            setError("");
            setDialogOpen(true);
          }}
          className="h-11 rounded-xl"
        >
          <Plus />
          <span className="hidden sm:inline">Add agent</span>
        </Button>
      </header>

      {demo && (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/75 p-4 text-[10px] leading-5 text-amber-900">
          Preview mode is active. The team interface is ready; creating or
          resetting live accounts becomes available after the database is connected.
        </div>
      )}
      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-destructive/[0.06] p-3 text-[10px] text-destructive">
          {error}
        </p>
      )}

      <section className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent) => (
          <article
            key={agent.id}
            className="rounded-[26px] border border-white/85 bg-white/78 p-4 shadow-[0_18px_48px_rgba(42,75,137,.09)] backdrop-blur-2xl transition-transform hover:-translate-y-1"
          >
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/[0.08] text-sm font-semibold text-primary">
                {agent.fullName
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{agent.fullName}</p>
                <p className="mt-0.5 truncate text-[9px] text-muted-foreground">
                  {agent.email}
                </p>
                <p className="mt-1 font-mono text-[9px] text-primary">
                  +{agent.phone}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label={`Manage ${agent.fullName}`}>
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    disabled={pending}
                    onSelect={() => manage(() => resetAgentPassword(agent.id))}
                  >
                    <KeyRound />
                    Reset password
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={pending}
                    onSelect={() =>
                      manage(() => setAgentActive(agent.id, !agent.active))
                    }
                  >
                    <Power />
                    {agent.active ? "Deactivate" : "Activate"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Badge
              className={cn(
                "mt-4 border-0",
                agent.active
                  ? "bg-emerald-500/10 text-emerald-700"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <span className={cn("size-1.5 rounded-full", agent.active ? "bg-emerald-500" : "bg-muted-foreground")} />
              {agent.active ? "Active" : "Inactive"}
            </Badge>
            <div className="mt-4 grid grid-cols-3 divide-x rounded-2xl bg-[#f6f9ff] py-3 text-center">
              {[
                ["Listings", agent.listings],
                ["Shares", agent.shares],
                ["Customers", agent.customers],
              ].map(([label, value]) => (
                <div key={String(label)} className="px-2">
                  <p className="text-base font-semibold">{value}</p>
                  <p className="mt-0.5 text-[8px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl border px-3 py-2.5 text-[9px]">
              <span className="text-muted-foreground">Site visits completed</span>
              <span className="font-semibold">
                {agent.completedVisits} / {agent.visits}
              </span>
            </div>
          </article>
        ))}
      </section>

      {agents.length === 0 && (
        <div className="mt-5 flex min-h-[280px] flex-col items-center justify-center rounded-[28px] border border-dashed bg-white/55 text-center">
          <UserPlus className="size-6 text-primary" />
          <p className="mt-3 text-sm font-semibold">No agents yet</p>
          <p className="mt-1 text-[9px] text-muted-foreground">
            Add the first team member to create secure credentials.
          </p>
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setCredentials(undefined);
            setError("");
          }
        }}
      >
        <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-[26px] sm:max-w-[480px]">
          <DialogHeader>
            <span className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-primary/[0.08] text-primary">
              {credentials ? <ShieldCheck className="size-5" /> : <UserPlus className="size-5" />}
            </span>
            <DialogTitle>
              {credentials ? "Agent credentials" : "Add an agent"}
            </DialogTitle>
            <DialogDescription>
              {credentials
                ? "Share these once. The agent must change the temporary password after signing in."
                : "Create a secure account with a Dubai-ready WhatsApp number."}
            </DialogDescription>
          </DialogHeader>
          {credentials ? (
            <CredentialsPanel credentials={credentials} />
          ) : (
            <form action={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="agent-name">Full name</Label>
                <Input id="agent-name" name="fullName" required placeholder="Agent name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agent-email">Work email</Label>
                <Input id="agent-email" name="email" type="email" required placeholder="agent@company.ae" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agent-phone">WhatsApp number</Label>
                <Input
                  id="agent-phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  required
                  placeholder="+971 50 123 4567"
                />
              </div>
              {error && <p className="text-[10px] text-destructive">{error}</p>}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending || demo}>
                  {pending ? <LoaderCircle className="animate-spin" /> : <UserPlus />}
                  {pending ? "Creating…" : "Create agent"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
