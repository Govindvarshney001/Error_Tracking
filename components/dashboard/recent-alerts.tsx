"use client";

import Link from "next/link";
import { mockAlerts, formatTimeAgo } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronRight, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const statusConfig: Record<
  string,
  { styles: string; icon: typeof AlertTriangle }
> = {
  active: {
    styles:
      "bg-severity-critical/20 text-severity-critical border-severity-critical/30",
    icon: AlertTriangle,
  },
  acknowledged: {
    styles:
      "bg-severity-warning/20 text-severity-warning border-severity-warning/30",
    icon: Clock,
  },
  resolved: {
    styles: "bg-chart-2/20 text-chart-2 border-chart-2/30",
    icon: CheckCircle,
  },
};

interface DashboardAlert {
  _id?: string;
  id?: string;
  title?: string;
  message?: string;
  status: string;
  service?: string;
  triggeredAt?: string;
  triggerTime?: string;
}

interface RecentAlertsProps {
  data?: DashboardAlert[];
  isLoading?: boolean;
}

export function RecentAlerts({ data, isLoading }: RecentAlertsProps) {
  const alerts = data && data.length > 0 ? data : mockAlerts.slice(0, 4);

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-sm font-medium text-card-foreground">
          Recent Alerts
        </h3>
        <Link
          href="/alerts"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          View all
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="divide-y divide-border">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="h-5 w-5 rounded-full" />
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))
          : alerts.map((alert: any) => {
              const config = statusConfig[alert.status] || statusConfig.active;
              const StatusIcon = config.icon;

              return (
                <Link
                  key={alert._id || alert.id}
                  href="/alerts"
                  className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors"
                >
                  <StatusIcon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      alert.status === "active" && "text-severity-critical",
                      alert.status === "acknowledged" &&
                        "text-severity-warning",
                      alert.status === "resolved" && "text-chart-2",
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-card-foreground truncate">
                      {alert.title || alert.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {alert.service}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("capitalize text-xs", config.styles)}
                  >
                    {alert.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTimeAgo(
                      new Date(
                        alert.triggeredAt || alert.triggerTime || Date.now(),
                      ),
                    )}
                  </span>
                </Link>
              );
            })}
      </div>
    </div>
  );
}
