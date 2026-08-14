import type { Lead } from "./types";

/**
 * In-memory lead store.
 *
 * Kept on globalThis so it survives dev hot-reload. Swapping this for a
 * Supabase table is a change to this file alone — nothing else reads the
 * underlying structure directly.
 */

interface Store {
  leads: Map<string, Lead>;
}

const globalStore = globalThis as unknown as { __rbrCrm?: Store };

function store(): Store {
  if (!globalStore.__rbrCrm) globalStore.__rbrCrm = { leads: new Map() };
  return globalStore.__rbrCrm;
}

export function findLeadByVisitor(visitorId: string): Lead | undefined {
  for (const lead of store().leads.values()) {
    if (lead.visitorId === visitorId) return lead;
  }
  return undefined;
}

export function saveLead(lead: Lead): Lead {
  store().leads.set(lead.id, lead);
  return lead;
}

export function listLeads(): Lead[] {
  return [...store().leads.values()].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export function getLead(id: string): Lead | undefined {
  return store().leads.get(id);
}
