/* eslint-disable filenames/match-exported, filenames/match-regex */
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cwd } from "node:process";
import { routing } from "@/i18n/routing";

export const alt = "next-subrouter";

export const size = { height: 630, width: 1200 };

export const contentType = "image/png";

/* ビルド時に焼く。動的なままだと assets/ が関数側に含まれず、
   本番でフォントを読めずに 500 になる */
export function generateStaticParams(): { locale: string }[] {
  return routing.locales.map((locale) => ({ locale }));
}

const TITLE = "next-subrouter";
const DESCRIPTION =
  "Mount a Next.js app under a sub-path without changing its routes.";
const ROUTES = [
  { from: "blog.example.com", to: "/blog" },
  { from: "admin.example.com", to: "/admin" },
];

export default async function Image(): Promise<ImageResponse> {
  /* 見出しの書体はサイトと同じ Zen Kaku Gothic Antique。使う文字だけに
     絞ったものを同梱している。文言を変えたら assets/README.md の手順で作り直す */
  const font = await readFile(
    join(cwd(), "assets/ZenKakuGothicAntique-Bold-subset.ttf"),
  );

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#0b0b0f",
          color: "#ffffff",
          display: "flex",
          height: "100%",
          padding: "0 80px",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: 600,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 72,
              fontWeight: 700,
              letterSpacing: -1,
            }}
          >
            {TITLE}
          </div>
          <div
            style={{
              color: "#a1a1aa",
              display: "flex",
              fontSize: 30,
              lineHeight: 1.4,
              marginTop: 26,
            }}
          >
            {DESCRIPTION}
          </div>
          <div
            style={{
              color: "#71717a",
              display: "flex",
              fontSize: 26,
              marginTop: 48,
            }}
          >
            kkweb.io
          </div>
        </div>
        {/* 何をするパッケージなのかを右に置く。名前と説明だけだと、
            9件が同じ絵になってタイムラインで見分けが付かない */}
        <div
          style={{
            alignItems: "center",
            display: "flex",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              width: 380,
            }}
          >
            {ROUTES.map((row) => (
              <div
                style={{
                  alignItems: "center",
                  background: "#15151c",
                  border: "1px solid #26262f",
                  borderRadius: 12,
                  display: "flex",
                  gap: 14,
                  padding: "18px 20px",
                }}
                key={row.from}
              >
                <div
                  style={{ color: "#a1a1aa", display: "flex", fontSize: 20 }}
                >
                  {row.from}
                </div>
                <div
                  style={{ color: "#3b82f6", display: "flex", fontSize: 22 }}
                >
                  →
                </div>
                <div
                  style={{
                    color: "#3b82f6",
                    display: "flex",
                    fontSize: 22,
                    fontWeight: 700,
                  }}
                >
                  {row.to}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          data: font,
          name: "Zen Kaku Gothic Antique",
          style: "normal",
          weight: 700,
        },
      ],
    },
  );
}
