"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAzureData } from "@/lib/data-store-azure"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Bot,
  Sparkles,
  TrendingUp,
  Target,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  BarChart3,
} from "lucide-react"

interface ProjectAIAssistantProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectAIAssistant({ open, onOpenChange }: ProjectAIAssistantProps) {
  const { projects, tasks, properties, assets } = useAzureData()
  const [activeTab, setActiveTab] = useState<"insights" | "generate" | "optimize">("insights")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedProject, setGeneratedProject] = useState<any>(null)
  const [customPrompts, setCustomPrompts] = useState<string[]>([])

  // Calculate project statistics
  const totalProjects = projects.length
  const activeProjects = projects.filter((p) => p.status !== "Completed" && p.status !== "Cancelled").length
  const completedProjects = projects.filter((p) => p.status === "Completed").length
  const overdueProjects = projects.filter(
    (p) => p.dueDate && new Date(p.dueDate) < new Date() && p.status !== "Completed",
  ).length

  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.status === "Completed").length
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "Completed",
  ).length

  const totalBudget = projects.reduce((sum, p) => sum + (p.estimatedCost || 0), 0)
  const spentBudget = projects.reduce((sum, p) => sum + (p.actualCost || 0), 0)

  const handleGenerateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsGenerating(true)

    const formData = new FormData(e.currentTarget)
    const description = formData.get("description") as string
    const budget = formData.get("budget") as string
    const timeline = formData.get("timeline") as string

    try {
      const response = await fetch("/api/generate-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          budget: budget ? Number.parseFloat(budget) : undefined,
          timeline,
          existingProjects: projects.map((p) => ({ title: p.title, category: p.category })),
          properties: properties.map((p) => ({ name: p.name, type: p.type })),
          assets: assets.map((a) => ({ name: a.name, category: a.category })),
        }),
      })

      const result = await response.json()
      setGeneratedProject(result.project)
    } catch (error) {
      console.error("Failed to generate project:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Add localStorage persistence for custom assistants
  useEffect(() => {
    if (open) {
      // Load custom prompts from localStorage
      const savedPrompts = localStorage.getItem("customPrompts")
      if (savedPrompts) {
        setCustomPrompts(JSON.parse(savedPrompts))
      }
    }
  }, [open])

  useEffect(() => {
    // Save custom prompts to localStorage whenever they change
    localStorage.setItem("customPrompts", JSON.stringify(customPrompts))
  }, [customPrompts])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-purple-600" />
            AI Project Assistant
          </DialogTitle>
          <DialogDescription>
            Get intelligent insights, generate new projects, and optimize your project management
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "insights" | "generate" | "optimize")} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="optimize">Optimize</TabsTrigger>
          </TabsList>

          <TabsContent value="insights" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalProjects}</div>
                  <p className="text-xs text-muted-foreground">
                    {activeProjects} active, {completedProjects} completed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {completedTasks} of {totalTasks} tasks done
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Budget Usage</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalBudget > 0 ? Math.round((spentBudget / totalBudget) * 100) : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(spentBudget)} of {formatCurrency(totalBudget)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{overdueProjects + overdueTasks}</div>
                  <p className="text-xs text-muted-foreground">
                    {overdueProjects} projects, {overdueTasks} tasks
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Performance Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">
                        {Math.round((completedProjects / Math.max(totalProjects, 1)) * 100)}% project completion rate
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">
                        Average project duration: {projects.length > 0 ? "3-6 months" : "No data"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">
                        Budget variance:{" "}
                        {totalBudget > 0
                          ? `${Math.round(((spentBudget - totalBudget) / totalBudget) * 100)}%`
                          : "No data"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Smart Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {overdueProjects > 0 && (
                    <div className="p-3 bg-red-50 rounded-lg">
                      <p className="text-sm font-medium text-red-900">Urgent Action Needed</p>
                      <p className="text-xs text-red-700">
                        {overdueProjects} project{overdueProjects > 1 ? "s are" : " is"} overdue. Review and update
                        timelines.
                      </p>
                    </div>
                  )}
                  {activeProjects > 5 && (
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm font-medium text-yellow-900">Resource Management</p>
                      <p className="text-xs text-yellow-700">
                        Consider prioritizing projects to avoid resource conflicts.
                      </p>
                    </div>
                  )}
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">Optimization Tip</p>
                    <p className="text-xs text-blue-700">
                      Break down large projects into smaller milestones for better tracking.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="generate" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Generate New Project
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGenerateProject} className="space-y-4">
                  <div>
                    <Label htmlFor="description">Project Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Describe what you want to accomplish (e.g., 'Renovate the kitchen with modern appliances and new countertops')"
                      required
                      rows={4}
                      className="resize-y"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="budget">Budget (optional)</Label>
                      <Input id="budget" name="budget" type="number" placeholder="10000" step="100" />
                    </div>
                    <div>
                      <Label htmlFor="timeline">Timeline (optional)</Label>
                      <Input id="timeline" name="timeline" placeholder="3 months" />
                    </div>
                  </div>
                  <Button type="submit" disabled={isGenerating} className="w-full">
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating Project...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Project Plan
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {generatedProject && (
              <Card>
                <CardHeader>
                  <CardTitle>Generated Project Plan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 max-w-3xl w-full">
                  <div>
                    <h4 className="font-medium">{generatedProject.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{generatedProject.description}</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm font-medium">Estimated Cost</p>
                      <p className="text-lg">{formatCurrency(generatedProject.estimatedCost || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Timeline</p>
                      <p className="text-lg">{generatedProject.estimatedDuration || "TBD"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Priority</p>
                      <Badge>{generatedProject.priority || "Medium"}</Badge>
                    </div>
                  </div>
                  {generatedProject.tasks && (
                    <div>
                      <p className="text-sm font-medium mb-2">Suggested Tasks</p>
                      <div className="space-y-2">
                        {generatedProject.tasks.slice(0, 5).map((task: any, index: number) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>{task.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button className="w-full">Add This Project</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="optimize" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Resource Optimization
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Active Projects</span>
                      <span className={activeProjects > 5 ? "text-red-600" : "text-green-600"}>{activeProjects}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Overdue Tasks</span>
                      <span className={overdueTasks > 0 ? "text-red-600" : "text-green-600"}>{overdueTasks}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Budget Utilization</span>
                      <span className={spentBudget > totalBudget ? "text-red-600" : "text-green-600"}>
                        {totalBudget > 0 ? Math.round((spentBudget / totalBudget) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">Suggestion</p>
                    <p className="text-xs text-blue-700">Schedule weekly project reviews to maintain momentum</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-900">Best Practice</p>
                    <p className="text-xs text-green-700">Use time blocking for focused project work</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Optimization Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {overdueProjects > 0 && (
                  <div className="p-4 border-l-4 border-red-500 bg-red-50">
                    <h4 className="font-medium text-red-900">Critical: Overdue Projects</h4>
                    <p className="text-sm text-red-700 mt-1">
                      Review {overdueProjects} overdue project{overdueProjects > 1 ? "s" : ""} and adjust timelines or
                      resources.
                    </p>
                  </div>
                )}
                {activeProjects > 5 && (
                  <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50">
                    <h4 className="font-medium text-yellow-900">Warning: Too Many Active Projects</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Consider completing or pausing some projects to improve focus and resource allocation.
                    </p>
                  </div>
                )}
                <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
                  <h4 className="font-medium text-blue-900">Tip: Project Templates</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Create templates for common project types to speed up planning and ensure consistency.
                  </p>
                </div>
                <div className="p-4 border-l-4 border-green-500 bg-green-50">
                  <h4 className="font-medium text-green-900">Success: Good Progress</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Your project completion rate is on track. Keep up the good work!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
