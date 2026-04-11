import { ReactNode } from "react";

// Dot-grid pattern — same as profile cover but in white
function LeftPattern() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="auth-dots"
            x="0"
            y="0"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1.2" fill="rgba(255,255,255,0.07)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#auth-dots)" />
      </svg>
    </div>
  );
}

function LogoMark({ variant = "dark" }: { variant?: "dark" | "light" }) {
  if (variant === "light") {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-white/30 bg-white/10">
        <span className="select-none text-xs font-bold font-heading text-white">
          DT
        </span>
      </div>
    );
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-primary bg-primary/10">
      <span className="select-none text-sm font-bold font-heading text-primary">
        DT
      </span>
    </div>
  );
}

type AuthLayoutProps = {
  children: ReactNode;
  title: string;
  subtitle: string;
};

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* ── Left column — always dark, hidden on mobile ── */}
      <div
        className="relative hidden lg:flex lg:w-[44%] flex-col justify-between p-12 overflow-hidden"
        style={{ backgroundColor: "#111411" }}
      >
        <LeftPattern />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <LogoMark variant="light" />
          <span className="text-sm font-semibold text-white/60">
            Devs Tocantins
          </span>
        </div>

        {/* Quote */}
        <blockquote className="relative z-10 space-y-3">
          <p className="font-heading italic text-sm leading-relaxed text-white/55">
            &ldquo;Ajudei um júnior a configurar o ambiente em 40 minutos. Essa
            conversa virou pontos. Não sabia que contribuição tinha nome.&rdquo;
          </p>
          <footer className="text-xs text-white/35">
            — Membro da Devs Tocantins
          </footer>
        </blockquote>
      </div>

      {/* ── Right column — form ── */}
      <div className="flex flex-1 items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Logo (mobile only — hidden on desktop since left col has it) */}
          <div className="mb-8 flex flex-col items-center gap-3 lg:items-start">
            <div className="lg:hidden">
              <LogoMark variant="dark" />
            </div>
            <div className="text-center lg:text-left">
              <h1 className="text-2xl font-bold">{title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
