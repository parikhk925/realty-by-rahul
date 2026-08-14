import {
  SiteVisitsWorkspace,
  type SiteVisitRow,
} from "@/components/studio/site-visits-workspace";
import { properties as seedProperties } from "@/lib/property-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getStudioProfile } from "@/lib/supabase/session";

export const metadata = { title: "Site visits" };

const demoVisitSeeds = [
  {
    id: "demo-visit-1",
    agentId: "demo-rahul",
    agentName: "Rahul",
    customerName: "Omar Hassan",
    customerPhone: "971552345678",
    scheduledAt: new Date(Date.now() + 86_400_000).toISOString(),
    status: "scheduled" as const,
    notes: "Meet at the sales gallery reception.",
  },
  {
    id: "demo-visit-2",
    agentId: "demo-agent-1",
    agentName: "Rohan Mehta",
    customerName: "Aisha Al Mansoori",
    customerPhone: "971501234567",
    scheduledAt: new Date(Date.now() - 172_800_000).toISOString(),
    status: "completed" as const,
  },
];

// Built by zipping against whatever seed inventory exists rather than
// indexing into it. The seed list is empty now that the workspace runs on
// real Supabase listings, and indexing it crashed the build at module load.
const demoVisits: SiteVisitRow[] = demoVisitSeeds.flatMap((visit, index) => {
  const property = seedProperties[index];
  if (!property) return [];
  return [
    {
      ...visit,
      propertyId: property.id,
      propertyTitle: property.title,
      propertyLocation: property.location,
    },
  ];
});

export default async function SiteVisitsPage() {
  const profile = await getStudioProfile();
  if (!isSupabaseConfigured() || profile.demo) {
    return (
      <SiteVisitsWorkspace
        visits={demoVisits}
        targets={[
          {
            id: "demo-target",
            agentId: profile.id,
            agentName: profile.fullName,
            periodStart: new Date().toISOString().slice(0, 8) + "01",
            periodEnd: new Date(
              new Date().getFullYear(),
              new Date().getMonth() + 1,
              0,
            )
              .toISOString()
              .slice(0, 10),
            targetCount: 12,
          },
        ]}
        properties={seedProperties.map((property) => ({
          id: property.id,
          title: property.title,
          location: property.location,
        }))}
        agents={[
          { id: "demo-agent-1", fullName: "Rohan Mehta" },
          { id: "demo-agent-2", fullName: "Sara Khan" },
        ]}
        currentAgentId={profile.id}
        isAdmin={profile.role === "admin"}
        demo
      />
    );
  }

  const supabase = await createClient();
  const [
    { data: visits },
    { data: properties },
    { data: agents },
    { data: targets },
  ] = await Promise.all([
    supabase.from("site_visits").select("*").order("scheduled_at", {
      ascending: false,
    }),
    supabase
      .from("properties")
      .select("id, title, data")
      .order("title"),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "agent")
      .eq("is_active", true)
      .order("full_name"),
    supabase
      .from("site_visit_targets")
      .select("*")
      .order("period_start", { ascending: false }),
  ]);

  const propertyMap = new Map(
    (properties ?? []).map((property) => [
      property.id,
      {
        title: property.title,
        location:
          typeof property.data === "object" &&
          property.data &&
          "location" in property.data
            ? String(property.data.location)
            : "Dubai",
      },
    ]),
  );
  const agentMap = new Map(
    (agents ?? []).map((agent) => [agent.id, agent.full_name]),
  );
  agentMap.set(profile.id, profile.fullName);

  return (
    <SiteVisitsWorkspace
      visits={(visits ?? []).map((visit) => ({
        id: visit.id,
        propertyId: visit.property_id,
        propertyTitle:
          propertyMap.get(visit.property_id)?.title ?? "Property removed",
        propertyLocation:
          propertyMap.get(visit.property_id)?.location ?? "Dubai",
        agentId: visit.agent_id,
        agentName: agentMap.get(visit.agent_id) ?? "Unknown agent",
        customerName: visit.customer_name,
        customerPhone: visit.customer_phone,
        scheduledAt: visit.scheduled_at,
        status: visit.status,
        notes: visit.notes ?? undefined,
      }))}
      targets={(targets ?? []).map((target) => ({
        id: target.id,
        agentId: target.agent_id,
        agentName: agentMap.get(target.agent_id) ?? "Unknown agent",
        periodStart: target.period_start,
        periodEnd: target.period_end,
        targetCount: target.target_count,
      }))}
      properties={(properties ?? []).map((property) => ({
        id: property.id,
        title: property.title,
        location: propertyMap.get(property.id)?.location ?? "Dubai",
      }))}
      agents={(agents ?? []).map((agent) => ({
        id: agent.id,
        fullName: agent.full_name,
      }))}
      currentAgentId={profile.id}
      isAdmin={profile.role === "admin"}
      demo={false}
    />
  );
}
