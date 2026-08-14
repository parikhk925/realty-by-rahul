import { put } from "@vercel/blob";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  isProperty,
  normalizePropertyAvailability,
} from "@/lib/property-data";
import {
  isPublishedPropertyPayload,
  PublishedPropertyPayload,
} from "@/lib/published-properties";
import { authorizeStudioRequest } from "@/lib/supabase/api-auth";

function safeSlug(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 72) || "dubai-project"
  );
}

export async function POST(request: Request) {
  if (!(await authorizeStudioRequest())) {
    return Response.json({ error: "Sign in to publish projects." }, { status: 401 });
  }
  try {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > 800_000) {
      return Response.json({ error: "Project is too large." }, { status: 413 });
    }

    const input = (await request.json()) as { property?: unknown };
    if (!isProperty(input.property)) {
      return Response.json(
        { error: "A valid project is required." },
        { status: 400 },
      );
    }
    // Publishing writes a publicly readable file, so a draft must never reach
    // it — set the project live first.
    if (input.property.status !== "Live") {
      return Response.json(
        { error: "Set the project live before publishing it." },
        { status: 400 },
      );
    }

    const property = normalizePropertyAvailability({
      ...input.property,
      slug: safeSlug(input.property.slug || input.property.title),
    });
    const payload: PublishedPropertyPayload = {
      property,
      publishedAt: new Date().toISOString(),
    };
    if (!isPublishedPropertyPayload(payload)) {
      return Response.json({ error: "Project data is invalid." }, { status: 400 });
    }

    await put(`projects/${property.slug}.json`, JSON.stringify(payload), {
      access: "public",
      contentType: "application/json; charset=utf-8",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60,
    });

    revalidateTag("published-properties");
    revalidatePath("/");

    const origin = new URL(request.url).origin;
    return Response.json({
      slug: property.slug,
      url: `${origin}/listing/${encodeURIComponent(property.slug)}`,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The project could not be published.",
      },
      { status: 500 },
    );
  }
}
