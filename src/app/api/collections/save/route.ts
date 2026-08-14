import { authorizeStudioRequest } from "@/lib/supabase/api-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

interface SaveInput {
  id?: unknown;
  publicId?: unknown;
  slug?: unknown;
  name?: unknown;
  description?: unknown;
  status?: unknown;
  propertyIds?: unknown;
}

const str = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return Response.json({ skipped: true });
  if (!(await authorizeStudioRequest())) {
    return Response.json({ error: "Not authorised." }, { status: 401 });
  }

  try {
    const input = (await request.json()) as SaveInput;
    const publicId = str(input.publicId);
    const name = str(input.name) || "Curated Dubai collection";
    const slug = str(input.slug);
    const propertyIds = Array.isArray(input.propertyIds)
      ? input.propertyIds.filter((id): id is string => typeof id === "string")
      : [];
    if (!publicId || !slug) {
      return Response.json({ error: "Missing collection identity." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Not authorised." }, { status: 401 });

    const row = {
      public_id: publicId,
      slug,
      name,
      description: str(input.description),
      status: input.status === "Published" ? "Published" : "Draft",
      property_ids: propertyIds,
    };

    // public_id is the collection's identity across renames, so conflict on it
    // rather than the row id — the client may not know the id on first save.
    const existingId = str(input.id);
    const { data, error } = existingId
      ? await supabase
          .from("collections")
          .update(row)
          .eq("id", existingId)
          .select("id")
          .maybeSingle()
      : await supabase
          .from("collections")
          .upsert({ ...row, created_by: user.id }, { onConflict: "public_id" })
          .select("id")
          .maybeSingle();

    if (error) throw error;
    // An update that matched nothing means someone else owns it — RLS blocked
    // the write rather than failing outright.
    if (existingId && !data) {
      return Response.json(
        { error: "This collection belongs to another agent." },
        { status: 403 },
      );
    }

    return Response.json({ ok: true, id: data?.id });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Could not save collection.",
      },
      { status: 500 },
    );
  }
}
