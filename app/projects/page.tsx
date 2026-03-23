import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { mockProjects } from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Plus, ExternalLink, AlertCircle } from "lucide-react"

const statusConfig = {
  healthy: {
    styles: "bg-chart-2/20 text-chart-2 border-chart-2/30",
    dot: "bg-chart-2"
  },
  degraded: {
    styles: "bg-severity-warning/20 text-severity-warning border-severity-warning/30",
    dot: "bg-severity-warning"
  },
  critical: {
    styles: "bg-severity-critical/20 text-severity-critical border-severity-critical/30",
    dot: "bg-severity-critical"
  },
}

export default function ProjectsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Projects</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your services and their error tracking configurations
            </p>
          </div>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </Button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockProjects.map((project) => {
            const config = statusConfig[project.status]

            return (
              <div 
                key={project.id}
                className="rounded-lg border border-border bg-card p-5 hover:border-muted-foreground/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-medium text-card-foreground">{project.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{project.slug}</p>
                  </div>
                  <Badge variant="outline" className={cn("capitalize text-xs", config.styles)}>
                    <span className={cn("h-2 w-2 rounded-full mr-1.5", config.dot)} />
                    {project.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">
                      {project.errorCount.toLocaleString()} errors
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}
