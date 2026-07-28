import { NotificationType } from "@/services/api/types/notification";
import {
  CheckCircle2,
  XCircle,
  Trophy,
  Flag,
  Award,
  ShieldAlert,
  FileText,
  CalendarDays,
  CalendarX,
  Shield,
  Clock,
  Bell,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const NOTIFICATION_TYPE_MAP: Record<
  NotificationType,
  { icon: LucideIcon; colorClass: string }
> = {
  SUBMISSION_APPROVED: { icon: CheckCircle2, colorClass: "text-emerald-500" },
  SUBMISSION_REJECTED: { icon: XCircle, colorClass: "text-destructive" },
  MISSION_WON: { icon: Trophy, colorClass: "text-amber-500" },
  TRACK_MILESTONE_APPROVED: { icon: Flag, colorClass: "text-blue-500" },
  TRACK_BADGE_GRANTED: { icon: Award, colorClass: "text-violet-500" },
  CONTRIBUTION_REPORT_UPHELD: {
    icon: ShieldAlert,
    colorClass: "text-destructive",
  },
  CONTRIBUTION_REPORT_RECEIVED: {
    icon: Shield,
    colorClass: "text-muted-foreground",
  },
  NEW_SUBMISSION_PENDING: { icon: Clock, colorClass: "text-blue-500" },
  LEGAL_DOCUMENT_UPDATED: {
    icon: FileText,
    colorClass: "text-muted-foreground",
  },
  EVENT_UPDATED: { icon: CalendarDays, colorClass: "text-amber-500" },
  EVENT_CANCELLED: { icon: CalendarX, colorClass: "text-destructive" },
};

export function NotificationIcon({
  type,
  className,
}: {
  type: NotificationType;
  className?: string;
}) {
  const mapping = NOTIFICATION_TYPE_MAP[type] || {
    icon: Bell,
    colorClass: "text-muted-foreground",
  };
  const Icon = mapping.icon;

  return <Icon className={cn(mapping.colorClass, className)} />;
}
