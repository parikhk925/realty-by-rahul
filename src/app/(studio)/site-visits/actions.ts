"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getStudioProfile } from "@/lib/supabase/session";

export type SiteVisitStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "no_show";

interface VisitActionResult {
  error?: string;
  success?: string;
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (/^971\d{9}$/.test(digits)) return digits;
  if (/^0?5\d{8}$/.test(digits)) return `971${digits.replace(/^0/, "")}`;
  if (/^\d{10,15}$/.test(digits)) return digits;
  return undefined;
}

export async function scheduleSiteVisit(
  formData: FormData,
): Promise<VisitActionResult> {
  const profile = await getStudioProfile();
  if (!isSupabaseConfigured() || profile.demo) {
    return { error: "Connect the production database to schedule live visits." };
  }

  const propertyId = String(formData.get("propertyId") ?? "");
  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerPhone = normalizePhone(
    String(formData.get("customerPhone") ?? ""),
  );
  const scheduledAt = String(formData.get("scheduledAt") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  if (!propertyId || !customerName || !customerPhone || !scheduledAt) {
    return {
      error: "Choose a property, customer, valid WhatsApp number and date.",
    };
  }
  const scheduledDate = new Date(scheduledAt);
  if (Number.isNaN(scheduledDate.getTime())) {
    return { error: "Choose a valid visit date and time." };
  }
  // The browser's min attribute is only a hint, so re-check here: a viewing
  // cannot be arranged for a time that has already passed. One minute of
  // slack absorbs the delay between picking the time and submitting.
  if (scheduledDate.getTime() < Date.now() - 60_000) {
    return { error: "Choose a visit time in the future." };
  }

  const supabase = await createClient();
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .upsert(
      {
        name: customerName,
        phone: customerPhone,
        assigned_agent_id: profile.id,
      },
      { onConflict: "phone" },
    )
    .select("id")
    .single();
  if (customerError) return { error: customerError.message };

  const { error } = await supabase.from("site_visits").insert({
    property_id: propertyId,
    agent_id: profile.id,
    customer_id: customer.id,
    customer_name: customerName,
    customer_phone: customerPhone,
    scheduled_at: scheduledDate.toISOString(),
    notes: notes || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/site-visits");
  return { success: "Site visit scheduled." };
}

export async function updateSiteVisitStatus(
  visitId: string,
  status: SiteVisitStatus,
): Promise<VisitActionResult> {
  const profile = await getStudioProfile();
  if (!isSupabaseConfigured() || profile.demo) {
    return { error: "Connect the production database to update visits." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("site_visits")
    .update({ status })
    .eq("id", visitId);
  if (error) return { error: error.message };
  revalidatePath("/site-visits");
  return { success: "Visit updated." };
}

export async function deleteSiteVisit(
  visitId: string,
): Promise<VisitActionResult> {
  const profile = await getStudioProfile();
  if (!isSupabaseConfigured() || profile.demo) {
    return { error: "Connect the production database to delete visits." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("site_visits")
    .delete()
    .eq("id", visitId);
  if (error) return { error: error.message };
  revalidatePath("/site-visits");
  return { success: "Visit deleted." };
}

export async function setSiteVisitTarget(
  formData: FormData,
): Promise<VisitActionResult> {
  const profile = await getStudioProfile();
  if (profile.role !== "admin") return { error: "Admin access required." };
  if (!isSupabaseConfigured() || profile.demo) {
    return { error: "Connect the production database to assign targets." };
  }
  const agentId = String(formData.get("agentId") ?? "");
  const targetCount = Number(formData.get("targetCount") ?? 0);
  const periodStart = String(formData.get("periodStart") ?? "");
  const periodEnd = String(formData.get("periodEnd") ?? "");
  if (
    !agentId ||
    !Number.isInteger(targetCount) ||
    targetCount < 1 ||
    !periodStart ||
    !periodEnd ||
    periodEnd < periodStart
  ) {
    return { error: "Choose an agent, valid dates and a target above zero." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("site_visit_targets").upsert(
    {
      agent_id: agentId,
      created_by: profile.id,
      period_start: periodStart,
      period_end: periodEnd,
      target_count: targetCount,
    },
    { onConflict: "agent_id,period_start,period_end" },
  );
  if (error) return { error: error.message };
  revalidatePath("/site-visits");
  return { success: "Target assigned." };
}
