import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type StudioRole = "admin" | "agent";

export interface StudioProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  whatsapp: string;
  role: StudioRole;
  avatarUrl?: string;
  mustChangePassword: boolean;
  demo: boolean;
}

export const getStudioProfile = cache(async (): Promise<StudioProfile> => {
  // Fail closed. This previously handed back a full admin profile whenever
  // Supabase config was missing, which meant a single absent env var — on a
  // preview deploy, a bad rename, a partial rollout — silently opened the
  // entire studio to anyone who visited it, with no login at all.
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;
  if (!userId) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, phone, whatsapp, role, avatar_url, is_active, must_change_password",
    )
    .eq("id", userId)
    .single();

  if (!profile?.is_active) {
    await supabase.auth.signOut();
    redirect("/login?error=inactive");
  }

  return {
    id: profile.id,
    fullName: profile.full_name,
    email: profile.email,
    phone: profile.phone,
    whatsapp: profile.whatsapp,
    role: profile.role as StudioRole,
    avatarUrl: profile.avatar_url ?? undefined,
    mustChangePassword: profile.must_change_password,
    demo: false,
  };
});

export async function requireAdmin() {
  const profile = await getStudioProfile();
  if (profile.role !== "admin") redirect("/dashboard");
  return profile;
}
