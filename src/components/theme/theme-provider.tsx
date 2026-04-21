"use client";

import {
  createTheme,
  ThemeProvider as MuiThemeProvider,
} from "@mui/material/styles";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { useMemo, PropsWithChildren, useEffect, useState } from "react";
import StyledJsxRegistry from "./registry";

function MuiThemeBridge({ children }: PropsWithChildren) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: mounted && resolvedTheme === "light" ? "light" : "dark",
        },
      }),
    [mounted, resolvedTheme]
  );

  return <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>;
}

/**
 * Custom NextThemesProvider wrapper that prevents the script tag warning in React 19.
 */
function SafeNextThemesProvider({ children }: PropsWithChildren) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      enableColorScheme={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}

function ThemeProvider({ children }: PropsWithChildren) {
  return (
    <SafeNextThemesProvider>
      <StyledJsxRegistry>
        <MuiThemeBridge>{children}</MuiThemeBridge>
      </StyledJsxRegistry>
    </SafeNextThemesProvider>
  );
}

export default ThemeProvider;
