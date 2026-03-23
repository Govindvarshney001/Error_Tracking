"use client"

// Navigation uses onClick with router.push - no Link inside TableRow
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { mockErrors, formatTimeAgo } from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { Search, ChevronRight, ArrowUpDown, Filter } from "lucide-react"

const severityStyles: Record<string, string> = {
  critical: "bg-severity-critical/20 text-severity-critical border-severity-critical/30",
  error: "bg-severity-error/20 text-severity-error border-severity-error/30",
  warning: "bg-severity-warning/20 text-severity-warning border-severity-warning/30",
  info: "bg-severity-info/20 text-severity-info border-severity-info/30",
}

type SortField = "frequency" | "lastSeen"
type SortOrder = "asc" | "desc"

export default function ErrorsPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [serviceFilter, setServiceFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<SortField>("frequency")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

  const services = useMemo(() => {
    return [...new Set(mockErrors.map((e) => e.service))]
  }, [])

  const filteredErrors = useMemo(() => {
    let result = [...mockErrors]

    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(
        (error) =>
          error.message.toLowerCase().includes(searchLower) ||
          error.service.toLowerCase().includes(searchLower) ||
          error.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      )
    }

    if (severityFilter !== "all") {
      result = result.filter((error) => error.severity === severityFilter)
    }

    if (serviceFilter !== "all") {
      result = result.filter((error) => error.service === serviceFilter)
    }

    result.sort((a, b) => {
      if (sortField === "frequency") {
        return sortOrder === "desc"
          ? b.frequency - a.frequency
          : a.frequency - b.frequency
      } else {
        return sortOrder === "desc"
          ? b.lastSeen.getTime() - a.lastSeen.getTime()
          : a.lastSeen.getTime() - b.lastSeen.getTime()
      }
    })

    return result
  }, [search, severityFilter, serviceFilter, sortField, sortOrder])

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc")
    } else {
      setSortField(field)
      setSortOrder("desc")
    }
  }

  const handleRowClick = (errorId: string) => {
    router.push(`/errors/${errorId}`)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Errors</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse and investigate error groups across all services
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search errors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-secondary border-border"
            />
          </div>
          <div className="flex gap-2">
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-32 bg-secondary border-border">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-40 bg-secondary border-border">
                <SelectValue placeholder="Service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {services.map((service) => (
                  <SelectItem key={service} value={service}>
                    {service}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-muted-foreground">Error</TableHead>
                <TableHead className="text-muted-foreground">Service</TableHead>
                <TableHead className="text-muted-foreground">Severity</TableHead>
                <TableHead className="text-muted-foreground">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 text-muted-foreground hover:text-foreground"
                    onClick={() => toggleSort("frequency")}
                  >
                    Events
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-muted-foreground">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 text-muted-foreground hover:text-foreground"
                    onClick={() => toggleSort("lastSeen")}
                  >
                    Last Seen
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-muted-foreground">Users</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredErrors.map((error) => (
                <TableRow
                  key={error.id}
                  className="border-border hover:bg-secondary/50 cursor-pointer"
                  onClick={() => handleRowClick(error.id)}
                >
                  <TableCell>
                    <div className="max-w-md">
                      <p className="font-medium text-card-foreground truncate">
                        {error.shortMessage}
                      </p>
                      <div className="flex gap-2 mt-1">
                        {error.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs text-muted-foreground"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {error.service}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "capitalize text-xs",
                        severityStyles[error.severity]
                      )}
                    >
                      {error.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-card-foreground font-medium">
                      {error.frequency.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {formatTimeAgo(error.lastSeen)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {error.affectedUsers.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredErrors.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">
                No errors found matching your criteria
              </p>
              <Button
                variant="ghost"
                className="mt-2"
                onClick={() => {
                  setSearch("")
                  setSeverityFilter("all")
                  setServiceFilter("all")
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
