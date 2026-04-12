import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const LEVELS = [
  { name: "Novato", minXp: 0, color: "#94a3b8" },
  { name: "Contribuidor", minXp: 100, color: "#34d399" },
  { name: "Colaborador Ativo", minXp: 500, color: "#38bdf8" },
  { name: "Referência", minXp: 1500, color: "#60a5fa" },
  { name: "Mentor", minXp: 4000, color: "#fbbf24" },
  { name: "Lenda", minXp: 10000, color: "#fb7185" },
];

function getLevel(totalXp: number) {
  return (
    [...LEVELS].reverse().find((l) => totalXp >= l.minXp) ?? LEVELS[0]
  );
}

function formatXp(xp: number): string {
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k`;
  return xp.toString();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username") ?? "usuario";

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
  let totalXp = 0;

  try {
    const res = await fetch(
      `${apiUrl}/api/v1/gamification-profiles/by-username/${username}`,
      { next: { revalidate: 60 } }
    );
    if (res.ok) {
      const profile = await res.json();
      totalXp = profile.totalXp ?? 0;
    }
  } catch {
    // silencioso — usa xp = 0
  }

  const level = getLevel(totalXp);
  const xpStr = formatXp(totalXp);

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          backgroundColor: "#111411",
          display: "flex",
          flexDirection: "column",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Amber top line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            backgroundColor: "#f59e0b",
          }}
        />

        {/* Subtle dot pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
            padding: "52px 64px",
            position: "relative",
          }}
        >
          {/* Top: logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "10px",
                border: "2px solid #3b82f6",
                backgroundColor: "rgba(59,130,246,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#3b82f6",
                fontSize: "18px",
                fontWeight: 700,
              }}
            >
              DT
            </div>
            <span
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: "16px",
              }}
            >
              Devs Tocantins
            </span>
          </div>

          {/* Middle: username + level + xp */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <span
                style={{
                  color: "white",
                  fontSize: "72px",
                  fontWeight: 800,
                  lineHeight: 1,
                  letterSpacing: "-2px",
                }}
              >
                @{username}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {/* Level badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: `${level.color}22`,
                  border: `1px solid ${level.color}55`,
                  borderRadius: "8px",
                  padding: "6px 14px",
                  gap: "6px",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: level.color,
                  }}
                />
                <span
                  style={{
                    color: level.color,
                    fontSize: "18px",
                    fontWeight: 600,
                  }}
                >
                  {level.name}
                </span>
              </div>

              {/* XP */}
              <span
                style={{
                  color: "#f59e0b",
                  fontSize: "32px",
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {xpStr} XP
              </span>
            </div>
          </div>

          {/* Bottom: site */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                color: "rgba(255,255,255,0.25)",
                fontSize: "14px",
              }}
            >
              legado.devstocantins.com.br
            </span>
            <span
              style={{
                color: "rgba(255,255,255,0.15)",
                fontSize: "13px",
              }}
            >
              Motor de Engajamento
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
