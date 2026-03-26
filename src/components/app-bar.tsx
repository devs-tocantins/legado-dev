"use client";

import { useState } from "react";
import useAuth from "@/services/auth/use-auth";
import useAuthActions from "@/services/auth/use-auth-actions";
import { useTranslation } from "@/services/i18n/client";
import Link from "next/link";
import { RoleEnum } from "@/services/api/types/role";
import { IS_SIGN_UP_ENABLED } from "@/services/auth/config";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, Moon, Sun } from "lucide-react";

function ResponsiveAppBar() {
  const { t } = useTranslation("common");
  const { user, isLoaded } = useAuth();
  const { logOut } = useAuthActions();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const isAdmin =
    !!user?.role && [RoleEnum.ADMIN].includes(Number(user?.role?.id));

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  };

  const adminLinks = [
    { href: "/admin-panel/users", label: t("common:navigation.users") },
    {
      href: "/admin-panel/activities",
      label: t("common:navigation.activities"),
    },
    {
      href: "/admin-panel/submissions",
      label: t("common:navigation.submissions"),
    },
    {
      href: "/admin-panel/transactions",
      label: t("common:navigation.transactions"),
    },
    {
      href: "/admin-panel/gamification-profiles",
      label: t("common:navigation.gamificationProfiles"),
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-4">
        {/* Logo */}
        <Link href="/" className="mr-6 font-mono text-lg font-bold tracking-widest">
          {t("common:app-name")}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex md:flex-1 md:items-center md:gap-1">
          <Button variant="ghost" size="sm" render={<Link href="/" />} className="text-primary-foreground hover:bg-primary-foreground/10">
            {t("common:navigation.home")}
          </Button>
          {isAdmin &&
            adminLinks.map((link) => (
              <Button
                key={link.href}
                variant="ghost"
                size="sm"
                render={<Link href={link.href} />}
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                {link.label}
              </Button>
            ))}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {!isLoaded ? (
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger render={<button className="rounded-full" data-testid="profile-menu-item" />}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user.photo?.path}
                      alt={`${user.firstName} ${user.lastName}`}
                    />
                    <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-xs">
                      {user.firstName?.[0]}
                      {user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem render={<Link href="/profile" />} data-testid="user-profile">
                  {t("common:navigation.profile")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={logOut}
                  data-testid="logout-menu-item"
                >
                  {t("common:navigation.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex md:gap-2">
              <Button variant="ghost" size="sm" render={<Link href="/sign-in" />} className="text-primary-foreground hover:bg-primary-foreground/10">
                {t("common:navigation.signIn")}
              </Button>
              {IS_SIGN_UP_ENABLED && (
                <Button variant="ghost" size="sm" render={<Link href="/sign-up" />} className="text-primary-foreground hover:bg-primary-foreground/10">
                  {t("common:navigation.signUp")}
                </Button>
              )}
            </div>
          )}

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => setMobileOpen((o) => !o)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="border-t md:hidden">
          <div className="flex flex-col p-2">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-3 py-2 text-sm hover:bg-primary-foreground/10"
            >
              {t("common:navigation.home")}
            </Link>
            {isAdmin &&
              adminLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2 text-sm hover:bg-primary-foreground/10"
                >
                  {link.label}
                </Link>
              ))}
            {isLoaded && !user && (
              <>
                <div className="my-1 border-t border-primary-foreground/20" />
                <Link
                  href="/sign-in"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2 text-sm hover:bg-primary-foreground/10"
                >
                  {t("common:navigation.signIn")}
                </Link>
                {IS_SIGN_UP_ENABLED && (
                  <Link
                    href="/sign-up"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-3 py-2 text-sm hover:bg-primary-foreground/10"
                  >
                    {t("common:navigation.signUp")}
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
