import "server-only";
import crypto from "node:crypto";
import { whatsappConfig } from "./config";

/**
 * Verifies Meta's X-Hub-Signature-256 header against the raw request body.
 *
 * The comparison is timing-safe, and the body must be the exact bytes Meta
 * sent — re-serialising parsed JSON changes the digest and every request
 * would fail.
 */
export function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader || !whatsappConfig.appSecret) return false;

  const [algorithm, signature] = signatureHeader.split("=");
  if (algorithm !== "sha256" || !signature) return false;

  const expected = crypto
    .createHmac("sha256", whatsappConfig.appSecret)
    .update(rawBody, "utf8")
    .digest("hex");

  const a = Buffer.from(signature, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}

export interface InboundWhatsAppMessage {
  from: string;
  messageId: string;
  text: string;
  profileName: string | null;
}

interface WebhookValue {
  contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
  messages?: Array<{
    id?: string;
    from?: string;
    type?: string;
    text?: { body?: string };
    button?: { text?: string };
    interactive?: {
      button_reply?: { title?: string };
      list_reply?: { title?: string };
    };
  }>;
}

/** Flattens Meta's nested payload into the messages we can actually act on. */
export function parseWebhookPayload(payload: unknown): InboundWhatsAppMessage[] {
  const out: InboundWhatsAppMessage[] = [];
  const body = payload as {
    entry?: Array<{ changes?: Array<{ value?: WebhookValue }> }>;
  };

  for (const entry of body?.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value?.messages) continue;

      const profileName = value.contacts?.[0]?.profile?.name ?? null;

      for (const message of value.messages) {
        if (!message.from || !message.id) continue;

        // Buttons and list picks carry the label the user actually tapped.
        const text =
          message.text?.body ??
          message.interactive?.button_reply?.title ??
          message.interactive?.list_reply?.title ??
          message.button?.text ??
          "";

        if (!text.trim()) continue;

        out.push({
          from: message.from,
          messageId: message.id,
          text: text.trim(),
          profileName,
        });
      }
    }
  }

  return out;
}
