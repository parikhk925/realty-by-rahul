import Image from "next/image";
import "./pitch.css";

export const dynamic = "force-static";

const PRODUCT = "Concierge AI";
const COMPANY = "Kaivan Tech";
const DEMO_URL = "https://realty-by-rahul.vercel.app";

/* ---------------------------------------------------------------- pieces */

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/pitch/kaivan-logo.jpeg"
        alt={`${COMPANY} logo`}
        width={44}
        height={44}
        className="rounded-[11px] object-cover"
      />
      <div className="leading-tight">
        <p
          className={`text-[15px] font-bold tracking-[0.08em] ${dark ? "text-white" : "text-[var(--kt-ink)]"}`}
        >
          KAIVAN <span className="kt-grad-text">TECH</span>
        </p>
        <p
          className={`text-[8.5px] font-medium tracking-[0.18em] ${dark ? "text-white/45" : "text-[var(--kt-body)]"}`}
        >
          AI AUTOMATION · SOFTWARE · DIGITAL
        </p>
      </div>
    </div>
  );
}

function Section({
  eyebrow,
  title,
  lead,
  children,
  breakBefore = false,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  children?: React.ReactNode;
  breakBefore?: boolean;
}) {
  return (
    <section
      className={`mx-auto w-full max-w-[1080px] px-6 py-14 sm:px-10 sm:py-20 ${breakBefore ? "kt-page-break" : ""}`}
    >
      <p className="kt-eyebrow">{eyebrow}</p>
      <h2 className="mt-3 max-w-[760px] text-[30px] font-bold sm:text-[42px]">{title}</h2>
      {lead && (
        <p className="mt-4 max-w-[680px] text-[13px] leading-relaxed text-[var(--kt-body)] sm:text-[15px]">
          {lead}
        </p>
      )}
      <div className="kt-rule mt-7 w-16" />
      {children && <div className="mt-9">{children}</div>}
    </section>
  );
}

