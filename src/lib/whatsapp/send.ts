import "server-only";
import { canSend, whatsappConfig } from "./config";

/**
 * Outbound WhatsApp send.
 *
 * Returns a result rather than throwing: a failed send must never take down
 * the webhook, or Meta retries the same inbound message indefinitely.
 */
export async function sendWhatsAppText(
  to: string,
  body: string,
): Promise<{ ok: boolean; reason?: string }> {
  if (!canSend()) {
    return { ok: false, reason: "sending_disabled" };
  }

  const url = `https://graph.facebook.com/${whatsappConfig.graphVersion}/${whatsappConfig.phoneNumberId}/messages`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${whatsappConfig.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        // Truncated to WhatsApp's 4096-character body limit.
        text: { preview_url: false, body: body.slice(0, 4096) },
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      // Never log the token; the URL and payload are safe to record.
      console.error("whatsapp.send_failed", response.status, detail.slice(0, 500));
      return { ok: false, reason: `http_${response.status}` };
    }

    return { ok: true };
  } catch (error) {
    console.error(
      "whatsapp.send_error",
      error instanceof Error ? error.message : "unknown",
    );
    return { ok: false, reason: "network_error" };
  }
}

/**
 * Quick replies become a numbered list appended to the message.
 *
 * Interactive button messages cap at three options and require a different
 * payload shape; a numbered list keeps every option visible and works
 * identically on the test number.
 */
export function withQuickReplies(reply: string, quickReplies: string[]): string {
  if (quickReplies.length === 0) return reply;
  const options = quickReplies.map((option, i) => `${i + 1}. ${option}`).join("\n");
  return `${reply}\n\n${options}`;
}

interface Recommendation {
  slug: string;
  title: string;
  community: string;
  price: string;
  priceQualifier: string;
  bedrooms: number;
  matchPercentage: number;
  handover?: string;
  paymentPlan?: string;
}

/**
 * Appends the matched properties as text with a link each.
 *
 * The website widget renders these as cards; on WhatsApp there is no such
 * affordance, so without this the assistant announces that it has found
 * matches and then never says what they are — which is the entire point of
 * the conversation.
 *
 * Kept to three: WhatsApp collapses long messages behind "read more", and a
 * wall of listings is worse than the two or three that actually fit.
 */
export function withRecommendations(
  reply: string,
  recommended: Recommendation[],
  baseUrl: string,
): string {
  if (recommended.length === 0) return reply;

  const lines = recommended.slice(0, 3).map((p) => {
    const beds = p.bedrooms === 0 ? "Studio" : `${p.bedrooms} bed`;
    const extra = p.handover
      ? ` · Handover ${p.handover}`
      : p.paymentPlan
        ? ` · ${p.paymentPlan}`
        : "";
    return [
      `*${p.title}*`,
      `${p.community} · ${beds} · ${p.priceQualifier} ${p.price}${extra}`,
      `${baseUrl}/listing/${encodeURIComponent(p.slug)}`,
    ].join("\n");
  });

  return `${reply}\n\n${lines.join("\n\n")}`;
}
