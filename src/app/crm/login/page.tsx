import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BRAND_MARK, BRAND_NAME } from "@/lib/property-data";
import {
  CRM_COOKIE,
  SESSION_MAX_AGE,
  createSessionValue,
  isCrmAuthConfigured,
  isValidSessionValue,
  verifyCredentials,
} from "@/lib/crm/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "CRM sign in" };

async function signIn(formData: FormData) {
  "use server";

  const user = String(formData.get("user") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!verifyCredentials(user, password)) {
    // Generic message: never reveal which half was wrong.
    redirect("/crm/login?error=1");
  }

  const jar = await cookies();
  jar.set(CRM_COOKIE, createSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  redirect("/crm");
}

export default async function CrmLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const jar = await cookies();
  if (isValidSessionValue(jar.get(CRM_COOKIE)?.value)) redirect("/crm");

  return (
    <main className="grid min-h-screen place-items-center bg-[linear-gradient(155deg,#0d1e33_0%,#112a44_46%,#0a1626_100%)] px-4">
      <div className="w-full max-w-[380px]">
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <span className="grid size-14 place-items-center rounded-[18px] bg-[linear-gradient(135deg,#f3d9a1_0%,#d9a94f_45%,#8f6420_100%)] text-lg font-bold text-[#231603] shadow-[0_12px_30px_rgba(217,169,79,.35)]">
            {BRAND_MARK}
          </span>
          <div>
            <p className="font-display text-xl font-semibold text-white">{BRAND_NAME}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-[#e8cfa4]">
              Lead CRM
            </p>
          </div>
        </div>

        <form
          action={signIn}
          className="space-y-4 rounded-[24px] border border-white/12 bg-white/[0.06] p-6 backdrop-blur-2xl"
        >
          {!isCrmAuthConfigured() && (
            <p className="rounded-xl border border-amber-300/30 bg-amber-200/10 px-3 py-2 text-[11px] text-amber-100">
              Sign-in is not configured on this deployment. Set CRM_ADMIN_USER
              and CRM_ADMIN_PASSWORD.
            </p>
          )}

          {error && (
            <p className="rounded-xl border border-red-300/30 bg-red-300/10 px-3 py-2 text-[11px] text-red-100">
              Incorrect username or password.
            </p>
          )}

          <div>
            <label htmlFor="user" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
              Username
            </label>
            <input
              id="user"
              name="user"
              autoComplete="username"
              required
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/[0.07] px-3 py-2.5 text-sm text-white outline-none transition focus-visible:border-[#d9a94f]"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/[0.07] px-3 py-2.5 text-sm text-white outline-none transition focus-visible:border-[#d9a94f]"
            />
          </div>

          <button
            type="submit"
            className="btn-gold w-full rounded-xl py-2.5 text-sm font-semibold"
          >
            Sign in
          </button>
        </form>

        <p className="mt-5 text-center text-[10px] text-white/35">
          Authorised access only. Sessions expire after 12 hours.
        </p>
      </div>
    </main>
  );
}
