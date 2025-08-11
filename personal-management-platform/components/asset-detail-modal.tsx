"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useAzureData } from "@/lib/data-store-azure"
import { Package, DollarSign, MapPin, Calendar, TrendingDown } from "lucide-react"

interface AssetDetailModalProps {
  assetId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AssetDetailModal({ assetId, open, onOpenChange }: AssetDetailModalProps) {
  const { assets } = useAzureData()
  const asset = assets.find((a) => a.id === assetId)

  if (!asset) {
    return null
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const depreciation = asset.purchasePrice - asset.value
  const depreciationPercentage = (depreciation / asset.purchasePrice) * 100

  const getConditionBadge = (condition: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      Excellent: "default",
      Good: "secondary",
      Fair: "outline",
      Poor: "destructive",
    }
    return <Badge variant={variants[condition] || "outline"}>{condition}</Badge>
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {asset.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Asset Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">Category</Label>
                  <Badge variant="outline">{asset.category}</Badge>
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">Condition</Label>
                  {getConditionBadge(asset.condition)}
                </div>
                {asset.location && (
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium">Location</Label>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{asset.location}</span>
                    </div>
                  </div>
                )}
                {asset.serialNumber && (
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium">Serial Number</Label>
                    <span className="text-sm font-mono">{asset.serialNumber}</span>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">Purchase Date</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{new Date(asset.purchaseDate).toLocaleDateString()}</span>
                  </div>
                </div>
                {asset.description && (
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium">Description</Label>
                    <span className="text-sm text-muted-foreground">{asset.description}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">Current Value</Label>
                  <span className="text-lg font-semibold">{formatCurrency(asset.value)}</span>
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">Purchase Price</Label>
                  <span className="text-sm">{formatCurrency(asset.purchasePrice)}</span>
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">Depreciation</Label>
                  <span className="text-sm text-red-600">
                    -{formatCurrency(depreciation)} ({depreciationPercentage.toFixed(1)}%)
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                Value Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label className="text-sm font-medium">Original Value</Label>
                  <div className="text-lg">{formatCurrency(asset.purchasePrice)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Current Value</Label>
                  <div className="text-lg font-semibold">{formatCurrency(asset.value)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total Depreciation</Label>
                  <div className="text-lg font-semibold text-red-600">-{formatCurrency(depreciation)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
