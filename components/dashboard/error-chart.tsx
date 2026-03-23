"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface TimelinePoint {
  timestamp?: string;
  count?: number;
  time?: string;
  errors?: number;
  warnings?: number;
}

interface ErrorChartProps {
  title?: string;
  data?: TimelinePoint[];
  isLoading?: boolean;
}

export function ErrorChart({
  title = "Error Rate (Last 12 Hours)",
  data: propData,
  isLoading,
}: ErrorChartProps) {
  const chartData = useMemo(() => {
    if (propData && propData.length > 0) {
      return propData.map((point) => ({
        time: point.timestamp
          ? new Date(point.timestamp).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : point.time || "",
        errors: point.count || point.errors || 0,
        warnings: Math.floor(Math.random() * 50), // Generate placeholder warnings
      }));
    }
    // Fallback mock data
    const result = [];
    const now = new Date();
    for (let i = 12; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      result.push({
        time: time.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        errors: Math.floor(Math.random() * 500 + 200),
        warnings: Math.floor(Math.random() * 200 + 50),
      });
    }
    return result;
  }, [propData]);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-medium text-card-foreground mb-4">
          {title}
        </h3>
        <div className="h-64">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-medium text-card-foreground mb-4">{title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4EB3D3" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4EB3D3" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorWarnings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4A84C" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#D4A84C" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#333"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              stroke="#666"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#666"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) =>
                value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #333",
                borderRadius: "8px",
                color: "#fff",
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: "10px" }}
              formatter={(value) => (
                <span style={{ color: "#999" }}>{value}</span>
              )}
            />
            <Area
              type="monotone"
              dataKey="errors"
              stroke="#4EB3D3"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorErrors)"
              name="Errors"
            />
            <Area
              type="monotone"
              dataKey="warnings"
              stroke="#D4A84C"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorWarnings)"
              name="Warnings"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
