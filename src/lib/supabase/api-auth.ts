import "server-only";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function authorizeStudioRequest() {
  // Fail closed. Returning true here authorised every studio write — save,
  // delete, uploads, brochure extraction — for anyone at all whenever the
  // Supabase config was missing.
  if (!isSupabaseConfigured()) return false;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;
  if (!userId) return false;
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", userId)
    .single();
  return profile?.is_active === true;
}
