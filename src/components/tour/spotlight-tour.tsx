"use client";

import { useEffect, useState, useRef, RefObject } from "react";
import { Button } from "@/components/ui/button";
import { X, ArrowRight } from "lucide-react";

export type TourStep = {
  ref: RefObject<HTMLElement | null>;
  title: string;
  description: string;
};

type Props = {
  steps: TourStep[];
  onFinish: () => void;
};

type Rect = {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

const PADDING = 10;

export default function SpotlightTour({ steps, onFinish }: Props) {
  const [current, setCurrent] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const step = steps[current];
  const stepRef = useRef(step);
  stepRef.current = step;

  useEffect(() => {
    const doUpdate = () => {
      const el = stepRef.current?.ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({
        top: r.top - PADDING,
        left: r.left - PADDING,
        right: r.right + PADDING,
        bottom: r.bottom + PADDING,
        width: r.width + PADDING * 2,
        height: r.height + PADDING * 2,
      });
    };
    doUpdate();
    window.addEventListener("resize", doUpdate);
    window.addEventListener("scroll", doUpdate, true);
    return () => {
      window.removeEventListener("resize", doUpdate);
      window.removeEventListener("scroll", doUpdate, true);
    };
  }, [current]);

  // Scroll target into view
  useEffect(() => {
    step?.ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [step]);

  const next = () => {
    if (current < steps.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      onFinish();
    }
  };

  const isLast = current === steps.length - 1;

  // Tooltip position: prefer below, fallback above
  const tooltipBelow = rect
    ? rect.bottom + 16 + 200 < window.innerHeight
    : true;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Dark overlay — 4 rects surrounding the spotlight */}
      {rect && (
        <>
          <div
            className="absolute bg-black/70 pointer-events-auto"
            style={{ top: 0, left: 0, right: 0, height: Math.max(0, rect.top) }}
          />
          <div
            className="absolute bg-black/70 pointer-events-auto"
            style={{ top: rect.bottom, left: 0, right: 0, bottom: 0 }}
          />
          <div
            className="absolute bg-black/70 pointer-events-auto"
            style={{
              top: rect.top,
              left: 0,
              width: Math.max(0, rect.left),
              height: rect.height,
            }}
          />
          <div
            className="absolute bg-black/70 pointer-events-auto"
            style={{
              top: rect.top,
              left: rect.right,
              right: 0,
              height: rect.height,
            }}
          />
          {/* Spotlight border glow */}
          <div
            className="absolute rounded-xl ring-2 ring-primary/60 ring-offset-0 animate-pulse"
            style={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              pointerEvents: "none",
            }}
          />
        </>
      )}

      {/* Tooltip */}
      {rect && (
        <div
          className="absolute pointer-events-auto"
          style={{
            left: Math.min(rect.left, window.innerWidth - 320 - 16),
            top: tooltipBelow ? rect.bottom + 12 : rect.top - 12 - 180,
            width: 300,
          }}
        >
          {/* Arrow */}
          <div
            className={`absolute left-6 ${tooltipBelow ? "-top-2" : "-bottom-2"} w-0 h-0`}
            style={{
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              ...(tooltipBelow
                ? { borderBottom: "8px solid hsl(var(--card))" }
                : { borderTop: "8px solid hsl(var(--card))" }),
            }}
          />
          <div className="rounded-xl border border-border bg-card shadow-2xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-mono text-muted-foreground mb-0.5">
                  {current + 1} / {steps.length}
                </p>
                <h3 className="font-semibold text-sm">{step.title}</h3>
              </div>
              <button
                onClick={onFinish}
                className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {step.description}
            </p>
            <div className="flex items-center justify-between">
              <button
                onClick={onFinish}
                className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
              >
                Pular tour
              </button>
              <Button size="sm" onClick={next} className="gap-1.5 h-7 text-xs">
                {isLast ? "Entendido" : "Próximo"}
                {!isLast && <ArrowRight className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
