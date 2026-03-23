"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { mockAlerts, formatTimeAgo } from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MoreHorizontal,
  Bell,
  BellOff
} from "lucide-react"
import type { Alert } from "@/lib/mock-data"

const statusConfig = {
  active: {
    styles: "bg-severity-critical/20 text-severity-critical border-severity-critical/30",
    icon: AlertTriangle,
    label: "Active"
  },
  acknowledged: {
    styles: "bg-severity-warning/20 text-severity-warning border-severity-warning/30",
    icon: Clock,
    label: "Acknowledged"
  },
  resolved: {
    styles: "bg-chart-2/20 text-chart-2 border-chart-2/30",
    icon: CheckCircle,
    label: "Resolved"
  },
}

export default function AlertsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts)

  const filteredAlerts = statusFilter === "all" 
    ? alerts 
    : alerts.filter(alert => alert.status === statusFilter)

  const updateAlertStatus = (alertId: string, newStatus: Alert['status']) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, status: newStatus } : alert
    ))
  }

  const activeCount = alerts.filter(a => a.status === 'active').length
  const acknowledgedCount = alerts.filter(a => a.status === 'acknowledged').length
  const resolvedCount = alerts.filter(a => a.status === 'resolved').length

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Alerts</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor and manage triggered alerts across your services
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Configure Alerts
          </Button>
        </div>

        {/* Alert Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-severity-critical animate-pulse" />
              <span className="text-sm text-muted-foreground">Active</span>
            </div>
            <p className="text-2xl font-semibold text-card-foreground mt-1">
              {activeCount}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-severity-warning" />
              <span className="text-sm text-muted-foreground">Acknowledged</span>
            </div>
            <p className="text-2xl font-semibold text-card-foreground mt-1">
              {acknowledgedCount}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-chart-2" />
              <span className="text-sm text-muted-foreground">Resolved</span>
            </div>
            <p className="text-2xl font-semibold text-card-foreground mt-1">
              {resolvedCount}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-secondary border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="acknowledged">Acknowledged</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Alerts Table */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-muted-foreground w-8"></TableHead>
                <TableHead className="text-muted-foreground">Alert</TableHead>
                <TableHead className="text-muted-foreground">Service</TableHead>
                <TableHead className="text-muted-foreground">Condition</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Triggered</TableHead>
                <TableHead className="text-muted-foreground w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAlerts.map((alert) => {
                const config = statusConfig[alert.status]
                const StatusIcon = config.icon

                return (
                  <TableRow key={alert.id} className="border-border hover:bg-secondary/50">
                    <TableCell>
                      <StatusIcon className={cn(
                        "h-5 w-5",
                        alert.status === 'active' && "text-severity-critical",
                        alert.status === 'acknowledged' && "text-severity-warning",
                        alert.status === 'resolved' && "text-chart-2"
                      )} />
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-card-foreground">
                        {alert.message}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{alert.service}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{alert.condition}</span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={cn("capitalize text-xs", config.styles)}
                      >
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatTimeAgo(alert.triggerTime)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {alert.status === 'active' && (
                            <DropdownMenuItem 
                              onClick={() => updateAlertStatus(alert.id, 'acknowledged')}
                            >
                              <Clock className="h-4 w-4 mr-2" />
                              Acknowledge
                            </DropdownMenuItem>
                          )}
                          {alert.status !== 'resolved' && (
                            <DropdownMenuItem 
                              onClick={() => updateAlertStatus(alert.id, 'resolved')}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Resolve
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <BellOff className="h-4 w-4 mr-2" />
                            Mute
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {filteredAlerts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No alerts found</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
