"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAzureData } from "@/lib/data-store-azure"
import { Bot, Loader2, Sparkles, Zap, Clock, DollarSign, AlertTriangle, CheckCircle } from "lucide-react"

interface AddProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddProjectModal({ open, onOpenChange }: AddProjectModalProps) {
  const { addProject, addTask, properties } = useAzureData()
  const [activeTab, setActiveTab] = useState("manual")

  // Manual form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "Medium",
    estimatedCost: "",
    estimatedHours: "",
    propertyId: "",
  })

  // AI generation state
  const [aiDescription, setAiDescription] = useState("")
  const [projectType, setProjectType] = useState("general")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedProject, setGeneratedProject] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Fix: Only reset activeTab to 'manual' if closing the modal, not on every open/close change
  const handleClose = () => {
    setActiveTab("manual")
    onOpenChange(false)
    setFormData({
      title: "",
      description: "",
      priority: "Medium",
      estimatedCost: "",
      estimatedHours: "",
      propertyId: "",
    })
    setAiDescription("")
    setProjectType("general")
    setGeneratedProject(null)
    setError(null)
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const projectData = {
      title: formData.title,
      description: formData.description,
      status: "Planning",
      priority: formData.priority,
      estimatedCost: Number.parseFloat(formData.estimatedCost) || 0,
      estimatedHours: Number.parseFloat(formData.estimatedHours) || 0,
      propertyId: formData.propertyId ? Number.parseInt(formData.propertyId) : undefined,
    }

    try {
      await addProject(projectData)
      handleClose()
    } catch (error) {
      console.error("Error adding project:", error)
      setError("Failed to add project")
    }
  }

  const handleAIGenerate = async () => {
    if (!aiDescription.trim()) {
      setError("Please provide a project description")
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch("/api/generate-project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: aiDescription,
          projectType,
          properties: properties.map((p) => ({ id: p.id, name: p.name, address: p.address })),
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to generate project: ${response.status}`)
      }

      const data = await response.json()
      console.log("Generated project data:", data)
      setGeneratedProject(data.project)
    } catch (err) {
      console.error("Error generating project:", err)
      setError(err instanceof Error ? err.message : "Failed to generate project")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAcceptGenerated = async () => {
    if (!generatedProject) return

    console.log("Creating project with data:", generatedProject)

    try {
      // Create the project first and get the ID
      const projectData = {
        title: generatedProject.title,
        description: generatedProject.description,
        status: "Planning",
        priority: generatedProject.priority || "Medium",
        estimatedCost: generatedProject.estimatedCost || 0,
        estimatedHours: generatedProject.estimatedHours || 0,
      }

      const projectId = await addProject(projectData)
      console.log("Created project with ID:", projectId)

      // Ensure projectId is a number (not void/undefined)
      const validProjectId = typeof projectId === "number" ? projectId : Number(projectId)
      for (const taskData of generatedProject.tasks) {
        const task = {
          projectId: validProjectId,
          title: taskData.title || `Task ${generatedProject.tasks.indexOf(taskData) + 1}`,
          description: taskData.description || "",
          status: "Todo",
          priority: taskData.priority || "Medium",
          estimatedHours: taskData.estimatedHours || 1,
          estimatedCost: taskData.estimatedCost || 0,
          materialsNeeded: Array.isArray(taskData.materials)
            ? taskData.materials.join(", ")
            : taskData.materialsNeeded || "",
        }

        console.log("Adding task:", task)
        await addTask(task)
      }

      handleClose()
    } catch (error) {
      console.error("Error creating generated project:", error)
      setError("Failed to create project")
    }
  }

  function SafeTabsContent({ value, children, ...props }: any) {
    if (typeof value === "undefined") return null;
    return <TabsContent value={value} {...props}>{children}</TabsContent>;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Add New Project
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              AI Generate
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh] mt-4">
            <SafeTabsContent value="manual" className="space-y-4">
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Project Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter project title"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
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
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the project scope and objectives"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="estimatedCost">Estimated Cost ($)</Label>
                    <Input
                      id="estimatedCost"
                      type="number"
                      value={formData.estimatedCost}
                      onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="estimatedHours">Estimated Hours</Label>
                    <Input
                      id="estimatedHours"
                      type="number"
                      value={formData.estimatedHours}
                      onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="property">Property (Optional)</Label>
                    <Select
                      value={formData.propertyId}
                      onValueChange={(value) => setFormData({ ...formData, propertyId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select property" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Property</SelectItem>
                        {properties?.map((property) => (
                          <SelectItem key={property.id} value={property.id.toString()}>
                            {property.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Project</Button>
                </div>
              </form>
            </SafeTabsContent>

            <SafeTabsContent value="ai" className="space-y-4">
              {!generatedProject ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="aiDescription">Project Description</Label>
                    <Textarea
                      id="aiDescription"
                      value={aiDescription}
                      onChange={(e) => setAiDescription(e.target.value)}
                      placeholder="Describe what you want to accomplish. Be specific about the scope, requirements, and any constraints. For example: 'Replace timing chain on 2018 VW Tiguan with P0016 code, including tensioner and guides, budget $800'"
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  <div>
                    <Label htmlFor="projectType">Project Type</Label>
                    <Select value={projectType} onValueChange={setProjectType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Project</SelectItem>
                        <SelectItem value="automotive">Automotive Repair</SelectItem>
                        <SelectItem value="home-improvement">Home Improvement</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="renovation">Renovation</SelectItem>
                        <SelectItem value="landscaping">Landscaping</SelectItem>
                        <SelectItem value="electrical">Electrical Work</SelectItem>
                        <SelectItem value="plumbing">Plumbing</SelectItem>
                        <SelectItem value="hvac">HVAC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  )}

                  <Button
                    onClick={handleAIGenerate}
                    disabled={isGenerating || !aiDescription.trim()}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating Project Plan...
                      </>
                    ) : (
                      <>
                        <Bot className="h-4 w-4 mr-2" />
                        <Zap className="h-4 w-4 mr-2" />
                        Generate Project with AI
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Generated Project Plan
                    </h3>
                    <Button variant="outline" onClick={() => setGeneratedProject(null)}>
                      Generate New
                    </Button>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>{generatedProject.title}</CardTitle>
                      <CardDescription>{generatedProject.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <DollarSign className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                          <p className="font-semibold">${generatedProject.estimatedCost || 0}</p>
                          <p className="text-xs text-muted-foreground">Estimated Cost</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <Clock className="h-5 w-5 mx-auto mb-1 text-green-600" />
                          <p className="font-semibold">{generatedProject.estimatedHours || 0}h</p>
                          <p className="text-xs text-muted-foreground">Estimated Time</p>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <Badge variant="outline">{generatedProject.priority || "Medium"}</Badge>
                          <p className="text-xs text-muted-foreground mt-1">Priority</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <p className="font-semibold">{generatedProject.tasks?.length || 0}</p>
                          <p className="text-xs text-muted-foreground">Tasks</p>
                        </div>
                      </div>

                      {generatedProject.tasks && generatedProject.tasks.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Tasks Overview:</h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {generatedProject.tasks.map((task: any, index: number) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="text-sm">{task.title}</span>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {task.estimatedHours || 1}h
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    ${task.estimatedCost || 0}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {generatedProject.materials && generatedProject.materials.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Materials Needed:</h4>
                          <div className="flex flex-wrap gap-1">
                            {generatedProject.materials.map((material: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {material}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {generatedProject.safetyNotes && generatedProject.safetyNotes.length > 0 && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4" />
                            Safety Notes:
                          </h4>
                          <ul className="text-sm text-red-700 space-y-1">
                            {generatedProject.safetyNotes.map((note: string, index: number) => (
                              <li key={index}>• {note}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button onClick={handleAcceptGenerated} className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Create This Project
                    </Button>
                  </div>
                </div>
              )}
            </SafeTabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
