"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAzureData } from "@/lib/data-store-azure"
import { Calendar, DollarSign, MapPin, User, Wrench, Clock, AlertTriangle, CheckCircle, XCircle } from "lucide-react"

interface Repair {
  id: number
  propertyId: number
  unitId?: number
  title: string
  description: string
  category: string
  priority: "Low" | "Medium" | "High" | "Emergency"
  status: "Open" | "In Progress" | "Completed" | "Cancelled"
  reportedDate: string
  scheduledDate?: string
  completedDate?: string
  estimatedCost: number
  actualCost?: number
  assignedTo?: string
  tenantReported: boolean
  images?: string[]
  notes?: string
}

interface RepairDetailModalProps {
  repair: Repair | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RepairDetailModal({ repair, open, onOpenChange }: RepairDetailModalProps) {
  const { updateRepair, deleteRepair, properties } = useAzureData()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<Repair>>({})

  if (!repair) return null

  const property = properties.find((p) => p.id === repair.propertyId)

  const handleEdit = () => {
    setFormData(repair)
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (formData.id) {
      await updateRepair(formData.id, formData)
      setIsEditing(false)
    }
  }

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this repair?")) {
      await deleteRepair(repair.id)
      onOpenChange(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Emergency":
        return "bg-red-100 text-red-800"
      case "High":
        return "bg-orange-100 text-orange-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "Low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800"
      case "In Progress":
        return "bg-blue-100 text-blue-800"
      case "Open":
        return "bg-yellow-100 text-yellow-800"
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
      case "Open":
        return <AlertTriangle className="h-4 w-4" />
      case "Cancelled":
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">{repair.title}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{property?.name || "Unknown Property"}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getPriorityColor(repair.priority)}>{repair.priority}</Badge>
              <Badge className={getStatusColor(repair.status)}>
                {getStatusIcon(repair.status)}
                <span className="ml-1">{repair.status}</span>
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {isEditing ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title || ""}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category || ""}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Plumbing">Plumbing</SelectItem>
                    <SelectItem value="Electrical">Electrical</SelectItem>
                    <SelectItem value="HVAC">HVAC</SelectItem>
                    <SelectItem value="Appliance">Appliance</SelectItem>
                    <SelectItem value="Structural">Structural</SelectItem>
                    <SelectItem value="Cosmetic">Cosmetic</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority || ""}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as Repair["priority"] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
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
                <Select
                  value={formData.status || ""}
                  onValueChange={(value) => setFormData({ ...formData, status: value as Repair["status"] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="estimatedCost">Estimated Cost</Label>
                <Input
                  id="estimatedCost"
                  type="number"
                  step="0.01"
                  value={formData.estimatedCost || ""}
                  onChange={(e) => setFormData({ ...formData, estimatedCost: Number.parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="actualCost">Actual Cost</Label>
                <Input
                  id="actualCost"
                  type="number"
                  step="0.01"
                  value={formData.actualCost || ""}
                  onChange={(e) => setFormData({ ...formData, actualCost: Number.parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="assignedTo">Assigned To</Label>
                <Input
                  id="assignedTo"
                  value={formData.assignedTo || ""}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="scheduledDate">Scheduled Date</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={formData.scheduledDate || ""}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSave}>Save Changes</Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Repair Images */}
            {repair.images && repair.images.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {repair.images.map((image, index) => (
                      <div key={index} className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={image || "/placeholder.svg"}
                          alt={`Repair image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Repair Details */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    Repair Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                    <p className="mt-1">{repair.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                      <p className="mt-1 font-medium">{repair.category}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Reported By</Label>
                      <p className="mt-1 font-medium">{repair.tenantReported ? "Tenant" : "Property Manager"}</p>
                    </div>
                  </div>
                  {repair.assignedTo && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Assigned To</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{repair.assignedTo}</span>
                      </div>
                    </div>
                  )}
                  {repair.notes && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                      <p className="mt-1">{repair.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Timeline & Costs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Reported Date</Label>
                      <p className="mt-1 font-medium">{formatDate(repair.reportedDate)}</p>
                    </div>
                    {repair.scheduledDate && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Scheduled Date</Label>
                        <p className="mt-1 font-medium">{formatDate(repair.scheduledDate)}</p>
                      </div>
                    )}
                    {repair.completedDate && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Completed Date</Label>
                        <p className="mt-1 font-medium">{formatDate(repair.completedDate)}</p>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Estimated Cost</Label>
                      <div className="flex items-center gap-1 mt-1">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-medium">{formatCurrency(repair.estimatedCost)}</span>
                      </div>
                    </div>
                    {repair.actualCost && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Actual Cost</Label>
                        <div className="flex items-center gap-1 mt-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-medium">{formatCurrency(repair.actualCost)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  {repair.actualCost && repair.actualCost !== repair.estimatedCost && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Cost Variance</Label>
                      <p
                        className={`mt-1 font-medium ${
                          repair.actualCost > repair.estimatedCost ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {repair.actualCost > repair.estimatedCost ? "+" : ""}
                        {formatCurrency(repair.actualCost - repair.estimatedCost)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleEdit}>Edit Repair</Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete Repair
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
