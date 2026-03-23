"use client";

import { useRealtime } from "@/hooks/use-realtime";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function RealtimeStatus() {
  const { isConnected } = useRealtime();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-secondary/50">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-emerald-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-muted-foreground" />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  isConnected ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
                )}
              />
              <span className="text-xs text-muted-foreground">
                {isConnected ? "Live" : "Offline"}
              </span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isConnected
              ? "Connected to real-time updates"
              : "Disconnected from real-time updates"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
