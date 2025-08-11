"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Home, MapPin, Calendar, DollarSign, Bed, Bath, Square, Shield, Receipt, Camera, Edit } from "lucide-react"
import { useAzureData } from "@/lib/data-store-azure"

interface Property {
  id: string
  name: string
  address: string
  type: string
  value: number
  purchasePrice?: number
  currentValue?: number
  purchaseDate?: string
  status: string
  bedrooms?: number
  bathrooms?: number
  squareFeet?: number
  yearBuilt?: number
  lastInspection?: string
  nextInspection?: string
  images?: string[]
  insurance?: {
    provider: string
    policyNumber: string
    expirationDate: string
    annualPremium: number
  }
  taxes?: {
    annualAmount: number
    lastPaid: string
    nextDue: string
  }
  monthlyRent?: number
  tenantName?: string
  tenantContact?: string
  leaseStart?: string
  leaseEnd?: string
  mortgage?: {
    lender: string
    originalAmount: number
    currentBalance: number
    interestRate: number
    monthlyPayment: number
    startDate: string
    endDate: string
  }
}

interface EnhancedPropertyDetailModalProps {
  property: Property | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EnhancedPropertyDetailModal({ property, open, onOpenChange }: EnhancedPropertyDetailModalProps) {
  const { updateProperty } = useAzureData()
  const [activeTab, setActiveTab] = useState("overview")

  if (!property) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    if (!status) return "bg-gray-100 text-gray-800"

    switch (status.toLowerCase()) {
      case "owner occupied":
        return "bg-blue-100 text-blue-800"
      case "rented":
        return "bg-green-100 text-green-800"
      case "vacant":
        return "bg-yellow-100 text-yellow-800"
      case "maintenance":
      case "under renovation":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">{property.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{property.address}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(property.status)}>{property.status || "Unknown"}</Badge>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Property Images */}
            {property.images && property.images.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Property Images
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {property.images.map((image, index) => (
                      <div key={index} className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={image || "/placeholder.svg"}
                          alt={`Property image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-muted-foreground">No images available</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Property Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Type</p>
                    <p className="font-semibold">{property.type}</p>
                  </div>
                  {property.bedrooms && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Bedrooms</p>
                      <div className="flex items-center gap-1">
                        <Bed className="h-4 w-4" />
                        <span className="font-semibold">{property.bedrooms}</span>
                      </div>
                    </div>
                  )}
                  {property.bathrooms && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Bathrooms</p>
                      <div className="flex items-center gap-1">
                        <Bath className="h-4 w-4" />
                        <span className="font-semibold">{property.bathrooms}</span>
                      </div>
                    </div>
                  )}
                  {property.squareFeet && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Square Feet</p>
                      <div className="flex items-center gap-1">
                        <Square className="h-4 w-4" />
                        <span className="font-semibold">{property.squareFeet.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                  {property.yearBuilt && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Year Built</p>
                      <p className="font-semibold">{property.yearBuilt}</p>
                    </div>
                  )}
                  {property.purchaseDate && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Purchase Date</p>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span className="font-semibold">{formatDate(property.purchaseDate)}</span>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Current Value</p>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-semibold">{formatCurrency(property.value)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rental Information */}
            {property.monthlyRent && (
              <Card>
                <CardHeader>
                  <CardTitle>Rental Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Monthly Rent</p>
                      <p className="font-semibold">{formatCurrency(property.monthlyRent)}</p>
                    </div>
                    {property.tenantName && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Tenant</p>
                        <p className="font-semibold">{property.tenantName}</p>
                      </div>
                    )}
                    {property.tenantContact && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Contact</p>
                        <p className="font-semibold">{property.tenantContact}</p>
                      </div>
                    )}
                    {property.leaseStart && property.leaseEnd && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Lease Period</p>
                        <p className="font-semibold">
                          {formatDate(property.leaseStart)} - {formatDate(property.leaseEnd)}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Inspections */}
            {(property.lastInspection || property.nextInspection) && (
              <Card>
                <CardHeader>
                  <CardTitle>Inspections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {property.lastInspection && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Last Inspection</p>
                        <p className="font-semibold">{formatDate(property.lastInspection)}</p>
                      </div>
                    )}
                    {property.nextInspection && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Next Inspection</p>
                        <p className="font-semibold">{formatDate(property.nextInspection)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            {/* Property Value */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Property Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Current Value</p>
                    <p className="text-2xl font-bold">{formatCurrency(property.value)}</p>
                  </div>
                  {property.purchasePrice && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Purchase Price</p>
                      <p className="text-xl font-semibold">{formatCurrency(property.purchasePrice)}</p>
                    </div>
                  )}
                  {property.purchasePrice && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Equity Gain</p>
                      <p className="text-xl font-semibold text-green-600">
                        {formatCurrency(property.value - property.purchasePrice)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Mortgage Information */}
            {property.mortgage && (
              <Card>
                <CardHeader>
                  <CardTitle>Mortgage Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Lender</p>
                      <p className="font-semibold">{property.mortgage.lender}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Original Amount</p>
                      <p className="font-semibold">{formatCurrency(property.mortgage.originalAmount)}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
                      <p className="font-semibold">{formatCurrency(property.mortgage.currentBalance)}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Interest Rate</p>
                      <p className="font-semibold">{property.mortgage.interestRate}%</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Monthly Payment</p>
                      <p className="font-semibold">{formatCurrency(property.mortgage.monthlyPayment)}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Loan Term</p>
                      <p className="font-semibold">
                        {formatDate(property.mortgage.startDate)} - {formatDate(property.mortgage.endDate)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Insurance */}
            {property.insurance && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Insurance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Provider</p>
                      <p className="font-semibold">{property.insurance.provider}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Policy Number</p>
                      <p className="font-semibold">{property.insurance.policyNumber}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Annual Premium</p>
                      <p className="font-semibold">{formatCurrency(property.insurance.annualPremium)}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Expiration</p>
                      <p className="font-semibold">{formatDate(property.insurance.expirationDate)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Property Taxes */}
            {property.taxes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Property Taxes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Annual Amount</p>
                      <p className="font-semibold">{formatCurrency(property.taxes.annualAmount)}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Last Paid</p>
                      <p className="font-semibold">{formatDate(property.taxes.lastPaid)}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Next Due</p>
                      <p className="font-semibold">{formatDate(property.taxes.nextDue)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
