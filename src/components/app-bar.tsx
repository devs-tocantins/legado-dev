"use client";

import { ptBR } from "date-fns/locale";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import useAuth from "@/services/auth/use-auth";
import useAuthActions from "@/services/auth/use-auth-actions";
import Link from "@/components/link";
import { useQuery } from "@tanstack/react-query";
import { useGetMyGamificationProfileService } from "@/services/api/services/gamification-profiles";
import { RoleEnum } from "@/services/api/types/role";
import {
  LogOut,
  User,
  Settings,
  Bell,
  Menu,
  X,
  LayoutDashboard,
  BookOpen,
  Trophy,
  Target,
  Sun,
  Moon,
  ExternalLink,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useGetNotificationsService,
  useGetUnreadCountService,
  useMarkAllReadService,
  useMarkReadService,
} from "@/services/api/services/notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Notification } from "@/services/api/types/notification";
import { GamificationProfile } from "@/services/api/types/gamification-profile";
import { getLevel, LEVELS } from "@/lib/gamification";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { formatDistanceToNow } from "date-fns";
import { IS_SIGN_UP_ENABLED } from "@/services/auth/config";

// ─── Logo Mark ────────────────────────────────────────────────────────────────

function LogoMark() {
  return (
    <div className="flex h-8 w-auto shrink-0 items-center justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/LOGO.svg"
        alt="legado.dev"
        className="h-8 w-auto"
        draggable={false}
      />
    </div>
  );
}

// ─── Level badge ──────────────────────────────────────────────────────────────

function LevelBadge({ totalXp }: { totalXp: number }) {
  const level = getLevel(totalXp);
  const levelValue = LEVELS.findIndex((l) => l.name === level.name) + 1;

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border",
        level.color,
        "bg-current/10 border-current/20"
      )}
    >
      Lvl {levelValue}
    </div>
  );
}

