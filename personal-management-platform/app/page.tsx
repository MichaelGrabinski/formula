"use client"

import { DashboardStats } from "@/components/dashboard-stats"
import { QuickAddForm } from "@/components/quick-add-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAzureData } from "@/lib/data-store-azure"
import { CalendarDays, Clock, AlertCircle, CheckCircle2 } from "lucide-react"

export default function DashboardPage() {
  const {
    tasks = [],
    repairs = [],
    projects = [],
    isLoading,
    getActiveTasks,
    getOverdueTasks,
    getUpcomingTasks,
  } = useAzureData()

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <div className="animate-pulse">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Get task data with null checks
  const activeTasks = getActiveTasks ? getActiveTasks() : tasks.filter((task) => task?.status !== "Completed")
  const overdueTasks = getOverdueTasks ? getOverdueTasks() : []
  const upcomingTasks = getUpcomingTasks ? getUpcomingTasks() : []

  // Get recent activity with null checks
  const recentRepairs = repairs
    .filter((repair) => repair?.status === "In Progress" || repair?.status === "Scheduled")
    .slice(0, 5)

  const activeProjects = projects
    .filter((project) => project?.status === "In Progress" || project?.status === "Planning")
    .slice(0, 5)

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      {/* Main Stats */}
      <DashboardStats />

      {/* Quick Actions and Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Quick Add Form */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Add</CardTitle>
            <CardDescription>Quickly add new items to your portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            <QuickAddForm />
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates across your portfolio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Active Tasks */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Active Tasks ({activeTasks.length})
              </h4>
              {activeTasks.length > 0 ? (
                <div className="space-y-2">
                  {activeTasks.slice(0, 3).map((task) => (
                    <div key={task.id} className="flex items-center justify-between text-sm">
                      <span className="truncate">{task.title}</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          task.priority === "High"
                            ? "bg-red-100 text-red-800"
                            : task.priority === "Medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  ))}
                  {activeTasks.length > 3 && (
                    <p className="text-xs text-muted-foreground">+{activeTasks.length - 3} more tasks</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No active tasks</p>
              )}
            </div>

            {/* Overdue Items */}
            {overdueTasks.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  Overdue Tasks ({overdueTasks.length})
                </h4>
                <div className="space-y-2">
                  {overdueTasks.slice(0, 2).map((task) => (
                    <div key={task.id} className="flex items-center justify-between text-sm">
                      <span className="truncate text-red-600">{task.title}</span>
                      <span className="text-xs text-muted-foreground">Due: {task.dueDate}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Repairs */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Active Repairs ({recentRepairs.length})
              </h4>
              {recentRepairs.length > 0 ? (
                <div className="space-y-2">
                  {recentRepairs.slice(0, 2).map((repair) => (
                    <div key={repair.id} className="flex items-center justify-between text-sm">
                      <span className="truncate">{repair.title}</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          repair.status === "In Progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {repair.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No active repairs</p>
              )}
            </div>

            {/* Active Projects */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Active Projects ({activeProjects.length})
              </h4>
              {activeProjects.length > 0 ? (
                <div className="space-y-2">
                  {activeProjects.slice(0, 2).map((project) => (
                    <div key={project.id} className="flex items-center justify-between text-sm">
                      <span className="truncate">{project.title}</span>
                      <span className="text-xs text-muted-foreground">{project.progress || 0}% complete</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No active projects</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
