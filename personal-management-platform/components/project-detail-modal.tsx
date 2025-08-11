"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useAzureData, type Project, type Task } from "@/lib/data-store-azure"
import { TaskEnhancementModal } from "./task-enhancement-modal"
import {
  X,
  Edit,
  Save,
  Plus,
  Calendar,
  Clock,
  DollarSign,
  User,
  CheckCircle,
  AlertCircle,
  Circle,
  Sparkles,
  TrendingUp,
  Target,
  BarChart3,
} from "lucide-react"

interface ProjectDetailModalProps {
  project?: Project // Make project optional
  onClose: () => void
}

export function ProjectDetailModal({ project, onClose }: ProjectDetailModalProps) {
  if (!project) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-xl">Project Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">No project data was provided. Please select a valid project.</p>
            <Button onClick={onClose}>Close</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const [activeTab, setActiveTab] = useState<string>("overview")
  const [isEditing, setIsEditing] = useState(false)
  const [editedProject, setEditedProject] = useState(project)
  const [showAddTask, setShowAddTask] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [taskEnhancement, setTaskEnhancement] = useState<any>(null)

  const {
    updateProject,
    deleteProject,
    addTask,
    updateTask,
    deleteTask,
    getProperty,
    getAsset,
    tasks,
    properties,
    assets,
  } = useAzureData()

  // Get project tasks
  const getProjectTasks = (projectId: number) => {
    return tasks.filter((task) => task.projectId === projectId)
  }

  const projectTasks = getProjectTasks(project.id)
  const completedTasks = projectTasks.filter((t) => t.status === "Completed")
  const inProgressTasks = projectTasks.filter((t) => t.status === "In Progress")
  const todoTasks = projectTasks.filter((t) => t.status === "Todo")

  const relatedProperty = project.propertyId ? getProperty(project.propertyId) : null
  const relatedAsset = project.assetId ? getAsset(project.assetId) : null

  const handleSave = () => {
    updateProject(project.id, editedProject)
    setIsEditing(false)
  }

  const handleAddTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    addTask({
      projectId: project.id,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      status: "Todo",
      priority: formData.get("priority") as string,
      estimatedHours: Number.parseFloat(formData.get("estimatedHours") as string) || undefined,
      estimatedCost: Number.parseFloat(formData.get("estimatedCost") as string) || undefined,
      dueDate: (formData.get("dueDate") as string) || undefined,
      category: formData.get("category") as string,
      assignedTo: (formData.get("assignedTo") as string) || undefined,
    })

    setShowAddTask(false)
  }

  const handleTaskEnhancement = (task: Task) => {
    if (task.enhancement) {
      setSelectedTask(task)
      setTaskEnhancement(task.enhancement)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "In Progress":
        return <AlertCircle className="h-4 w-4 text-blue-500" />
      default:
        return <Circle className="h-4 w-4 text-gray-400" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "Low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const calculateProgress = () => {
    if (projectTasks.length === 0) return 0
    return Math.round((completedTasks.length / projectTasks.length) * 100)
  }

  const calculateTotalCost = () => {
    return projectTasks.reduce((total, task) => total + (task.actualCost || task.estimatedCost || 0), 0)
  }

  const calculateTotalHours = () => {
    return projectTasks.reduce((total, task) => total + (task.actualHours || task.estimatedHours || 0), 0)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {isEditing ? (
                <Input
                  value={editedProject.title}
                  onChange={(e) => setEditedProject({ ...editedProject, title: e.target.value })}
                  className="text-xl font-semibold"
                />
              ) : (
                <CardTitle className="text-xl">{project.title}</CardTitle>
              )}
              {isEditing ? (
                <Textarea
                  value={editedProject.description}
                  onChange={(e) => setEditedProject({ ...editedProject, description: e.target.value })}
                  className="mt-1 text-sm"
                />
              ) : (
                <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{project.status}</Badge>
                <Badge className={getPriorityColor(project.priority)}>{project.priority} Priority</Badge>
                <Badge className="bg-blue-100 text-blue-800">{calculateProgress()}% Complete</Badge>
                {relatedProperty && <Badge variant="secondary">Property: {relatedProperty.name}</Badge>}
                {relatedAsset && <Badge variant="secondary">Asset: {relatedAsset.name}</Badge>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">Tasks ({projectTasks.length})</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="ai">AI Assistant</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Progress value={calculateProgress()} className="w-full" />
                      <div className="text-center">
                        <span className="text-2xl font-bold">{calculateProgress()}%</span>
                        <p className="text-sm text-muted-foreground">Complete</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div>
                          <div className="font-medium text-green-600">{completedTasks.length}</div>
                          <div className="text-muted-foreground">Done</div>
                        </div>
                        <div>
                          <div className="font-medium text-blue-600">{inProgressTasks.length}</div>
                          <div className="text-muted-foreground">In Progress</div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-600">{todoTasks.length}</div>
                          <div className="text-muted-foreground">To Do</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Budget
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Estimated:</span>
                        {isEditing ? (
                          <Input
                            value={editedProject.estimatedCost}
                            onChange={(e) => setEditedProject({ ...editedProject, estimatedCost: Number(e.target.value) })}
                            className="mt-2"
                            type="number"
                            placeholder="Budget"
                          />
                        ) : (
                          <span className="font-medium">{formatCurrency(project.estimatedCost || 0)}</span>
                        )}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Actual:</span>
                        <span className="font-medium">{formatCurrency(calculateTotalCost())}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Variance:</span>
                        <span
                          className={`font-medium ${
                            calculateTotalCost() > (project.estimatedCost || 0) ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {formatCurrency(calculateTotalCost() - (project.estimatedCost || 0))}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Time Tracking
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Estimated:</span>
                        <span className="font-medium">{project.estimatedHours || 0}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Actual:</span>
                        <span className="font-medium">{calculateTotalHours()}h</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Efficiency:</span>
                        <span
                          className={`font-medium ${
                            calculateTotalHours() > (project.estimatedHours || 0) ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {project.estimatedHours
                            ? Math.round(
                                ((project.estimatedHours - calculateTotalHours()) / project.estimatedHours) * 100,
                              )
                            : 0}
                          %
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Project Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="outline">{project.status}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Priority:</span>
                      <Badge className={getPriorityColor(project.priority)}>{project.priority}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <span className="font-medium">{project.category}</span>
                    </div>
                    {project.assignedTo && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Assigned To:</span>
                        <span className="font-medium">{project.assignedTo}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Start Date:</span>
                      <span className="font-medium">
                        {project.startDate ? new Date(project.startDate).toLocaleDateString() : "Not set"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Due Date:</span>
                      <span className="font-medium">
                        {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : "Not set"}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {projectTasks.slice(0, 5).map((task) => (
                        <div key={task.id} className="flex items-center gap-2 text-sm">
                          {getStatusIcon(task.status)}
                          <span className="flex-1 truncate">{task.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {task.status}
                          </Badge>
                        </div>
                      ))}
                      {projectTasks.length === 0 && <p className="text-sm text-muted-foreground">No tasks yet</p>}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="tasks" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Task Management</h3>
                <Button size="sm" onClick={() => setShowAddTask(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Task
                </Button>
              </div>

              {showAddTask && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Add New Task</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddTask} className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label htmlFor="title">Task Title *</Label>
                          <Input id="title" name="title" required />
                        </div>
                        <div>
                          <Label htmlFor="priority">Priority</Label>
                          <Select name="priority" defaultValue="Medium">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Low">Low</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="High">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea id="description" name="description" />
                        </div>
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Input id="category" name="category" />
                        </div>
                        <div>
                          <Label htmlFor="assignedTo">Assigned To</Label>
                          <Input id="assignedTo" name="assignedTo" />
                        </div>
                        <div>
                          <Label htmlFor="estimatedHours">Estimated Hours</Label>
                          <Input id="estimatedHours" name="estimatedHours" type="number" step="0.5" />
                        </div>
                        <div>
                          <Label htmlFor="estimatedCost">Estimated Cost</Label>
                          <Input id="estimatedCost" name="estimatedCost" type="number" step="0.01" />
                        </div>
                        <div>
                          <Label htmlFor="dueDate">Due Date</Label>
                          <Input id="dueDate" name="dueDate" type="date" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit">Add Task</Button>
                        <Button type="button" variant="outline" onClick={() => setShowAddTask(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-4">
                {projectTasks.map((task) => (
                  <Card key={task.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(task.status)}
                            <h4 className="font-medium">{task.title}</h4>
                            <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                            {task.enhancement && (
                              <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                <Sparkles className="h-3 w-3 mr-1" />
                                Enhanced
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            {task.estimatedHours && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {task.estimatedHours}h
                              </span>
                            )}
                            {task.estimatedCost && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {formatCurrency(task.estimatedCost)}
                              </span>
                            )}
                            {task.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                            {task.assignedTo && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {task.assignedTo}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Select value={task.status} onValueChange={(value) => updateTask(task.id, { status: value })}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Todo">Todo</SelectItem>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                          {task.enhancement && (
                            <Button size="sm" variant="outline" onClick={() => handleTaskEnhancement(task)}>
                              <Sparkles className="h-4 w-4 mr-1" />
                              View Enhancement
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="timeline" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Project Timeline</h3>
                <div className="space-y-4">
                  {projectTasks
                    .filter((task) => task.dueDate)
                    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
                    .map((task) => (
                      <div key={task.id} className="flex items-center gap-4 p-3 border rounded-lg">
                        <div className="flex-shrink-0">{getStatusIcon(task.status)}</div>
                        <div className="flex-1">
                          <h4 className="font-medium">{task.title}</h4>
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{new Date(task.dueDate!).toLocaleDateString()}</div>
                          <Badge className={getPriorityColor(task.priority)} variant="outline">
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  {projectTasks.filter((task) => task.dueDate).length === 0 && (
                    <p className="text-muted-foreground text-center py-8">No tasks with due dates yet</p>
                  )}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="ai" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  AI Project Assistant
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Project Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Project is {calculateProgress()}% complete</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm">{inProgressTasks.length} tasks in progress</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm">
                            {projectTasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date()).length} overdue
                            tasks
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {calculateProgress() < 50 && (
                          <div className="text-sm">
                            <span className="font-medium">Focus Area:</span> Complete planning tasks first
                          </div>
                        )}
                        {inProgressTasks.length > 3 && (
                          <div className="text-sm">
                            <span className="font-medium">Suggestion:</span> Limit work in progress
                          </div>
                        )}
                        {calculateTotalCost() > (project.estimatedCost || 0) && (
                          <div className="text-sm">
                            <span className="font-medium">Alert:</span> Budget exceeded
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Smart Suggestions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900">Next Steps</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Based on your progress, consider focusing on{" "}
                          {todoTasks.length > 0 ? todoTasks[0].title : "completing remaining tasks"}
                        </p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <h4 className="font-medium text-green-900">Optimization</h4>
                        <p className="text-sm text-green-700 mt-1">
                          Tasks with AI enhancements show better completion rates. Consider enhancing more tasks.
                        </p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <h4 className="font-medium text-purple-900">Resource Planning</h4>
                        <p className="text-sm text-purple-700 mt-1">
                          Current burn rate suggests project completion by{" "}
                          {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : "target date"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardHeader>
        <CardContent className="overflow-y-auto max-h-[60vh]">
          {/* Content for the selected tab will be rendered here */}
        </CardContent>
      </Card>
    </div>
  )
}
