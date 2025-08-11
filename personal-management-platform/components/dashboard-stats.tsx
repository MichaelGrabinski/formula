"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAzureData } from "@/lib/data-store-azure"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  Car,
  PiggyBank,
  Home,
  Users,
  Calendar,
  AlertTriangle,
} from "lucide-react"

export function DashboardStats() {
  const {
    properties = [],
    assets = [],
    tenants = [],
    units = [],
    transactions = [],
    expenseEntries = [],
    isLoading,
  } = useAzureData()

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Calculate financial metrics with null checks
  const totalPropertyValue = properties.reduce(
    (sum, property) => sum + (property?.value || property?.currentValue || 0),
    0,
  )

  const totalAssetValue = assets.reduce((sum, asset) => sum + (asset?.value || asset?.currentValue || 0), 0)

  const totalDebt = properties.reduce((sum, property) => sum + (property?.mortgage?.balance || 0), 0)

  const netWorth = totalPropertyValue + totalAssetValue - totalDebt

  // Calculate monthly income with null checks
  const monthlyRentalIncome = properties.reduce((sum, property) => sum + (property?.monthlyRent || 0), 0)

  const unitRentalIncome = units.reduce((sum, unit) => sum + (unit?.isOccupied ? unit?.monthlyRent || 0 : 0), 0)

  const totalMonthlyIncome = monthlyRentalIncome + unitRentalIncome

  // Calculate monthly expenses with null checks
  const currentMonth = new Date().toISOString().slice(0, 7)
  const monthlyExpenses = transactions
    .filter((transaction) => transaction?.type === "Expense" && transaction?.date?.startsWith(currentMonth))
    .reduce((sum, transaction) => sum + (transaction?.amount || 0), 0)

  // Add expense entries to monthly expenses
  const monthlyExpenseEntries = expenseEntries
    .filter((expense) => expense?.date?.startsWith(currentMonth))
    .reduce((sum, expense) => sum + (expense?.amount || 0), 0)

  const totalMonthlyExpenses = monthlyExpenses + monthlyExpenseEntries

  // Calculate cash flow
  const monthlyCashFlow = totalMonthlyIncome - totalMonthlyExpenses

  // Portfolio stats with null checks
  const totalUnits = units.length
  const occupiedUnits = units.filter((unit) => unit?.isOccupied === true).length
  const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0
  const activeTenants = tenants.filter((tenant) => tenant?.isActive === true).length

  // Upcoming lease expirations (next 60 days) with null checks
  const upcomingExpirations = tenants.filter((tenant) => {
    if (!tenant?.leaseEnd) return false
    try {
      const leaseEnd = new Date(tenant.leaseEnd)
      const now = new Date()
      const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
      return leaseEnd >= now && leaseEnd <= sixtyDaysFromNow
    } catch {
      return false
    }
  }).length

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0)
  }

  const formatPercentage = (value: number) => {
    return `${(value || 0).toFixed(1)}%`
  }

  return (
    <div className="space-y-6">
      {/* Main Financial Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={netWorth >= 0 ? "text-green-600" : "text-red-600"}>{formatCurrency(netWorth)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Assets minus debt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Property Value</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPropertyValue)}</div>
            <p className="text-xs text-muted-foreground">{properties.length} properties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asset Value</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAssetValue)}</div>
            <p className="text-xs text-muted-foreground">{assets.length} assets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalMonthlyIncome)}</div>
            <p className="text-xs text-muted-foreground">{formatCurrency(totalMonthlyIncome * 12)} annually</p>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow and Portfolio Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Cash Flow</CardTitle>
            {monthlyCashFlow >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${monthlyCashFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(monthlyCashFlow)}
            </div>
            <p className="text-xs text-muted-foreground">
              Income: {formatCurrency(totalMonthlyIncome)} | Expenses: {formatCurrency(totalMonthlyExpenses)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUnits > 0 ? formatPercentage(occupancyRate) : "N/A"}</div>
            <p className="text-xs text-muted-foreground">
              {occupiedUnits} of {totalUnits} units occupied
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTenants}</div>
            <p className="text-xs text-muted-foreground">{tenants.length} total tenant records</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Financial Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Financial Overview
          </CardTitle>
          <CardDescription>Complete breakdown of your financial position</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Assets */}
            <div className="space-y-4">
              <h4 className="font-semibold text-green-600">Assets</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Properties</span>
                  <span className="font-medium">{formatCurrency(totalPropertyValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Personal Assets</span>
                  <span className="font-medium">{formatCurrency(totalAssetValue)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total Assets</span>
                    <span className="text-green-600">{formatCurrency(totalPropertyValue + totalAssetValue)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Liabilities */}
            <div className="space-y-4">
              <h4 className="font-semibold text-red-600">Liabilities</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Mortgage Debt</span>
                  <span className="font-medium">{formatCurrency(totalDebt)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total Debt</span>
                    <span className="text-red-600">{formatCurrency(totalDebt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Net Worth</span>
              <span className={`text-2xl font-bold ${netWorth >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(netWorth)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts and Notifications */}
      {upcomingExpirations > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Upcoming Lease Expirations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-600" />
              <span className="text-sm">
                {upcomingExpirations} lease{upcomingExpirations > 1 ? "s" : ""} expiring in the next 60 days
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
