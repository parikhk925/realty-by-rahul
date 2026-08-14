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