function Shot({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  return (
    <figure className="kt-avoid-break">
      <div className="kt-shot">
        <Image src={src} alt={alt} width={1600} height={1000} className="h-auto w-full" />
      </div>
      <figcaption className="mt-3 text-[11px] text-[var(--kt-body)]">{caption}</figcaption>
    </figure>
  );
}

function Bubble({ from, children }: { from: "in" | "out"; children: React.ReactNode }) {
  return (
    <div className={`kt-bubble ${from === "in" ? "kt-bubble-in" : "kt-bubble-out"}`}>
      {children}
    </div>
  );
}

function Phone({
  name,
  initials,
  accent,
  turns,
}: {
  name: string;
  initials: string;
  accent: string;
  turns: Array<{ from: "in" | "out"; text: string }>;
}) {
  return (
    <div className="kt-phone kt-avoid-break">
      <div className="kt-phone-screen">
        <div className="kt-wa-header">
          <span
            className="grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white"
            style={{ background: accent }}
          >
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[11.5px] font-semibold">{name}</p>
            <p className="text-[8.5px] text-white/70">online</p>
          </div>
        </div>
        <div className="kt-wa-body">
          {turns.map((t, i) => (
            <Bubble key={i} from={t.from}>
              {t.text}
            </Bubble>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ page */

export default function PitchPage() {
  return (
    <main className="kt-sheet">
      {/* ---------------------------------------------------------- cover */}
      <header className="kt-sheet px-6 pb-20 pt-0 sm:px-10 sm:pb-28">
        <div className="kt-topline -mx-6 sm:-mx-10" />
        <span aria-hidden className="kt-watermark kt-watermark-cover">KT</span>

        <div className="relative mx-auto max-w-[1080px] pt-8 sm:pt-10">
          <Logo />

          <div className="mt-16 sm:mt-24">
            <span className="inline-block rounded-full border border-[var(--kt-line)] bg-white px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--kt-blue)]">
              Product Proposal
            </span>

            <h1 className="mt-6 max-w-[860px] text-[42px] font-bold leading-[1.02] text-[var(--kt-ink)] sm:text-[74px]">
              <span className="kt-grad-text">{PRODUCT}</span>
              <br />
              Never lose an enquiry again.
            </h1>

            <p className="mt-6 max-w-[620px] text-[14px] leading-relaxed text-[var(--kt-body)] sm:text-[17px]">
              An AI conversation layer that answers every enquiry the moment it
              arrives, qualifies it properly, scores it, and hands your team a
              lead that is ready to act on — on WhatsApp, your website, or both.
            </p>

            <div className="mt-10 flex flex-wrap gap-2.5">
              {["Replies in seconds, 24/7", "Qualifies without a form", "Scores every lead", "Fills your CRM automatically"].map(
                (chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-[var(--kt-line)] bg-white px-3.5 py-2 text-[11px] font-medium text-[var(--kt-ink-2)]"
                  >
                    {chip}
                  </span>
                ),
              )}
            </div>

            <div className="mt-14 flex flex-wrap items-center gap-6 border-t border-[var(--kt-line)] pt-6 text-[11px] text-[var(--kt-body)]">
              <span>Prepared by {COMPANY}</span>
              <span>info@kaivantech.com</span>
              <span>kaivantech.com</span>
              <span>Ahmedabad, India</span>
            </div>
          </div>
        </div>
      </header>

      {/* --------------------------------------------------------- problem */}
      <Section
        eyebrow="The Problem"
        title="Most enquiries are lost in the first hour — not the first meeting."
        lead="Enquiries arrive at every hour from WhatsApp, Instagram, portals and your website. Whoever replies first usually wins. When a reply takes hours, the enquiry has already moved on — and the ones that do get answered still cost your team the same twenty questions, over and over."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              stat: "78%",
              label: "of buyers go with whoever responds first",
              note: "Speed beats polish on a first reply.",
            },
            {
              stat: "5–10 min",
              label: "spent qualifying each enquiry manually",
              note: "Budget, area, timeline, financing — every single time.",
            },
            {
              stat: "Most",
              label: "enquiries arrive outside working hours",
              note: "Evenings and weekends, when nobody is watching the inbox.",
            },
          ].map((item) => (
            <div key={item.stat} className="kt-card kt-avoid-break p-6">
              <p className="kt-grad-text text-[34px] font-bold">{item.stat}</p>
              <p className="mt-2 text-[13px] font-semibold">{item.label}</p>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-[var(--kt-body)]">
                {item.note}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------------------------ flow */}
      <Section
        eyebrow="How It Works"
        title="One conversation. Five things happen automatically."
        lead="The customer just talks. Everything else runs behind it, in order, every time."
        breakBefore
      >
        <div className="space-y-3">
          {[
            {
              n: "01",
              t: "Understands the message",
              d: "Reads plain language — “2 bed in Marina, 3.5M, cash, moving next month” — and pulls out every fact in one pass. No forms, no menus.",
            },
            {
              n: "02",
              t: "Asks only what is missing",
              d: "Nothing is asked twice. If they already said the budget, the next question is about something else.",
            },
            {
              n: "03",
              t: "Scores the lead",
              d: "A transparent 0–100 score from budget, timeline, payment method and intent. Every point is traceable to something the customer actually said.",
            },
            {
              n: "04",
              t: "Recommends from your own inventory",
              d: "Matches against your real stock and explains why each one fits. It never invents a listing, and it says so honestly when nothing matches.",
            },
            {
              n: "05",
              t: "Creates the CRM record",
              d: "Requirements, score, transcript, recommended items and the next action — written the moment the conversation reaches a useful point.",
            },
          ].map((step) => (
            <div key={step.n} className="kt-card kt-avoid-break flex gap-5 p-5 sm:p-6">
              <span className="kt-grad-text shrink-0 text-[22px] font-bold">{step.n}</span>
              <div>
                <p className="text-[14px] font-semibold">{step.t}</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--kt-body)]">
                  {step.d}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* -------------------------------------------------------- scoring */}
      <Section
        eyebrow="The Scoring Model"
        title="Why one lead is worth calling before another."
        lead="The score is arithmetic, not opinion. Your team can see exactly where every point came from — and you can change the weights whenever your market changes."
      >
        <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
          <div className="kt-card kt-avoid-break p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--kt-body)]">
              Worked example
            </p>
            <p className="mt-3 text-[12.5px] italic leading-relaxed text-[var(--kt-ink-2)]">
              “I want to buy a 2 bedroom apartment in Dubai Marina, 3.5 million,
              cash, ready, moving within 30 days.”
            </p>
            <div className="mt-5 space-y-2">
              {[
                ["Timeline — within 30 days", "+22"],
                ["Budget — AED 2M–5M", "+20"],
                ["Cash buyer", "+15"],
                ["Intent — buy", "+10"],
                ["Location specified", "+8"],
                ["Property type specified", "+5"],
                ["Layout specified", "+5"],
                ["Off-plan / ready decided", "+4"],
              ].map(([label, pts]) => (
                <div
                  key={label}
                  className="flex items-center justify-between border-b border-dashed border-[var(--kt-line)] pb-2 text-[12px]"
                >
                  <span className="text-[var(--kt-body)]">{label}</span>
                  <span className="font-semibold text-[var(--kt-blue)]">{pts}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between rounded-xl bg-[var(--kt-canvas)] px-4 py-3">
              <span className="text-[12px] font-semibold">Total</span>
              <span className="text-[20px] font-bold text-[#c8342b]">89 / 100 · HOT</span>
            </div>
          </div>

          <div className="space-y-4">
            {[
              {
                band: "HOT",
                range: "70–100",
                colour: "#c8342b",
                bg: "#fdecea",
                action: "Call today. Budget, timeline and intent are all confirmed.",
              },
              {
                band: "WARM",
                range: "40–69",
                colour: "#a5701a",
                bg: "#fff6e6",
                action: "Send matching options, follow up in a few days.",
              },
              {
                band: "COLD",
                range: "0–39",
                colour: "#5b6478",
                bg: "#eef0f5",
                action: "Nurture. Re-engage when relevant stock appears.",
              },
            ].map((b) => (
              <div key={b.band} className="kt-card kt-avoid-break p-5">
                <div className="flex items-center gap-3">
                  <span
                    className="rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide"
                    style={{ background: b.bg, color: b.colour }}
                  >
                    {b.band}
                  </span>
                  <span className="text-[11px] text-[var(--kt-body)]">{b.range}</span>
                </div>
                <p className="mt-2.5 text-[12.5px] leading-relaxed text-[var(--kt-body)]">
                  {b.action}
                </p>
              </div>
            ))}
            <p className="px-1 text-[11px] leading-relaxed text-[var(--kt-body)]">
              Thresholds and weights are configurable per business. A clinic
              scores urgency differently to a property advisor.
            </p>
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------- use case: real estate */}
      <Section
        eyebrow="Use Case 01 — Real Estate"
        title="Property enquiries, qualified before you pick up the phone."
        lead="Live and running today for a Dubai property advisor. The assistant qualifies the buyer, matches against real inventory, books the viewing and hands over a scored lead."
        breakBefore
      >
        <div className="grid items-start gap-8 lg:grid-cols-[300px_1fr]">
          <Phone
            name="Realty by Rahul"
            initials="RJ"
            accent="linear-gradient(135deg,#d9a94f,#8f6420)"
            turns={[
              { from: "out", text: "Hi, saw your listing on Instagram" },
              {
                from: "in",
                text: "Hey, good evening! I'm Rahul's assistant — I help buyers and investors find the right property in Dubai. To point you at the right things — are you looking to buy, invest, rent, or sell?",
              },
              { from: "out", text: "Buy. 2 bed in Marina, around 3.5M, cash" },
              {
                from: "in",
                text: "Dubai Marina — one of the most liquid rental markets in the city. AED 3.5M is a workable budget there. Ready to move in, or off-plan?",
              },
              { from: "out", text: "Ready. Want to move within a month" },
              {
                from: "in",
                text: "Based on that, here's what I'd put in front of you from Rahul's portfolio. I've flagged this to him as a priority — he'll come back to you personally, usually within the day.",
              },
            ]}
          />

          <div className="space-y-5">
            <Shot
              src="/pitch/chat-widget.png"
              alt="The assistant qualifying a buyer on the Realty by Rahul website"
              caption="The same assistant on the website — recommending from live inventory with a match score."
            />
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Qualifies", "Budget, area, type, layout, timeline, financing"],
                ["Recommends", "From your real stock, with a reason per match"],
                ["Books", "Viewing requests captured and flagged"],
              ].map(([h, d]) => (
                <div key={h} className="kt-card p-4">
                  <p className="text-[12px] font-semibold">{h}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[var(--kt-body)]">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ---------------------------------------------------- use case: clinic */}
      <Section
        eyebrow="Use Case 02 — Clinics & Healthcare"
        title="Appointments booked while the clinic sleeps."
        lead="Patients message at 11pm. The assistant triages the reason for the visit, offers real slots, books the appointment and sends the reminder — without a receptionist in the loop."
      >
        <div className="grid items-start gap-8 lg:grid-cols-[300px_1fr]">
          <Phone
            name="Sunrise Dental Clinic"
            initials="SD"
            accent="linear-gradient(135deg,#00b8f0,#2563eb)"
            turns={[
              { from: "out", text: "Hi, do you have anything tomorrow?" },
              {
                from: "in",
                text: "Good evening! Yes, we have slots tomorrow. So I can book the right one — is this a check-up, a cleaning, or are you in pain?",
              },
              { from: "out", text: "Bad toothache since last night" },
              {
                from: "in",
                text: "Sorry to hear that — I'll treat this as urgent. Dr. Mehta has 10:15am or 4:30pm tomorrow. Which suits you?",
              },
              { from: "out", text: "10:15 please" },
              {
                from: "in",
                text: "Booked — 10:15am with Dr. Mehta. I'll send a reminder an hour before. Could I take your name and date of birth for the file?",
              },
            ]}
          />

          <div className="space-y-4">
            {[
              ["Triage before booking", "Distinguishes routine from urgent, and books accordingly."],
              ["Real calendar slots", "Reads live availability per practitioner — never double-books."],
              ["Reminders and no-show recovery", "Confirmation, reminder, and an automatic re-book offer when someone misses."],
              ["Patient record created", "Name, contact, reason for visit and history in the system before they arrive."],
            ].map(([h, d]) => (
              <div key={h} className="kt-card kt-avoid-break p-5">
                <p className="text-[13px] font-semibold">{h}</p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--kt-body)]">{d}</p>
              </div>
            ))}
            <div className="rounded-xl bg-[var(--kt-canvas)] p-4 text-[11.5px] leading-relaxed text-[var(--kt-body)]">
              <strong className="text-[var(--kt-ink)]">Boundary:</strong> the
              assistant books and informs. It never gives clinical advice — any
              medical question is routed to a practitioner.
            </div>
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------- use case: marketing */}
      <Section
        eyebrow="Use Case 03 — Marketing & Agencies"
        title="Ad spend that converts into booked meetings, not form fills."
        lead="Route your paid traffic into a conversation instead of a contact form. The assistant qualifies against your ideal-client criteria and books the discovery call straight into the calendar."
        breakBefore
      >
        <div className="grid items-start gap-8 lg:grid-cols-[300px_1fr]">
          <Phone
            name="Northwind Digital"
            initials="ND"
            accent="linear-gradient(135deg,#7c3aed,#ec4899)"
            turns={[
              { from: "out", text: "Saw your ad — what do you charge for SEO?" },
              {
                from: "in",
                text: "Happy to help. Pricing depends on scope, so a couple of quick questions — what does your business do, and roughly what's your monthly marketing budget?",
              },
              { from: "out", text: "B2B SaaS, about $4k a month" },
              {
                from: "in",
                text: "That's a good fit — we work with B2B SaaS at that level. Are you looking to start this month, or planning ahead?",
              },
              { from: "out", text: "This month ideally" },
              {
                from: "in",
                text: "Then let's get you in with Sarah. She has Thursday 2pm or Friday 11am. Which works?",
              },
            ]}
          />

          <div className="space-y-4">
            {[
              ["Qualifies against ICP", "Budget, industry, company size and timeline — before anyone's diary is opened."],
              ["Books straight to calendar", "Real availability, invite sent, reminder scheduled."],
              ["Disqualifies politely", "Out-of-budget enquiries get an honest answer instead of wasting a call."],
              ["Attribution intact", "Campaign, ad and keyword carried into the CRM record."],
            ].map(([h, d]) => (
              <div key={h} className="kt-card kt-avoid-break p-5">
                <p className="text-[13px] font-semibold">{h}</p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--kt-body)]">{d}</p>
              </div>
            ))}
            <div className="rounded-xl bg-[var(--kt-canvas)] p-4 text-[11.5px] leading-relaxed text-[var(--kt-body)]">
              Same engine in all three cases. Only the questions, the scoring
              weights and the connected system change.
            </div>
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------------------- CRM */}
      <Section
        eyebrow="The CRM"
        title="Your team opens one screen and knows exactly who to call."
        lead="Ranked hottest first. Every card carries the captured requirements, the score with its full breakdown, the recommended items, the complete transcript and a next action."
        breakBefore
      >
        <div className="space-y-6">
          <Shot
            src="/pitch/crm-board.png"
            alt="Concierge AI CRM board showing scored leads"
            caption="The live board — metrics, a hot-lead call-out, and per-lead detail with the full conversation."
          />
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              ["Scored & ranked", "Work top down. No triage meeting."],
              ["Full transcript", "See exactly what was said, and when."],
              ["Next action", "Written per lead, not left to guesswork."],
              ["Pipeline value", "Total budget in play, live."],
            ].map(([h, d]) => (
              <div key={h} className="kt-card kt-avoid-break p-4">
                <p className="text-[12px] font-semibold">{h}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-[var(--kt-body)]">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------------ live system */}
      <Section
        eyebrow="Working System"
        title="This is not a concept. It is deployed and running."
        lead="Built for a Dubai property advisor: a public portfolio site, the assistant, the CRM and a WhatsApp integration — live, and open to walk through right now."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Shot
            src="/pitch/site-hero.png"
            alt="Realty by Rahul public site"
            caption="Public site — the assistant sits on every page."
          />
          <Shot
            src="/pitch/site-listing.png"
            alt="Property detail page with documents and price check"
            caption="Listing detail — payment plan, generated PDF, live market price check."
          />
        </div>

        <div className="kt-card kt-no-print mt-6 flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <p className="text-[13px] font-semibold">See it working</p>
            <p className="mt-1 text-[11.5px] text-[var(--kt-body)]">
              Open the site and talk to the assistant — the lead appears in the
              CRM as you speak.
            </p>
          </div>
          <a
            href={DEMO_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-full px-6 py-3 text-[12px] font-semibold text-white"
            style={{ background: "var(--kt-gradient)" }}
          >
            Open the live demo →
          </a>
        </div>
      </Section>

      {/* ---------------------------------------------------------- impact */}
      <Section
        eyebrow="What It Changes"
        title="The measurable difference."
        breakBefore
      >
        <div className="kt-card kt-avoid-break overflow-hidden">
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="bg-[var(--kt-canvas)] text-[10px] uppercase tracking-[0.12em] text-[var(--kt-body)]">
                <th className="px-5 py-3 font-semibold">Today</th>
                <th className="px-5 py-3 font-semibold">With {PRODUCT}</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Reply in minutes to hours — if at all", "Replies in seconds, every hour of every day"],
                ["Same twenty questions, manually, every time", "Qualified automatically before anyone reads it"],
                ["Leads scattered across WhatsApp and notebooks", "One ranked board, scored and searchable"],
                ["“Who should I call first?”", "Hottest lead at the top, with a next action"],
                ["Follow-ups forgotten", "Every enquiry recorded with its full history"],
              ].map(([before, after]) => (
                <tr key={before} className="border-t border-[var(--kt-line)]">
                  <td className="px-5 py-3.5 text-[var(--kt-body)]">{before}</td>
                  <td className="px-5 py-3.5 font-medium text-[var(--kt-ink)]">{after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            ["24/7", "Coverage without hiring"],
            ["< 5 sec", "Typical first response"],
            ["0", "Enquiries left unanswered"],
          ].map(([stat, label]) => (
            <div key={stat} className="kt-card kt-avoid-break p-6 text-center">
              <p className="kt-grad-text text-[32px] font-bold">{stat}</p>
              <p className="mt-1.5 text-[11.5px] text-[var(--kt-body)]">{label}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* --------------------------------------------------------- process */}
      <Section
        eyebrow="Delivery"
        title="How we build it with you."
        lead="The same structured process behind every Kaivan Tech engagement."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["01. Discovery", "Your enquiry flow, tools and the questions your team actually asks."],
            ["02. Design", "Conversation script, scoring weights and CRM fields agreed with you."],
            ["03. Build", "Assistant, CRM and integrations — WhatsApp, website, calendar."],
            ["04. Launch & support", "Live rollout, monitoring, and tuning as real conversations come in."],
          ].map(([h, d]) => (
            <div key={h} className="kt-card kt-avoid-break p-5">
              <p className="kt-grad-text text-[12px] font-bold">{h}</p>
              <p className="mt-2 text-[11.5px] leading-relaxed text-[var(--kt-body)]">{d}</p>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--kt-body)]">
            Built on
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              "Next.js",
              "React",
              "TypeScript",
              "Supabase / PostgreSQL",
              "WhatsApp Cloud API",
              "Gemini",
              "Vercel",
              "n8n / Make",
            ].map((t) => (
              <span key={t} className="kt-chip">
                {t}
              </span>
            ))}
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------------------ close */}
      <footer className="kt-page-break kt-sheet px-6 py-20 sm:px-10 sm:py-28">
        <span aria-hidden className="kt-watermark kt-watermark-close">KT</span>
        <div className="relative mx-auto max-w-[1080px]">
          <p className="kt-eyebrow">Next Step</p>

          <h2 className="mt-4 max-w-[820px] text-[40px] font-bold text-[var(--kt-ink)] sm:text-[64px]">
            Get your <span className="kt-grad-text">quote now.</span>
          </h2>

          <p className="mt-5 max-w-[560px] text-[13px] leading-relaxed text-[var(--kt-body)] sm:text-[15px]">
            Tell us how enquiries reach you today. We&apos;ll map the flow,
            configure the assistant to your business and quote a fixed scope —
            usually within two working days.
          </p>

          {/* The contact block is the payoff of the whole document, so it is
              set as the primary visual, not a footnote. */}
          <div className="mt-10 inline-flex flex-col gap-3 rounded-[22px] border border-[var(--kt-line)] bg-white p-7 shadow-[0_14px_44px_rgba(19,27,56,.08)] sm:flex-row sm:items-center sm:gap-10">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--kt-body)]">
                Website
              </p>
              <p className="mt-1.5 text-[20px] font-bold text-[var(--kt-ink)] sm:text-[26px]">
                kaivantech.com
              </p>
            </div>
            <div className="hidden h-12 w-px bg-[var(--kt-line)] sm:block" />
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[var(--kt-body)]">
                Email
              </p>
              <p className="mt-1.5 text-[20px] font-bold text-[var(--kt-ink)] sm:text-[26px]">
                info@kaivantech.com
              </p>
            </div>
          </div>

          <p className="mt-6 text-[11.5px] text-[var(--kt-body)]">
            Science City, Ahmedabad, Gujarat, India · AI Automation, Software
            Development &amp; Digital Experiences
          </p>

          <div className="mt-14 flex flex-wrap items-center justify-between gap-6 border-t border-[var(--kt-line)] pt-6">
            <Logo />
            <p className="text-[10px] text-[var(--kt-body)]">
              Build Smarter. Automate Faster. Scale with AI.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
