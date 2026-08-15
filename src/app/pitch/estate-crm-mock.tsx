/**
 * Real-estate CRM dashboard, drawn for the deck.
 *
 * Table-driven pipeline rather than a kanban, matching how property desks
 * actually work a list: score, status and next action visible on one row.
 *
 * Every name, number and property here is invented. The deck ships to
 * prospects, so it must not carry any real client's brand or data.
 */

const ACCENT = "#7c3aed";

const NAV: { group: string; items: string[] }[] = [
  { group: "", items: ["Dashboard"] },
  { group: "LEADS", items: ["All Leads", "Lead Pipeline", "Hot Leads", "Lost Leads"] },
  { group: "COMMUNICATION", items: ["WhatsApp", "Email", "Calls", "SMS"] },
  { group: "CALENDAR", items: ["Viewings", "Appointments"] },
  { group: "PROPERTIES", items: ["Properties", "Projects"] },
  { group: "REPORTS", items: ["Analytics", "Reports"] },
];

const METRICS = [
  { label: "New Leads", value: "87", delta: "28%", tint: "#ede9fe", icon: "#7c3aed" },
  { label: "Hot Leads", value: "24", delta: "33%", tint: "#ffe4e6", icon: "#e11d48" },
  { label: "Warm Leads", value: "41", delta: "18%", tint: "#fef3c7", icon: "#d97706" },
  { label: "Viewings This Week", value: "12", delta: "20%", tint: "#dbeafe", icon: "#2563eb" },
  { label: "Pipeline Value", value: "AED 18.4M", delta: "22%", tint: "#dcfce7", icon: "#16a34a" },
];

const ROWS = [
  { i: "AK", n: "Ahmed Khan", p: "+971 50 ••• 4567", src: "Instagram", b: "AED 3,000,000", in: "Dubai Marina", s: 94, st: "Hot", act: "2m ago", next: "Book Viewing" },
  { i: "SA", n: "Sarah Ali", p: "+971 52 ••• 6543", src: "Website", b: "AED 1,800,000", in: "Downtown Dubai", s: 88, st: "Hot", act: "5m ago", next: "Call" },
  { i: "OH", n: "Omar Hassan", p: "+971 55 ••• 4321", src: "WhatsApp", b: "AED 2,200,000", in: "Jumeirah Village Circle", s: 71, st: "Warm", act: "15m ago", next: "Send Properties" },
  { i: "DS", n: "Daniel Smith", p: "+971 58 ••• 6789", src: "Instagram", b: "AED 900,000", in: "Business Bay", s: 42, st: "Cold", act: "1h ago", next: "Follow Up" },
  { i: "PM", n: "Priya Mehta", p: "+971 50 ••• 5678", src: "Referral", b: "AED 1,500,000", in: "Dubai Hills Estate", s: 65, st: "Warm", act: "2h ago", next: "Book Viewing" },
];

const STATUS: Record<string, { bg: string; fg: string }> = {
  Hot: { bg: "#ffe4e6", fg: "#be123c" },
  Warm: { bg: "#fef3c7", fg: "#b45309" },
  Cold: { bg: "#e0f2fe", fg: "#0369a1" },
};

const SCORE_RING: Record<string, string> = {
  Hot: "#16a34a",
  Warm: "#f59e0b",
  Cold: "#94a3b8",
};

const MATCHED = [
  { t: "Marina Vista Tower 2", a: "Dubai Marina", d: "2 BR · 1,450 sqft", p: "AED 2,850,000", m: "98% Match", g: "linear-gradient(150deg,#93c5fd,#3b82f6)" },
  { t: "Marina Shores", a: "Dubai Marina", d: "2 BR · 1,380 sqft", p: "AED 2,950,000", m: "95% Match", g: "linear-gradient(150deg,#a5b4fc,#6366f1)" },
  { t: "Emaar Beachfront", a: "Dubai Harbour", d: "2 BR · 1,350 sqft", p: "AED 3,100,000", m: "92% Match", g: "linear-gradient(150deg,#7dd3fc,#0ea5e9)" },
];

const ACTIVITY = [
  { t: "New WhatsApp lead received", b: "Ahmed Khan started qualification", w: "2m ago", c: "#22c55e" },
  { t: "AI qualification completed", b: "Lead scored 94/100 (Hot Lead)", w: "3m ago", c: "#7c3aed" },
  { t: "Property matched", b: "3 properties matched for Ahmed Khan", w: "4m ago", c: "#f59e0b" },
  { t: "Viewing requested", b: "Marina Vista — 2 BR", w: "6m ago", c: "#2563eb" },
  { t: "Task created", b: "Follow up tomorrow at 11:00 AM", w: "7m ago", c: "#e11d48" },
];

