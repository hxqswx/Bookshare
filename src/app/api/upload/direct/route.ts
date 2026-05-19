/**
 * POST /api/upload/direct
 *
 * Vercel Blob Client Upload handler.
 * The browser calls this endpoint TWICE per upload:
 *   1. To get a short-lived upload token (phase = "blob.generate-client-token")
 *   2. Vercel Blob calls back once the upload completes (phase = "blob.upload-completed")
 *
 * The browser then uploads the file DIRECTLY to Vercel Blob using that token,
 * bypassing the 4.5 MB serverless request-body limit entirely.
 * Practical limit: ~500 MB (Vercel Blob per-file ceiling).
 */
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

const AVATAR_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

const BOOK_TYPES = [
  "application/pdf",
  "application/epub+zip",
  "text/plain",
];

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,

      // ── Phase 1: Browser asks for an upload token ──────────────────
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Auth check lives here so it runs for token requests.
        // Completion callbacks (phase 2) arrive from Vercel's servers
        // without a user session, so we cannot check auth there.
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
          throw new Error("Unauthorized");
        }

        const payload = clientPayload
          ? (JSON.parse(clientPayload) as { type?: string })
          : {};
        const uploadType = payload.type ?? "book"; // "avatar" | "book"

        return {
          allowedContentTypes:
            uploadType === "avatar" ? AVATAR_TYPES : BOOK_TYPES,
          maximumSizeInBytes:
            uploadType === "avatar"
              ? 10 * 1024 * 1024   // 10 MB for profile pictures
              : 200 * 1024 * 1024, // 200 MB for books
          addRandomSuffix: true,
          // Embed userId so the completion callback can use it if needed
          tokenPayload: JSON.stringify({
            userId: session.user.id,
            type: uploadType,
          }),
        };
      },

      // ── Phase 2: Vercel Blob calls this after the upload finishes ──
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // In local dev there is no public URL so this webhook is skipped —
        // the upload still succeeds and the URL is returned to the client.
        console.log("[blob] client upload complete:", blob.pathname, tokenPayload);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    console.error("[blob] handleUpload error:", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Upload failed" },
      { status: 400 }
    );
  }
}
