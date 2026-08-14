"use server";

import { redirect } from "next/navigation";
import {
  createClient as createSupabaseClient,
  type UserAttributes,
} from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getSupabasePublicConfig,
  isSupabaseConfigured,
} from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export interface AuthActionResult {
  error?: string;
  success?: string;
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}

export async function changePassword(
  formData: FormData,
): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) {
    return {
      error:
        "Connect the production database before changing account passwords.",
    };
  }

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "Complete all three password fields." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "The new passwords do not match." };
  }
  if (newPassword === currentPassword) {
    return { error: "Choose a password different from your current password." };
  }
  if (
    newPassword.length < 10 ||
    !/[A-Z]/.test(newPassword) ||
    !/[a-z]/.test(newPassword) ||
    !/\d/.test(newPassword)
  ) {
    return {
      error:
        "Use at least 10 characters with uppercase, lowercase and a number.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Your session has expired. Sign in again." };

  // Check the current password on a throwaway client that never persists a
  // session. Letting the session client reject it instead clears the auth
  // cookies, which silently signed people out rather than showing this error.
  const config = getSupabasePublicConfig();
  if (!config) return { error: "Supabase is not configured." };
  const verifier = createSupabaseClient(config.url, config.key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  const { error: verifyError } = await verifier.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  // Local scope only — a global sign-out would revoke the caller's own session.
  await verifier.auth.signOut({ scope: "local" });
  if (verifyError) return { error: "Your current password is incorrect." };

  const attributes: UserAttributes & { current_password: string } = {
    password: newPassword,
    current_password: currentPassword,
  };
  const { error } = await supabase.auth.updateUser(attributes);
  if (error) {
    return {
      error: error.message.toLowerCase().includes("password")
        ? "That new password was not accepted. Choose a different one."
        : error.message,
    };
  }

  // The password has already changed by this point, so clearing the flag must
  // not be able to report failure back to someone whose change actually
  // succeeded. Only an admin key can write the profile, and it is unavailable
  // in preview mode.
  try {
    const admin = createAdminClient();
    await admin
      .from("profiles")
      .update({ must_change_password: false })
      .eq("id", user.id);
  } catch {
    // Left set; the prompt simply reappears until an admin write succeeds.
  }

  return { success: "Password changed successfully." };
}
