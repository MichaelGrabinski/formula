"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, DollarSign, CheckCircle2 } from "lucide-react"

interface Project {
  id: number
  title: string
  description: string
  status: string
  priority: string
  estimatedCost: number
  estimatedHours: number
  dueDate?: string
}

interface Task {
  id: number
  projectId: number
  status: string
}

interface ProjectKanbanBoardProps {
  projects: Project[]
  tasks: Task[]
}

export function ProjectKanbanBoard({ projects, tasks }: ProjectKanbanBoardProps) {
  const columns = [
    { id: "Planning", title: "Planning", color: "bg-yellow-50 border-yellow-200" },
    { id: "In Progress", title: "In Progress", color: "bg-blue-50 border-blue-200" },
    { id: "On Hold", title: "On Hold", color: "bg-orange-50 border-orange-200" },
    { id: "Completed", title: "Completed", color: "bg-green-50 border-green-200" },
  ]

  const getProjectsByStatus = (status: string) => {
    return projects.filter((project) => project.status === status)
  }

  const getProjectTasks = (projectId: number) => {
    return tasks.filter((task) => task.projectId === projectId)
  }

  const getCompletedTasks = (projectId: number) => {
    return tasks.filter((task) => task.projectId === projectId && task.status === "Completed")
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800"
      case "Medium":
        return "bg-orange-100 text-orange-800"
      case "Low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {columns.map((column) => {
        const columnProjects = getProjectsByStatus(column.id)

        return (
          <div key={column.id} className={`rounded-lg border-2 ${column.color} p-4`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">{column.title}</h3>
              <Badge variant="secondary">{columnProjects.length}</Badge>
            </div>

            <div className="space-y-3">
              {columnProjects.map((project) => {
                const projectTasks = getProjectTasks(project.id)
                const completedTasks = getCompletedTasks(project.id)
                const progress = projectTasks.length > 0 ? (completedTasks.length / projectTasks.length) * 100 : 0

                return (
                  <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow bg-white">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm leading-tight">{project.title}</h4>
                          <Badge className={getPriorityColor(project.priority)} variant="outline">
                            {project.priority}
                          </Badge>
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>

                        {/* Progress Bar */}
                        {projectTasks.length > 0 && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span>Progress</span>
                              <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Project Stats */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>
                              {completedTasks.length}/{projectTasks.length}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{project.estimatedHours}h</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            <span>${project.estimatedCost.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Due Date */}
                        {project.dueDate && (
                          <div
                            className={`text-xs ${isOverdue(project.dueDate) && project.status !== "Completed" ? "text-red-500 font-medium" : "text-muted-foreground"}`}
                          >
                            Due: {new Date(project.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {columnProjects.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-xs">No projects</div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
