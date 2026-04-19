"use client";

import { usePathname } from "next/navigation";
import { ReactNode, useEffect } from "react";

const AUTH_PATHS = ["/sign-in", "/sign-up", "/forgot-password"];

export default function PageWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.some((p) => pathname?.includes(p));

  useEffect(() => {
    if (isAuthPage) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isAuthPage]);

  return (
    <div
      className={
        isAuthPage ? "overflow-hidden" : "pb-16 md:pb-0 overflow-x-hidden"
      }
    >
      {children}
    </div>
  );
}
