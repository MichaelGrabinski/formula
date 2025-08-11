"use client"
import { useState } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAzureData } from "@/lib/data-store-azure"
import { Plus, Edit, Trash2, Mail, Phone, Calendar, Home } from "lucide-react"

interface TenantManagementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TenantManagementModal({ open, onOpenChange }: TenantManagementModalProps) {
  const { tenants, properties, units } = useAzureData()

  const [showAddTenant, setShowAddTenant] = useState(false)
  const [editingTenant, setEditingTenant] = useState<number | null>(null)

  const allVacantUnits = properties.flatMap((property) =>
    units.filter((unit) => unit.propertyId === property.id && !unit.isOccupied),
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Tenant Management</DialogTitle>
            {allVacantUnits.length > 0 && (
              <Button size="sm" onClick={() => setShowAddTenant(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Tenant
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add Tenant Form */}
          {showAddTenant && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add New Tenant</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="unitId">Available Unit *</Label>
                      <Select name="unitId" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vacant unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {allVacantUnits.map((unit) => {
                            const propertyInfo = properties.find((p) => p.id === unit.propertyId)
                            return (
                              <SelectItem key={unit.id} value={unit.id.toString()}>
                                {propertyInfo?.property.name} - Unit {unit.unitNumber} (
                                {formatCurrency(unit.monthlyRent)}/month)
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                      <input type="hidden" name="propertyId" value={allVacantUnits[0]?.propertyId || ""} />
                    </div>
                    <div>
                      <Label htmlFor="monthlyRent">Monthly Rent *</Label>
                      <Input id="monthlyRent" name="monthlyRent" type="number" step="0.01" required />
                    </div>
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input id="firstName" name="firstName" required />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input id="lastName" name="lastName" required />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" name="phone" />
                    </div>
                    <div>
                      <Label htmlFor="leaseStart">Lease Start *</Label>
                      <Input id="leaseStart" name="leaseStart" type="date" required />
                    </div>
                    <div>
                      <Label htmlFor="leaseEnd">Lease End *</Label>
                      <Input id="leaseEnd" name="leaseEnd" type="date" required />
                    </div>
                    <div>
                      <Label htmlFor="securityDeposit">Security Deposit</Label>
                      <Input id="securityDeposit" name="securityDeposit" type="number" step="0.01" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Add Tenant</Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddTenant(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Tenants List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">All Tenants ({tenants.length})</h3>

            {tenants.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600">No Tenants Yet</h3>
                  <p className="text-gray-500">Add your first tenant to get started</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {tenants.map((tenant) => {
                  const propertyInfo = properties.find((p) => p.id === tenant.propertyId)
                  const isEditing = editingTenant === tenant.id

                  return (
                    <Card key={tenant.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">
                                {tenant.firstName} {tenant.lastName}
                              </h4>
                              <Badge
                                className={tenant.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                              >
                                {tenant.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>

                            <div className="mt-2 space-y-1">
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <Home className="h-4 w-4 text-muted-foreground" />
                                  <span>
                                    {propertyInfo?.property.name} - Unit {units.find((u) => u.id === tenant.unitId)?.unitNumber}
                                  </span>
                                </div>
                                <div className="font-medium">{formatCurrency(tenant.monthlyRent)}/month</div>
                              </div>

                              <div className="grid gap-2 md:grid-cols-2 text-sm">
                                <div className="flex items-center gap-1">
                                  <Mail className="h-4 w-4 text-muted-foreground" />
                                  <span>{tenant.email || "No email"}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  <span>{tenant.phone || "No phone"}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  Lease: {new Date(tenant.leaseStart).toLocaleDateString()} -{" "}
                                  {new Date(tenant.leaseEnd).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
