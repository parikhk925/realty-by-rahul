import { AgentsWorkspace, type AgentRow } from "@/components/admin/agents-workspace";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/session";

export const metadata = { title: "Agents" };

const demoAgents: AgentRow[] = [
  {
    id: "demo-agent-1",
    fullName: "Rohan Mehta",
    email: "rohan@realtybyrahul.ae",
    phone: "971501234567",
    active: true,
    shares: 38,
    customers: 16,
    visits: 9,
    completedVisits: 7,
    listings: 12,
  },
  {
    id: "demo-agent-2",
    fullName: "Sara Khan",
    email: "sara@realtybyrahul.ae",
    phone: "971552345678",
    active: true,
    shares: 29,
    customers: 13,
    visits: 8,
    completedVisits: 6,
    listings: 9,
  },
];

export default async function AgentsPage() {
  const currentProfile = await requireAdmin();
  if (!isSupabaseConfigured() || currentProfile.demo) {
    return <AgentsWorkspace agents={demoAgents} demo />;
  }

  const supabase = await createClient();
  const [
    { data: profiles },
    { data: shares },
    { data: visits },
    { data: properties },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, phone, is_active")
      .eq("role", "agent")
      .order("full_name"),
    supabase.from("property_shares").select("agent_id, customer_id"),
    supabase.from("site_visits").select("agent_id, status"),
    supabase.from("properties").select("assigned_agent_id"),
  ]);

  const rows: AgentRow[] = (profiles ?? []).map((profile) => {
    const agentShares = (shares ?? []).filter(
      (share) => share.agent_id === profile.id,
    );
    const agentVisits = (visits ?? []).filter(
      (visit) => visit.agent_id === profile.id,
    );
    return {
      id: profile.id,
      fullName: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      active: profile.is_active,
      shares: agentShares.length,
      customers: new Set(
        agentShares
          .map((share) => share.customer_id)
          .filter((value): value is string => Boolean(value)),
      ).size,
      visits: agentVisits.length,
      completedVisits: agentVisits.filter(
        (visit) => visit.status === "completed",
      ).length,
      listings: (properties ?? []).filter(
        (property) => property.assigned_agent_id === profile.id,
      ).length,
    };
  });

  return <AgentsWorkspace agents={rows} demo={false} />;
}
