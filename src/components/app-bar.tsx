"use client";

import { useState, useEffect } from "react";
import useAuth from "@/services/auth/use-auth";
import useAuthActions from "@/services/auth/use-auth-actions";
import Link from "@/components/link";
import { usePathname } from "next/navigation";
import { RoleEnum } from "@/services/api/types/role";
import { IS_SIGN_UP_ENABLED } from "@/services/auth/config";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Trophy,
  BookOpen,
  ClipboardList,
  ShieldCheck,
  Menu,
  X,
  Moon,
  Sun,
  LayoutDashboard,
  LogOut,
  User,
  Settings,
  Target,
  ExternalLink,
  Bell,
  CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useGetMyGamificationProfileService } from "@/services/api/services/gamification-profiles";
import {
  useGetNotificationsService,
  useGetUnreadCountService,
  useMarkAllReadService,
  useMarkReadService,
} from "@/services/api/services/notifications";
import { Notification } from "@/services/api/types/notification";
import { getLevel } from "@/lib/gamification";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  return (
    <span className={cn("text-[10px] font-semibold", level.color)}>
      {level.name}
    </span>
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

  const { mutate: doMarkOne } = useMutation({
    mutationFn: async (id: string) => {
      await markRead(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const unread = unreadData?.count ?? 0;

  function notifIcon(type: Notification["type"]) {
    if (type === "SUBMISSION_APPROVED" || type === "MISSION_WON") return "🏆";
    if (type === "CONTRIBUTION_REPORT_UPHELD") return "⚠️";
    return "🔔";
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Notificações"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-border bg-popover shadow-lg">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-semibold">Notificações</span>
              {unread > 0 && (
                <button
                  onClick={() => doMarkAll()}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Marcar todas como lidas
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {!notifications || notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  <Bell className="h-6 w-6 mx-auto mb-2 opacity-30" />
                  Nenhuma notificação ainda.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "flex gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0",
                      !n.isRead && "bg-primary/5"
                    )}
                    onClick={() => !n.isRead && doMarkOne(n.id)}
                  >
                    <span className="text-base shrink-0 mt-0.5">
                      {notifIcon(n.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm leading-snug",
                          !n.isRead && "font-semibold"
                        )}
                      >
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {n.body}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(n.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    {!n.isRead && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main AppBar ──────────────────────────────────────────────────────────────

function ResponsiveAppBar() {
  const { user, isLoaded } = useAuth();
  const { logOut } = useAuthActions();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const [isDark, setIsDark] = useState(false);

  const fetchMyProfile = useGetMyGamificationProfileService();
  const { data: profile } = useQuery({
    queryKey: ["my-profile-appbar"],
    queryFn: async () => {
      const { status, data } = await fetchMyProfile();
      if (status === HTTP_CODES_ENUM.OK) return data;
      return null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Theme toggle
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved) {
      const dark = saved === "dark";
      document.documentElement.classList.toggle("dark", dark);
      setIsDark(dark);
    } else {
      setIsDark(document.documentElement.classList.contains("dark"));
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);
  };

  const isAdmin = !!user?.role && Number(user.role.id) === RoleEnum.ADMIN;
  const isModerator =
    !!user?.role &&
    [RoleEnum.ADMIN, RoleEnum.MODERATOR].includes(Number(user.role.id));

  const isActive = (href: string) => pathname?.includes(href) && href !== "/";

  const navLinks = user
    ? [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/activities", label: "Atividades", icon: BookOpen },
        { href: "/missions", label: "Missões", icon: Target },
        { href: "/submissions", label: "Histórico", icon: ClipboardList },
        { href: "/leaderboard", label: "Ranking", icon: Trophy },
        ...(isModerator
          ? [{ href: "/moderation", label: "Moderação", icon: ShieldCheck }]
          : []),
      ]
    : [
        { href: "/activities", label: "Atividades", icon: BookOpen },
        { href: "/leaderboard", label: "Ranking", icon: Trophy },
      ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-4">
        {/* Logo */}
        <Link
          href="/"
          className="mr-6 flex items-center gap-2.5 font-bold tracking-tight"
        >
          <LogoMark />
          <span className="hidden sm:block text-sm font-heading font-semibold text-white">
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
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
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
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
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
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            {isDark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* Notification bell */}
          {user && <NotificationBell />}

          {/* User area */}
          {!isLoaded ? (
            <div className="h-7 w-7 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted transition-colors outline-none" />
                }
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage
                    src={user?.photo?.path ? user.photo.path : undefined}
                  />
                  <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold font-heading">
                    {user.firstName?.[0]}
                    {user.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex sm:flex-col sm:items-start sm:gap-0">
                  <span className="text-xs font-semibold leading-none">
                    {user.firstName}
                  </span>
                  {profile?.username && (
                    <span className="text-[10px] text-muted-foreground font-mono leading-none mt-0.5">
                      @{profile.username}
                    </span>
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
                  {!profile?.username && (
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  )}
                </div>

                <DropdownMenuSeparator />

                {profile?.username && (
                  <DropdownMenuItem
                    render={<Link href={`/u/${profile.username}`} />}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ver perfil público
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem render={<Link href="/profile" />}>
                  <User className="mr-2 h-4 w-4" />
                  Minha conta
                </DropdownMenuItem>

                <DropdownMenuItem
                  render={<Link href="/settings/notifications" />}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Preferências de notificação
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={logOut}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                render={<Link href="/sign-in" />}
              >
                Entrar
              </Button>
              {IS_SIGN_UP_ENABLED && (
                <Button size="sm" render={<Link href="/sign-up" />}>
                  Cadastrar
                </Button>
              )}
            </div>
          )}

          {/* Mobile hamburger — only for pages that need it (admin, etc) */}
          <Button
            variant="ghost"
            size="icon"
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

      {/* Mobile dropdown menu — for moderator/admin links not in bottom nav */}
      {mobileOpen && (
        <nav className="border-t border-border/50 bg-background/95 md:hidden">
          <div className="flex flex-col gap-0.5 p-3">
            {isModerator && (
              <Link
                href="/moderation"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive("/moderation")
                    ? "bg-primary/8 text-primary"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <ShieldCheck className="h-4 w-4" />
                Moderação
              </Link>
            )}
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
            {!user && (
              <>
                <Link
                  href="/sign-in"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                >
                  Entrar
                </Link>
                {IS_SIGN_UP_ENABLED && (
                  <Link
                    href="/sign-up"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    Cadastrar
                  </Link>
                )}
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

export default ResponsiveAppBar;
