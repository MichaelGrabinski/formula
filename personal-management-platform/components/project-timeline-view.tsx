"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, DollarSign, CheckCircle2 } from "lucide-react"

interface Project {
  id: number
  title: string
  status: string
  priority: string
  startDate?: string
  dueDate?: string
  estimatedCost: number
  estimatedHours: number
}

interface Task {
  id: number
  projectId: number
  status: string
}

interface ProjectTimelineViewProps {
  projects: Project[]
  tasks: Task[]
}

export function ProjectTimelineView({ projects, tasks }: ProjectTimelineViewProps) {
  const timelineData = useMemo(() => {
    return projects
      .map((project) => {
        const projectTasks = tasks.filter((t) => t.projectId === project.id)
        const completedTasks = projectTasks.filter((t) => t.status === "Completed")

        return {
          ...project,
          taskCount: projectTasks.length,
          completedTasks: completedTasks.length,
          startDate: project.startDate ? new Date(project.startDate) : new Date(),
          endDate: project.dueDate ? new Date(project.dueDate) : null,
        }
      })
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
  }, [projects, tasks])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Planning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "On Hold":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "border-l-red-500"
      case "Medium":
        return "border-l-orange-500"
      case "Low":
        return "border-l-green-500"
      default:
        return "border-l-gray-500"
    }
  }

  const isOverdue = (endDate: Date | null, status: string) => {
    if (!endDate || status === "Completed") return false
    return endDate < new Date()
  }

  const formatDateRange = (startDate: Date, endDate: Date | null) => {
    const start = startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    if (!endDate) return `${start} - Ongoing`
    const end = endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    return `${start} - ${end}`
  }

  const getDuration = (startDate: Date, endDate: Date | null) => {
    if (!endDate) return "Ongoing"
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays === 1) return "1 day"
    if (diffDays < 7) return `${diffDays} days`
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks`
    return `${Math.ceil(diffDays / 30)} months`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Project Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {timelineData.map((project, index) => (
            <div key={project.id} className="relative">
              {/* Timeline Line */}
              {index < timelineData.length - 1 && <div className="absolute left-6 top-16 w-0.5 h-12 bg-gray-200"></div>}

              {/* Timeline Dot */}
              <div className="absolute left-4 top-6 w-4 h-4 rounded-full bg-white border-4 border-blue-500 z-10"></div>

              {/* Project Card */}
              <div
                className={`ml-12 border-l-4 ${getPriorityColor(project.priority)} bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{project.title}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                        <Badge variant="outline" className="text-xs">
                          {project.priority} Priority
                        </Badge>
                        {isOverdue(project.endDate, project.status) && (
                          <Badge variant="destructive" className="text-xs">
                            Overdue
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">Timeline</span>
                      </div>
                      <div className="pl-6">
                        <div>{formatDateRange(project.startDate, project.endDate)}</div>
                        <div className="text-xs text-muted-foreground">
                          Duration: {getDuration(project.startDate, project.endDate)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="font-medium">Progress</span>
                      </div>
                      <div className="pl-6">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{
                                width: `${project.taskCount > 0 ? (project.completedTasks / project.taskCount) * 100 : 0}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium">
                            {project.taskCount > 0 ? Math.round((project.completedTasks / project.taskCount) * 100) : 0}
                            %
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {project.completedTasks}/{project.taskCount} tasks completed
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-medium">Resources</span>
                      </div>
                      <div className="pl-6 space-y-1">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{project.estimatedHours} hours</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span>${project.estimatedCost.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {timelineData.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No projects in timeline</h3>
              <p>Projects will appear here once you create them</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
