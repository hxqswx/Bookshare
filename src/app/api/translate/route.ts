/**
 * POST /api/translate
 * Body: { text: string; targetLocale: "zh" | "en" }
 * Returns: { translated: string }
 *
 * Uses Claude Haiku for fast, low-cost translation.
 * Requires ANTHROPIC_API_KEY env var.
 */
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const MAX_CHARS = 3000;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Translation not configured" }, { status: 503 });
  }

  let body: { text?: string; targetLocale?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { text, targetLocale } = body;
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }
  if (targetLocale !== "zh" && targetLocale !== "en") {
    return NextResponse.json({ error: "targetLocale must be zh or en" }, { status: 400 });
  }

  // Truncate to avoid runaway costs
  const input = text.slice(0, MAX_CHARS);
  const targetLabel = targetLocale === "zh" ? "简体中文" : "English";

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content:
            `Translate the following text to ${targetLabel}. ` +
            `Return ONLY the translation, no explanation, no quotation marks:\n\n${input}`,
        },
      ],
    });

    const translated =
      message.content[0].type === "text" ? message.content[0].text.trim() : "";

    return NextResponse.json({ translated });
  } catch (err) {
    console.error("[translate] error:", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Translation failed" },
      { status: 500 }
    );
  }
}
