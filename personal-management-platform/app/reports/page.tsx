"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useAzureData } from "@/lib/data-store-azure"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { Download, TrendingUp, DollarSign, Calendar, Home, Wrench, Target, AlertTriangle } from "lucide-react"

export default function ReportsPage() {
  const { properties, projects, tasks, repairs, assets } = useAzureData()
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [selectedProperty, setSelectedProperty] = useState("all")

  // Helper functions to calculate totals
  const getTotalPropertyValue = () => {
    return properties.reduce((sum, property) => sum + (property.currentValue || property.value || 0), 0)
  }

  const getTotalProjectCost = () => {
    return projects.reduce((sum, project) => sum + (project.estimatedCost || 0), 0)
  }

  const getCompletedProjects = () => {
    return projects.filter((project) => project.status === "Completed").length
  }

  const getActiveRepairs = () => {
    return repairs.filter((repair) => repair.status === "In Progress" || repair.status === "Scheduled").length
  }

  const getOverdueRepairs = () => {
    const today = new Date()
    return repairs.filter((repair) => {
      if (!repair.scheduledDate) return false
      const scheduledDate = new Date(repair.scheduledDate)
      return scheduledDate < today && repair.status !== "Completed"
    }).length
  }

  // Sample data for charts
  const monthlyData = [
    { month: "Jan", income: 4800, expenses: 1200, profit: 3600 },
    { month: "Feb", income: 4800, expenses: 800, profit: 4000 },
    { month: "Mar", income: 4800, expenses: 2100, profit: 2700 },
    { month: "Apr", income: 4800, expenses: 950, profit: 3850 },
    { month: "May", income: 4800, expenses: 1400, profit: 3400 },
    { month: "Jun", income: 4800, expenses: 1100, profit: 3700 },
  ]

  const expenseCategories = [
    { name: "Maintenance", value: 2400, color: "#8884d8" },
    { name: "Insurance", value: 1200, color: "#82ca9d" },
    { name: "Property Tax", value: 1800, color: "#ffc658" },
    { name: "Utilities", value: 600, color: "#ff7300" },
    { name: "Other", value: 400, color: "#00ff00" },
  ]

  const propertyPerformance = properties.map((property) => ({
    name: property.name,
    value: property.currentValue || property.value || 0,
    rent: property.monthlyRent || 0,
    roi: property.monthlyRent
      ? ((property.monthlyRent * 12) / (property.currentValue || property.value || 1)) * 100
      : 0,
  }))

  const projectStatus = [
    { name: "Completed", value: projects.filter((p) => p.status === "Completed").length, color: "#22c55e" },
    { name: "In Progress", value: projects.filter((p) => p.status === "In Progress").length, color: "#3b82f6" },
    { name: "Planning", value: projects.filter((p) => p.status === "Planning").length, color: "#f59e0b" },
    { name: "On Hold", value: projects.filter((p) => p.status === "On Hold").length, color: "#ef4444" },
  ]

  const handleExportReport = (reportType: string) => {
    console.log(`Exporting ${reportType} report...`)
    // TODO: Implement actual export functionality
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Comprehensive insights into your property portfolio</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedProperty} onValueChange={setSelectedProperty}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id.toString()}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Portfolio Value</p>
                <p className="text-2xl font-bold">${getTotalPropertyValue().toLocaleString()}</p>
              </div>
              <Home className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">+5.2% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Project Investments</p>
                <p className="text-2xl font-bold">${getTotalProjectCost().toLocaleString()}</p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
            <div className="flex items-center mt-2">
              <span className="text-sm text-muted-foreground">{getCompletedProjects()} projects completed</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Repairs</p>
                <p className="text-2xl font-bold">{getActiveRepairs()}</p>
              </div>
              <Wrench className="h-8 w-8 text-orange-600" />
            </div>
            <div className="flex items-center mt-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mr-1" />
              <span className="text-sm text-red-600">{getOverdueRepairs()} overdue</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Net Income</p>
                <p className="text-2xl font-bold">$3,700</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">+8.1% from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <Tabs defaultValue="financial" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="property">Property</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Income vs Expenses</CardTitle>
                <CardDescription>Track your cash flow over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="income" fill="#22c55e" name="Income" />
                    <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
                <CardDescription>Where your money is going</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expenseCategories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expenseCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Profit Trend</CardTitle>
                  <CardDescription>Monthly profit over time</CardDescription>
                </div>
                <Button onClick={() => handleExportReport("financial")} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="profit" stroke="#8884d8" strokeWidth={2} name="Profit" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="property" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Property Performance</CardTitle>
                <CardDescription>Value and rental income by property</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={propertyPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#3b82f6" name="Property Value" />
                    <Bar dataKey="rent" fill="#22c55e" name="Monthly Rent" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ROI Analysis</CardTitle>
                <CardDescription>Return on investment by property</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {propertyPerformance.map((property, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{property.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ${property.value.toLocaleString()} • ${property.rent}/month
                        </p>
                      </div>
                      <Badge variant={property.roi > 8 ? "default" : property.roi > 5 ? "secondary" : "destructive"}>
                        {property.roi.toFixed(1)}% ROI
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Status Overview</CardTitle>
                <CardDescription>Current status of all projects</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={projectStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {projectStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Budget Analysis</CardTitle>
                <CardDescription>Budget vs actual costs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects.slice(0, 5).map((project, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{project.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Budget: ${(project.estimatedCost || 0).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={project.status === "Completed" ? "default" : "secondary"}>{project.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Project Timeline</CardTitle>
                  <CardDescription>Project completion over time</CardDescription>
                </div>
                <Button onClick={() => handleExportReport("projects")} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {projects.map((project, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{project.title}</p>
                      <p className="text-sm text-muted-foreground">{project.description}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={project.status === "Completed" ? "default" : "secondary"}>{project.status}</Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        ${(project.estimatedCost || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Repair Status</CardTitle>
                <CardDescription>Current status of all repairs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {repairs.slice(0, 5).map((repair, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{repair.title}</p>
                        <p className="text-sm text-muted-foreground">{repair.description}</p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            repair.status === "Completed"
                              ? "default"
                              : repair.status === "In Progress"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {repair.status}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          ${(repair.estimatedCost || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Maintenance Schedule</CardTitle>
                <CardDescription>Upcoming maintenance tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {repairs
                    .filter((repair) => repair.scheduledDate)
                    .slice(0, 5)
                    .map((repair, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <div className="flex-1">
                          <p className="font-medium">{repair.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {repair.scheduledDate ? new Date(repair.scheduledDate).toLocaleDateString() : "No date set"}
                          </p>
                        </div>
                        <Badge variant={repair.priority === "High" ? "destructive" : "secondary"}>
                          {repair.priority}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Maintenance Costs</CardTitle>
                  <CardDescription>Monthly maintenance expenses</CardDescription>
                </div>
                <Button onClick={() => handleExportReport("maintenance")} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="expenses" fill="#ef4444" name="Maintenance Costs" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
