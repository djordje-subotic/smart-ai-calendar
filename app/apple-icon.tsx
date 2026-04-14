import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
            width: 260,
            height: 260,
            borderRadius: 130,
            background: "radial-gradient(circle, rgba(245,158,11,0.35) 0%, transparent 70%)",
            top: -40,
            left: -40,
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <div style={{ fontSize: 70, display: "flex" }}>👑</div>
          <div
            style={{
              display: "flex",
              fontSize: 38,
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
    { ...size }
  );
}
