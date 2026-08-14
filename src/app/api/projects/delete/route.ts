import { authorizeStudioRequest } from "@/lib/supabase/api-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { unpublishProperty } from "@/lib/published-properties";
import type { Property } from "@/lib/property-data";

/**
 * Deleting locally is no longer enough now that the studio hydrates from the
 * shared inventory — without this the project would reappear on next load.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return Response.json({ skipped: true });
  if (!(await authorizeStudioRequest())) {
    return Response.json({ error: "Not authorised." }, { status: 401 });
  }

  try {
    const input = (await request.json()) as { propertyId?: unknown };
    const propertyId =
      typeof input.propertyId === "string" ? input.propertyId.trim() : "";
    if (!propertyId) {
      return Response.json({ error: "Missing project id." }, { status: 400 });
    }

    const supabase = await createClient();
    // Read the slug before the row goes — the public snapshot is keyed on it,
    // and without it the listing would stay on the site with nothing left in
    // the studio to remove it with.
    const { data: row } = await supabase
      .from("properties")
      .select("data")
      .eq("id", propertyId)
      .maybeSingle();
    const slug = (row?.data as Property | undefined)?.slug;

    await supabase.from("property_documents").delete().eq("property_id", propertyId);
    const { error } = await supabase
      .from("properties")
      .delete()
      .eq("id", propertyId);
    if (error) throw error;

    if (slug) await unpublishProperty(slug);

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Could not delete project.",
      },
      { status: 500 },
    );
  }
}
