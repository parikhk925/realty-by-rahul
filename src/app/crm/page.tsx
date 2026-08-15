import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { listLeads } from "@/lib/crm/store";
import { AGENT_NAME, BRAND_MARK, BRAND_NAME } from "@/lib/property-data";
import { CRM_COOKIE, isValidSessionValue } from "@/lib/crm/auth";
import type { Lead } from "@/lib/crm/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lead CRM" };

async function signOut() {
  "use server";
  const jar = await cookies();
  jar.delete(CRM_COOKIE);
  redirect("/crm/login");
}

const TEMPERATURE_STYLES: Record<string, string> = {
  hot: "bg-[#fdecea] text-[#c8342b] border-[#f7cdc8]",
  warm: "bg-[#fff6e6] text-[#a5701a] border-[#f3ddb4]",
  cold: "bg-[#f5f0e6] text-[#6b6559] border-[#e6dcc9]",
};

function Metric({
  label,
  value,
  tone = "plain",
}: {
  label: string;
  value: string | number;
  tone?: "plain" | "hot" | "gold";
}) {
  const valueClass =
    tone === "hot"
      ? "text-[#c8342b]"
      : tone === "gold"
        ? "text-gold"
        : "text-[#17212e]";

  return (
    <div className="rounded-[20px] border border-[#e9e1d3] bg-white p-4 shadow-[0_14px_40px_rgba(74,62,40,.10)]">
      <p className={`font-display text-3xl font-semibold ${valueClass}`}>{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[#7d766a]">{label}</p>
    </div>
  );
}

function LeadCard({ lead }: { lead: Lead }) {
  const budget = lead.requirements.budgetMax ?? lead.requirements.budgetMin;

  return (
    <article className="rounded-[24px] border border-[#e9e1d3] bg-white p-5 shadow-[0_14px_40px_rgba(74,62,40,.07)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-[#17212e]">
              {lead.name ?? `Website visitor ${lead.id.slice(-4)}`}
            </h2>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                TEMPERATURE_STYLES[lead.temperature]
              }`}
            >
              {lead.temperature} · {lead.score}/100
            </span>
            <span className="rounded-full border border-[#e9e1d3] bg-[#faf7f2] px-2 py-0.5 text-[10px] text-[#6b6559]">
              {lead.stage}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-[#6f6a5f]">{lead.summary}</p>
        </div>
        <p className="text-[10px] text-[#9a9284]">
          {new Date(lead.updatedAt).toLocaleString("en-GB", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#9a9284]">
            Captured requirements
          </p>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
            {[
              ["Intent", lead.requirements.intent],
              ["Budget", budget ? `AED ${budget.toLocaleString("en-GB")}` : undefined],
              ["Area", lead.requirements.community],
              ["Type", lead.requirements.propertyType],
              [
                "Bedrooms",
                lead.requirements.bedrooms === undefined
                  ? undefined
                  : lead.requirements.bedrooms === 0
                    ? "Studio"
                    : String(lead.requirements.bedrooms),
              ],
              ["Market", lead.requirements.marketType?.replace("_", "-")],
              ["Purpose", lead.requirements.purpose?.replace("_", " ")],
              ["Timeline", lead.requirements.timeline?.replace(/_/g, " ")],
              ["Payment", lead.requirements.payment],
              ["Target ROI", lead.requirements.expectedRoi],
              ["Nationality", lead.requirements.nationality],
            ]
              .filter(([, value]) => Boolean(value))
              .map(([label, value]) => (
                <div key={label as string}>
                  <dt className="text-[9px] uppercase tracking-[0.1em] text-[#7d766a]">
                    {label}
                  </dt>
                  <dd className="font-medium capitalize text-[#28313d]">{value as string}</dd>
                </div>
              ))}
          </dl>

          <p className="mt-4 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#9a9284]">
            Score breakdown
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {lead.breakdown.map((item) => (
              <span
                key={item.label}
                className="rounded-full border border-[#ece5d8] bg-[#faf7f2] px-2 py-0.5 text-[10px] text-[#6b6559]"
              >
                {item.label} +{item.points}
              </span>
            ))}
          </div>

          <div className="mt-4 rounded-[14px] border border-[#ffe6c7] bg-[#fffaf2] px-3 py-2">
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#a5701a]">
              Next action
            </p>
            <p className="mt-0.5 text-[11px] text-[#7a5512]">{lead.nextAction}</p>
          </div>
        </div>

        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#9a9284]">
            Recommended ({lead.recommended.length})
          </p>
          <div className="mt-2 space-y-1.5">
            {lead.recommended.length === 0 && (
              <p className="text-[11px] text-[#9a9284]">No matches yet.</p>
            )}
            {lead.recommended.map((property) => (
              <Link
                key={property.slug}
                href={`/listing/${encodeURIComponent(property.slug)}`}
                className="block rounded-[14px] border border-[#ece5d8] bg-[#faf7f2] px-3 py-2 transition hover:border-[#d6bf94]"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[11px] font-medium text-[#28313d]">
                    {property.title}
                  </p>
                  <span className="shrink-0 text-[10px] font-semibold text-[#8f6420]">
                    {property.matchPercentage}%
                  </span>
                </div>
                <p className="text-[10px] text-[#6f6a5f]">
                  {property.community} · {property.priceQualifier} {property.price}
                </p>
              </Link>
            ))}
          </div>

          <p className="mt-4 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#9a9284]">
            Conversation
          </p>
          <div className="mt-2 max-h-52 space-y-1.5 overflow-y-auto pr-1">
            {lead.conversation.map((turn, i) => (
              <div
                key={i}
                className={`rounded-[12px] px-2.5 py-1.5 text-[10px] leading-relaxed ${
                  turn.role === "lead"
                    ? "bg-[#f5efe3] text-[#28313d]"
                    : "bg-[#f7f4ee] text-[#6f6a5f]"
                }`}
              >
                <span className="mr-1 font-semibold">
                  {turn.role === "lead" ? "Lead" : "Bot"}:
                </span>
                {turn.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

export default async function CrmPage() {
  const jar = await cookies();
  if (!isValidSessionValue(jar.get(CRM_COOKIE)?.value)) redirect("/crm/login");

  const leads = await listLeads();
  const hot = leads.filter((lead) => lead.temperature === "hot");
  const warm = leads.filter((lead) => lead.temperature === "warm");
  const viewings = leads.filter((lead) => lead.viewingRequested);
  const pipelineValue = leads.reduce(
    (sum, lead) => sum + (lead.requirements.budgetMax ?? lead.requirements.budgetMin ?? 0),
    0,
  );
  const firstName = AGENT_NAME.split(" ")[0];

  return (
    <div className="min-h-screen bg-[#faf7f2] text-[#17212e]">
      {/* Dark rail keeps the working surface calm and the brand present. */}
      <header className="bg-[linear-gradient(120deg,#0d1e33,#122a44_60%,#0a1626)] px-4 pb-24 pt-6 sm:px-8">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-[13px] bg-[linear-gradient(135deg,#f3d9a1_0%,#d9a94f_45%,#8f6420_100%)] text-[13px] font-bold text-[#231603]">
              {BRAND_MARK}
            </span>
            <div>
              <p className="text-sm font-semibold text-white">{BRAND_NAME}</p>
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#e8cfa4]">
                Lead CRM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 text-[11px] font-medium text-white/80 transition hover:bg-white/15"
            >
              Public site
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 text-[11px] font-medium text-white/80 transition hover:bg-white/15"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-[1240px]">
          <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">
            Good to see you, {firstName}.
          </h1>
          <p className="mt-2 max-w-[560px] text-xs text-white/55">
            {leads.length === 0
              ? "No conversations yet. Every enquiry from the site assistant or WhatsApp lands here, already qualified and scored."
              : `${hot.length} of ${leads.length} ${leads.length === 1 ? "lead is" : "leads are"} hot. Everything below is scored and ranked — work top down.`}
          </p>
        </div>
      </header>

      {/* Metrics lifted onto the fold between the rail and the board. */}
      <div className="mx-auto -mt-16 max-w-[1240px] px-4 sm:px-8">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric label="Total leads" value={leads.length} />
          <Metric label="Hot" value={hot.length} tone="hot" />
          <Metric label="Viewings requested" value={viewings.length} tone="gold" />
          <Metric
            label="Pipeline value"
            value={pipelineValue ? `AED ${(pipelineValue / 1_000_000).toFixed(1)}M` : "—"}
            tone="gold"
          />
        </div>
      </div>

      <main className="mx-auto max-w-[1240px] px-4 pb-16 pt-8 sm:px-8">
        {hot.length > 0 && (
          <div className="mb-6 overflow-hidden rounded-[20px] border border-[#f0c9c3] bg-[linear-gradient(120deg,#fdecea,#fff7f5)]">
            <div className="flex items-start gap-3 px-5 py-4">
              <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-[#c8342b] text-[11px] font-bold text-white">
                {hot.length}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#a8302a]">
                  Needs {firstName}&apos;s attention today
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-[#9a4038]">
                  {hot.map((lead) => lead.summary).join("  •  ")}
                </p>
              </div>
            </div>
          </div>
        )}

        {leads.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="text-[#8a8377]">Board</span>
            <span className="rounded-full bg-[#fdecea] px-2.5 py-1 font-semibold text-[#c8342b]">
              {hot.length} hot
            </span>
            <span className="rounded-full bg-[#fff6e6] px-2.5 py-1 font-semibold text-[#a5701a]">
              {warm.length} warm
            </span>
            <span className="rounded-full bg-[#f2efe8] px-2.5 py-1 font-semibold text-[#6b6559]">
              {leads.length - hot.length - warm.length} cold
            </span>
          </div>
        )}

        <div className="space-y-4">
          {leads.length === 0 ? (
            <div className="rounded-[26px] border border-dashed border-[#ddd2bd] bg-white px-6 py-20 text-center">
              <p className="font-display text-lg font-semibold text-[#17212e]">
                The board is clear
              </p>
              <p className="mx-auto mt-2 max-w-[440px] text-[11px] leading-relaxed text-[#6f6a5f]">
                Open the public site and talk to the assistant, or message the
                WhatsApp number. The lead appears here the moment it is scored —
                requirements, conversation and recommended stock included.
              </p>
              <Link
                href="/"
                className="btn-gold mt-6 inline-block rounded-full px-5 py-2.5 text-[11px] font-semibold"
              >
                Open the site
              </Link>
            </div>
          ) : (
            leads.map((lead) => <LeadCard key={lead.id} lead={lead} />)
          )}
        </div>
      </main>
    </div>
  );
}
