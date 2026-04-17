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
  return (
    <div
      className={
        variant === "light"
          ? "flex h-9 w-9 shrink-0 items-center justify-center"
          : "flex h-10 w-10 shrink-0 items-center justify-center"
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/LOGO.svg"
        alt="legado.dev"
        className="h-full w-auto"
        draggable={false}
      />
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
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* ── Left column — always dark, hidden on mobile ── */}
      <div
        className="relative hidden lg:flex lg:w-[44%] flex-col justify-between p-12 overflow-hidden"
        style={{ backgroundColor: "#111411" }}
      >
        {/* Background photo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/auth-bg.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-60"
          draggable={false}
        />
        {/* Dark overlay to keep text legible */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111411] via-[#111411]/40 to-transparent" />

        <LeftPattern />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <LogoMark variant="light" />
          <span className="text-sm font-semibold text-white/60">
            legado.dev
          </span>
        </div>

        {/* Quote */}
        <blockquote className="relative z-10 space-y-3">
          <p className="font-heading italic text-sm leading-relaxed text-white/55">
            &ldquo;Ajudei um júnior a configurar o ambiente em 40 minutos. Essa
            conversa virou pontos. Não sabia que contribuição tinha nome.&rdquo;
          </p>
          <footer className="text-xs text-white/35">
            — Membro do legado.dev
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
