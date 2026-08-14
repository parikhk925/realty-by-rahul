import Link from "next/link";
import { listLeads } from "@/lib/crm/store";
import { AGENT_NAME, BRAND_NAME } from "@/lib/property-data";
import type { Lead } from "@/lib/crm/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lead CRM" };

const TEMPERATURE_STYLES: Record<string, string> = {
  hot: "bg-[#fdecea] text-[#c8342b] border-[#f7cdc8]",
  warm: "bg-[#fff6e6] text-[#a5701a] border-[#f3ddb4]",
  cold: "bg-[#eef4fa] text-[#4d6c88] border-[#d8e5f1]",
};

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[20px] border border-[#dce9f4] bg-white p-4 shadow-[0_10px_30px_rgba(37,77,119,.06)]">
      <p className="text-2xl font-semibold tracking-[-0.04em] text-[#102f4b]">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[#6c869c]">{label}</p>
    </div>
  );
}

function LeadCard({ lead }: { lead: Lead }) {
  const budget = lead.requirements.budgetMax ?? lead.requirements.budgetMin;

  return (
    <article className="rounded-[24px] border border-[#dce9f4] bg-white p-5 shadow-[0_14px_40px_rgba(37,77,119,.07)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-[#102f4b]">
              {lead.name ?? `Website visitor ${lead.id.slice(-4)}`}
            </h2>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                TEMPERATURE_STYLES[lead.temperature]
              }`}
            >
              {lead.temperature} · {lead.score}/100
            </span>
            <span className="rounded-full border border-[#dce9f4] bg-[#f7fbfe] px-2 py-0.5 text-[10px] text-[#4d6c88]">
              {lead.stage}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-[#5e7690]">{lead.summary}</p>
        </div>
        <p className="text-[10px] text-[#8aa2b8]">
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
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8aa2b8]">
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
                  <dt className="text-[9px] uppercase tracking-[0.1em] text-[#9db0c2]">
                    {label}
                  </dt>
                  <dd className="font-medium capitalize text-[#20405c]">{value as string}</dd>
                </div>
              ))}
          </dl>

          <p className="mt-4 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8aa2b8]">
            Score breakdown
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {lead.breakdown.map((item) => (
              <span
                key={item.label}
                className="rounded-full border border-[#e4eef7] bg-[#f7fbfe] px-2 py-0.5 text-[10px] text-[#4d6c88]"
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
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8aa2b8]">
            Recommended ({lead.recommended.length})
          </p>
          <div className="mt-2 space-y-1.5">
            {lead.recommended.length === 0 && (
              <p className="text-[11px] text-[#8aa2b8]">No matches yet.</p>
            )}
            {lead.recommended.map((property) => (
              <Link
                key={property.slug}
                href={`/listing/${encodeURIComponent(property.slug)}`}
                className="block rounded-[14px] border border-[#e4eef7] bg-[#f7fbfe] px-3 py-2 transition hover:border-[#a9cdee]"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[11px] font-medium text-[#20405c]">
                    {property.title}
                  </p>
                  <span className="shrink-0 text-[10px] font-semibold text-[#1764c0]">
                    {property.matchPercentage}%
                  </span>
                </div>
                <p className="text-[10px] text-[#7891a7]">
                  {property.community} · {property.priceQualifier} {property.price}
                </p>
              </Link>
            ))}
          </div>

          <p className="mt-4 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8aa2b8]">
            Conversation
          </p>
          <div className="mt-2 max-h-52 space-y-1.5 overflow-y-auto pr-1">
            {lead.conversation.map((turn, i) => (
              <div
                key={i}
                className={`rounded-[12px] px-2.5 py-1.5 text-[10px] leading-relaxed ${
                  turn.role === "lead"
                    ? "bg-[#eef5fc] text-[#20405c]"
                    : "bg-[#f6f8fa] text-[#5e7690]"
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

export default function CrmPage() {
  const leads = listLeads();
  const hot = leads.filter((lead) => lead.temperature === "hot");
  const viewings = leads.filter((lead) => lead.viewingRequested);

  return (
    <main className="min-h-screen bg-[#f7fbfe] px-4 py-8 text-[#10243a] sm:px-8 sm:py-12">
      <div className="mx-auto max-w-[1180px]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#1764c0]">
              {BRAND_NAME}
            </p>
            <h1 className="mt-1.5 text-3xl font-semibold tracking-[-0.05em] text-[#102f4b] sm:text-4xl">
              Lead qualification CRM
            </h1>
            <p className="mt-1.5 max-w-[560px] text-[11px] text-[#5e7690] sm:text-xs">
              Every conversation from the site assistant, scored and routed
              automatically. {AGENT_NAME} only needs to act on what is already hot.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-[#dce9f4] bg-white px-4 py-2 text-[11px] font-semibold text-[#1764c0] transition hover:border-[#a9cdee]"
          >
            View public site
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Total leads" value={leads.length} />
          <Metric label="Hot leads" value={hot.length} />
          <Metric label="Viewings requested" value={viewings.length} />
          <Metric
            label="Average score"
            value={
              leads.length
                ? Math.round(leads.reduce((sum, lead) => sum + lead.score, 0) / leads.length)
                : 0
            }
          />
        </div>

        {hot.length > 0 && (
          <div className="mt-6 rounded-[20px] border border-[#f7cdc8] bg-[#fdecea] px-4 py-3">
            <p className="text-[11px] font-semibold text-[#c8342b]">
              {hot.length} hot lead{hot.length > 1 ? "s" : ""} need
              {hot.length > 1 ? "" : "s"} {AGENT_NAME.split(" ")[0]}&apos;s attention
            </p>
            <p className="mt-0.5 text-[10px] text-[#a8433b]">
              {hot.map((lead) => lead.summary).join(" • ")}
            </p>
          </div>
        )}

        <div className="mt-6 space-y-4">
          {leads.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[#cfe0ee] bg-white px-6 py-16 text-center">
              <p className="text-sm font-semibold text-[#102f4b]">No leads yet</p>
              <p className="mx-auto mt-1.5 max-w-[420px] text-[11px] text-[#5e7690]">
                Open the public site and start a conversation with the chat
                assistant — the qualified lead will appear here immediately.
              </p>
            </div>
          ) : (
            leads.map((lead) => <LeadCard key={lead.id} lead={lead} />)
          )}
        </div>
      </div>
    </main>
  );
}
