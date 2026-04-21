"use client";

import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import Zap from "lucide-react/dist/esm/icons/zap";
import { useGetActivitiesService } from "@/services/api/services/activities";
import { Activity } from "@/services/api/types/activity";

export function LatestActivitySection() {
  const { t } = useTranslation("home");
  const getActivities = useGetActivitiesService();
  const { data } = useQuery({
    queryKey: ["home-activities"],
    queryFn: () => getActivities({ page: 1, limit: 4 }),
  });

  const activities = (data?.data as Activity[]) || [];

  return (
    <section className="py-24 border-t border-border/50 bg-background/50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center p-3 mb-4 rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <Zap className="w-6 h-6" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4 tracking-tight">
            {t("milestonesTitle")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            {t("milestonesSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {activities.length > 0
            ? activities.map((activity) => (
                <div
                  key={activity.id}
                  className="p-6 rounded-2xl bg-card/40 border border-border/40 transition-all hover:translate-y-[-4px] hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-muted border border-border overflow-hidden">
                      {activity.user?.photo?.path && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={activity.user.photo.path}
                          alt={activity.user.firstName}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">
                        {activity.user?.firstName}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {activity.type}
                      </p>
                    </div>
                  </div>
                  <h4 className="text-sm font-medium line-clamp-2 mb-4 h-10">
                    {activity.title}
                  </h4>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </span>
                    <div className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                      +{activity.xp} XP
                    </div>
                  </div>
                </div>
              ))
            : Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-48 rounded-2xl bg-muted/20 animate-pulse border border-border/50"
                />
              ))}
        </div>
      </div>
    </section>
  );
}
