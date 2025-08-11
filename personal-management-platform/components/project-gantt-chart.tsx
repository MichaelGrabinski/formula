"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, DollarSign } from "lucide-react"

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
  title: string
  status: string
  dueDate?: string
}

interface ProjectGanttChartProps {
  projects: Project[]
  tasks: Task[]
}

export function ProjectGanttChart({ projects, tasks }: ProjectGanttChartProps) {
  const ganttData = useMemo(() => {
    const today = new Date()
    const startOfChart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const endOfChart = new Date(today.getFullYear(), today.getMonth() + 5, 0)

    const totalDays = Math.ceil((endOfChart.getTime() - startOfChart.getTime()) / (1000 * 60 * 60 * 24))

    return projects.map((project) => {
      const projectTasks = tasks.filter((t) => t.projectId === project.id)
      const startDate = project.startDate ? new Date(project.startDate) : today
      const endDate = project.dueDate ? new Date(project.dueDate) : new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

      const startOffset = Math.max(0, Math.ceil((startDate.getTime() - startOfChart.getTime()) / (1000 * 60 * 60 * 24)))
      const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const width = Math.min(duration, totalDays - startOffset)

      return {
        ...project,
        startOffset: (startOffset / totalDays) * 100,
        width: (width / totalDays) * 100,
        taskCount: projectTasks.length,
        completedTasks: projectTasks.filter((t) => t.status === "Completed").length,
        startDate,
        endDate,
      }
    })
  }, [projects, tasks])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-500"
      case "In Progress":
        return "bg-blue-500"
      case "Planning":
        return "bg-yellow-500"
      case "On Hold":
        return "bg-orange-500"
      default:
        return "bg-gray-500"
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

  // Generate month headers
  const months = []
  const currentDate = new Date()
  for (let i = -1; i <= 5; i++) {
    const month = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1)
    months.push({
      name: month.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      width: 100 / 7, // 7 months total
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Project Gantt Chart
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Timeline Header */}
          <div className="flex border-b pb-2">
            <div className="w-80 font-medium">Project</div>
            <div className="flex-1 relative">
              <div className="flex">
                {months.map((month, index) => (
                  <div
                    key={index}
                    className="text-xs text-center border-l px-2 py-1"
                    style={{ width: `${month.width}%` }}
                  >
                    {month.name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Project Rows */}
          <div className="space-y-3">
            {ganttData.map((project) => (
              <div key={project.id} className="flex items-center group hover:bg-muted/50 p-2 rounded">
                <div className="w-80 pr-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm truncate">{project.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {project.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {project.estimatedHours}h
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />${project.estimatedCost.toLocaleString()}
                      </div>
                      <span>
                        {project.completedTasks}/{project.taskCount} tasks
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 relative h-8">
                  {/* Gantt Bar */}
                  <div
                    className={`absolute top-1 h-6 rounded ${getStatusColor(project.status)} ${getPriorityColor(project.priority)} border-l-4 opacity-80 hover:opacity-100 transition-opacity`}
                    style={{
                      left: `${project.startOffset}%`,
                      width: `${project.width}%`,
                      minWidth: "20px",
                    }}
                  >
                    <div className="h-full flex items-center justify-center text-white text-xs font-medium px-2">
                      {project.width > 15 && `${Math.round((project.completedTasks / project.taskCount) * 100)}%`}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {project.taskCount > 0 && (
                    <div
                      className="absolute top-1 h-6 bg-white/30 rounded"
                      style={{
                        left: `${project.startOffset}%`,
                        width: `${(project.width * project.completedTasks) / project.taskCount}%`,
                        minWidth: project.completedTasks > 0 ? "2px" : "0px",
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {ganttData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No projects to display in Gantt chart</p>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-6 pt-4 border-t text-xs">
            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>Planning</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>In Progress</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                <span>On Hold</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Priority:</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 border-l-4 border-l-red-500 bg-gray-200"></div>
                <span>High</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 border-l-4 border-l-orange-500 bg-gray-200"></div>
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 border-l-4 border-l-green-500 bg-gray-200"></div>
                <span>Low</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
