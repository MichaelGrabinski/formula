"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAzureData } from "@/lib/data-store-azure"
import { Plus, Edit, Trash2, Users, Home, DollarSign, Calendar, Phone, Mail } from "lucide-react"

export function UnitManagementModal({ property, open, onOpenChange }) {
  const {
    units = [],
    tenants = [],
    addUnit,
    updateUnit,
    deleteUnit,
    addTenant,
    updateTenant,
    deleteTenant,
  } = useAzureData()

  const [showAddUnit, setShowAddUnit] = useState(false)
  const [showAddTenant, setShowAddTenant] = useState(false)
  const [editingUnit, setEditingUnit] = useState(null)
  const [editingTenant, setEditingTenant] = useState(null)
  const [selectedUnit, setSelectedUnit] = useState(null)

  // Get units and tenants for this property
  const propertyUnits = units.filter((unit) => unit.propertyId === property?.id)
  const propertyTenants = tenants.filter((tenant) => tenant.propertyId === property?.id)

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0)
  }

  if (!property) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Manage Units - {property.name}
          </DialogTitle>
          <DialogDescription>Manage units and tenants for this property</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="units" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="units">Units ({propertyUnits.length})</TabsTrigger>
            <TabsTrigger value="tenants">Tenants ({propertyTenants.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="units" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Property Units</h3>
              <Button onClick={() => setShowAddUnit(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Unit
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {propertyUnits.map((unit) => (
                <Card key={unit.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Unit {unit.unitNumber}</CardTitle>
                      <Badge variant={unit.isOccupied ? "default" : "secondary"}>
                        {unit.isOccupied ? "Occupied" : "Vacant"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Bedrooms: {unit.bedrooms}</div>
                      <div>Bathrooms: {unit.bathrooms}</div>
                      <div>Sq Ft: {unit.squareFeet?.toLocaleString()}</div>
                      <div>Rent: {formatCurrency(unit.monthlyRent)}</div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingUnit(unit)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        {!unit.isOccupied && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUnit(unit)
                              setShowAddTenant(true)
                            }}
                          >
                            <Users className="h-4 w-4 mr-1" />
                            Add Tenant
                          </Button>
                        )}
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Unit</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete Unit {unit.unitNumber}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteUnit(unit.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {propertyUnits.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Home className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Units Added</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Add units to track individual rental spaces in this property.
                  </p>
                  <Button onClick={() => setShowAddUnit(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Unit
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tenants" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Property Tenants</h3>
              <Button onClick={() => setShowAddTenant(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Tenant
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {propertyTenants.map((tenant) => {
                const tenantUnit = propertyUnits.find((unit) => unit.id === tenant.unitId)
                return (
                  <Card key={tenant.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {tenant.firstName} {tenant.lastName}
                        </CardTitle>
                        <Badge variant={tenant.isActive ? "default" : "secondary"}>
                          {tenant.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {tenantUnit && <CardDescription>Unit {tenantUnit.unitNumber}</CardDescription>}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{tenant.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{tenant.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>{formatCurrency(tenant.monthlyRent)}/month</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {tenant.leaseStart} - {tenant.leaseEnd}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <Button variant="outline" size="sm" onClick={() => setEditingTenant(tenant)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Tenant</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove {tenant.firstName} {tenant.lastName}? This action cannot
                                be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteTenant(tenant.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {propertyTenants.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Tenants Added</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Add tenants to track lease information and rental income.
                  </p>
                  <Button onClick={() => setShowAddTenant(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Tenant
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Add/Edit Unit Modal */}
        <UnitFormModal
          open={showAddUnit || !!editingUnit}
          onOpenChange={(open) => {
            setShowAddUnit(open)
            if (!open) setEditingUnit(null)
          }}
          property={property}
          unit={editingUnit}
          onSave={editingUnit ? updateUnit : addUnit}
        />

        {/* Add/Edit Tenant Modal */}
        <TenantFormModal
          open={showAddTenant || !!editingTenant}
          onOpenChange={(open) => {
            setShowAddTenant(open)
            if (!open) {
              setEditingTenant(null)
              setSelectedUnit(null)
            }
          }}
          property={property}
          units={propertyUnits}
          tenant={editingTenant}
          selectedUnit={selectedUnit}
          onSave={editingTenant ? updateTenant : addTenant}
        />
      </DialogContent>
    </Dialog>
  )
}

// Unit Form Modal Component
function UnitFormModal({ open, onOpenChange, property, unit, onSave }) {
  const [formData, setFormData] = useState({
    unitNumber: "",
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: "",
    monthlyRent: "",
    isOccupied: false,
  })

  useEffect(() => {
    if (unit) {
      setFormData({
        unitNumber: unit.unitNumber || "",
        bedrooms: unit.bedrooms || 1,
        bathrooms: unit.bathrooms || 1,
        squareFeet: unit.squareFeet?.toString() || "",
        monthlyRent: unit.monthlyRent?.toString() || "",
        isOccupied: unit.isOccupied || false,
      })
    } else {
      setFormData({
        unitNumber: "",
        bedrooms: 1,
        bathrooms: 1,
        squareFeet: "",
        monthlyRent: "",
        isOccupied: false,
      })
    }
  }, [unit, open])

  const handleSubmit = async (e) => {
    e.preventDefault()

    const unitData = {
      ...formData,
      propertyId: property.id,
      squareFeet: Number.parseInt(formData.squareFeet) || 0,
      monthlyRent: Number.parseFloat(formData.monthlyRent) || 0,
    }

    if (unit) {
      await onSave(unit.id, unitData)
    } else {
      await onSave(unitData)
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{unit ? "Edit Unit" : "Add Unit"}</DialogTitle>
          <DialogDescription>{unit ? "Update unit information" : "Add a new unit to this property"}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unitNumber">Unit Number</Label>
              <Input
                id="unitNumber"
                value={formData.unitNumber}
                onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                placeholder="e.g., 1A, 101"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlyRent">Monthly Rent</Label>
              <Input
                id="monthlyRent"
                type="number"
                value={formData.monthlyRent}
                onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input
                id="bedrooms"
                type="number"
                value={formData.bedrooms}
                onChange={(e) => setFormData({ ...formData, bedrooms: Number.parseInt(e.target.value) || 0 })}
                min="0"
                max="10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Input
                id="bathrooms"
                type="number"
                value={formData.bathrooms}
                onChange={(e) => setFormData({ ...formData, bathrooms: Number.parseInt(e.target.value) || 0 })}
                min="0"
                max="10"
                step="0.5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="squareFeet">Square Feet</Label>
              <Input
                id="squareFeet"
                type="number"
                value={formData.squareFeet}
                onChange={(e) => setFormData({ ...formData, squareFeet: e.target.value })}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{unit ? "Update Unit" : "Add Unit"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Tenant Form Modal Component
function TenantFormModal({ open, onOpenChange, property, units, tenant, selectedUnit, onSave }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    unitId: "",
    leaseStart: "",
    leaseEnd: "",
    monthlyRent: "",
    securityDeposit: "",
    isActive: true,
  })

  useEffect(() => {
    if (tenant) {
      setFormData({
        firstName: tenant.firstName || "",
        lastName: tenant.lastName || "",
        email: tenant.email || "",
        phone: tenant.phone || "",
        unitId: tenant.unitId?.toString() || "",
        leaseStart: tenant.leaseStart || "",
        leaseEnd: tenant.leaseEnd || "",
        monthlyRent: tenant.monthlyRent?.toString() || "",
        securityDeposit: tenant.securityDeposit?.toString() || "",
        isActive: tenant.isActive !== false,
      })
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        unitId: selectedUnit?.id?.toString() || "",
        leaseStart: "",
        leaseEnd: "",
        monthlyRent: selectedUnit?.monthlyRent?.toString() || "",
        securityDeposit: "",
        isActive: true,
      })
    }
  }, [tenant, selectedUnit, open])

  const handleSubmit = async (e) => {
    e.preventDefault()

    const tenantData = {
      ...formData,
      propertyId: property.id,
      unitId: Number.parseInt(formData.unitId) || null,
      monthlyRent: Number.parseFloat(formData.monthlyRent) || 0,
      securityDeposit: Number.parseFloat(formData.securityDeposit) || 0,
    }

    if (tenant) {
      await onSave(tenant.id, tenantData)
    } else {
      await onSave(tenantData)
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tenant ? "Edit Tenant" : "Add Tenant"}</DialogTitle>
          <DialogDescription>
            {tenant ? "Update tenant information" : "Add a new tenant to this property"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="unitId">Unit</Label>
            <Select
              value={formData.unitId}
              onValueChange={(value) => {
                const unit = units.find((u) => u.id.toString() === value)
                setFormData({
                  ...formData,
                  unitId: value,
                  monthlyRent: unit?.monthlyRent?.toString() || formData.monthlyRent,
                })
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a unit" />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id.toString()}>
                    Unit {unit.unitNumber} - {unit.bedrooms}BR/{unit.bathrooms}BA
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="leaseStart">Lease Start</Label>
              <Input
                id="leaseStart"
                type="date"
                value={formData.leaseStart}
                onChange={(e) => setFormData({ ...formData, leaseStart: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leaseEnd">Lease End</Label>
              <Input
                id="leaseEnd"
                type="date"
                value={formData.leaseEnd}
                onChange={(e) => setFormData({ ...formData, leaseEnd: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthlyRent">Monthly Rent</Label>
              <Input
                id="monthlyRent"
                type="number"
                value={formData.monthlyRent}
                onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                placeholder="0"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="securityDeposit">Security Deposit</Label>
              <Input
                id="securityDeposit"
                type="number"
                value={formData.securityDeposit}
                onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{tenant ? "Update Tenant" : "Add Tenant"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
