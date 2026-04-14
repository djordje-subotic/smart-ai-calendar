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
            width: 280,
            height: 280,
            borderRadius: 140,
            background: "radial-gradient(circle, rgba(245,158,11,0.4) 0%, transparent 70%)",
            top: -40,
            left: -40,
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
          }}
        >
          <div style={{ fontSize: 78, display: "flex" }}>👑</div>
          <div
            style={{
              display: "flex",
              fontSize: 42,
              fontWeight: 900,
              color: "#FBBF24",
              letterSpacing: -1.5,
            }}
          >
            kron
          </div>
        </div>
      </div>
    ),
    { width: 192, height: 192 }
  );
}
