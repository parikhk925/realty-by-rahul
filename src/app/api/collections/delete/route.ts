import { authorizeStudioRequest } from "@/lib/supabase/api-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return Response.json({ skipped: true });
  if (!(await authorizeStudioRequest())) {
    return Response.json({ error: "Not authorised." }, { status: 401 });
  }

  try {
    const input = (await request.json()) as { id?: unknown };
    const id = typeof input.id === "string" ? input.id.trim() : "";
    if (!id) return Response.json({ error: "Missing collection." }, { status: 400 });

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("collections")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    // RLS silently filters rows the caller does not own.
    if (!data) {
      return Response.json(
        { error: "This collection belongs to another agent." },
        { status: 403 },
      );
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Could not delete collection.",
      },
      { status: 500 },
    );
  }
}
