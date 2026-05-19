/**
 * GET /api/icons/180
 * Returns a 180×180 PNG — apple-touch-icon for iOS Safari "Add to Home Screen".
 * iOS ignores SVG touch icons; this PNG is required for a proper home screen icon.
 */
import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  const size = 180;

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1b4332 0%, #40916c 100%)",
          // iOS clips to rounded square automatically — no borderRadius needed
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "linear-gradient(160deg, rgba(255,255,255,0.12) 0%, transparent 60%)",
          }}
        />
        <div
          style={{
            fontSize: Math.round(size * 0.52),
            lineHeight: 1,
            marginTop: Math.round(size * -0.02),
            display: "flex",
          }}
        >
          📚
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}
