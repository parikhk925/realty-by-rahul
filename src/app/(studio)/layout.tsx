import { StudioShell } from "@/components/studio/studio-shell";
import { getStudioProfile } from "@/lib/supabase/session";

export const dynamic = "force-dynamic";

export default async function StudioLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getStudioProfile();
  return <StudioShell profile={profile}>{children}</StudioShell>;
}
