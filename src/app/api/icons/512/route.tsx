/**
 * GET /api/icons/512
 * Returns a 512×512 PNG app icon — recommended by Chrome/Android for high-res screens.
 */
import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  const size = 512;

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
          borderRadius: Math.round(size * 0.21),
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle highlight overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "linear-gradient(160deg, rgba(255,255,255,0.12) 0%, transparent 60%)",
            borderRadius: Math.round(size * 0.21),
          }}
        />

        {/* Book emoji */}
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
