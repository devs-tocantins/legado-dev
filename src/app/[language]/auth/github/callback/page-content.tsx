"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthGitHubLoginService } from "@/services/api/services/auth";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import useAuthActions from "@/services/auth/use-auth-actions";
import useAuthTokens from "@/services/auth/use-auth-tokens";
import { Loader2 } from "lucide-react";

export default function GitHubCallbackPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setUser } = useAuthActions();
  const { setTokensInfo } = useAuthTokens();
  const authGitHubLoginService = useAuthGitHubLoginService();
  const called = useRef(false);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code || called.current) return;
    called.current = true;

    authGitHubLoginService({ code }).then(({ status, data }) => {
      if (status === HTTP_CODES_ENUM.OK) {
        setTokensInfo({
          token: data.token,
          refreshToken: data.refreshToken,
          tokenExpires: data.tokenExpires,
        });
        setUser(data.user);
        router.replace(data.isNewUser ? "/onboarding" : "/dashboard");
      } else {
        router.replace("/sign-in");
      }
    });
  }, [searchParams, authGitHubLoginService, setTokensInfo, setUser, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
