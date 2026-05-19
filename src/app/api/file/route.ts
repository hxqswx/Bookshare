import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/file?url=<encodedBlobUrl>
 *
 * Server-side proxy for private Vercel Blob objects.
 * The server fetches the blob using BLOB_READ_WRITE_TOKEN (Bearer auth),
 * then streams the bytes back to the authenticated browser client.
 *
 * Why: Private-store blobs return 403 when fetched directly from a browser.
 * The server has the token and is always allowed to read from its own store.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Must be signed in
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const rawUrl = request.nextUrl.searchParams.get("url");
  if (!rawUrl) {
    return new NextResponse("Missing url param", { status: 400 });
  }

  // Validate it's actually a Vercel Blob URL (safety check)
  if (!rawUrl.includes(".blob.vercel-storage.com")) {
    return new NextResponse("Invalid blob URL", { status: 400 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return new NextResponse("Storage not configured", { status: 503 });
  }

  try {
    const blobRes = await fetch(rawUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!blobRes.ok) {
      return new NextResponse(`Blob error: ${blobRes.status}`, { status: blobRes.status });
    }

    const contentType = blobRes.headers.get("Content-Type") ?? "application/octet-stream";

    // Stream the blob body straight to the client
    return new NextResponse(blobRes.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Allow the browser to cache for 30 min (blobs are immutable)
        "Cache-Control": "private, max-age=1800",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Fetch failed";
    return new NextResponse(msg, { status: 500 });
  }
}
