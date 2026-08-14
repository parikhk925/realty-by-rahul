import { AgentDashboard } from "@/components/studio/agent-dashboard";
import { getStudioProfile } from "@/lib/supabase/session";

export default async function DashboardPage() {
  const profile = await getStudioProfile();
  return <AgentDashboard demo={profile.demo} />;
}
