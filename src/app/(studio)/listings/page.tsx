import { ListingsWorkspace } from "@/components/studio/listings-workspace";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getStudioProfile } from "@/lib/supabase/session";

export default async function ListingsPage() {
  const profile = await getStudioProfile();
  if (!isSupabaseConfigured() || profile.demo) {
    return <ListingsWorkspace demo />;
  }
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, whatsapp, avatar_url")
    .eq("is_active", true)
    .in("role", profile.role === "admin" ? ["admin", "agent"] : ["agent"])
    .order("full_name");
  const agents = (profiles ?? [])
    .filter((agent) => profile.role === "admin" || agent.id === profile.id)
    .map((agent) => ({
      id: agent.id,
      fullName: agent.full_name,
      whatsapp: agent.whatsapp,
      avatarUrl: agent.avatar_url ?? undefined,
    }));
  return <ListingsWorkspace agents={agents} />;
}
