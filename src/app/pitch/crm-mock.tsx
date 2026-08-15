/**
 * CRM dashboard mockups for the deck.
 *
 * Drawn rather than screenshotted, for two reasons: the deck ships to
 * prospects in other industries, so it must not carry any real client's
 * brand, name or photograph; and a drawn mock prints crisply at any size.
 *
 * One component, configured per industry — the product is the same system.
 */

export interface CrmMockConfig {
  brand: string;
  brandSub: string;
  accent: string;
  greeting: string;
  nav: { group: string; items: string[] }[];
  metrics: { label: string; value: string; delta: string }[];
  columns: {
    title: string;
    count: number;
    tone: string;
    cards: { initials: string; name: string; sub: string; meta: string; tag?: string }[];
  }[];
  detail: {
    name: string;
    tag: string;
    contact: string;
    source: string;
    rows: [string, string][];
    note: string;
    score: string;
  };
  activity: { title: string; body: string; time: string; dot: string }[];
  botStats: { label: string; value: string; delta: string }[];
}

function Bar({ pct, colour }: { pct: number; colour: string }) {
  return (
    <span className="block h-1.5 w-full overflow-hidden rounded-full bg-[#eef0f6]">
      <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: colour }} />
    </span>
  );
}

export function CrmMock({ c }: { c: CrmMockConfig }) {
  return (
    <div className="kt-avoid-break overflow-hidden rounded-[14px] border border-[#e4e7f0] bg-white text-[#10131f] shadow-[0_10px_34px_rgba(19,27,56,.08)]">
      <div className="flex">
        {/* ------------------------------------------------------ sidebar */}
        <aside className="hidden w-[132px] shrink-0 border-r border-[#eef0f6] bg-[#fbfbfe] p-3 sm:block">
          <div className="flex items-center gap-1.5">
            <span
              className="grid size-5 place-items-center rounded-[6px] text-[7px] font-bold text-white"
              style={{ background: c.accent }}
            >
              {c.brand.slice(0, 1)}
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[8px] font-bold">{c.brand}</p>
              <p className="truncate text-[6px] text-[#8b93a7]">{c.brandSub}</p>
            </div>
          </div>

          <div className="mt-3 space-y-2.5">
            {c.nav.map((g) => (
              <div key={g.group}>
                <p className="text-[5.5px] font-semibold uppercase tracking-[0.14em] text-[#a9b0c2]">
                  {g.group}
                </p>
                <ul className="mt-1 space-y-[3px]">
                  {g.items.map((item, i) => (
                    <li
                      key={item}
                      className={`rounded-[5px] px-1.5 py-[3px] text-[7px] ${
                        g.group === "MAIN" && i === 0
                          ? "font-semibold text-white"
                          : "text-[#5b6478]"
                      }`}
                      style={
                        g.group === "MAIN" && i === 0 ? { background: c.accent } : undefined
                      }
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {/* --------------------------------------------------------- main */}
        <div className="min-w-0 flex-1 p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[12px] font-bold">Dashboard</p>
              <p className="text-[7.5px] text-[#8b93a7]">{c.greeting}</p>
            </div>
            <span
              className="rounded-[6px] px-2 py-1 text-[7px] font-semibold text-white"
              style={{ background: c.accent }}
            >
              + Add Lead
            </span>
          </div>

          {/* metrics */}
          <div className="mt-3 grid grid-cols-5 gap-1.5">
            {c.metrics.map((m) => (
              <div key={m.label} className="rounded-[8px] border border-[#eef0f6] p-1.5">
                <p className="text-[6px] text-[#8b93a7]">{m.label}</p>
                <p className="mt-0.5 text-[13px] font-bold leading-none">{m.value}</p>
                <p className="mt-1 text-[5.5px] font-medium text-[#16a34a]">↑ {m.delta}</p>
              </div>
            ))}
          </div>

          <div className="mt-2.5 grid gap-2.5 lg:grid-cols-[1fr_150px]">
            <div>
              {/* pipeline */}
              <div className="rounded-[10px] border border-[#eef0f6] p-2">
                <p className="text-[8px] font-bold">Lead Pipeline</p>
                <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                  {c.columns.map((col) => (
                    <div key={col.title} className="rounded-[7px] bg-[#fbfbfe] p-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-[6.5px] font-semibold">{col.title}</p>
                        <span className="text-[6px] text-[#8b93a7]">{col.count}</span>
                      </div>
                      <span
                        className="mt-1 block h-[2px] w-full rounded-full"
                        style={{ background: col.tone }}
                      />
                      <div className="mt-1.5 space-y-1">
                        {col.cards.map((card) => (
                          <div
                            key={card.name}
                            className="rounded-[6px] border border-[#eef0f6] bg-white p-1"
                          >
                            <div className="flex items-center gap-1">
                              <span className="grid size-3.5 shrink-0 place-items-center rounded-full bg-[#eef0f6] text-[5px] font-bold text-[#5b6478]">
                                {card.initials}
                              </span>
                              <p className="truncate text-[6.5px] font-semibold">{card.name}</p>
                            </div>
                            <p className="mt-0.5 truncate text-[6px]" style={{ color: c.accent }}>
                              {card.sub}
                            </p>
                            <p className="truncate text-[5.5px] text-[#a9b0c2]">{card.meta}</p>
                            {card.tag && (
                              <span className="mt-0.5 inline-block rounded-full bg-[#fff4e6] px-1 py-[1px] text-[5px] font-semibold text-[#b45309]">
                                {card.tag}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* lead detail */}
              <div className="mt-2 rounded-[10px] border border-[#eef0f6] p-2">
                <div className="flex items-center justify-between">
                  <p className="text-[8px] font-bold">Lead Details</p>
                  <span className="text-[6px]" style={{ color: c.accent }}>
                    View full profile
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="grid size-6 place-items-center rounded-full bg-[#eef0f6] text-[7px] font-bold text-[#5b6478]">
                    {c.detail.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-[8px] font-bold">{c.detail.name}</p>
                      <span className="rounded-full bg-[#fdecea] px-1 py-[1px] text-[5px] font-semibold text-[#c8342b]">
                        {c.detail.tag}
                      </span>
                    </div>
                    <p className="text-[6px] text-[#8b93a7]">
                      {c.detail.contact} · {c.detail.source}
                    </p>
                  </div>
                </div>

                <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  <div className="rounded-[7px] bg-[#fbfbfe] p-1.5">
                    <p className="text-[5.5px] font-semibold uppercase tracking-[0.1em] text-[#a9b0c2]">
                      AI qualification summary
                    </p>
                    <div className="mt-1 space-y-[3px]">
                      {c.detail.rows.map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-2 text-[6px]">
                          <span className="text-[#8b93a7]">{k}</span>
                          <span className="font-medium">{v}</span>
                        </div>
                      ))}
                      <div className="flex items-center gap-1 pt-0.5">
                        <span className="text-[6px] text-[#8b93a7]">Score</span>
                        <span className="text-[7px] font-bold" style={{ color: c.accent }}>
                          {c.detail.score}
                        </span>
                        <Bar pct={Number(c.detail.score.split("/")[0])} colour="#16a34a" />
                      </div>
                    </div>
                  </div>
                  <div className="rounded-[7px] bg-[#f5f3ff] p-1.5">
                    <p className="text-[5.5px] font-semibold uppercase tracking-[0.1em] text-[#7c3aed]">
                      AI notes
                    </p>
                    <p className="mt-1 text-[6px] leading-[1.5] text-[#5b6478]">{c.detail.note}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------ right rail */}
            <div className="hidden space-y-2 lg:block">
              <div className="rounded-[10px] border border-[#eef0f6] p-2">
                <p className="text-[8px] font-bold">Live Activity</p>
                <div className="mt-1.5 space-y-1.5">
                  {c.activity.map((a) => (
                    <div key={a.title} className="flex gap-1.5">
                      <span
                        className="mt-[3px] size-1.5 shrink-0 rounded-full"
                        style={{ background: a.dot }}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-[6.5px] font-semibold">{a.title}</p>
                        <p className="truncate text-[5.5px] text-[#8b93a7]">{a.body}</p>
                        <p className="text-[5px] text-[#c3c8d6]">{a.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[10px] border border-[#eef0f6] p-2">
                <p className="text-[8px] font-bold">Bot Performance</p>
                <div className="mt-1.5 space-y-1.5">
                  {c.botStats.map((s) => (
                    <div key={s.label}>
                      <p className="text-[5.5px] text-[#8b93a7]">{s.label}</p>
                      <div className="flex items-baseline gap-1">
                        <p className="text-[11px] font-bold leading-none">{s.value}</p>
                        <span className="text-[5.5px] font-medium text-[#16a34a]">↑ {s.delta}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- configs */

export const ESTATE_CRM: CrmMockConfig = {
  brand: "Kaivan Estates",
  brandSub: "Property CRM",
  accent: "#2563eb",
  greeting: "Welcome back, Sales Desk",
  nav: [
    { group: "MAIN", items: ["Dashboard", "All Leads", "Pipeline", "Viewings"] },
    { group: "INVENTORY", items: ["Listings", "Developers", "Collections"] },
    { group: "AUTOMATION", items: ["WhatsApp Bot", "Follow Ups", "Workflows"] },
    { group: "ANALYTICS", items: ["Reports", "Performance"] },
  ],
  metrics: [
    { label: "New Leads", value: "52", delta: "26%" },
    { label: "Qualified", value: "34", delta: "31%" },
    { label: "Viewings", value: "21", delta: "19%" },
    { label: "Attended", value: "17", delta: "22%" },
    { label: "Conversion", value: "32.7%", delta: "11%" },
  ],
  columns: [
    {
      title: "New Lead",
      count: 52,
      tone: "#c7d2fe",
      cards: [
        { initials: "AH", name: "A. Hassan", sub: "2BR · Marina", meta: "WhatsApp · 3m ago", tag: "High intent" },
        { initials: "LR", name: "L. Ribeiro", sub: "Villa · Hills", meta: "Website · 22m ago" },
      ],
    },
    {
      title: "Qualified",
      count: 34,
      tone: "#fde68a",
      cards: [
        { initials: "SK", name: "S. Kapoor", sub: "Off-plan · Creek", meta: "Qualified · 1h ago" },
        { initials: "MN", name: "M. Novak", sub: "1BR · JVC", meta: "Qualified · 3h ago" },
      ],
    },
    {
      title: "Viewing Booked",
      count: 21,
      tone: "#bbf7d0",
      cards: [
        { initials: "TR", name: "T. Rahman", sub: "Palm Jumeirah", meta: "Sat, 11:00 AM" },
        { initials: "DK", name: "D. Kaur", sub: "Business Bay", meta: "Sun, 3:30 PM" },
      ],
    },
    {
      title: "Negotiation",
      count: 9,
      tone: "#ddd6fe",
      cards: [
        { initials: "YB", name: "Y. Bakr", sub: "Offer submitted", meta: "Follow up · 1d" },
      ],
    },
  ],
  detail: {
    name: "Ahmed Hassan",
    tag: "HOT",
    contact: "+971 50 ••• 4501",
    source: "via WhatsApp",
    rows: [
      ["Looking for", "2 BR apartment"],
      ["Area", "Dubai Marina"],
      ["Budget", "AED 3.5M"],
      ["Payment", "Cash"],
      ["Timeline", "Within 30 days"],
    ],
    note: "Cash buyer with a firm 30-day timeline and a fixed area. Two matching units in stock. Viewing requested — call today.",
    score: "89/100",
  },
  activity: [
    { title: "New WhatsApp lead", body: "A. Hassan started a conversation", time: "3m ago", dot: "#22c55e" },
    { title: "AI qualification complete", body: "Scored 89/100 — high intent", time: "3m ago", dot: "#7c3aed" },
    { title: "Viewing requested", body: "Marina Vista — Saturday 11:00", time: "9m ago", dot: "#2563eb" },
    { title: "Follow-up sent", body: "Payment plan shared with S. Kapoor", time: "41m ago", dot: "#f59e0b" },
  ],
  botStats: [
    { label: "Conversations", value: "164", delta: "27%" },
    { label: "Qualified leads", value: "94", delta: "33%" },
    { label: "Viewings booked", value: "21", delta: "19%" },
  ],
};

export const CLINIC_CRM: CrmMockConfig = {
  brand: "CareFlow",
  brandSub: "Clinic CRM",
  accent: "#7c3aed",
  greeting: "Welcome back, Front Desk",
  nav: [
    { group: "MAIN", items: ["Dashboard", "All Leads", "Appointments", "Follow Ups"] },
    { group: "PATIENTS", items: ["Patients", "Consultations", "Treatment Plans"] },
    { group: "AUTOMATION", items: ["WhatsApp Bot", "Reminders", "Workflows"] },
    { group: "ANALYTICS", items: ["Reports", "Performance"] },
  ],
  metrics: [
    { label: "New Leads", value: "48", delta: "24%" },
    { label: "Qualified", value: "31", delta: "32%" },
    { label: "Booked", value: "19", delta: "18%" },
    { label: "Showed Up", value: "15", delta: "20%" },
    { label: "Conversion", value: "31.2%", delta: "12%" },
  ],
  columns: [
    {
      title: "New Lead",
      count: 48,
      tone: "#c7d2fe",
      cards: [
        { initials: "AS", name: "A. Sharma", sub: "Dermatology", meta: "WhatsApp · 2m ago", tag: "High intent" },
        { initials: "RM", name: "R. Mehta", sub: "Orthodontics", meta: "Website · 15m ago" },
      ],
    },
    {
      title: "Qualified",
      count: 31,
      tone: "#fde68a",
      cards: [
        { initials: "AV", name: "A. Verma", sub: "Hair Transplant", meta: "Qualified · 1h ago" },
        { initials: "SK", name: "S. Kaur", sub: "Cosmetology", meta: "Qualified · 2h ago" },
      ],
    },
    {
      title: "Appointment Booked",
      count: 19,
      tone: "#bbf7d0",
      cards: [
        { initials: "PI", name: "P. Iyer", sub: "Dermatology", meta: "May 22, 11:00 AM" },
        { initials: "VS", name: "V. Singh", sub: "Orthodontics", meta: "May 22, 3:30 PM" },
      ],
    },
    {
      title: "Follow Up",
      count: 12,
      tone: "#ddd6fe",
      cards: [
        { initials: "KJ", name: "K. Joshi", sub: "Cosmetology", meta: "Follow up · 1d ago" },
      ],
    },
  ],
  detail: {
    name: "Aisha Sharma",
    tag: "HIGH INTENT",
    contact: "+971 50 ••• 4567",
    source: "via WhatsApp",
    rows: [
      ["Concern", "Hair fall & thinning"],
      ["Interested in", "PRP treatment"],
      ["Budget", "AED 1,500–2,500"],
      ["Timeline", "Within 1 month"],
      ["Experience", "First time"],
    ],
    note: "High-intent enquiry for PRP hair-fall treatment. Budget in range, wants an appointment this month. Strong conversion potential.",
    score: "92/100",
  },
  activity: [
    { title: "New WhatsApp lead", body: "A. Sharma — dermatology, hair fall", time: "2m ago", dot: "#22c55e" },
    { title: "AI qualification complete", body: "Scored 92/100 — high intent", time: "3m ago", dot: "#7c3aed" },
    { title: "Appointment booked", body: "P. Iyer — May 22, 11:00 AM", time: "8m ago", dot: "#2563eb" },
    { title: "No-show alert", body: "R. Das missed May 21, 3:30 PM", time: "1h ago", dot: "#ef4444" },
  ],
  botStats: [
    { label: "Conversations", value: "158", delta: "28%" },
    { label: "Qualified leads", value: "89", delta: "35%" },
    { label: "Appointments", value: "19", delta: "22%" },
  ],
};
