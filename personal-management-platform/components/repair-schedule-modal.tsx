"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAzureData } from "@/lib/data-store-azure"
import { X, Calendar, Clock, MapPin } from "lucide-react"

interface RepairScheduleModalProps {
  onClose: () => void
}

export function RepairScheduleModal({ onClose }: RepairScheduleModalProps) {
  const { repairs, units, properties } = useAzureData()

  const scheduledRepairs = repairs
    .filter((repair: any) => repair.scheduledDate)
    .sort((a: any, b: any) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime())

  const getPropertyAndUnit = (unitId: number) => {
    const unit = units.find((u: any) => u.id === unitId)
    const property = properties.find((p: any) => p.id === unit?.propertyId)
    return {
      propertyName: property?.name || "Unknown Property",
      unitNumber: unit?.unitNumber || "Unknown Unit",
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
      case "Scheduled":
        return "bg-purple-100 text-purple-800"
      case "In Progress":
        return "bg-orange-100 text-orange-800"
      case "Completed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const groupRepairsByDate = () => {
    const grouped: { [key: string]: typeof scheduledRepairs } = {}

    scheduledRepairs.forEach((repair: any) => {
      const dateKey = repair.scheduledDate!
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(repair)
    })

    return grouped
  }

  const groupedRepairs = groupRepairsByDate()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Repair Schedule
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">{scheduledRepairs.length} scheduled repairs</p>
        </CardHeader>
        <CardContent>
          {Object.keys(groupedRepairs).length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Scheduled Repairs</h3>
              <p className="text-muted-foreground">
                Schedule repairs by editing existing tickets or creating new ones.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedRepairs).map(([date, repairs]) => (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium">{formatDate(date)}</h3>
                    <Badge variant="outline">
                      {repairs.length} repair{repairs.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>

                  <div className="grid gap-3 ml-6">
                    {repairs.map((repair) => {
                      const { propertyName, unitNumber } = getPropertyAndUnit(repair.unitId)

                      return (
                        <Card key={repair.id} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium">{repair.title}</h4>
                                  <Badge className={getPriorityColor(repair.priority)}>{repair.priority}</Badge>
                                  <Badge className={getStatusColor(repair.status)}>{repair.status}</Badge>
                                </div>

                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {propertyName} - Unit {unitNumber}
                                  </div>
                                  {repair.assignedTo && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {repair.assignedTo}
                                    </div>
                                  )}
                                </div>

                                <p className="text-sm text-muted-foreground">{repair.description}</p>

                                {repair.estimatedCost > 0 && (
                                  <p className="text-sm font-medium mt-2">
                                    Estimated Cost: ${repair.estimatedCost.toFixed(2)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
