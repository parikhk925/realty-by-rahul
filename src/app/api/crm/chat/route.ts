import { NextResponse, type NextRequest } from "next/server";
import { processMessage } from "@/lib/crm/engine";

export const dynamic = "force-dynamic";

/** Public ingress for the site chat widget. No session — visitors are anonymous. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const visitorId = String(body?.visitorId ?? "").trim();
    const message = String(body?.message ?? "").trim();
    const name = body?.name ? String(body.name).trim().slice(0, 120) : undefined;

    if (visitorId.length < 6 || visitorId.length > 80) {
      return NextResponse.json({ error: "Invalid visitor" }, { status: 400 });
    }
    if (!message || message.length > 2000) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    const result = processMessage({ visitorId, message, name });

    return NextResponse.json({
      reply: result.reply,
      quickReplies: result.quickReplies,
      recommended: result.recommended,
      score: result.lead.score,
      temperature: result.lead.temperature,
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
