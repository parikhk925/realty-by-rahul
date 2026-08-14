import "server-only";
import { createUserContent } from "@google/genai";
import { createGeminiClient, GEMINI_MODEL } from "@/lib/ai/gemini";

/**
 * Asking a model for a JSON object, with somewhere to go when the model is busy.
 *
 * Auto-fill failed in front of the client with a raw Google payload:
 * `{"error":{"code":503,"message":"This model is currently experiencing high
 * demand..."}}`. That is transient overload rather than a quota being spent, so
 * the first answer is simply to try again a moment later. The second is to ask
 * a different model — and since brochure text is extracted locally before any
 * of this runs, what gets sent is plain text that any competent model can read,
 * not a PDF only Gemini can open.
 */

/** Busy or broken upstream; a later attempt may well succeed. */
const RETRYABLE_STATUS = new Set([408, 409, 429, 500, 502, 503, 504]);

/** 0s, then ~1.5s, then ~4s. Three tries fit inside the 60s function limit. */
const BACKOFF_MS = [0, 1_500, 4_000];

/**
 * The route has 60 seconds in total, and a request that overruns it returns an
 * HTML error page the browser cannot parse — which is how a clear "the model is
 * busy" turned into "not valid JSON" the last time this overran. Attempts stop
 * being started once the budget is gone, leaving room to answer properly.
 */
const TOTAL_BUDGET_MS = 45_000;

/** Fewer than this left is not enough for another attempt to be worth starting. */
const MIN_ATTEMPT_MS = 3_000;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * The Gemini SDK reports the HTTP status inside the message rather than on a
 * field, so the code has to be read back out of the text.
 */
function statusOf(error: unknown): number | undefined {
  const record = error as { status?: unknown; code?: unknown } | undefined;
  if (typeof record?.status === "number") return record.status;
  if (typeof record?.code === "number") return record.code;
  const message = error instanceof Error ? error.message : String(error ?? "");
  const match = message.match(/"code"\s*:\s*(\d{3})/) ?? message.match(/\b(4\d{2}|5\d{2})\b/);
  return match ? Number(match[1]) : undefined;
}

function isRetryable(error: unknown) {
  const status = statusOf(error);
  if (status !== undefined) return RETRYABLE_STATUS.has(status);
  // A network drop or an aborted socket has no status but is worth retrying.
  return error instanceof Error && /fetch|network|socket|timeout|ECONN/i.test(error.message);
}

/**
 * Models are tried in order. The list is deliberately short: each extra model
 * costs a round trip on the way to failing, and the function has 60s in total.
 */
function geminiModels() {
  const configured = process.env.GEMINI_MODELS?.split(",")
    .map((model) => model.trim())
    .filter(Boolean);
  return configured?.length ? configured : [GEMINI_MODEL, "gemini-flash-latest"];
}

/** A rendered brochure page, for brochures whose words are all artwork. */
export interface JsonImage {
  mimeType: string;
  data: Buffer;
}

async function askGemini(
  model: string,
  prompt: string,
  schema: unknown,
  images: JsonImage[],
): Promise<string | undefined> {
  const ai = createGeminiClient();
  const response = await ai.models.generateContent({
    model,
    contents: images.length
      ? createUserContent([
          prompt,
          ...images.map((image) => ({
            inlineData: {
              mimeType: image.mimeType,
              data: image.data.toString("base64"),
            },
          })),
        ])
      : prompt,
    // Without a schema the caller wants prose, not JSON.
    config: schema
      ? {
          responseMimeType: "application/json",
          // The SDK's schema type is not exported in a form worth mirroring.
          responseSchema: schema as never,
        }
      : undefined,
  });
  return response.text ?? undefined;
}

/**
 * OpenRouter fronts several vendors behind one OpenAI-compatible endpoint, so
 * one key covers Gemini, Grok and others. Used only when every Gemini attempt
 * has failed, which keeps the usual path unchanged.
 *
 * The Gemini response schema is not sent — support for strict schemas varies by
 * model. The prompt already describes the shape it wants, and the caller
 * normalises whatever comes back, so plain JSON mode is enough.
 */
async function askOpenRouter(
  prompt: string,
  remainingMs: () => number,
  json: boolean,
): Promise<string | undefined> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return undefined;

  // Checked against the live model list rather than assumed — the ids that
  // first looked obvious (gemini-2.0-flash-001, grok-4-fast) are both retired
  // and return 404. These two answered correctly in 8.4s and 28.2s.
  const models = (
    process.env.OPENROUTER_MODELS ??
    "openai/gpt-oss-20b:free,nvidia/nemotron-3-ultra-550b-a55b:free"
  )
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);

  for (const model of models) {
    const budget = remainingMs();
    if (budget < MIN_ATTEMPT_MS) break;
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "user",
              content: `${prompt}\n\nRespond with a single JSON object and nothing else.`,
            },
          ],
        }),
        signal: AbortSignal.timeout(Math.min(30_000, budget)),
      });
      if (!response.ok) continue;
      const payload = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const text = payload.choices?.[0]?.message?.content?.trim();
      if (text) return text;
    } catch {
      // Try the next model.
    }
  }
  return undefined;
}

/** Raised when every model and every retry has been exhausted. */
export class ModelBusyError extends Error {
  constructor() {
    super(
      "The brochure reader is busy right now. Wait a moment and press Auto-fill again.",
    );
    this.name = "ModelBusyError";
  }
}

/**
 * Returns the model's raw JSON text, or throws ModelBusyError once every
 * option has been tried.
 */
export async function generateJson(input: {
  prompt: string;
  schema: unknown;
  /** Sent to Gemini only; the OpenRouter fallbacks are text models. */
  images?: JsonImage[];
}): Promise<string | undefined> {
  return generate(input);
}

/**
 * Same retries and fallbacks, for callers that want prose rather than JSON.
 *
 * The market estimate used to call the model directly and turn any failure at
 * all into "live market data is unavailable" — so a moment of overload looked
 * to the agent exactly like there being no data on the property.
 */
export async function generateText(input: {
  prompt: string;
}): Promise<string | undefined> {
  return generate({ ...input, schema: undefined });
}

async function generate(input: {
  prompt: string;
  schema: unknown;
  images?: JsonImage[];
}): Promise<string | undefined> {
  let lastError: unknown;
  const startedAt = Date.now();
  const remainingMs = () => TOTAL_BUDGET_MS - (Date.now() - startedAt);

  for (const model of geminiModels()) {
    for (const wait of BACKOFF_MS) {
      if (remainingMs() < MIN_ATTEMPT_MS + wait) break;
      if (wait) await delay(wait);
      try {
        return await askGemini(model, input.prompt, input.schema, input.images ?? []);
      } catch (error) {
        lastError = error;
        // A bad request or a missing model will fail identically however many
        // times it is sent; only overload is worth waiting out.
        if (!isRetryable(error)) break;
      }
    }
  }

  const fallback = await askOpenRouter(input.prompt, remainingMs, Boolean(input.schema));
  if (fallback) return fallback;

  if (lastError && !isRetryable(lastError)) throw lastError;
  throw new ModelBusyError();
}
