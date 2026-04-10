"use client";

import { usePathname } from "next/navigation";
import Link from "@/components/link";
import useAuth from "@/services/auth/use-auth";
import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  User,
  Home,
  LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Don't show bottom nav on admin pages
  if (pathname?.includes("/admin-panel")) return null;

  const isActive = (href: string) => {
    if (href === "/")
      return (
        pathname === "/" ||
        pathname?.endsWith("/pt-BR") ||
        pathname?.endsWith("/en")
      );
    return pathname?.includes(href);
  };

  const authedLinks: NavItem[] = [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/activities", label: "Atividades", icon: BookOpen },
    { href: "/leaderboard", label: "Ranking", icon: Trophy },
    { href: "/profile", label: "Perfil", icon: User },
  ];

  const guestLinks: NavItem[] = [
    { href: "/", label: "Início", icon: Home },
    { href: "/activities", label: "Atividades", icon: BookOpen },
    { href: "/leaderboard", label: "Ranking", icon: Trophy },
    { href: "/sign-in", label: "Entrar", icon: LogIn },
  ];

  const links = user ? authedLinks : guestLinks;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border/50 bg-background/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navegação principal"
    >
      <div className="flex items-stretch h-14">
        {links.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform",
                  active && "scale-110"
                )}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
