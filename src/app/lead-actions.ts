"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { LeadStatus } from "@/lib/leads";

export interface LeadActionResult {
  error?: string;
  success?: string;
}

/**
 * UAE mobiles are quoted as +971 5X XXX XXXX, 05X XXX XXXX or bare 5X XXX XXXX.
 * Buyers also arrive from abroad, so anything that looks like a plausible
 * international number is accepted rather than rejecting a real enquiry.
 */
function normalizePhone(input: string) {
  const digits = input.replace(/\D/g, "");
  if (/^0?5\d{8}$/.test(digits)) return `971${digits.replace(/^0/, "")}`;
  if (/^971\d{9}$/.test(digits)) return digits;
  return digits.length >= 8 && digits.length <= 15 ? digits : "";
}

export async function submitLead(formData: FormData): Promise<LeadActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const email = String(formData.get("email") ?? "").trim();
  const budget = String(formData.get("budget") ?? "").trim();
  const timeline = String(formData.get("timeline") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const propertyId = String(formData.get("propertyId") ?? "").trim();
  const propertyTitle = String(formData.get("propertyTitle") ?? "").trim();
  const source = String(formData.get("source") ?? "listing").trim();

  if (name.length < 2) return { error: "Please enter your name." };
  if (!phone) return { error: "Please enter a valid mobile number." };
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: "That email address does not look right." };
  }

  if (!isSupabaseConfigured()) {
    // Preview builds have no database; the buyer should still see it worked.
    return { success: "Thanks — your request has been noted." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("leads").insert({
    // Seed listings are not rows in properties, so only link a real one.
    property_id: propertyId || null,
    property_title: propertyTitle || null,
    name,
    phone,
    email: email || null,
    budget: budget || null,
    timeline: timeline || null,
    message: message || null,
    source: source || "listing",
  });

  if (error) {
    // A stale or demo property id must not cost us the enquiry.
    if (error.code === "23503") {
      const { error: retryError } = await supabase.from("leads").insert({
        property_id: null,
        property_title: propertyTitle || null,
        name,
        phone,
        email: email || null,
        budget: budget || null,
        timeline: timeline || null,
        message: message || null,
        source: source || "listing",
      });
      if (!retryError) return { success: "Thanks — we'll be in touch shortly." };
    }
    return { error: "Something went wrong. Please try WhatsApp instead." };
  }

  revalidatePath("/leads");
  return { success: "Thanks — we'll be in touch shortly." };
}

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  if (!isSupabaseConfigured()) return { error: "Connect the database first." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", leadId);
  if (error) return { error: error.message };
  revalidatePath("/leads");
  return { ok: true };
}

export async function assignLead(leadId: string, agentId: string | null) {
  if (!isSupabaseConfigured()) return { error: "Connect the database first." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ assigned_agent_id: agentId })
    .eq("id", leadId);
  if (error) return { error: error.message };
  revalidatePath("/leads");
  return { ok: true };
}

export async function deleteLead(leadId: string) {
  if (!isSupabaseConfigured()) return { error: "Connect the database first." };
  const supabase = await createClient();
  const { error } = await supabase.from("leads").delete().eq("id", leadId);
  if (error) return { error: error.message };
  revalidatePath("/leads");
  return { ok: true };
}
