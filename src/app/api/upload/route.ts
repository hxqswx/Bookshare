import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

const MAX_BYTES = 100 * 1024 * 1024; // 100 MB

const EXT_TO_TYPE: Record<string, string> = {
  pdf:  "pdf",
  epub: "epub",
  txt:  "txt",
};

const ALLOWED_MIME = [
  "application/pdf",
  "application/epub+zip",
  "text/plain",
  "text/plain; charset=utf-8",
  "text/plain;charset=utf-8",
  "application/octet-stream", // some browsers send .txt as octet-stream
];

/**
 * POST /api/upload
 *
 * Vercel Blob client-upload handshake.
 * Phase 1 – "generate-client-token": returns a signed token for the browser.
 * Phase 2 – "blob.upload-completed": acknowledged but no server-side work needed.
 *
 * NOTE: onUploadCompleted is intentionally omitted.
 * When it is present, handleUpload embeds a callbackUrl in the client token and
 * Vercel's CDN must POST to that URL before the upload is considered complete.
 * This makes uploads hang in local dev (localhost unreachable from Vercel) and
 * can stall production uploads if the webhook is slow. Since we only need the
 * blob URL (returned to the browser directly), no server-side callback is required.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request: request as never,
      onBeforeGenerateToken: async (pathname: string) => {
        const ext = (pathname.split(".").pop() ?? "").toLowerCase();
        if (!EXT_TO_TYPE[ext]) {
          throw new Error("Only PDF, EPUB, and TXT files are supported");
        }
        return {
          allowedContentTypes: ALLOWED_MIME,
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: true,
          // No callbackUrl → no webhook → upload completes immediately
        };
      },
      // onUploadCompleted deliberately omitted — see comment above
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