// ─── Notification Bell ────────────────────────────────────────────────────────

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const getNotifications = useGetNotificationsService();
  const getUnreadCount = useGetUnreadCountService();
  const markAllRead = useMarkAllReadService();
  const markRead = useMarkReadService();

  const { data: unreadData } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: async () => {
      const res = await getUnreadCount();
      if (res.status === HTTP_CODES_ENUM.OK)
        return res.data as { count: number };
      return { count: 0 };
    },
    refetchInterval: 30_000,
  });

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await getNotifications();
      if (res.status === HTTP_CODES_ENUM.OK) return res.data as Notification[];
      return [] as Notification[];
    },
    enabled: open,
  });

  const { mutate: doMarkAll } = useMutation({
    mutationFn: async () => {
      await markAllRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const { mutate: doMarkRead } = useMutation({
    mutationFn: async (id: string) => {
      await markRead(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return (
    <DropdownMenu onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            nativeButton={true}
            aria-label="Ver notificações"
            className="relative h-8 w-8 text-muted-foreground hover:text-foreground"
          />
        }
      >
        <Bell className="h-4 w-4" />
        {unreadData && unreadData.count > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-primary text-[8px] font-bold text-white items-center justify-center">
              {unreadData.count > 9 ? "9+" : unreadData.count}
            </span>
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold text-sm">Notificações</h3>
          {unreadData && unreadData.count > 0 && (
            <button
              onClick={() => doMarkAll()}
              className="text-[10px] font-bold text-primary hover:underline"
            >
              Marcar todas como lidas
            </button>
          )}
        </div>
        <div className="max-h-[350px] overflow-y-auto">
          {!notifications || notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Tudo limpo por aqui!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Você não tem notificações no momento.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && doMarkRead(n.id)}
                  className={cn(
                    "p-4 hover:bg-muted/50 transition-colors cursor-pointer relative group",
                    !n.isRead && "bg-primary/[0.03]"
                  )}
                >
                  <div className="flex gap-3">
                    <div
                      className={cn(
                        "mt-1 h-2 w-2 shrink-0 rounded-full",
                        !n.isRead ? "bg-primary" : "bg-transparent"
                      )}
                    />
                    <div className="space-y-1 min-w-0">
                      <p className="text-xs text-foreground leading-relaxed">
                        <span className="font-bold">{n.title}</span> {n.body}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(n.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

function ResponsiveAppBar() {
  const { user, isLoaded } = useAuth();
  const { logOut } = useAuthActions();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  const fetchMyProfile = useGetMyGamificationProfileService();
  const { data: profile } = useQuery<GamificationProfile | null>({
    queryKey: ["my-profile-appbar"],
    queryFn: async () => {
      const res = await fetchMyProfile();
      if (res.status === HTTP_CODES_ENUM.OK) {
        return res.data;
      }
      return null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const isAdmin =
    !!user?.role &&
    (Number(user.role.id) === RoleEnum.ADMIN ||
      Number(user.role.id) === RoleEnum.MODERATOR);

  const isActive = (href: string) => pathname?.includes(href) && href !== "/";

  const navLinks = user
    ? [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/activities", label: "Atividades", icon: BookOpen },
        { href: "/missions", label: "Missões", icon: Target },
        { href: "/leaderboard", label: "Ranking", icon: Trophy },
      ]
    : [
        { href: "/activities", label: "Atividades", icon: BookOpen },
        { href: "/leaderboard", label: "Ranking", icon: Trophy },
      ];

  return (
    <header className="sticky top-0 z-50 w-full border-b transition-colors duration-1000 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 dark:border-white/5 dark:bg-[#020307]/80 border-black/5 bg-[#FDFBF7]/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-4">
        {/* Logo */}
        <Link
          href="/"
          className="mr-6 flex items-center gap-2.5 font-bold tracking-tight"
        >
          <LogoMark />
          <span className="hidden sm:block text-sm font-heading font-semibold transition-colors duration-1000 dark:text-white text-slate-900">
            legado<span className="text-[#E59B13]">.dev</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex md:flex-1 md:items-center md:gap-0.5">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-300",
                isActive(href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin-panel"
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-300",
                isActive("/admin-panel")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Settings className="h-3.5 w-3.5" />
              Admin
            </Link>
          )}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-1.5">
          {/* Theme toggle */}
          <div className="flex h-8 w-8 items-center justify-center">
            {mounted ? (
              <Button
                variant="ghost"
                size="icon"
                nativeButton={true}
                onClick={toggleTheme}
                aria-label={
                  isDark ? "Mudar para tema claro" : "Mudar para tema escuro"
                }
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                {isDark ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <div className="h-8 w-8" />
            )}
          </div>

          {/* Notification bell */}
          {user && <NotificationBell />}

          {/* User area */}
          {!isLoaded ? (
            <div className="h-7 w-7 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    aria-label="Abrir menu do usuário"
                    className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted transition-colors outline-none"
                  />
                }
              >
                <div className="h-7 w-7 overflow-hidden rounded-full border border-border bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                  {profile?.photo?.path ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.photo.path}
                      alt={user.firstName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    user.firstName?.substring(0, 1).toUpperCase()
                  )}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {/* User info header */}
                <div className="px-3 py-2.5 space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold font-heading truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    {profile && <LevelBadge totalXp={profile.totalXp ?? 0} />}
                  </div>
                  {profile?.username && (
                    <p className="text-xs font-mono text-muted-foreground">
                      @{profile.username}
                    </p>
                  )}
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  render={
                    <Link
                      href={
                        profile?.username
                          ? `/u/${profile.username}`
                          : "/profile"
                      }
                    />
                  }
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Ver perfil público
                </DropdownMenuItem>

                <DropdownMenuItem render={<Link href="/profile" />}>
                  <User className="mr-2 h-4 w-4" />
                  Minha conta
                </DropdownMenuItem>

                <DropdownMenuItem
                  render={<Link href="/settings/notifications" />}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Notificações
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={logOut}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link href="/sign-in" />}
              >
                Entrar
              </Button>
              {IS_SIGN_UP_ENABLED && (
                <Button
                  size="sm"
                  nativeButton={false}
                  render={<Link href="/sign-up" />}
                >
                  Cadastrar
                </Button>
              )}
            </div>
          )}

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            nativeButton={true}
            className="md:hidden h-8 w-8"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
          >
            {mobileOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <nav className="border-t border-border/50 bg-background/95 md:hidden">
          <div className="flex flex-col gap-0.5 p-3">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive(href)
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin-panel"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                <Settings className="h-4 w-4" />
                Admin
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

export default ResponsiveAppBar;
