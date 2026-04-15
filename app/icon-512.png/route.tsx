import { ImageResponse } from "next/og";

export const runtime = "edge";

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
          background: "linear-gradient(135deg, #0f0b15 0%, #2a1f1a 100%)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 720,
            height: 720,
            borderRadius: 360,
            background: "radial-gradient(circle, rgba(245,158,11,0.4) 0%, transparent 70%)",
            top: -100,
            left: -100,
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 200, display: "flex" }}>👑</div>
          <div
            style={{
              display: "flex",
              fontSize: 86,
              fontWeight: 900,
              color: "#FBBF24",
              letterSpacing: -4,
            }}
          >
            krowna
          </div>
        </div>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
