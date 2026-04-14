import { ImageResponse } from "next/og";

export const runtime = "edge";

/**
 * Maskable icon — the safe area is the inner 80% (per Android adaptive icon
 * guidelines). We center the crown tighter inside that safe area so Android
 * can crop the edges for different mask shapes without clipping the artwork.
 */
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f0b15",
        }}
      >
        <div
          style={{
            width: "80%",
            height: "80%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #1a1525 0%, #3a2a1a 100%)",
            borderRadius: "50%",
          }}
        >
          <div style={{ fontSize: 220, display: "flex" }}>👑</div>
        </div>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
