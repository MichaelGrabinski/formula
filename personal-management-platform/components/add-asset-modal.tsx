"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAzureData, type Asset } from "@/lib/data-store-azure"
import { Package, DollarSign, Calendar, MapPin, FileText, Wrench } from "lucide-react"

interface AddAssetModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingAsset?: Asset
}

export function AddAssetModal({ open, onOpenChange, editingAsset }: AddAssetModalProps) {
  const { addAsset, updateAsset } = useAzureData()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditing = !!editingAsset

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)

    try {
      const assetData = {
        name: formData.get("name") as string,
        category: formData.get("category") as string,
        description: formData.get("description") as string,
        purchasePrice: Number.parseFloat(formData.get("purchasePrice") as string),
        value: Number.parseFloat(formData.get("currentValue") as string),
        currentValue: Number.parseFloat(formData.get("currentValue") as string),
        purchaseDate: formData.get("purchaseDate") as string,
        condition: formData.get("condition") as string,
        location: (formData.get("location") as string) || undefined,
        serialNumber: (formData.get("serialNumber") as string) || undefined,
        warrantyExpiration: (formData.get("warrantyExpiration") as string) || undefined,
        lastMaintenance: (formData.get("lastMaintenance") as string) || undefined,
        nextMaintenance: (formData.get("nextMaintenance") as string) || undefined,
        depreciationRate: formData.get("depreciationRate")
          ? Number.parseFloat(formData.get("depreciationRate") as string)
          : undefined,
      }

      if (isEditing && editingAsset) {
        await updateAsset(editingAsset.id, assetData)
      } else {
        await addAsset(assetData)
      }

      onOpenChange(false)
      // Reset form
      ;(e.target as HTMLFormElement).reset()
    } catch (error) {
      console.error("Error saving asset:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {isEditing ? "Edit Asset" : "Add New Asset"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Asset Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., 2022 Ford F-150"
                  defaultValue={editingAsset?.name}
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select name="category" defaultValue={editingAsset?.category} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vehicles">Vehicles</SelectItem>
                    <SelectItem value="Heavy Machinery">Heavy Machinery</SelectItem>
                    <SelectItem value="Boats">Boats</SelectItem>
                    <SelectItem value="Motorcycles">Motorcycles</SelectItem>
                    <SelectItem value="Equipment">Equipment</SelectItem>
                    <SelectItem value="Electronics">Electronics</SelectItem>
                    <SelectItem value="Tools">Tools</SelectItem>
                    <SelectItem value="Furniture">Furniture</SelectItem>
                    <SelectItem value="Jewelry">Jewelry</SelectItem>
                    <SelectItem value="Art & Collectibles">Art & Collectibles</SelectItem>
                    <SelectItem value="Appliances">Appliances</SelectItem>
                    <SelectItem value="Sports Equipment">Sports Equipment</SelectItem>
                    <SelectItem value="Musical Instruments">Musical Instruments</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Brief description of the asset"
                rows={2}
                defaultValue={editingAsset?.description}
              />
            </div>

            <div>
              <Label htmlFor="condition">Condition *</Label>
              <Select name="condition" defaultValue={editingAsset?.condition} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Excellent">Excellent</SelectItem>
                  <SelectItem value="Good">Good</SelectItem>
                  <SelectItem value="Fair">Fair</SelectItem>
                  <SelectItem value="Poor">Poor</SelectItem>
                  <SelectItem value="Needs Repair">Needs Repair</SelectItem>
                </SelectContent>
              </Select>
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
                  placeholder="25000"
                  defaultValue={editingAsset?.purchasePrice}
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
                  placeholder="22000"
                  defaultValue={editingAsset?.currentValue || editingAsset?.value}
                  required
                />
              </div>

              <div>
                <Label htmlFor="depreciationRate">Depreciation Rate (%/year)</Label>
                <Input
                  id="depreciationRate"
                  name="depreciationRate"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="15"
                  defaultValue={editingAsset?.depreciationRate}
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
                  defaultValue={editingAsset?.purchaseDate}
                  required
                />
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Additional Details
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    name="location"
                    placeholder="e.g., Main Garage, Storage Unit A"
                    className="pl-10"
                    defaultValue={editingAsset?.location}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="serialNumber">Serial Number / VIN</Label>
                <Input
                  id="serialNumber"
                  name="serialNumber"
                  placeholder="e.g., VIN, Model Number"
                  defaultValue={editingAsset?.serialNumber}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="warrantyExpiration">Warranty Expiration</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="warrantyExpiration"
                  name="warrantyExpiration"
                  type="date"
                  className="pl-10"
                  defaultValue={editingAsset?.warrantyExpiration}
                />
              </div>
            </div>
          </div>

          {/* Maintenance Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Maintenance Information
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="lastMaintenance">Last Maintenance</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="lastMaintenance"
                    name="lastMaintenance"
                    type="date"
                    className="pl-10"
                    defaultValue={editingAsset?.lastMaintenance}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="nextMaintenance">Next Maintenance Due</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="nextMaintenance"
                    name="nextMaintenance"
                    type="date"
                    className="pl-10"
                    defaultValue={editingAsset?.nextMaintenance}
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
                  ? "Updating Asset..."
                  : "Adding Asset..."
                : isEditing
                  ? "Update Asset"
                  : "Add Asset"}
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
