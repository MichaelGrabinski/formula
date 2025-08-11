"use client"

import { useState } from "react"
import { useAzureData } from "@/lib/data-store-azure"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { AddProjectModal } from "@/components/add-project-modal"
import { ProjectDetailModal } from "@/components/project-detail-modal"
import { ProjectGanttChart } from "@/components/project-gantt-chart"
import { ProjectKanbanBoard } from "@/components/project-kanban-board"
import { ProjectTimelineView } from "@/components/project-timeline-view"
import { ProjectAIAssistant } from "@/components/project-ai-assistant"
import {
  FolderOpen,
  Search,
  Plus,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  LayoutGrid,
  List,
  BarChart3,
  Bot,
} from "lucide-react"

export default function ProjectsPage() {
  const { projects, tasks, isLoading } = useAzureData()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [showAddProject, setShowAddProject] = useState(false)
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "kanban" | "gantt" | "timeline">("grid")

  // Defensive: ensure viewMode is always valid
  const validViewModes = ["grid", "kanban", "gantt", "timeline"] as const
  const safeViewMode = validViewModes.includes(viewMode) ? viewMode : "grid"

  function SafeTabsContent({ value, children, ...props }: any) {
    // Only render if inside Tabs (safeViewMode is valid)
    if (!validViewModes.includes(safeViewMode)) {
      if (process.env.NODE_ENV === "development") {
        console.warn("TabsContent attempted to render outside Tabs!")
      }
      return null
    }
    return <TabsContent value={value} {...props}>{children}</TabsContent>
  }

  const filteredProjects = (projects || []).filter(
    (project) =>
      (project.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.category || "").toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const mappedProjects = filteredProjects.map((p) => ({
    ...p,
    estimatedCost: p.estimatedCost ?? 0,
    estimatedHours: p.estimatedHours ?? 0,
  }))
  const mappedTasks = (tasks || []).map((t) => ({
    ...t,
    projectId: t.projectId ?? -1,
  }))

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800"
      case "In Progress":
        return "bg-blue-100 text-blue-800"
      case "Planning":
        return "bg-yellow-100 text-yellow-800"
      case "On Hold":
        return "bg-orange-100 text-orange-800"
      case "Cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="h-4 w-4" />
      case "In Progress":
        return <Clock className="h-4 w-4" />
      case "Planning":
        return <Calendar className="h-4 w-4" />
      case "On Hold":
        return <AlertTriangle className="h-4 w-4" />
      case "Cancelled":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <FolderOpen className="h-4 w-4" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getProjectProgress = (projectId: number) => {
    const projectTasks = (tasks || []).filter((task) => task.projectId === projectId)
    if (projectTasks.length === 0) return 0
    const completedTasks = projectTasks.filter((task) => task.status === "Completed")
    return Math.round((completedTasks.length / projectTasks.length) * 100)
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
        <SidebarTrigger className="-ml-1 h-8 w-8" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Projects</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground">Manage your property improvement and maintenance projects</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowAIAssistant(true)} variant="outline" className="gap-2">
              <Bot className="h-4 w-4" />
              AI Assistant
            </Button>
            <Button onClick={() => setShowAddProject(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Project
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-1">
            <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "kanban" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("kanban")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "gantt" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("gantt")}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "timeline" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("timeline")}
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs value={safeViewMode} onValueChange={(value) => setViewMode(value as any)} className="space-y-4">
          <TabsList className="hidden">
            <TabsTrigger value="grid">Grid</TabsTrigger>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="gantt">Gantt</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <SafeTabsContent value="grid" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => {
                const progress = getProjectProgress(project.id)
                const projectTasks = (tasks || []).filter((task) => task.projectId === project.id)
                return (
                  <Card
                    key={project.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedProject(project.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{project.title}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {project.description || "No description available"}
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(project.status)}>
                          {getStatusIcon(project.status)}
                          <span className="ml-1">{project.status}</span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Category</p>
                          <p className="font-medium">{project.category || "General"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Budget</p>
                          <p className="font-medium">{formatCurrency(project.estimatedCost || 0)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Start Date</p>
                          <p className="font-medium">{project.startDate ? formatDate(project.startDate) : "Not set"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">End Date</p>
                          <p className="font-medium">{project.dueDate ? formatDate(project.dueDate) : "Not set"}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{projectTasks.length} tasks</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedProject(project.id)
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {filteredProjects.length === 0 && (
              <div className="text-center py-12">
                <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No projects found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? "Try adjusting your search terms" : "Get started by creating your first project"}
                </p>
                <Button onClick={() => setShowAddProject(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Project
                </Button>
              </div>
            )}
          </SafeTabsContent>

          <SafeTabsContent value="kanban" className="space-y-4">
            <ProjectKanbanBoard projects={mappedProjects} tasks={mappedTasks} />
          </SafeTabsContent>

          <SafeTabsContent value="gantt" className="space-y-4">
            <ProjectGanttChart projects={mappedProjects} tasks={mappedTasks} />
          </SafeTabsContent>

          <SafeTabsContent value="timeline" className="space-y-4">
            <ProjectTimelineView projects={mappedProjects} tasks={mappedTasks} />
          </SafeTabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <AddProjectModal open={showAddProject} onOpenChange={setShowAddProject} />

      {selectedProject && (
        <ProjectDetailModal
          project={projects.find((p) => p.id === selectedProject) || undefined}
          onClose={() => setSelectedProject(null)}
        />
      )}

      <ProjectAIAssistant open={showAIAssistant} onOpenChange={setShowAIAssistant} />
    </>
  )
}
