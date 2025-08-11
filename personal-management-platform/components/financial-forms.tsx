"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useAzureData } from "@/lib/data-store-azure"
import { TrendingUp, TrendingDown, Plus, Calendar, Receipt } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

export function FinancialForms() {
  const { properties } = useAzureData()

  // Income form state
  const [incomeForm, setIncomeForm] = useState({
    amount: "",
    source: "",
    category: "Rental Income",
    date: new Date().toISOString().split("T")[0],
    description: "",
    propertyId: "",
    recurring: false,
  })

  // Expense form state
  const [expenseForm, setExpenseForm] = useState({
    amount: "",
    category: "Maintenance",
    date: new Date().toISOString().split("T")[0],
    description: "",
    propertyId: "",
    vendor: "",
    receipt: null as File | null,
  })

  // Sample data for demonstration
  const recentTransactions = [
    {
      id: 1,
      type: "income",
      amount: 2400,
      description: "Monthly rent - Main Residence",
      date: "2024-01-01",
      category: "Rental Income",
    },
    {
      id: 2,
      type: "expense",
      amount: 150,
      description: "Plumbing repair - kitchen sink",
      date: "2024-01-02",
      category: "Maintenance",
    },
    {
      id: 3,
      type: "expense",
      amount: 1200,
      description: "Property insurance premium",
      date: "2024-01-03",
      category: "Insurance",
    },
  ]

  const handleIncomeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Income data:", incomeForm)
    // TODO: Add to Azure data store when income methods are available

    // Reset form
    setIncomeForm({
      amount: "",
      source: "",
      category: "Rental Income",
      date: new Date().toISOString().split("T")[0],
      description: "",
      propertyId: "",
      recurring: false,
    })
  }

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Expense data:", expenseForm)
    // TODO: Add to Azure data store when expense methods are available

    // Reset form
    setExpenseForm({
      amount: "",
      category: "Maintenance",
      date: new Date().toISOString().split("T")[0],
      description: "",
      propertyId: "",
      vendor: "",
      receipt: null,
    })
  }

  const incomeCategories = ["Rental Income", "Property Sale", "Security Deposit", "Late Fees", "Other Income"]

  const expenseCategories = [
    "Maintenance",
    "Repairs",
    "Insurance",
    "Property Tax",
    "Utilities",
    "Property Management",
    "Legal Fees",
    "Advertising",
    "Other Expenses",
  ]

  return (
    <div className="space-y-6">
      <Tabs defaultValue="income" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="income" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Add Income
          </TabsTrigger>
          <TabsTrigger value="expense" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Add Expense
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Recent
          </TabsTrigger>
        </TabsList>

        <TabsContent value="income" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Record Income
              </CardTitle>
              <CardDescription>Add rental income, property sales, or other income sources</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleIncomeSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="income-amount">Amount ($)</Label>
                    <Input
                      id="income-amount"
                      type="number"
                      step="0.01"
                      value={incomeForm.amount}
                      onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="income-source">Source</Label>
                    <Input
                      id="income-source"
                      value={incomeForm.source}
                      onChange={(e) => setIncomeForm({ ...incomeForm, source: e.target.value })}
                      placeholder="e.g., John Smith (Tenant)"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="income-category">Category</Label>
                    <Select
                      value={incomeForm.category}
                      onValueChange={(value) => setIncomeForm({ ...incomeForm, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {incomeCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="income-date">Date</Label>
                    <Input
                      id="income-date"
                      type="date"
                      value={incomeForm.date}
                      onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="income-property">Property (Optional)</Label>
                  <Select
                    value={incomeForm.propertyId}
                    onValueChange={(value) => setIncomeForm({ ...incomeForm, propertyId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Property</SelectItem>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id.toString()}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="income-description">Description</Label>
                  <Textarea
                    id="income-description"
                    value={incomeForm.description}
                    onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
                    placeholder="Additional details about this income"
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Record Income
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expense" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                Record Expense
              </CardTitle>
              <CardDescription>Track maintenance, repairs, taxes, and other property expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleExpenseSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expense-amount">Amount ($)</Label>
                    <Input
                      id="expense-amount"
                      type="number"
                      step="0.01"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="expense-vendor">Vendor/Payee</Label>
                    <Input
                      id="expense-vendor"
                      value={expenseForm.vendor}
                      onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })}
                      placeholder="e.g., ABC Plumbing Co."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expense-category">Category</Label>
                    <Select
                      value={expenseForm.category}
                      onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="expense-date">Date</Label>
                    <Input
                      id="expense-date"
                      type="date"
                      value={expenseForm.date}
                      onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="expense-property">Property (Optional)</Label>
                  <Select
                    value={expenseForm.propertyId}
                    onValueChange={(value) => setExpenseForm({ ...expenseForm, propertyId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Property</SelectItem>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id.toString()}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="expense-description">Description</Label>
                  <Textarea
                    id="expense-description"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    placeholder="Details about this expense"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="expense-receipt">Receipt (Optional)</Label>
                  <Input
                    id="expense-receipt"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setExpenseForm({ ...expenseForm, receipt: e.target.files?.[0] || null })}
                  />
                </div>

                <Button type="submit" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Record Expense
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-600" />
                Recent Transactions
              </CardTitle>
              <CardDescription>Your latest income and expense entries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${transaction.type === "income" ? "bg-green-100" : "bg-red-100"}`}
                      >
                        {transaction.type === "income" ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {transaction.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(transaction.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}
                      >
                        {transaction.type === "income" ? "+" : "-"}${transaction.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
