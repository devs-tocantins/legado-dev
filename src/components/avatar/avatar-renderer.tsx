import { useMemo } from "react";
import { cn } from "@/lib/utils";

const SIZE_CLASSES = {
  xxs: "w-4 h-4",
  xs: "w-8 h-8",
  sm: "w-10 h-10",
  md: "w-16 h-16",
  smd: "w-24 h-24",
  lg: "w-32 h-32",
  xl: "w-48 h-48",
  "2xl": "w-64 h-64",
} as const;

const ROUNDED_CLASSES = {
  full: "rounded-full",
  md: "rounded-md",
  sm: "rounded-sm",
  lg: "rounded-lg",
  none: "",
} as const;

interface AvatarRendererProps {
  svg: string;
  size?: keyof typeof SIZE_CLASSES;
  rounded?: keyof typeof ROUNDED_CLASSES;
  className?: string;
  style?: React.CSSProperties;
}

export function AvatarRenderer({
  svg,
  size = "md",
  rounded = "none",
  className,
  style,
}: AvatarRendererProps) {
  const dataUrl = useMemo(() => {
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }, [svg]);

  return (
    <div
      style={style}
      className={cn(
        "overflow-hidden flex items-center justify-center shrink-0",
        !style && SIZE_CLASSES[size],
        ROUNDED_CLASSES[rounded],
        className
      )}
    >
      <img
        src={dataUrl}
        alt="Avatar"
        loading="lazy"
        className="w-full h-full object-contain"
      />
    </div>
  );
}
