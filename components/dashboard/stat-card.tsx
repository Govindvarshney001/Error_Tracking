import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: LucideIcon;
  className?: string;
  isLoading?: boolean;
}

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  className,
  isLoading,
}: StatCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  if (isLoading) {
    return (
      <div
        className={cn("rounded-lg border border-border bg-card p-4", className)}
      >
        <div className="flex items-start justify-between">
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-10 w-10 rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("rounded-lg border border-border bg-card p-4", className)}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-card-foreground">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
        </div>
        {Icon && (
          <div className="rounded-md bg-secondary p-2">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
      </div>
      {change !== undefined && (
        <div className="mt-3 flex items-center gap-1">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-severity-error" />
          ) : isNegative ? (
            <TrendingDown className="h-4 w-4 text-chart-2" />
          ) : null}
          <span
            className={cn(
              "text-sm font-medium",
              isPositive && "text-severity-error",
              isNegative && "text-chart-2",
            )}
          >
            {isPositive && "+"}
            {change}%
          </span>
          {changeLabel && (
            <span className="text-sm text-muted-foreground">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
