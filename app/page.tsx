"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { StatCard } from "@/components/dashboard/stat-card";
import { ErrorChart } from "@/components/dashboard/error-chart";
import { RecentErrors } from "@/components/dashboard/recent-errors";
import { RecentAlerts } from "@/components/dashboard/recent-alerts";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { RealtimeProvider } from "@/components/dashboard/realtime-provider";
import { useDashboard } from "@/hooks/use-dashboard";
import { AlertCircle, Users, Bell, Activity } from "lucide-react";

export default function DashboardPage() {
  const { data, isLoading } = useDashboard({
    refreshInterval: 30000, // Refresh every 30 seconds
  });

  const stats = data?.stats || {
    totalErrors24h: 0,
    totalErrors7d: 0,
    affectedUsers: 0,
    activeAlerts: 0,
    resolvedAlerts: 0,
    errorRateChange: 0,
  };

  return (
    <ProtectedRoute>
      <RealtimeProvider>
        <DashboardLayout>
          <div className="space-y-6">
            {/* Page Header */}
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Overview of your system health and error metrics
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Errors (24h)"
                value={stats.totalErrors24h}
                change={stats.errorRateChange}
                changeLabel="vs yesterday"
                icon={AlertCircle}
                isLoading={isLoading}
              />
              <StatCard
                title="Total Errors (7d)"
                value={stats.totalErrors7d}
                icon={Activity}
                isLoading={isLoading}
              />
              <StatCard
                title="Affected Users"
                value={stats.affectedUsers}
                icon={Users}
                isLoading={isLoading}
              />
              <StatCard
                title="Active Alerts"
                value={stats.activeAlerts}
                icon={Bell}
                isLoading={isLoading}
              />
            </div>

            {/* Chart */}
            <ErrorChart data={data?.timeline || []} isLoading={isLoading} />

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentErrors
                data={data?.recentErrors || []}
                isLoading={isLoading}
              />
              <RecentAlerts
                data={data?.recentAlerts || []}
                isLoading={isLoading}
              />
            </div>
          </div>
        </DashboardLayout>
      </RealtimeProvider>
    </ProtectedRoute>
  );
}
