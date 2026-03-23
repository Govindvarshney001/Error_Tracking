import useSWR from "swr";

interface DashboardStats {
  totalErrors24h: number;
  totalErrors7d: number;
  affectedUsers: number;
  activeAlerts: number;
  resolvedAlerts: number;
  errorRateChange: number;
}

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

interface DashboardAlert {
  _id: string;
  title: string;
  message: string;
  type: string;
  severity: string;
  status: string;
  service: string;
  triggeredAt: string;
}

interface TimelinePoint {
  timestamp: string;
  count: number;
}

interface DashboardData {
  stats: DashboardStats;
  recentErrors: DashboardError[];
  recentAlerts: DashboardAlert[];
  timeline: TimelinePoint[];
}

interface UseDashboardOptions {
  refreshInterval?: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useDashboard(options: UseDashboardOptions = {}) {
  const { refreshInterval = 30000 } = options; // Default to 30 seconds

  const { data, error, isLoading, mutate } = useSWR<DashboardData>(
    "/api/dashboard",
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: true,
    },
  );

  return {
    data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
