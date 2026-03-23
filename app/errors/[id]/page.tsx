"use client"

import { use, useMemo } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { mockErrors, formatTimeAgo } from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  Clock,
  Users,
  Activity,
  ExternalLink,
  Copy,
  CheckCircle
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { useState } from "react"

const severityStyles = {
  critical: "bg-severity-critical/20 text-severity-critical border-severity-critical/30",
  error: "bg-severity-error/20 text-severity-error border-severity-error/30",
  warning: "bg-severity-warning/20 text-severity-warning border-severity-warning/30",
  info: "bg-severity-info/20 text-severity-info border-severity-info/30",
}

export default function ErrorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [copied, setCopied] = useState(false)
  
  const error = mockErrors.find(e => e.id === id)

  const occurrenceData = useMemo(() => {
    if (!error) return []
    return error.occurrences.map(o => ({
      time: o.date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      count: o.count
    }))
  }, [error])

  if (!error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <p className="text-muted-foreground">Error not found</p>
          <Link href="/errors">
            <Button variant="ghost" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Errors
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const copyStackTrace = () => {
    navigator.clipboard.writeText(error.stackTrace)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <Link href="/errors">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <Badge 
                variant="outline" 
                className={cn("capitalize", severityStyles[error.severity])}
              >
                {error.severity}
              </Badge>
              <span className="text-sm text-muted-foreground">{error.service}</span>
            </div>
            <h1 className="text-xl font-semibold text-foreground break-all">
              {error.message}
            </h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Ignore
            </Button>
            <Button variant="outline" size="sm">
              Resolve
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Activity className="h-4 w-4" />
              <span className="text-sm">Events</span>
            </div>
            <p className="text-2xl font-semibold text-card-foreground">
              {error.frequency.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-sm">Users Affected</span>
            </div>
            <p className="text-2xl font-semibold text-card-foreground">
              {error.affectedUsers.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm">First Seen</span>
            </div>
            <p className="text-lg font-medium text-card-foreground">
              {formatTimeAgo(error.firstSeen)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Last Seen</span>
            </div>
            <p className="text-lg font-medium text-card-foreground">
              {formatTimeAgo(error.lastSeen)}
            </p>
          </div>
        </div>

        {/* Occurrence Chart */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-medium text-card-foreground mb-4">
            Occurrences (Last 24 Hours)
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={occurrenceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOccurrences" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4EB3D3" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4EB3D3" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
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
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#4EB3D3"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorOccurrences)"
                  name="Events"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="stacktrace" className="space-y-4">
          <TabsList className="bg-secondary">
            <TabsTrigger value="stacktrace">Stack Trace</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            <TabsTrigger value="tags">Tags & Context</TabsTrigger>
          </TabsList>

          <TabsContent value="stacktrace" className="space-y-4">
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/50">
                <span className="text-sm font-medium text-card-foreground">Stack Trace</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={copyStackTrace}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2 text-chart-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <pre className="p-4 text-sm text-card-foreground font-mono overflow-x-auto whitespace-pre-wrap">
                {error.stackTrace}
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="metadata" className="space-y-4">
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="px-4 py-2 border-b border-border bg-secondary/50">
                <span className="text-sm font-medium text-card-foreground">Environment Details</span>
              </div>
              <div className="divide-y divide-border">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">Environment</span>
                  <span className="text-sm font-medium text-card-foreground">
                    {error.metadata.environment}
                  </span>
                </div>
                {error.metadata.browser && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-muted-foreground">Browser</span>
                    <span className="text-sm font-medium text-card-foreground">
                      {error.metadata.browser}
                    </span>
                  </div>
                )}
                {error.metadata.os && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-muted-foreground">Operating System</span>
                    <span className="text-sm font-medium text-card-foreground">
                      {error.metadata.os}
                    </span>
                  </div>
                )}
                {error.metadata.version && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-muted-foreground">Version</span>
                    <span className="text-sm font-medium text-card-foreground">
                      {error.metadata.version}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">Service</span>
                  <span className="text-sm font-medium text-card-foreground">
                    {error.service}
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tags" className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <span className="text-sm font-medium text-card-foreground mb-3 block">
                Tags
              </span>
              <div className="flex flex-wrap gap-2">
                {error.tags.map(tag => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="bg-secondary text-secondary-foreground"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
