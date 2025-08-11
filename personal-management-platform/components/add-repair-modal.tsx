"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAzureData } from "@/lib/data-store-azure"
import { X, Plus } from "lucide-react"

interface AddRepairModalProps {
  onClose: () => void
}

export function AddRepairModal({ onClose }: AddRepairModalProps) {
  const [formData, setFormData] = useState({
    itemType: "unit", // new: 'property', 'unit', or 'asset'
    itemId: 0, // new: id of selected item
    title: "",
    description: "",
    priority: "Medium",
    status: "Open",
    reportedBy: "",
    assignedTo: "",
    estimatedCost: 0,
    reportedDate: new Date().toISOString().split("T")[0],
    scheduledDate: "",
    category: "Other",
  })

  const { addRepair, units, properties, assets } = useAzureData()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.itemId === 0) {
      alert("Please select an item")
      return
    }
    // Compose repair object for Azure
    const repair: any = {
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      status: formData.status,
      reportedBy: formData.reportedBy,
      assignedTo: formData.assignedTo || undefined,
      estimatedCost: formData.estimatedCost,
      reportedDate: formData.reportedDate,
      scheduledDate: formData.scheduledDate || undefined,
      category: formData.category,
    }
    if (formData.itemType === "property") repair.propertyId = formData.itemId
    if (formData.itemType === "unit") repair.unitId = formData.itemId
    if (formData.itemType === "asset") repair.assetId = formData.itemId
    await addRepair(repair)
    onClose()
  }

  const getPropertyName = (unitId: number) => {
    const unit = units.find((u) => u.id === unitId)
    const property = properties.find((p) => p.id === unit?.propertyId)
    return property?.name || "Unknown Property"
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              New Repair Ticket
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="itemType">Type</Label>
                <Select
                  value={formData.itemType}
                  onValueChange={(value) => setFormData({ ...formData, itemType: value, itemId: 0 })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="property">Property</SelectItem>
                    <SelectItem value="unit">Unit</SelectItem>
                    <SelectItem value="asset">Asset</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="itemId">Select</Label>
                <Select
                  value={formData.itemId.toString()}
                  onValueChange={(value) => setFormData({ ...formData, itemId: Number.parseInt(value) })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select a ${formData.itemType}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.itemType === "property" && properties.map((property) => (
                      <SelectItem key={property.id} value={property.id.toString()}>
                        {property.name}
                      </SelectItem>
                    ))}
                    {formData.itemType === "unit" && units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id.toString()}>
                        {properties.find((p) => p.id === unit.propertyId)?.name || "Unknown Property"} - Unit {unit.unitNumber}
                      </SelectItem>
                    ))}
                    {formData.itemType === "asset" && assets.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id.toString()}>
                        {asset.name} ({asset.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief description of the issue"
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Plumbing">Plumbing</SelectItem>
                    <SelectItem value="Electrical">Electrical</SelectItem>
                    <SelectItem value="HVAC">HVAC</SelectItem>
                    <SelectItem value="Appliances">Appliances</SelectItem>
                    <SelectItem value="Flooring">Flooring</SelectItem>
                    <SelectItem value="Painting">Painting</SelectItem>
                    <SelectItem value="Roofing">Roofing</SelectItem>
                    <SelectItem value="Windows/Doors">Windows/Doors</SelectItem>
                    <SelectItem value="Landscaping">Landscaping</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
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
                placeholder="Detailed description of the repair needed"
                rows={3}
                required
                className="resize-y min-h-[80px] max-h-[320px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                    <SelectItem value="Emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reportedBy">Reported By</Label>
                <Input
                  id="reportedBy"
                  value={formData.reportedBy}
                  onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
                  placeholder="Tenant name or Property Manager"
                  required
                />
              </div>
              <div>
                <Label htmlFor="assignedTo">Assigned To (Optional)</Label>
                <Input
                  id="assignedTo"
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  placeholder="Contractor or maintenance person"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estimatedCost">Estimated Cost ($)</Label>
                <Input
                  id="estimatedCost"
                  type="number"
                  step="0.01"
                  value={formData.estimatedCost}
                  onChange={(e) => setFormData({ ...formData, estimatedCost: Number.parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="scheduledDate">Scheduled Date (Optional)</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Create Repair Ticket</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
