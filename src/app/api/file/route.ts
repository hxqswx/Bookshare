import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { issueSignedToken, presignUrl } from "@vercel/blob";

const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * GET /api/file?url=<encodedBlobUrl>
 *
 * Generates a 1-hour presigned URL for a private Vercel Blob object and
 * redirects the client to it.  Requires an active session.
 *
 * This is the server-side gateway that lets authenticated users read
 * private-store blobs without exposing the BLOB_READ_WRITE_TOKEN.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawUrl = request.nextUrl.searchParams.get("url");
  if (!rawUrl) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  try {
    // Extract the pathname from the blob URL
    // e.g. https://abc123.public.blob.vercel-storage.com/myfile-suffix.txt
    //                                                     ^^^^^^^^^^^^^^^^^^^
    const urlObj = new URL(rawUrl);
    const pathname = urlObj.pathname.replace(/^\//, ""); // strip leading slash

    const validUntil = Date.now() + ONE_HOUR_MS;

    // Issue a delegation token scoped to this exact file
    const signedToken = await issueSignedToken({
      pathname,
      operations: ["get"],
      validUntil,
    });

    // Build a presigned URL the browser can fetch directly
    const { presignedUrl } = await presignUrl(signedToken, {
      access: "private",
      operation: "get",
      pathname,
      validUntil,
    });

    // Redirect — keeps the API transparent to the reader components
    return NextResponse.redirect(presignedUrl);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to sign URL";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
