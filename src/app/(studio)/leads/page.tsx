import {
  LeadsWorkspace,
  type LeadRow,
} from "@/components/studio/leads-workspace";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getStudioProfile } from "@/lib/supabase/session";

export const metadata = { title: "Leads" };

const demoLeads: LeadRow[] = [
  {
    id: "demo-lead-1",
    name: "Priya Nair",
    phone: "971501234567",
    email: "priya@example.com",
    budget: "AED 2M – 5M",
    timeline: "Within 1 month",
    message: "Looking for a high floor with a marina view.",
    propertyTitle: "Bayview Residences",
    source: "listing",
    status: "new",
    assignedAgentId: null,
    assignedAgentName: null,
    createdAt: new Date(Date.now() - 3_600_000).toISOString(),
  },
  {
    id: "demo-lead-2",
    name: "Omar Hassan",
    phone: "971552345678",
    email: null,
    budget: "AED 1M – 2M",
    timeline: "1 – 3 months",
    message: null,
    propertyTitle: "Azure Creek",
    source: "listing",
    status: "contacted",
    assignedAgentId: null,
    assignedAgentName: "Rohan Mehta",
    createdAt: new Date(Date.now() - 172_800_000).toISOString(),
  },
];

export default async function LeadsPage() {
  const profile = await getStudioProfile();

  if (!isSupabaseConfigured() || profile.demo) {
    return <LeadsWorkspace leads={demoLeads} agents={[]} demo />;
  }

  const supabase = await createClient();
  const [{ data: leads }, { data: agents }] = await Promise.all([
    supabase.from("leads").select("*").order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("is_active", true)
      .order("full_name"),
  ]);

  const agentNames = new Map(
    (agents ?? []).map((agent) => [agent.id, agent.full_name]),
  );

  const rows: LeadRow[] = (leads ?? []).map((lead) => ({
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    budget: lead.budget,
    timeline: lead.timeline,
    message: lead.message,
    propertyTitle: lead.property_title,
    source: lead.source,
    status: lead.status as LeadRow["status"],
    assignedAgentId: lead.assigned_agent_id,
    assignedAgentName: lead.assigned_agent_id
      ? (agentNames.get(lead.assigned_agent_id) ?? "Unknown")
      : null,
    createdAt: lead.created_at,
  }));

  return (
    <LeadsWorkspace
      leads={rows}
      agents={(agents ?? []).map((agent) => ({
        id: agent.id,
        fullName: agent.full_name,
      }))}
    />
  );
}
