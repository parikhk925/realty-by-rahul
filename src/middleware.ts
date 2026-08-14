import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const publicPrefixes = [
  "/login",
  "/listing",
  "/brochure",
  // The generated dossier, alongside the developer's brochure — both are
  // linked from the public listing page and must not sit behind the studio
  // login. Omitting this sent every buyer clicking Download to /login.
  "/dossier",
  "/floor-plan",
  "/collection",
  "/portfolio",
  "/api/track",
  // Buyers trigger this from the public listing page, so it cannot sit behind
  // the studio login. Listed explicitly rather than opening all of
  // /api/listings, which also holds the agent-only brochure extractor.
  "/api/listings/market-price",
  // The site chat assistant is used by anonymous buyers, and the lead CRM it
  // feeds is a demo surface with no Supabase-backed accounts behind it.
  "/api/crm",
  "/crm",
];

function isPublicPath(pathname: string) {
  if (pathname === "/") return true;
  return publicPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Without Supabase there is no way to verify a session, so deny everything
  // that is not public instead of waving it through. Letting requests past
  // here used to combine with the studio's demo profile to grant full admin
  // access on any deploy that was missing its config.
  if (!url || !key) {
    return isPublicPath(request.nextUrl.pathname)
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/login", request.url));
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headersToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headersToSet ?? {}).forEach(([name, value]) =>
          response.headers.set(name, value),
        );
      },
    },
  });

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;
  const { pathname } = request.nextUrl;

  if (!userId && !isPublicPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  // Deliberately no automatic bounce from /login into the dashboard when a
  // session already exists. Silently opening the admin workspace to whoever
  // clicks the profile icon is indistinguishable from having no gate at all
  // on a shared or unlocked device. The login page instead shows who is
  // signed in and makes continuing an explicit choice.

  if (userId && !isPublicPath(pathname) && !pathname.startsWith("/api/")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_active")
      .eq("id", userId)
      .single();
    if (!profile?.is_active) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/login?error=inactive", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
