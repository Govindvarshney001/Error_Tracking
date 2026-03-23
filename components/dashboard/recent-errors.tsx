"use client";

import Link from "next/link";
import { mockErrors, formatTimeAgo } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const severityStyles = {
  critical:
    "bg-severity-critical/20 text-severity-critical border-severity-critical/30",
  error: "bg-severity-error/20 text-severity-error border-severity-error/30",
  warning:
    "bg-severity-warning/20 text-severity-warning border-severity-warning/30",
  info: "bg-severity-info/20 text-severity-info border-severity-info/30",
};

interface DashboardError {
  groupId: string;
  message: string;
  service: string;
  level: string;
  status: string;
  occurrenceCount: number;
  firstSeen: string;
  lastSeen: string;
}

interface RecentErrorsProps {
  data?: DashboardError[];
  isLoading?: boolean;
}

export function RecentErrors({ data, isLoading }: RecentErrorsProps) {
  const recentErrors = data && data.length > 0 ? data : mockErrors.slice(0, 5);

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-sm font-medium text-card-foreground">
          Top Recurring Errors
        </h3>
        <Link
          href="/errors"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          View all
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="divide-y divide-border">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
            ))
          : recentErrors.map((error: any) => (
              <Link
                key={error.groupId || error.id}
                href={`/errors/${error.groupId || error.id}`}
                className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-card-foreground truncate">
                    {error.message?.slice(0, 50) ||
                      error.shortMessage ||
                      error.message}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {error.service}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {(
                        error.occurrenceCount ||
                        error.frequency ||
                        0
                      ).toLocaleString()}{" "}
                      events
                    </span>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "capitalize text-xs",
                    severityStyles[
                      (error.level ||
                        error.severity ||
                        "error") as keyof typeof severityStyles
                    ] || severityStyles.error,
                  )}
                >
                  {error.level || error.severity || "error"}
                </Badge>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatTimeAgo(new Date(error.lastSeen || error.lastSeen))}
                </span>
              </Link>
            ))}
      </div>
    </div>
  );
}
