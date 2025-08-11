"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAzureData, type Property } from "@/lib/data-store-azure"
import { Building2, DollarSign, Calendar, MapPin, Users, Home } from "lucide-react"

interface AddPropertyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingProperty?: Property
}

export function AddPropertyModal({ open, onOpenChange, editingProperty }: AddPropertyModalProps) {
  const { addProperty, updateProperty } = useAzureData()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditing = !!editingProperty

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)

    try {
      const propertyData = {
        name: formData.get("name") as string,
        address: formData.get("address") as string,
        type: formData.get("type") as string,
        description: formData.get("description") as string,
        purchasePrice: Number.parseFloat(formData.get("purchasePrice") as string),
        value: Number.parseFloat(formData.get("currentValue") as string),
        currentValue: Number.parseFloat(formData.get("currentValue") as string),
        purchaseDate: formData.get("purchaseDate") as string,
        status: formData.get("status") as string,
        bedrooms: formData.get("bedrooms") ? Number.parseInt(formData.get("bedrooms") as string) : undefined,
        bathrooms: formData.get("bathrooms") ? Number.parseFloat(formData.get("bathrooms") as string) : undefined,
        squareFeet: formData.get("squareFeet") ? Number.parseInt(formData.get("squareFeet") as string) : undefined,
        yearBuilt: formData.get("yearBuilt") ? Number.parseInt(formData.get("yearBuilt") as string) : undefined,
        monthlyRent: formData.get("monthlyRent") ? Number.parseFloat(formData.get("monthlyRent") as string) : undefined,
        tenantName: (formData.get("tenantName") as string) || undefined,
        tenantContact: (formData.get("tenantContact") as string) || undefined,
        leaseStart: (formData.get("leaseStart") as string) || undefined,
        leaseEnd: (formData.get("leaseEnd") as string) || undefined,
      }

      if (isEditing && editingProperty) {
        await updateProperty(editingProperty.id, propertyData)
      } else {
        await addProperty(propertyData)
      }

      onOpenChange(false)
      // Reset form
      ;(e.target as HTMLFormElement).reset()
    } catch (error) {
      console.error("Error saving property:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {isEditing ? "Edit Property" : "Add New Property"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Property Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Main Residence, Rental Property #1"
                  defaultValue={editingProperty?.name}
                  required
                />
              </div>

              <div>
                <Label htmlFor="type">Property Type *</Label>
                <Select name="type" defaultValue={editingProperty?.type} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single Family Home">Single Family Home</SelectItem>
                    <SelectItem value="Duplex">Duplex</SelectItem>
                    <SelectItem value="Triplex">Triplex</SelectItem>
                    <SelectItem value="Fourplex">Fourplex</SelectItem>
                    <SelectItem value="Apartment Building">Apartment Building</SelectItem>
                    <SelectItem value="Condominium">Condominium</SelectItem>
                    <SelectItem value="Townhouse">Townhouse</SelectItem>
                    <SelectItem value="Mobile Home">Mobile Home</SelectItem>
                    <SelectItem value="Commercial">Commercial</SelectItem>
                    <SelectItem value="Land">Land</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="address"
                  name="address"
                  placeholder="123 Main St, City, State 12345"
                  className="pl-10"
                  defaultValue={editingProperty?.address}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Brief description of the property"
                rows={2}
                defaultValue={editingProperty?.description}
              />
            </div>

            <div>
              <Label htmlFor="status">Status *</Label>
              <Select name="status" defaultValue={editingProperty?.status} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Owner Occupied">Owner Occupied</SelectItem>
                  <SelectItem value="Rented">Rented</SelectItem>
                  <SelectItem value="Vacant">Vacant</SelectItem>
                  <SelectItem value="Under Renovation">Under Renovation</SelectItem>
                  <SelectItem value="For Sale">For Sale</SelectItem>
                  <SelectItem value="For Rent">For Rent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Property Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Home className="h-5 w-5" />
              Property Details
            </h3>

            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  name="bedrooms"
                  type="number"
                  min="0"
                  placeholder="3"
                  defaultValue={editingProperty?.bedrooms}
                />
              </div>

              <div>
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  name="bathrooms"
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="2.5"
                  defaultValue={editingProperty?.bathrooms}
                />
              </div>

              <div>
                <Label htmlFor="squareFeet">Square Feet</Label>
                <Input
                  id="squareFeet"
                  name="squareFeet"
                  type="number"
                  min="0"
                  placeholder="2400"
                  defaultValue={editingProperty?.squareFeet}
                />
              </div>

              <div>
                <Label htmlFor="yearBuilt">Year Built</Label>
                <Input
                  id="yearBuilt"
                  name="yearBuilt"
                  type="number"
                  min="1800"
                  max="2030"
                  placeholder="2010"
                  defaultValue={editingProperty?.yearBuilt}
                />
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Information
            </h3>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="purchasePrice">Purchase Price *</Label>
                <Input
                  id="purchasePrice"
                  name="purchasePrice"
                  type="number"
                  step="0.01"
                  placeholder="450000"
                  defaultValue={editingProperty?.purchasePrice}
                  required
                />
              </div>

              <div>
                <Label htmlFor="currentValue">Current Value *</Label>
                <Input
                  id="currentValue"
                  name="currentValue"
                  type="number"
                  step="0.01"
                  placeholder="475000"
                  defaultValue={editingProperty?.currentValue || editingProperty?.value}
                  required
                />
              </div>

              <div>
                <Label htmlFor="monthlyRent">Monthly Rent</Label>
                <Input
                  id="monthlyRent"
                  name="monthlyRent"
                  type="number"
                  step="0.01"
                  placeholder="2400"
                  defaultValue={editingProperty?.monthlyRent}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="purchaseDate">Purchase Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="purchaseDate"
                  name="purchaseDate"
                  type="date"
                  className="pl-10"
                  defaultValue={editingProperty?.purchaseDate}
                  required
                />
              </div>
            </div>
          </div>

          {/* Tenant Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Users className="h-5 w-5" />
              Tenant Information (Optional)
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="tenantName">Tenant Name</Label>
                <Input
                  id="tenantName"
                  name="tenantName"
                  placeholder="John & Jane Smith"
                  defaultValue={editingProperty?.tenantName}
                />
              </div>

              <div>
                <Label htmlFor="tenantContact">Tenant Contact</Label>
                <Input
                  id="tenantContact"
                  name="tenantContact"
                  placeholder="(555) 123-4567"
                  defaultValue={editingProperty?.tenantContact}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="leaseStart">Lease Start Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="leaseStart"
                    name="leaseStart"
                    type="date"
                    className="pl-10"
                    defaultValue={editingProperty?.leaseStart}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="leaseEnd">Lease End Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="leaseEnd"
                    name="leaseEnd"
                    type="date"
                    className="pl-10"
                    defaultValue={editingProperty?.leaseEnd}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting
                ? isEditing
                  ? "Updating Property..."
                  : "Adding Property..."
                : isEditing
                  ? "Update Property"
                  : "Add Property"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
