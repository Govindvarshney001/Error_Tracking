"use client";

import { useRealtime, RealtimeEventData } from "@/hooks/use-realtime";
import { useToast } from "@/hooks/use-toast";
import { useCallback, createContext, useContext, ReactNode } from "react";

interface RealtimeContextValue {
  isConnected: boolean;
  lastEvent: { type: string; data: RealtimeEventData } | null;
}

const RealtimeContext = createContext<RealtimeContextValue>({
  isConnected: false,
  lastEvent: null,
});

export function useRealtimeContext() {
  return useContext(RealtimeContext);
}

interface RealtimeProviderProps {
  children: ReactNode;
  showToasts?: boolean;
}

export function RealtimeProvider({
  children,
  showToasts = true,
}: RealtimeProviderProps) {
  const { toast } = useToast();

  const handleNewError = useCallback(
    (data: RealtimeEventData) => {
      if (showToasts) {
        toast({
          title: "New Error Detected",
          description: `${data.message?.slice(0, 60)}${(data.message?.length ?? 0) > 60 ? "..." : ""} in ${data.service}`,
          variant: "destructive",
        });
      }
    },
    [toast, showToasts],
  );

  const handleErrorUpdated = useCallback(
    (data: RealtimeEventData) => {
      if (showToasts && data.status === "resolved") {
        toast({
          title: "Error Resolved",
          description: `Error in ${data.service} has been resolved`,
        });
      }
    },
    [toast, showToasts],
  );

  const handleAlertTriggered = useCallback(
    (data: RealtimeEventData) => {
      if (showToasts) {
        const title =
          typeof data.title === "string" ? data.title : "Alert Triggered";
        const description =
          typeof data.message === "string"
            ? data.message.slice(0, 80)
            : undefined;
        toast({
          title,
          description,
          variant:
            data.severity === "critical" || data.severity === "high"
              ? "destructive"
              : "default",
        });
      }
    },
    [toast, showToasts],
  );

  const handleAlertUpdated = useCallback(
    (data: RealtimeEventData) => {
      if (showToasts && data.status === "resolved") {
        toast({
          title: "Alert Resolved",
          description: `Alert for ${data.service} has been resolved`,
        });
      }
    },
    [toast, showToasts],
  );

  const { isConnected, lastEvent } = useRealtime({
    onNewError: handleNewError,
    onErrorUpdated: handleErrorUpdated,
    onAlertTriggered: handleAlertTriggered,
    onAlertUpdated: handleAlertUpdated,
  });

  return (
    <RealtimeContext.Provider value={{ isConnected, lastEvent }}>
      {children}
    </RealtimeContext.Provider>
  );
}
