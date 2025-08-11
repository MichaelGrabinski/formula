"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useAzureData, type Property } from "@/lib/data-store-azure"
import { X, Edit, Save, Plus, Trash2, Users, DollarSign, Home, Calendar } from "lucide-react"

interface PropertyDetailModalProps {
  property: Property
  onClose: () => void
}

export function PropertyDetailModal({ property, onClose }: PropertyDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "financial" | "tenants">("overview")
  const [isEditing, setIsEditing] = useState(false)
  const [editedProperty, setEditedProperty] = useState(property)
  const { updateProperty, deleteProperty, units, tenants } = useAzureData()

  // Calculate occupied units for this property
  const propertyUnits = units.filter((u) => u.propertyId === property.id)
  const occupiedUnits = propertyUnits.filter((u) => u.isOccupied).length
  const totalUnits = propertyUnits.length

  // Calculate monthly income for this property
  const monthlyIncome = propertyUnits.reduce((sum, u) => sum + (u.monthlyRent || 0), 0)

  const handleSave = () => {
    updateProperty(property.id, editedProperty)
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this property? This action cannot be undone.")) {
      deleteProperty(property.id)
      onClose()
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const calculateROI = () => {
    const monthlyProfit = monthlyIncome - monthlyIncome * 0.3 // Assuming 30% expenses
    const annualProfit = monthlyProfit * 12
    const roi = (annualProfit / property.purchasePrice) * 100
    return roi.toFixed(1)
  }

  const calculateEquity = () => {
    return property.currentValue - property.purchasePrice
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {isEditing ? (
                <Input
                  value={editedProperty.name}
                  onChange={(e) => setEditedProperty({ ...editedProperty, name: e.target.value })}
                  className="text-xl font-semibold"
                />
              ) : (
                <CardTitle className="text-xl">{property.name}</CardTitle>
              )}
              {isEditing ? (
                <Textarea
                  value={editedProperty.address}
                  onChange={(e) => setEditedProperty({ ...editedProperty, address: e.target.value })}
                  className="mt-1 text-sm"
                />
              ) : (
                <p className="text-sm text-muted-foreground mt-1">{property.address}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{property.type}</Badge>
                <Badge className="bg-green-100 text-green-800">
                  {occupiedUnits}/{totalUnits} Units Occupied
                </Badge>
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

          <div className="flex gap-2 mt-4">
            <Button
              variant={activeTab === "overview" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </Button>
            <Button
              variant={activeTab === "financial" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("financial")}
            >
              Financial
            </Button>
            <Button
              variant={activeTab === "tenants" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("tenants")}
            >
              Tenants ({occupiedUnits})
            </Button>
          </div>
        </CardHeader>

        <CardContent className="overflow-y-auto max-h-[60vh]">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <Home className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                  <p className="text-sm text-muted-foreground">Total Units</p>
                  <p className="font-bold">{totalUnits}</p>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <Users className="h-6 w-6 mx-auto mb-1 text-green-500" />
                  <p className="text-sm text-muted-foreground">Occupied</p>
                  <p className="font-bold">{occupiedUnits}</p>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <DollarSign className="h-6 w-6 mx-auto mb-1 text-green-500" />
                  <p className="text-sm text-muted-foreground">Monthly Income</p>
                  <p className="font-bold">{formatCurrency(monthlyIncome)}</p>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <Calendar className="h-6 w-6 mx-auto mb-1 text-purple-500" />
                  <p className="text-sm text-muted-foreground">ROI</p>
                  <p className="font-bold">{calculateROI()}%</p>
                </div>
              </div>

              {/* Property Details */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Property Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Property Type:</span>
                      {isEditing ? (
                        <Select
                          value={editedProperty.type}
                          onValueChange={(value) => setEditedProperty({ ...editedProperty, type: value })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Single Family">Single Family</SelectItem>
                            <SelectItem value="Duplex">Duplex</SelectItem>
                            <SelectItem value="Multi-Family">Multi-Family</SelectItem>
                            <SelectItem value="Apartment">Apartment</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="font-medium">{property.type}</span>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Purchase Date:</span>
                      <span className="font-medium">{new Date(property.purchaseDate).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Financial Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Purchase Price:</span>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editedProperty.purchasePrice}
                          onChange={(e) =>
                            setEditedProperty({ ...editedProperty, purchasePrice: Number.parseFloat(e.target.value) })
                          }
                          className="w-32 h-8"
                        />
                      ) : (
                        <span className="font-medium">{formatCurrency(property.purchasePrice)}</span>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Value:</span>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editedProperty.currentValue}
                          onChange={(e) =>
                            setEditedProperty({ ...editedProperty, currentValue: Number.parseFloat(e.target.value) })
                          }
                          className="w-32 h-8"
                        />
                      ) : (
                        <span className="font-medium">{formatCurrency(property.currentValue)}</span>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Equity:</span>
                      <span className="font-medium text-green-600">{formatCurrency(calculateEquity())}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Danger Zone */}
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-base text-red-600">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="destructive" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Property
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    This action cannot be undone. This will permanently delete the property and all associated data.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "financial" && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Monthly Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Gross Income:</span>
                        <span className="font-medium">{formatCurrency(monthlyIncome)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Est. Expenses (30%):</span>
                        <span className="font-medium text-red-600">
                          -{formatCurrency(monthlyIncome * 0.3)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-medium">Net Income:</span>
                        <span className="font-bold text-green-600">{formatCurrency(monthlyIncome * 0.7)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Annual Projection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Gross Income:</span>
                        <span className="font-medium">{formatCurrency(monthlyIncome * 12)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Est. Expenses:</span>
                        <span className="font-medium text-red-600">
                          -{formatCurrency(monthlyIncome * 12 * 0.3)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-medium">Net Income:</span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(monthlyIncome * 12 * 0.7)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Investment Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">ROI:</span>
                        <span className="font-medium">{calculateROI()}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Cap Rate:</span>
                        <span className="font-medium">
                          {(((monthlyIncome * 12) / property.currentValue) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Appreciation:</span>
                        <span className="font-medium text-green-600">
                          {(((property.currentValue - property.purchasePrice) / property.purchasePrice) * 100).toFixed(
                            1,
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "tenants" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Tenant Management</h3>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Tenant
                </Button>
              </div>

              <div className="grid gap-4">
                {Array.from({ length: occupiedUnits }, (_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Unit {i + 1}</h4>
                          <p className="text-sm text-muted-foreground">Sample Tenant {i + 1}</p>
                          <p className="text-sm text-muted-foreground">Lease: Jan 2024 - Dec 2024</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(monthlyIncome / totalUnits)}/month</p>
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {totalUnits - occupiedUnits > 0 && (
                  <Card className="border-dashed">
                    <CardContent className="p-4 text-center">
                      <p className="text-muted-foreground">{totalUnits - occupiedUnits} vacant unit(s)</p>
                      <Button size="sm" className="mt-2">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Tenant
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
