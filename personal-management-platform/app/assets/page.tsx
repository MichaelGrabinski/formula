"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { AddPropertyModal } from "@/components/add-property-modal"
import { AddAssetModal } from "@/components/add-asset-modal"
import { PropertyDetailModal } from "@/components/property-detail-modal"
import { AssetDetailModal } from "@/components/asset-detail-modal"
import { UnitManagementModal } from "@/components/unit-management-modal"
import {
  Plus,
  Search,
  Building2,
  Car,
  Home,
  DollarSign,
  Calendar,
  MapPin,
  Users,
  Trash2,
  Edit,
  Eye,
  Settings,
} from "lucide-react"

export default function AssetsPage() {
  const { properties = [], assets = [], deleteProperty, deleteAsset, isLoading } = useAzureData()

  const [searchTerm, setSearchTerm] = useState("")
  const [showAddProperty, setShowAddProperty] = useState(false)
  const [showAddAsset, setShowAddAsset] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [editingProperty, setEditingProperty] = useState(null)
  const [editingAsset, setEditingAsset] = useState(null)
  const [showUnits, setShowUnits] = useState(null)

  // Filter properties and assets based on search term
  const filteredProperties = properties.filter(
    (property) =>
      property?.name?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
      property?.address?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
      property?.type?.toLowerCase()?.includes(searchTerm.toLowerCase()),
  )

  const filteredAssets = assets.filter(
    (asset) =>
      asset?.name?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
      asset?.category?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
      asset?.location?.toLowerCase()?.includes(searchTerm.toLowerCase()),
  )

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0)
  }

  const handleDeleteProperty = async (id) => {
    try {
      await deleteProperty(id)
    } catch (error) {
      console.error("Failed to delete property:", error)
    }
  }

  const handleDeleteAsset = async (id) => {
    try {
      await deleteAsset(id)
    } catch (error) {
      console.error("Failed to delete asset:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Assets & Properties</h2>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Assets & Properties</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowAddProperty(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Button>
          <Button variant="outline" onClick={() => setShowAddAsset(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search properties and assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Properties Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Properties ({filteredProperties.length})
          </h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((property) => (
            <Card key={property.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{property.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {property.address}
                    </CardDescription>
                  </div>
                  <Badge variant={property.status === "Rented" ? "default" : "secondary"}>{property.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <span>{property.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>{formatCurrency(property.value || property.currentValue)}</span>
                  </div>
                  {property.monthlyRent && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatCurrency(property.monthlyRent)}/mo</span>
                    </div>
                  )}
                  {property.tenantName && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{property.tenantName}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedProperty(property)}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setEditingProperty(property)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowUnits(property)}>
                      <Settings className="h-4 w-4 mr-1" />
                      Units
                    </Button>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Property</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{property.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteProperty(property.id)}
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

        {filteredProperties.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Properties Found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm
                  ? "No properties match your search criteria."
                  : "Get started by adding your first property."}
              </p>
              <Button onClick={() => setShowAddProperty(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Property
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Assets Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Car className="h-5 w-5" />
            Assets ({filteredAssets.length})
          </h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAssets.map((asset) => (
            <Card key={asset.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{asset.name}</CardTitle>
                    <CardDescription>{asset.category}</CardDescription>
                  </div>
                  <Badge variant={asset.condition === "Excellent" ? "default" : "secondary"}>{asset.condition}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>{formatCurrency(asset.value || asset.currentValue)}</span>
                  </div>
                  {asset.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{asset.location}</span>
                    </div>
                  )}
                  {asset.purchaseDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(asset.purchaseDate).getFullYear()}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedAsset(asset)}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setEditingAsset(asset)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Asset</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{asset.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteAsset(asset.id)}
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

        {filteredAssets.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Car className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Assets Found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm ? "No assets match your search criteria." : "Get started by adding your first asset."}
              </p>
              <Button onClick={() => setShowAddAsset(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Asset
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      <AddPropertyModal
        open={showAddProperty || !!editingProperty}
        onOpenChange={(open) => {
          setShowAddProperty(open)
          if (!open) setEditingProperty(null)
        }}
        editingProperty={editingProperty}
      />

      <AddAssetModal
        open={showAddAsset || !!editingAsset}
        onOpenChange={(open) => {
          setShowAddAsset(open)
          if (!open) setEditingAsset(null)
        }}
        editingAsset={editingAsset}
      />

      {selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          open={!!selectedProperty}
          onOpenChange={(open) => !open && setSelectedProperty(null)}
        />
      )}

      {selectedAsset && (
        <AssetDetailModal
          asset={selectedAsset}
          open={!!selectedAsset}
          onOpenChange={(open) => !open && setSelectedAsset(null)}
        />
      )}

      {showUnits && (
        <UnitManagementModal
          property={showUnits}
          open={!!showUnits}
          onOpenChange={(open) => !open && setShowUnits(null)}
        />
      )}
    </div>
  )
}
