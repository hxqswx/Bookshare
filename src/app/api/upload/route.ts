import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put } from "@vercel/blob";

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/epub+zip": "epub",
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!ALLOWED_TYPES[file.type]) {
      return NextResponse.json(
        { error: "Only PDF and EPUB files are supported" },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large (max 50 MB)" },
        { status: 400 }
      );
    }

    // Sanitise filename
    const ext = ALLOWED_TYPES[file.type]; // "pdf" | "epub"
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const blobName = `books/${Date.now()}_${safeName}`;

    const blob = await put(blobName, file, {
      access: "public",
      contentType: file.type,
    });

    return NextResponse.json({ url: blob.url, type: ext });
  } catch (err) {
    console.error("Upload error:", err);
    // Provide a clear message when BLOB_READ_WRITE_TOKEN is missing
    if (String(err).includes("BLOB_READ_WRITE_TOKEN")) {
      return NextResponse.json(
        { error: "File upload is not configured on this server. Please add BLOB_READ_WRITE_TOKEN to your environment variables." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
