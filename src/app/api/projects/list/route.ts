import { isProperty, normalizePropertyAvailability } from "@/lib/property-data";
import { authorizeStudioRequest } from "@/lib/supabase/api-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * The shared inventory. Studio devices hydrate from here so a project added on
 * one machine is visible to the whole team, rather than living in whichever
 * browser happened to create it.
 */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return Response.json({ skipped: true, properties: [] });
  }
  if (!(await authorizeStudioRequest())) {
    return Response.json({ error: "Not authorised." }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("properties")
      .select("data, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw error;

    // A single malformed row must not blank the whole portfolio.
    const properties = (data ?? [])
      .map((row) => row.data)
      .filter(isProperty)
      .map(normalizePropertyAvailability);

    return Response.json({ properties });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Could not load projects.",
      },
      { status: 500 },
    );
  }
}
