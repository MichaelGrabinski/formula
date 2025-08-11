"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, DollarSign, TrendingUp, TrendingDown, PieChart, Edit, Trash2, Calendar } from "lucide-react"
import { useAzureData } from "@/lib/data-store-azure"
import { FinancialForms } from "@/components/financial-forms"

export default function FinancialPage() {
  const { incomeEntries, expenseEntries, deleteIncomeEntry, deleteExpenseEntry, properties } = useAzureData()

  const [showIncomeForm, setShowIncomeForm] = useState(false)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [editingIncome, setEditingIncome] = useState<any>(null)
  const [editingExpense, setEditingExpense] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [typeFilter, setTypeFilter] = useState("All")

  // Calculate totals
  const totalIncome = incomeEntries.reduce((sum, entry) => sum + entry.amount, 0)
  const totalExpenses = expenseEntries.reduce((sum, entry) => sum + entry.amount, 0)
  const netIncome = totalIncome - totalExpenses

  // Get all categories for filtering
  const incomeCategories = [...new Set(incomeEntries.map((entry) => entry.category))]
  const expenseCategories = [...new Set(expenseEntries.map((entry) => entry.category))]
  const allCategories = [...new Set([...incomeCategories, ...expenseCategories])]

  // Filter entries
  const filteredIncomeEntries = incomeEntries.filter((entry) => {
    const matchesSearch =
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.source.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "All" || entry.category === categoryFilter
    const matchesType = typeFilter === "All" || typeFilter === "Income"
    return matchesSearch && matchesCategory && matchesType
  })

  const filteredExpenseEntries = expenseEntries.filter((entry) => {
    const matchesSearch =
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.vendor.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "All" || entry.category === categoryFilter
    const matchesType = typeFilter === "All" || typeFilter === "Expenses"
    return matchesSearch && matchesCategory && matchesType
  })

  const handleEditIncome = (income: any) => {
    setEditingIncome(income)
    setShowIncomeForm(true)
  }

  const handleEditExpense = (expense: any) => {
    setEditingExpense(expense)
    setShowExpenseForm(true)
  }

  const handleDeleteIncome = (id: number) => {
    if (confirm("Are you sure you want to delete this income entry?")) {
      deleteIncomeEntry(id)
    }
  }

  const handleDeleteExpense = (id: number) => {
    if (confirm("Are you sure you want to delete this expense entry?")) {
      deleteExpenseEntry(id)
    }
  }

  const handleCloseIncomeForm = () => {
    setShowIncomeForm(false)
    setEditingIncome(null)
  }

  const handleCloseExpenseForm = () => {
    setShowExpenseForm(false)
    setEditingExpense(null)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getPropertyName = (propertyId?: number) => {
    if (!propertyId) return "General"
    const property = properties.find((p) => p.id === propertyId)
    return property?.name || "Unknown Property"
  }

  // Calculate category breakdowns
  const incomeByCategoryData = incomeCategories
    .map((category) => ({
      category,
      amount: incomeEntries
        .filter((entry) => entry.category === category)
        .reduce((sum, entry) => sum + entry.amount, 0),
    }))
    .sort((a, b) => b.amount - a.amount)

  const expensesByCategoryData = expenseCategories
    .map((category) => ({
      category,
      amount: expenseEntries
        .filter((entry) => entry.category === category)
        .reduce((sum, entry) => sum + entry.amount, 0),
    }))
    .sort((a, b) => b.amount - a.amount)

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white">
        <h1 className="text-xl font-semibold">Financial Management</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm">
            <PieChart className="h-4 w-4 mr-2" />
            Reports
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowExpenseForm(true)}>
            <TrendingDown className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
          <Button size="sm" onClick={() => setShowIncomeForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Income
          </Button>
        </div>
      </header>

      <main className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Financial Overview</h2>
            <p className="text-muted-foreground">Track income, expenses, and financial performance</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
              <p className="text-xs text-muted-foreground">{incomeEntries.length} entries</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
              <p className="text-xs text-muted-foreground">{expenseEntries.length} entries</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Income</CardTitle>
              <DollarSign className={`h-4 w-4 ${netIncome >= 0 ? "text-green-500" : "text-red-500"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(netIncome)}
              </div>
              <p className="text-xs text-muted-foreground">{netIncome >= 0 ? "Profit" : "Loss"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expense Ratio</CardTitle>
              <PieChart className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Of total income</p>
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdowns */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Income by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              {incomeByCategoryData.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No income entries yet</p>
              ) : (
                <div className="space-y-3">
                  {incomeByCategoryData.map((item) => (
                    <div key={item.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">{item.category}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{formatCurrency(item.amount)}</div>
                        <div className="text-xs text-muted-foreground">
                          {totalIncome > 0 ? Math.round((item.amount / totalIncome) * 100) : 0}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
                Expenses by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expensesByCategoryData.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No expense entries yet</p>
              ) : (
                <div className="space-y-3">
                  {expensesByCategoryData.map((item) => (
                    <div key={item.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm font-medium">{item.category}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{formatCurrency(item.amount)}</div>
                        <div className="text-xs text-muted-foreground">
                          {totalExpenses > 0 ? Math.round((item.amount / totalExpenses) * 100) : 0}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Types</SelectItem>
              <SelectItem value="Income">Income Only</SelectItem>
              <SelectItem value="Expenses">Expenses Only</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              {allCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Transactions */}
        <div className="space-y-6">
          {/* Income Entries */}
          {(typeFilter === "All" || typeFilter === "Income") && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Income Entries
                {filteredIncomeEntries.length > 0 && <Badge variant="outline">{filteredIncomeEntries.length}</Badge>}
              </h3>

              {filteredIncomeEntries.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                    <h4 className="text-lg font-medium mb-2">No Income Entries</h4>
                    <p className="text-muted-foreground text-center mb-4">
                      {searchTerm || categoryFilter !== "All"
                        ? "No income entries match your current filters."
                        : "Start tracking your income by adding your first entry."}
                    </p>
                    {!searchTerm && categoryFilter === "All" && (
                      <Button onClick={() => setShowIncomeForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Income
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {filteredIncomeEntries.map((income) => (
                    <Card key={income.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{income.description}</h4>
                              <Badge variant="outline" className="text-green-700 border-green-200">
                                {income.category}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Source: {income.source}</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(income.date)}
                              </span>
                              <span>Property: {getPropertyName(income.propertyId)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right mr-4">
                              <div className="text-lg font-semibold text-green-600">
                                {formatCurrency(income.amount)}
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleEditIncome(income)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteIncome(income.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Expense Entries */}
          {(typeFilter === "All" || typeFilter === "Expenses") && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
                Expense Entries
                {filteredExpenseEntries.length > 0 && <Badge variant="outline">{filteredExpenseEntries.length}</Badge>}
              </h3>

              {filteredExpenseEntries.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <TrendingDown className="h-12 w-12 text-muted-foreground mb-4" />
                    <h4 className="text-lg font-medium mb-2">No Expense Entries</h4>
                    <p className="text-muted-foreground text-center mb-4">
                      {searchTerm || categoryFilter !== "All"
                        ? "No expense entries match your current filters."
                        : "Start tracking your expenses by adding your first entry."}
                    </p>
                    {!searchTerm && categoryFilter === "All" && (
                      <Button onClick={() => setShowExpenseForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Expense
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {filteredExpenseEntries.map((expense) => (
                    <Card key={expense.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{expense.description}</h4>
                              <Badge variant="outline" className="text-red-700 border-red-200">
                                {expense.category}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Vendor: {expense.vendor}</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(expense.date)}
                              </span>
                              <span>Property: {getPropertyName(expense.propertyId)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right mr-4">
                              <div className="text-lg font-semibold text-red-600">{formatCurrency(expense.amount)}</div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleEditExpense(expense)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteExpense(expense.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Forms */}
        {showIncomeForm && <FinancialForms type="income" onClose={handleCloseIncomeForm} initialData={editingIncome} />}

        {showExpenseForm && (
          <FinancialForms type="expense" onClose={handleCloseExpenseForm} initialData={editingExpense} />
        )}
      </main>
    </div>
  )
}
