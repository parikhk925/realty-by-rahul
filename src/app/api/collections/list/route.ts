import { authorizeStudioRequest } from "@/lib/supabase/api-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Every shortlist the team has built, newest first. */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return Response.json({ skipped: true, collections: [] });
  }
  if (!(await authorizeStudioRequest())) {
    return Response.json({ error: "Not authorised." }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const [{ data, error }, { data: profiles }] = await Promise.all([
      supabase.from("collections").select("*").order("updated_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name"),
    ]);
    if (error) throw error;

    const names = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
    const collections = (data ?? []).map((row) => ({
      id: row.id,
      publicId: row.public_id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      status: row.status as "Published" | "Draft",
      propertyIds: row.property_ids ?? [],
      createdBy: row.created_by,
      // Agents cannot read every profile, so an unresolved owner is omitted
      // rather than shown as "Unknown".
      ownerName: row.created_by ? (names.get(row.created_by) ?? null) : null,
      updatedAt: row.updated_at,
    }));

    return Response.json({ collections });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Could not load collections.",
      },
      { status: 500 },
    );
  }
}
