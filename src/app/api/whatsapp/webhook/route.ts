import { NextResponse, type NextRequest } from "next/server";
import { processMessage } from "@/lib/crm/engine";
import { canReceive, whatsappConfig } from "@/lib/whatsapp/config";
import { parseWebhookPayload, verifySignature } from "@/lib/whatsapp/verify";
import { sendWhatsAppText, withQuickReplies } from "@/lib/whatsapp/send";

// crypto.timingSafeEqual needs the Node runtime, not Edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Message ids already handled — Meta retries deliveries. */
const seen = globalThis as unknown as { __waSeen?: Set<string> };
function alreadyHandled(id: string): boolean {
  if (!seen.__waSeen) seen.__waSeen = new Set();
  if (seen.__waSeen.has(id)) return true;
  seen.__waSeen.add(id);
  // Bound the set so a long-running instance cannot grow it without limit.
  if (seen.__waSeen.size > 1000) {
    seen.__waSeen = new Set([...seen.__waSeen].slice(-500));
  }
  return false;
}

/** Meta's subscription handshake. */
export async function GET(request: NextRequest) {
  if (!whatsappConfig.verifyToken) {
    return new NextResponse("not_connected", { status: 503 });
  }

  const params = request.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (mode === "subscribe" && token === whatsappConfig.verifyToken && challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new NextResponse("forbidden", { status: 403 });
}

/**
 * Inbound messages.
 *
 * Calls the same `processMessage` the website widget uses — there is no
 * separate WhatsApp pipeline, so qualification, scoring and recommendations
 * behave identically on both channels.
 */
export async function POST(request: NextRequest) {
  if (!canReceive()) {
    return NextResponse.json({ error: "not_connected" }, { status: 503 });
  }

  // Raw bytes, exactly as sent — required for the HMAC to match.
  const rawBody = await request.text();

  if (!verifySignature(rawBody, request.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    // Malformed but signed — acknowledge so Meta stops retrying.
    return NextResponse.json({ received: true });
  }

  const messages = parseWebhookPayload(payload);

  for (const message of messages) {
    if (alreadyHandled(message.messageId)) continue;

    try {
      const result = processMessage({
        // The WhatsApp number is the stable identity, so a returning buyer
        // keeps everything captured previously.
        visitorId: `wa-${message.from}`,
        message: message.text,
        name: message.profileName ?? undefined,
      });

      await sendWhatsAppText(
        message.from,
        withQuickReplies(result.reply, result.quickReplies),
      );
    } catch (error) {
      // One bad message must not fail the whole batch.
      console.error(
        "whatsapp.process_failed",
        error instanceof Error ? error.message : "unknown",
      );
    }
  }

  // Always 200 on a signed, parseable payload.
  return NextResponse.json({ received: true });
}
