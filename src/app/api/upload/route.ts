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
  "application/octet-stream", // some browsers send this for .txt
];

/**
 * POST /api/upload
 *
 * Implements the Vercel Blob client-upload handshake:
 *   Phase 1 – "generate-client-token": browser asks for a signed upload URL
 *   Phase 2 – "upload-complete":        browser confirms upload finished
 *
 * The actual file bytes travel directly browser → Blob storage, so there is
 * no server-side body-size limit.
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
      request: request as never, // handleUpload expects a Request; NextRequest is compatible
      onBeforeGenerateToken: async (pathname: string) => {
        const ext = (pathname.split(".").pop() ?? "").toLowerCase();
        if (!EXT_TO_TYPE[ext]) {
          throw new Error("Only PDF, EPUB, and TXT files are supported");
        }
        return {
          allowedContentTypes: ALLOWED_MIME,
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // Optional hook — runs after the upload is confirmed
        console.log("Book file uploaded:", blob.pathname, blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
