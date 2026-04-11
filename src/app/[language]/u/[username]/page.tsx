import type { Metadata } from "next";
import PublicProfilePageContent from "./page-content";
import { getLevel, formatXp } from "@/lib/gamification";

type Props = {
  params: Promise<{ username: string; language: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  try {
    const res = await fetch(
      `${apiUrl}/api/v1/gamification-profiles/by-username/${username}`,
      { next: { revalidate: 60 } }
    );
    if (res.ok) {
      const profile = await res.json();
      const level = getLevel(profile.totalXp ?? 0);
      const xpStr = formatXp(profile.totalXp ?? 0);
      return {
        title: `@${username} — Devs Tocantins`,
        description: `${level.name} com ${xpStr} XP na comunidade Devs Tocantins`,
        openGraph: {
          title: `@${username} — Devs Tocantins`,
          description: `${level.name} • ${xpStr} XP`,
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
