import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put } from "@vercel/blob";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg":  "jpg",
  "image/png":  "png",
  "image/webp": "webp",
  "image/gif":  "gif",
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
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
        { error: "Image too large (max 2 MB)" },
        { status: 413 }
      );
    }

    const mime = file.type.toLowerCase();
    if (!ALLOWED_TYPES[mime]) {
      return NextResponse.json(
        { error: "Only JPG, PNG, WebP and GIF are supported" },
        { status: 400 }
      );
    }

    const ext = ALLOWED_TYPES[mime];
    const filename = `avatar-${session.user.id}-${Date.now()}.${ext}`;

    const blob = await put(filename, file, {
      access: "private",
      addRandomSuffix: false, // we include userId + timestamp for uniqueness
    });

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
