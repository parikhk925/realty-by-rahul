import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { authorizeStudioRequest } from "@/lib/supabase/api-auth";

const maximumImageSize = 10 * 1024 * 1024;

export async function POST(request: Request) {
  if (!(await authorizeStudioRequest())) {
    return Response.json({ error: "Sign in to upload images." }, { status: 401 });
  }
  try {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host && new URL(origin).host !== host) {
      return Response.json({ error: "Invalid upload origin." }, { status: 403 });
    }

    const body = (await request.json()) as HandleUploadBody;
    const response = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith("property-images/")) {
          throw new Error("Invalid image destination.");
        }

        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          maximumSizeInBytes: maximumImageSize,
          addRandomSuffix: true,
          cacheControlMaxAge: 60 * 60 * 24 * 365,
        };
      },
    });

    return Response.json(response);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "The image could not be uploaded.",
      },
      { status: 400 },
    );
  }
}
