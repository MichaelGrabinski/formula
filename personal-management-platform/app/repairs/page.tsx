"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Calendar, Search, Wrench, AlertTriangle, Clock, CheckCircle } from "lucide-react"
import { useAzureData } from "@/lib/data-store-azure"
import { RepairDetailModal } from "@/components/repair-detail-modal"
import { AddRepairModal } from "@/components/add-repair-modal"
import { RepairScheduleModal } from "@/components/repair-schedule-modal"

export default function RepairsPage() {
  const { repairs, units, properties } = useAzureData()
  const [selectedRepair, setSelectedRepair] = useState<number | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [priorityFilter, setPriorityFilter] = useState("All")

  const getPropertyAndUnit = (unitId: number) => {
    const unit = units.find((u) => u.id === unitId)
    const property = properties.find((p) => p.id === unit?.propertyId)
    return {
      propertyName: property?.name || "Unknown Property",
      unitNumber: unit?.unitNumber || "Unknown Unit",
    }
  }

  const filteredRepairs = repairs.filter((repair) => {
    const { propertyName } = getPropertyAndUnit(repair.unitId || 0)
    const matchesSearch =
      repair.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      propertyName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "All" || repair.status === statusFilter
    const matchesPriority = priorityFilter === "All" || repair.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

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
      case "Open":
        return "bg-blue-100 text-blue-800"
      case "Scheduled":
        return "bg-purple-100 text-purple-800"
      case "In Progress":
        return "bg-orange-100 text-orange-800"
      case "Completed":
        return "bg-green-100 text-green-800"
      case "Cancelled":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  // Calculate summary stats
  const openRepairs = repairs.filter((r) => r.status === "Open").length
  const inProgressRepairs = repairs.filter((r) => r.status === "In Progress").length
  const scheduledRepairs = repairs.filter((r) => r.status === "Scheduled").length
  const completedThisMonth = repairs.filter((r) => {
    if (!r.completedDate) return false
    const completed = new Date(r.completedDate)
    const now = new Date()
    return completed.getMonth() === now.getMonth() && completed.getFullYear() === now.getFullYear()
  }).length

  const selectedRepairData = selectedRepair ? repairs.find((r) => r.id === selectedRepair) : null

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white">
        <h1 className="text-xl font-semibold">Repairs & Maintenance</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowScheduleModal(true)}>
            <Calendar className="h-4 w-4 mr-2" />
            Schedule
          </Button>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </div>
      </header>

      <main className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Maintenance Overview</h2>
            <p className="text-muted-foreground">Track and manage property repairs and maintenance</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{openRepairs}</div>
              <p className="text-xs text-muted-foreground">Awaiting attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Wrench className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{inProgressRepairs}</div>
              <p className="text-xs text-muted-foreground">Currently being worked on</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{scheduledRepairs}</div>
              <p className="text-xs text-muted-foreground">Appointments set</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed This Month</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedThisMonth}</div>
              <p className="text-xs text-muted-foreground">Finished repairs</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search repairs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="Scheduled">Scheduled</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Priority</SelectItem>
              <SelectItem value="Emergency">Emergency</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Repair Tickets */}
        <div className="grid gap-4">
          {filteredRepairs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Repair Tickets</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm || statusFilter !== "All" || priorityFilter !== "All"
                    ? "No repairs match your current filters."
                    : "Get started by creating your first repair ticket."}
                </p>
                {!searchTerm && statusFilter === "All" && priorityFilter === "All" && (
                  <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Ticket
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredRepairs.map((repair) => {
              const { propertyName, unitNumber } = getPropertyAndUnit(repair.unitId || 0)

              return (
                <Card
                  key={repair.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedRepair(repair.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{repair.title}</h3>
                          <Badge className={getPriorityColor(repair.priority)}>{repair.priority}</Badge>
                          <Badge className={getStatusColor(repair.status)}>{repair.status}</Badge>
                        </div>

                        <p className="text-sm text-muted-foreground mb-2">
                          {propertyName} - Unit {unitNumber}
                        </p>

                        <p className="text-sm mb-3">{repair.description}</p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Reported: {repair.scheduledDate ? formatDate(repair.scheduledDate) : "N/A"}</span>
                          {repair.scheduledDate && <span>Scheduled: {formatDate(repair.scheduledDate)}</span>}
                          {repair.contractor && <span>Assigned to: {repair.contractor}</span>}
                          <span>Category: {repair.category}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-medium">Est: {formatCurrency(repair.cost || 0)}</div>
                        {repair.cost && (
                          <div className="text-sm text-muted-foreground">Actual: {formatCurrency(repair.cost)}</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* Modals */}
        {selectedRepairData && (
          <RepairDetailModal repair={selectedRepairData} onClose={() => setSelectedRepair(null)} />
        )}

        {showAddModal && <AddRepairModal onClose={() => setShowAddModal(false)} />}

        {showScheduleModal && <RepairScheduleModal onClose={() => setShowScheduleModal(false)} />}
      </main>
    </div>
  )
}
