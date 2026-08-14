import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { authorizeStudioRequest } from "@/lib/supabase/api-auth";

/**
 * Real developer brochures run to 25MB and more.
 *
 * This used to accept the file as multipart form data and forward it to Blob,
 * which meant every upload had to travel through the serverless function —
 * and Vercel caps a function's request body at 4.5MB. Any genuine brochure was
 * rejected at the edge before this handler ran at all, so uploads simply
 * failed. The browser now uploads straight to Blob with a token minted here,
 * exactly as property images already do, and the size limit is enforced on
 * that token instead.
 */
const maxPdfBytes = 40 * 1024 * 1024;

export async function POST(request: Request) {
  if (!(await authorizeStudioRequest())) {
    return Response.json({ error: "Sign in to upload documents." }, { status: 401 });
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
        if (!pathname.startsWith("property-documents/")) {
          throw new Error("Invalid document destination.");
        }
        return {
          allowedContentTypes: ["application/pdf"],
          maximumSizeInBytes: maxPdfBytes,
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
          error instanceof Error
            ? error.message
            : "The PDF could not be uploaded.",
      },
      { status: 400 },
    );
  }
}
