import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "@/components/link";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; href: string };
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center space-y-3",
        className
      )}
    >
      <Icon className="h-12 w-12 text-muted-foreground opacity-40" />
      <div className="space-y-1">
        <p className="font-semibold">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            {description}
          </p>
        )}
      </div>
      {action && (
        <Button
          variant="outline"
          size="sm"
          render={<Link href={action.href} />}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
