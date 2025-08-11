"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAzureData } from "@/lib/data-store-azure"
import { useToast } from "@/hooks/use-toast"
import { Plus } from "lucide-react"

export function QuickAddForm() {
  const [type, setType] = useState<string>("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("medium")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { addTask, addRepair } = useAzureData()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!type || !title) return

    setIsSubmitting(true)
    try {
      if (type === "task") {
        await addTask({
          title,
          description,
          status: "pending",
          priority: priority as "low" | "medium" | "high",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
          projectId: 1, // Default project
        })
      } else if (type === "repair") {
        await addRepair({
          title,
          description,
          status: "pending",
          priority: priority as "low" | "medium" | "high",
          propertyId: 1, // Default property
          estimatedCost: 0,
        })
      }

      toast({
        title: "Success",
        description: `${type === "task" ? "Task" : "Repair"} added successfully`,
      })

      // Reset form
      setTitle("")
      setDescription("")
      setPriority("medium")
      setType("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Quick Add
        </CardTitle>
        <CardDescription>Quickly add a new task or repair</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="task">Task</SelectItem>
                <SelectItem value="repair">Repair</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={!type || !title || isSubmitting} className="w-full">
            {isSubmitting ? "Adding..." : `Add ${type === "task" ? "Task" : "Repair"}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
