import type { Metadata } from "next";
import PublicProfilePageContent from "./page-content";
import { getLevel, formatXp } from "@/lib/gamification";

type Props = {
  params: Promise<{ username: string; language: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  try {
    const res = await fetch(
      `${apiUrl}/api/v1/gamification-profiles/by-username/${username}`,
      { next: { revalidate: 60 } }
    );
    if (res.ok) {
      const profile = await res.json();
      const level = getLevel(profile.totalXp ?? 0);
      const xpStr = formatXp(profile.totalXp ?? 0);
      const title = `@${username} — Devs Tocantins`;
      const description = `${level.name} com ${xpStr} XP na comunidade Devs Tocantins`;
      const ogImageUrl = `${siteUrl}/api/og?username=${encodeURIComponent(username)}`;
      return {
        title,
        description,
        openGraph: {
          title,
          description: `${level.name} • ${xpStr} XP`,
          images: [{ url: ogImageUrl, width: 1200, height: 630 }],
        },
        twitter: {
          card: "summary_large_image",
          title,
          description: `${level.name} • ${xpStr} XP`,
          images: [ogImageUrl],
        },
      };
    }
  } catch {
    // fallback silencioso
  }

  return {
    title: `@${username} — Devs Tocantins`,
  };
}

export default function Page() {
  return <PublicProfilePageContent />;
}
