"use client";

import { useCallback } from "react";
import { AUTH_REFRESH_URL } from "./config";
import { FetchInputType, FetchInitType } from "./types/fetch-params";
import useLanguage from "../i18n/use-language";
import { getTokensInfo, setTokensInfo } from "../auth/auth-tokens-info";

let refreshPromise: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const tokens = getTokensInfo();
      const response = await fetch(AUTH_REFRESH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens?.refreshToken}`,
        },
      });

      if (!response.ok) {
        setTokensInfo(null);
        return false;
      }

      const newTokens = await response.json();

      if (newTokens.token) {
        setTokensInfo({
          token: newTokens.token,
          refreshToken: newTokens.refreshToken,
          tokenExpires: newTokens.tokenExpires,
        });
        return true;
      }

      setTokensInfo(null);
      return false;
    } catch {
      setTokensInfo(null);
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function useFetch() {
  const language = useLanguage();

  return useCallback(
    async (input: FetchInputType, init?: FetchInitType) => {
      const tokens = getTokensInfo();

      let headers: HeadersInit = {
        "x-custom-lang": language,
      };

      if (!(init?.body instanceof FormData)) {
        headers = {
          ...headers,
          "Content-Type": "application/json",
        };
      }

      if (tokens?.token) {
        headers = {
          ...headers,
          Authorization: `Bearer ${tokens.token}`,
        };
      }

      if (tokens?.tokenExpires && tokens.tokenExpires - 60000 <= Date.now()) {
        const refreshed = await refreshTokens();
        if (refreshed) {
          const refreshedTokens = getTokensInfo();
          if (refreshedTokens?.token) {
            headers = {
              ...headers,
              Authorization: `Bearer ${refreshedTokens.token}`,
            };
          }
        } else {
          // Refresh falhou — remove header de auth para não enviar token inválido
          const { Authorization: _, ...headersWithoutAuth } = headers as Record<
            string,
            string
          >;
          headers = headersWithoutAuth;
        }
      }

      return fetch(input, {
        ...init,
        headers: {
          ...headers,
          ...init?.headers,
        },
      });
    },
    [language]
  );
}

export default useFetch;
