"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/supabase/session";

export interface AgentCredentials {
  email: string;
  temporaryPassword: string;
}

export interface AgentActionResult {
  error?: string;
  credentials?: AgentCredentials;
  success?: string;
}

function normalizeUaePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (/^971\d{9}$/.test(digits)) return digits;
  if (/^0?5\d{8}$/.test(digits)) return `971${digits.replace(/^0/, "")}`;
  if (/^\d{10,15}$/.test(digits)) return digits;
  return undefined;
}

function temporaryPassword() {
  return `DxB${randomBytes(8).toString("base64url")}7`;
}

export async function createAgent(
  formData: FormData,
): Promise<AgentActionResult> {
  const adminProfile = await requireAdmin();
  if (!isSupabaseConfigured() || adminProfile.demo) {
    return { error: "Connect the production database before adding agents." };
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = normalizeUaePhone(String(formData.get("phone") ?? ""));
  if (!fullName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !phone) {
    return {
      error: "Enter the agent's name, work email and valid WhatsApp number.",
    };
  }

  const admin = createAdminClient();
  const password = temporaryPassword();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "agent" },
  });
  if (error || !data.user) {
    return { error: error?.message ?? "The agent account could not be created." };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    full_name: fullName,
    email,
    phone,
    whatsapp: phone,
    role: "agent",
    is_active: true,
    must_change_password: true,
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: profileError.message };
  }

  revalidatePath("/agents");
  return {
    success: `${fullName} can now sign in.`,
    credentials: { email, temporaryPassword: password },
  };
}

export async function setAgentActive(
  agentId: string,
  active: boolean,
): Promise<AgentActionResult> {
  const adminProfile = await requireAdmin();
  if (!isSupabaseConfigured() || adminProfile.demo) {
    return { error: "Connect the production database to manage agents." };
  }
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ is_active: active })
    .eq("id", agentId)
    .eq("role", "agent");
  if (error) return { error: error.message };
  revalidatePath("/agents");
  return { success: active ? "Agent activated." : "Agent deactivated." };
}

export async function resetAgentPassword(
  agentId: string,
): Promise<AgentActionResult> {
  const adminProfile = await requireAdmin();
  if (!isSupabaseConfigured() || adminProfile.demo) {
    return { error: "Connect the production database to reset passwords." };
  }
  const admin = createAdminClient();
  const password = temporaryPassword();
  const { data: profile } = await admin
    .from("profiles")
    .select("email")
    .eq("id", agentId)
    .eq("role", "agent")
    .single();
  if (!profile) return { error: "Agent not found." };
  const { error } = await admin.auth.admin.updateUserById(agentId, {
    password,
  });
  if (error) return { error: error.message };
  await admin
    .from("profiles")
    .update({ must_change_password: true })
    .eq("id", agentId);
  return {
    success: "Temporary password generated.",
    credentials: {
      email: profile.email,
      temporaryPassword: password,
    },
  };
}
