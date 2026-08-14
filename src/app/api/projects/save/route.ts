import { after } from "next/server";
import {
  getProjectCategory,
  isProperty,
  normalizePropertyAvailability,
} from "@/lib/property-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { generateAndStoreListingPdf } from "@/lib/pdf/store-listing-pdf";
import { syncPublishedProperty } from "@/lib/published-properties";

// The PDF step below fetches every listing photo and re-encodes it, which
// comfortably exceeds the platform default for a route handler.
export const maxDuration = 60;

function normalizeDirectoryName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return Response.json({ skipped: true });
  }
  try {
    const input = (await request.json()) as { property?: unknown };
    if (!isProperty(input.property)) {
      return Response.json({ error: "Invalid property data." }, { status: 400 });
    }
    const property = normalizePropertyAvailability(input.property);
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();
    const userId = claimsData?.claims.sub;
    if (!userId) {
      return Response.json({ error: "Sign in to sync properties." }, { status: 401 });
    }
    const { data: activeProfile } = await supabase
      .from("profiles")
      .select("is_active")
      .eq("id", userId)
      .single();
    if (!activeProfile?.is_active) {
      return Response.json({ error: "This account is inactive." }, { status: 403 });
    }

    let developerId: string | null = null;
    if (property.developer?.trim()) {
      const developerName = property.developer.trim().replace(/\s+/g, " ");
      const { data: existingDeveloper } = await supabase
        .from("developers")
        .select("id")
        .eq("normalized_name", normalizeDirectoryName(developerName))
        .maybeSingle();
      const { data: developer, error } = existingDeveloper
        ? { data: existingDeveloper, error: null }
        : await supabase
            .from("developers")
            .insert({ name: developerName, created_by: userId })
            .select("id")
            .single();
      if (error || !developer) throw error ?? new Error("Developer could not be saved.");
      developerId = developer.id;
    }

    let communityId: string | null = null;
    if ((property.community ?? property.location).trim()) {
      const communityName = (property.community ?? property.location)
        .trim()
        .replace(/\s+/g, " ");
      const emirate = property.emirate ?? "Dubai";
      const { data: existingCommunity } = await supabase
        .from("communities")
        .select("id")
        .eq("normalized_name", normalizeDirectoryName(communityName))
        .eq("emirate", emirate)
        .maybeSingle();
      const { data: community, error } = existingCommunity
        ? { data: existingCommunity, error: null }
        : await supabase
            .from("communities")
            .insert({
              name: communityName,
              emirate,
              created_by: userId,
            })
            .select("id")
            .single();
      if (error || !community) throw error ?? new Error("Community could not be saved.");
      communityId = community.id;
    }

    const { error: propertyError } = await supabase.from("properties").upsert({
      id: property.id,
      slug: property.slug,
      title: property.title,
      status: property.status,
      purpose: property.purpose,
      category: getProjectCategory(property),
      developer_id: developerId,
      community_id: communityId,
      assigned_agent_id: property.assignedAgentId ?? userId,
      created_by: userId,
      data: property,
    });
    if (propertyError) throw propertyError;

    const documents = [
      property.brochure
        ? {
            property_id: property.id,
            kind: "brochure",
            name: property.brochure.name,
            url: property.brochure.url,
          }
        : undefined,
      property.floorPlan
        ? {
            property_id: property.id,
            kind: "floor_plan",
            name: property.floorPlan.name,
            url: property.floorPlan.url,
          }
        : undefined,
    ].filter((value) => value !== undefined);

    await supabase
      .from("property_documents")
      .delete()
      .eq("property_id", property.id);
    if (documents.length > 0) {
      const { error } = await supabase.from("property_documents").insert(documents);
      if (error) throw error;
    }

    // Fire-and-forget: runs after the response is sent, so a slow or failed
    // PDF render can never turn a successful save into a failed one.
    after(async () => {
      // Publish first so the listing is actually visible the moment it is set
      // Live, then let the PDF land and re-sync once it has a download link.
      await syncPublishedProperty(property);
      await generateAndStoreListingPdf(property, supabase);
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Cloud sync failed.",
      },
      { status: 500 },
    );
  }
}
