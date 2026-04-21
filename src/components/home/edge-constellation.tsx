"use client";

export function EdgeConstellation() {
  return (
    <div className="absolute inset-0 pointer-events-none opacity-20">
      <svg
        className="w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--primary)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M 10 20 L 30 15 L 50 25 L 40 45 Z"
          fill="none"
          stroke="url(#lineGrad)"
          strokeWidth="0.1"
        />
        <path
          d="M 90 10 L 70 30 L 85 50 L 95 35 Z"
          fill="none"
          stroke="url(#lineGrad)"
          strokeWidth="0.1"
        />
      </svg>
    </div>
  );
}
