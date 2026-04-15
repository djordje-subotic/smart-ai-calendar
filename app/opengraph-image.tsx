import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Krowna — Rule Your Time";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f0b15 0%, #1a1525 50%, #2a1f1a 100%)",
          padding: "80px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -100,
            left: -100,
            width: 500,
            height: 500,
            borderRadius: 250,
            background: "radial-gradient(circle, rgba(245,158,11,0.3) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: 200,
            background: "radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)",
          }}
        />

        {/* Crown icon */}
        <div style={{ fontSize: 140, display: "flex", marginBottom: 20 }}>👑</div>

        <div
          style={{
            display: "flex",
            fontSize: 120,
            fontWeight: 900,
            letterSpacing: -4,
            color: "#FBBF24",
            marginBottom: 8,
          }}
        >
          krowna
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 36,
            fontWeight: 700,
            color: "#9a94a4",
            letterSpacing: 6,
            textTransform: "uppercase",
            marginBottom: 40,
          }}
        >
          RULE YOUR TIME
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 28,
            fontWeight: 500,
            color: "#f5f0fa",
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.4,
          }}
        >
          The AI calendar that schedules your day,
          protects your focus, and adapts when plans change.
        </div>

        <div style={{ display: "flex", gap: 16, marginTop: 50 }}>
          {["AI Scheduling", "Voice Assistant", "Focus Mode", "Social"].map((f) => (
            <div
              key={f}
              style={{
                display: "flex",
                border: "1px solid rgba(245,158,11,0.3)",
                backgroundColor: "rgba(245,158,11,0.1)",
                borderRadius: 24,
                padding: "8px 20px",
                color: "#FBBF24",
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              {f}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
