import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put } from "@vercel/blob";

// Vercel serverless request-body limit is 4.5 MB; stay safely under it.
const MAX_BYTES = 4 * 1024 * 1024; // 4 MB

const EXT_TO_TYPE: Record<string, string> = {
  pdf:  "pdf",
  epub: "epub",
  txt:  "txt",
};

/**
 * POST /api/upload   (multipart/form-data, field name: "file")
 *
 * The browser sends the file to *our* server; the server calls put() and
 * forwards it to Vercel Blob.  This avoids the browser ever talking directly
 * to vercel.com/api/blob, so there are no CORS issues regardless of how the
 * Blob store is configured.
 *
 * Limitation: Vercel serverless request bodies are capped at 4.5 MB.
 * Clients must enforce MAX_BYTES before uploading.
 *
 * Returns: { url: string, fileType: string }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `File too large (max 4 MB). For larger files use an external link.` },
        { status: 413 }
      );
    }

    const ext = (file.name.split(".").pop() ?? "").toLowerCase();
    const fileType = EXT_TO_TYPE[ext];
    if (!fileType) {
      return NextResponse.json(
        { error: "Only PDF, EPUB, and TXT files are supported" },
        { status: 400 }
      );
    }

    const blob = await put(file.name, file, {
      access: "private",   // store is private — public access would be rejected
      addRandomSuffix: true,
    });

    return NextResponse.json({ url: blob.url, fileType });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
