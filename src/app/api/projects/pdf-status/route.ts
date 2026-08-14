import { authorizeStudioRequest } from "@/lib/supabase/api-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Cheap poll target while a PDF is generating — avoids re-fetching the whole inventory. */
export async function GET(request: Request) {
  if (!isSupabaseConfigured()) return Response.json({ skipped: true });
  if (!(await authorizeStudioRequest())) {
    return Response.json({ error: "Not authorised." }, { status: 401 });
  }

  const slug = new URL(request.url).searchParams.get("slug");
  if (!slug) return Response.json({ error: "Missing slug." }, { status: 400 });

  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("data")
    .eq("slug", slug)
    .maybeSingle();

  const property = data?.data as
    | { pdfStatus?: string; pdfUrl?: string; pdfGeneratedAt?: string }
    | undefined;

  return Response.json({
    pdfStatus: property?.pdfStatus ?? "idle",
    pdfUrl: property?.pdfUrl ?? null,
    pdfGeneratedAt: property?.pdfGeneratedAt ?? null,
  });
}