const OVERVIEW = [
  { l: "New Leads", v: "87 (100%)", pct: 100, c: "#7c3aed" },
  { l: "Qualified", v: "52 (60%)", pct: 60, c: "#f97316" },
  { l: "Proposal Sent", v: "21 (24%)", pct: 24, c: "#f59e0b" },
  { l: "Negotiation", v: "11 (13%)", pct: 13, c: "#2563eb" },
  { l: "Closed Won", v: "6 (7%)", pct: 7, c: "#16a34a" },
];

export function EstateCrmMock() {
  return (
    <div className="kt-avoid-break overflow-hidden rounded-[14px] border border-[#e4e7f0] bg-[#fafbfd] text-[#10131f] shadow-[0_10px_34px_rgba(19,27,56,.08)]">
      <div className="flex">
        {/* ------------------------------------------------------ sidebar */}
        <aside className="hidden w-[118px] shrink-0 border-r border-[#eef0f6] bg-white p-2.5 sm:block">
          <div className="flex items-center gap-1.5">
            <span className="grid size-5 shrink-0 place-items-center rounded-[5px] bg-[linear-gradient(135deg,#00b8f0,#7c3aed)] text-[6px] font-bold text-white">
              KT
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[7px] font-extrabold tracking-[0.06em]">KAIVAN TECH</p>
              <p className="truncate text-[5px] tracking-[0.14em] text-[#8b93a7]">REAL ESTATE CRM</p>
            </div>
          </div>

          <div className="mt-2.5 space-y-2">
            {NAV.map((g, gi) => (
              <div key={g.group || "main"}>
                {g.group && (
                  <p className="mb-1 text-[5px] font-semibold tracking-[0.16em] text-[#a9b0c2]">
                    {g.group}
                  </p>
                )}
                <ul className="space-y-[2px]">
                  {g.items.map((item, i) => (
                    <li
                      key={item}
                      className={`rounded-[5px] px-1.5 py-[3px] text-[6.5px] ${
                        gi === 0 && i === 0
                          ? "bg-[#f3f0ff] font-semibold text-[#7c3aed]"
                          : "text-[#5b6478]"
                      }`}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-1.5 rounded-[6px] border border-[#eef0f6] p-1.5">
            <span className="grid size-4 place-items-center rounded-full bg-[#ede9fe] text-[5px] font-bold text-[#7c3aed]">
              KS
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[6px] font-semibold">Kabir Shah</p>
              <p className="text-[5px] text-[#a9b0c2]">Admin</p>
            </div>
          </div>
        </aside>

        {/* --------------------------------------------------------- main */}
        <div className="min-w-0 flex-1 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[12px] font-bold">Dashboard</p>
              <p className="text-[7px] text-[#8b93a7]">
                Welcome back — here&apos;s what&apos;s happening with your leads today.
              </p>
            </div>
            <span
              className="rounded-[6px] px-2 py-1 text-[6.5px] font-semibold text-white"
              style={{ background: ACCENT }}
            >
              + Add Lead
            </span>
          </div>

          {/* metrics */}
          <div className="mt-2.5 grid grid-cols-5 gap-1.5">
            {METRICS.map((m) => (
              <div key={m.label} className="rounded-[8px] border border-[#eef0f6] bg-white p-1.5">
                <span
                  className="mb-1 grid size-4 place-items-center rounded-[5px]"
                  style={{ background: m.tint }}
                >
                  <span className="size-1.5 rounded-[2px]" style={{ background: m.icon }} />
                </span>
                <p className="text-[5.5px] text-[#8b93a7]">{m.label}</p>
                <p className="mt-0.5 text-[11px] font-bold leading-none">{m.value}</p>
                <p className="mt-0.5 text-[5px] font-medium text-[#16a34a]">↑ {m.delta} vs last week</p>
              </div>
            ))}
          </div>

          <div className="mt-2 grid gap-2 lg:grid-cols-[1fr_140px]">
            <div className="min-w-0 space-y-2">
              {/* pipeline table */}
              <div className="rounded-[10px] border border-[#eef0f6] bg-white p-2">
                <div className="flex items-center gap-2">
                  <p className="text-[8px] font-bold">Lead Pipeline</p>
                  <div className="flex gap-1.5 text-[6px]">
                    {["All Leads", "New", "Warm", "Hot", "Qualified", "Closed"].map((tab, i) => (
                      <span
                        key={tab}
                        className={i === 0 ? "font-semibold text-[#7c3aed]" : "text-[#a9b0c2]"}
                      >
                        {tab}
                      </span>
                    ))}
                  </div>
                </div>

                <table className="mt-1.5 w-full border-collapse text-[6px]">
                  <thead>
                    <tr className="text-left text-[5.5px] text-[#a9b0c2]">
                      {["Lead", "Source", "Budget", "Interested In", "Score", "Status", "Next Action"].map(
                        (h) => (
                          <th key={h} className="border-b border-[#eef0f6] pb-1 font-medium">
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {ROWS.map((r) => (
                      <tr key={r.n} className="border-b border-[#f4f5f9]">
                        <td className="py-1.5">
                          <div className="flex items-center gap-1">
                            <span className="grid size-3.5 shrink-0 place-items-center rounded-full bg-[#ede9fe] text-[4.5px] font-bold text-[#7c3aed]">
                              {r.i}
                            </span>
                            <div className="leading-tight">
                              <p className="font-semibold">{r.n}</p>
                              <p className="text-[5px] text-[#a9b0c2]">{r.p}</p>
                            </div>
                          </div>
                        </td>
                        <td className="text-[#5b6478]">{r.src}</td>
                        <td className="text-[#5b6478]">{r.b}</td>
                        <td className="text-[#5b6478]">{r.in}</td>
                        <td>
                          <span
                            className="grid size-4 place-items-center rounded-full border text-[5px] font-bold"
                            style={{ borderColor: SCORE_RING[r.st], color: SCORE_RING[r.st] }}
                          >
                            {r.s}
                          </span>
                        </td>
                        <td>
                          <span
                            className="rounded-full px-1.5 py-[1px] text-[5px] font-semibold"
                            style={{ background: STATUS[r.st].bg, color: STATUS[r.st].fg }}
                          >
                            {r.st}
                          </span>
                        </td>
                        <td className="text-[5.5px] font-medium" style={{ color: ACCENT }}>
                          {r.next}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* lead detail + matched properties */}
              <div className="grid gap-2 lg:grid-cols-[1fr_150px]">
                <div className="rounded-[10px] border border-[#eef0f6] bg-white p-2">
                  <div className="flex items-center gap-1.5">
                    <span className="grid size-6 place-items-center rounded-full bg-[#ede9fe] text-[7px] font-bold text-[#7c3aed]">
                      AK
                    </span>
                    <div>
                      <div className="flex items-center gap-1">
                        <p className="text-[8px] font-bold">Ahmed Khan</p>
                        <span className="rounded-full bg-[#ffe4e6] px-1 py-[1px] text-[5px] font-semibold text-[#be123c]">
                          Hot Lead
                        </span>
                        <span className="rounded-full bg-[#dcfce7] px-1 py-[1px] text-[5px] font-semibold text-[#15803d]">
                          94/100
                        </span>
                      </div>
                      <p className="text-[5.5px] text-[#8b93a7]">+971 50 ••• 4567 · Dubai, UAE</p>
                    </div>
                  </div>

                  <div className="mt-1.5 flex gap-2 border-b border-[#eef0f6] pb-1 text-[5.5px]">
                    {["Overview", "Qualification", "Conversations", "Activity", "Notes"].map((t, i) => (
                      <span
                        key={t}
                        className={
                          i === 0
                            ? "border-b-[1.5px] border-[#7c3aed] pb-[3px] font-semibold text-[#7c3aed]"
                            : "text-[#a9b0c2]"
                        }
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
                    <div className="rounded-[7px] bg-[#fbfbfe] p-1.5">
                      <p className="text-[5px] font-semibold tracking-[0.1em] text-[#a9b0c2]">
                        AI QUALIFICATION SUMMARY
                      </p>
                      <div className="mt-1 space-y-[2px]">
                        {[
                          ["Purpose", "Investment"],
                          ["Budget", "AED 3,000,000"],
                          ["Property Type", "Apartment"],
                          ["Bedrooms", "2 – 3 BR"],
                          ["Preferred Area", "Dubai Marina"],
                          ["Timeline", "Within 1 Month"],
                          ["Financing", "Cash"],
                        ].map(([k, v]) => (
                          <div key={k} className="flex justify-between gap-2 text-[5.5px]">
                            <span className="text-[#8b93a7]">{k}</span>
                            <span className="font-medium">{v}</span>
                          </div>
                        ))}
                      </div>
                      <p className="mt-1 text-[5px] text-[#8b93a7]">Deal probability</p>
                      <div className="mt-0.5 flex items-center gap-1">
                        <span className="block h-1 flex-1 overflow-hidden rounded-full bg-[#eef0f6]">
                          <span className="block h-full w-[94%] rounded-full bg-[#16a34a]" />
                        </span>
                        <span className="text-[5px] font-bold text-[#16a34a]">94%</span>
                      </div>
                    </div>

                    <div className="rounded-[7px] bg-[#f5f3ff] p-1.5">
                      <p className="text-[5px] font-semibold tracking-[0.1em] text-[#7c3aed]">
                        AI SUMMARY
                      </p>
                      <p className="mt-1 text-[5.5px] leading-[1.55] text-[#5b6478]">
                        High-intent investor looking for a 2–3 BR apartment in Dubai Marina with a
                        budget up to AED 3M. Ready to view within a month.
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {["Investor", "High Budget", "Dubai Marina", "2–3 BR"].map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-white px-1 py-[1px] text-[4.5px] font-medium text-[#5b6478]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-1.5 flex gap-1">
                    {["WhatsApp", "Call", "Email", "Book Viewing"].map((b, i) => (
                      <span
                        key={b}
                        className={`rounded-[5px] px-1.5 py-1 text-[5.5px] font-semibold ${
                          i === 0
                            ? "bg-[#22c55e] text-white"
                            : i === 1
                              ? "text-white"
                              : "border border-[#eef0f6] text-[#5b6478]"
                        }`}
                        style={i === 1 ? { background: ACCENT } : undefined}
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-[10px] border border-[#eef0f6] bg-white p-2">
                  <p className="text-[7.5px] font-bold">AI Matched Properties</p>
                  <div className="mt-1.5 space-y-1.5">
                    {MATCHED.map((m) => (
                      <div key={m.t} className="flex gap-1.5">
                        <span
                          className="h-8 w-9 shrink-0 rounded-[5px]"
                          style={{ background: m.g }}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-[6px] font-semibold">{m.t}</p>
                          <p className="truncate text-[5px] text-[#a9b0c2]">{m.a}</p>
                          <p className="text-[5px] text-[#8b93a7]">{m.d}</p>
                          <div className="mt-0.5 flex items-center gap-1">
                            <span className="text-[5.5px] font-bold">{m.p}</span>
                            <span className="rounded-full bg-[#dcfce7] px-1 text-[4.5px] font-semibold text-[#15803d]">
                              {m.m}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------ right rail */}
            <div className="hidden space-y-2 lg:block">
              <div className="rounded-[10px] border border-[#eef0f6] bg-white p-2">
                <p className="text-[7.5px] font-bold">Live Activity Feed</p>
                <div className="mt-1.5 space-y-1.5">
                  {ACTIVITY.map((a) => (
                    <div key={a.t} className="flex gap-1.5">
                      <span
                        className="mt-[3px] size-1.5 shrink-0 rounded-full"
                        style={{ background: a.c }}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-[6px] font-semibold">{a.t}</p>
                        <p className="truncate text-[5px] text-[#8b93a7]">{a.b}</p>
                        <p className="text-[4.5px] text-[#c3c8d6]">{a.w}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[10px] border border-[#eef0f6] bg-white p-2">
                <p className="text-[7.5px] font-bold">Pipeline Overview</p>
                <div className="mt-1.5 space-y-1">
                  {OVERVIEW.map((o) => (
                    <div key={o.l}>
                      <div className="flex justify-between text-[5px]">
                        <span className="text-[#5b6478]">{o.l}</span>
                        <span className="text-[#a9b0c2]">{o.v}</span>
                      </div>
                      <span className="mt-0.5 block h-1 w-full overflow-hidden rounded-full bg-[#eef0f6]">
                        <span
                          className="block h-full rounded-full"
                          style={{ width: `${o.pct}%`, background: o.c }}
                        />
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  <div className="rounded-[6px] bg-[#fbfbfe] p-1.5">
                    <p className="text-[4.5px] text-[#8b93a7]">Conversion Rate</p>
                    <p className="text-[9px] font-bold">7%</p>
                  </div>
                  <div className="rounded-[6px] bg-[#fbfbfe] p-1.5">
                    <p className="text-[4.5px] text-[#8b93a7]">Total Revenue</p>
                    <p className="text-[9px] font-bold">AED 6.2M</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
