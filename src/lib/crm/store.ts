import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Lead } from "./types";

/**
 * Lead persistence.
 *
 * Backed by Supabase when CRM_SUPABASE_URL and CRM_SUPABASE_SERVICE_ROLE_KEY
 * are set, otherwise an in-memory map so the product still runs with no setup.
 *
 * These are deliberately *not* the NEXT_PUBLIC_SUPABASE_* variables the studio
 * auth uses: setting those switches on the login gate and closes the demo
 * studio. Leads persist independently of that decision.
 *
 * The service-role key bypasses RLS, which is why `crm_leads` has RLS on with
 * no policies — the server is the only thing that may touch it, and the key
 * never reaches the browser.
 */

interface MemoryStore {
  leads: Map<string, Lead>;
}

const globalStore = globalThis as unknown as {
  __rbrCrm?: MemoryStore;
  __rbrCrmClient?: SupabaseClient | null;
};

function memory(): MemoryStore {
  if (!globalStore.__rbrCrm) globalStore.__rbrCrm = { leads: new Map() };
  return globalStore.__rbrCrm;
}

function client(): SupabaseClient | null {
  if (globalStore.__rbrCrmClient !== undefined) return globalStore.__rbrCrmClient;

  const url = process.env.CRM_SUPABASE_URL?.trim();
  const key = process.env.CRM_SUPABASE_SERVICE_ROLE_KEY?.trim();

  globalStore.__rbrCrmClient =
    url && key
      ? createClient(url, key, { auth: { persistSession: false } })
      : null;

  return globalStore.__rbrCrmClient;
}

export function isLeadStorePersistent() {
  return client() !== null;
}

/** Database row → domain object. */
function toLead(row: Record<string, unknown>): Lead {
  return {
    id: row.id as string,
    visitorId: row.visitor_id as string,
    name: (row.name as string) ?? undefined,
    phone: (row.phone as string) ?? undefined,
    requirements: (row.requirements ?? {}) as Lead["requirements"],
    score: (row.score as number) ?? 0,
    temperature: (row.temperature as Lead["temperature"]) ?? "cold",
    breakdown: (row.breakdown ?? []) as Lead["breakdown"],
    conversation: (row.conversation ?? []) as Lead["conversation"],
    recommended: (row.recommended ?? []) as Lead["recommended"],
    stage: (row.stage as string) ?? "New",
    nextAction: (row.next_action as string) ?? "",
    summary: (row.summary as string) ?? "",
    viewingRequested: Boolean(row.viewing_requested),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function toRow(lead: Lead) {
  return {
    id: lead.id,
    visitor_id: lead.visitorId,
    name: lead.name ?? null,
    phone: lead.phone ?? null,
    requirements: lead.requirements,
    score: lead.score,
    temperature: lead.temperature,
    breakdown: lead.breakdown,
    conversation: lead.conversation,
    recommended: lead.recommended,
    stage: lead.stage,
    next_action: lead.nextAction,
    summary: lead.summary,
    viewing_requested: lead.viewingRequested,
    created_at: lead.createdAt,
    updated_at: lead.updatedAt,
  };
}

export async function findLeadByVisitor(visitorId: string): Promise<Lead | undefined> {
  const db = client();
  if (!db) {
    for (const lead of memory().leads.values()) {
      if (lead.visitorId === visitorId) return lead;
    }
    return undefined;
  }

  const { data, error } = await db
    .from("crm_leads")
    .select("*")
    .eq("visitor_id", visitorId)
    .maybeSingle();

  if (error) {
    console.error("crm.find_lead_failed", error.message);
    return undefined;
  }
  return data ? toLead(data) : undefined;
}

export async function saveLead(lead: Lead): Promise<Lead> {
  const db = client();
  if (!db) {
    memory().leads.set(lead.id, lead);
    return lead;
  }

  // Conflict on visitor_id, not id: a returning visitor must update their own
  // row rather than insert a second one.
  const { error } = await db
    .from("crm_leads")
    .upsert(toRow(lead), { onConflict: "visitor_id" });

  if (error) {
    // A storage failure must never break the conversation — keep the lead in
    // memory for this instance so the reply still goes out.
    console.error("crm.save_lead_failed", error.message);
    memory().leads.set(lead.id, lead);
  }
  return lead;
}

export async function listLeads(): Promise<Lead[]> {
  const db = client();
  if (!db) {
    return [...memory().leads.values()].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }

  const { data, error } = await db
    .from("crm_leads")
    .select("*")
    .order("score", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("crm.list_leads_failed", error.message);
    return [];
  }
  return (data ?? []).map(toLead);
}

export async function getLead(id: string): Promise<Lead | undefined> {
  const db = client();
  if (!db) return memory().leads.get(id);

  const { data, error } = await db
    .from("crm_leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("crm.get_lead_failed", error.message);
    return undefined;
  }
  return data ? toLead(data) : undefined;
}
