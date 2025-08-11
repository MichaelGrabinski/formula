"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Types
export interface Property {
  id: number
  name: string
  address: string
  type: string
  value: number
  monthlyRent?: number
  tenantName?: string
  tenantContact?: string
  leaseStart?: string
  leaseEnd?: string
  status: string
  description?: string
  bedrooms?: number
  bathrooms?: number
  squareFeet?: number
  yearBuilt?: number
  lastInspection?: string
  nextInspection?: string
  purchasePrice: number
  currentValue: number
  purchaseDate: string
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
  mortgage?: {
    lender: string
    balance: number
    monthlyPayment: number
    interestRate: number
    maturityDate: string
  }
}

export interface Unit {
  id: number
  propertyId: number
  unitNumber: string
  bedrooms: number
  bathrooms: number
  squareFeet: number
  monthlyRent: number
  isOccupied: boolean
  images?: string[]
}

export interface Tenant {
  id: number
  unitId: number
  propertyId: number
  firstName: string
  lastName: string
  email: string
  phone: string
  leaseStart: string
  leaseEnd: string
  monthlyRent: number
  securityDeposit: number
  isActive: boolean
}

export interface Asset {
  id: number
  name: string
  category: string
  value: number
  purchaseDate: string
  condition: string
  location?: string
  description?: string
  serialNumber?: string
  warrantyExpiration?: string
  lastMaintenance?: string
  nextMaintenance?: string
  depreciationRate?: number
  currentValue?: number
  purchasePrice: number
  images?: string[]
}

export interface Repair {
  id: number
  propertyId?: number
  assetId?: number
  title: string
  description: string
  priority: string
  status: string
  cost?: number
  scheduledDate?: string
  completedDate?: string
  contractor?: string
  contractorContact?: string
  notes?: string
  category: string
  estimatedHours?: number
  actualHours?: number
  materials?: string
  beforePhotos?: string[]
  afterPhotos?: string[]
  warrantyInfo?: string
}

export interface Document {
  id: number
  name: string
  type: string
  category: string
  uploadDate: string
  size: number
  propertyId?: number
  assetId?: number
  repairId?: number
  url?: string
  description?: string
  tags?: string[]
  expirationDate?: string
  isImportant?: boolean
}

export interface Transaction {
  id: number
  type: string
  category: string
  amount: number
  date: string
  description: string
  propertyId?: number
  assetId?: number
  repairId?: number
  paymentMethod?: string
  reference?: string
  taxDeductible?: boolean
  receipt?: string
}

// Financial entry types for the financial page
export interface IncomeEntry {
  id: number
  description: string
  amount: number
  category: string
  source: string
  date: string
  propertyId?: number
}

export interface ExpenseEntry {
  id: number
  description: string
  amount: number
  category: string
  vendor: string
  date: string
  propertyId?: number
}

export interface Project {
  id: number
  title: string
  description: string
  status: string
  priority: string
  startDate?: string
  dueDate?: string
  completedDate?: string
  estimatedHours?: number
  actualHours?: number
  estimatedCost?: number
  actualCost?: number
  propertyId?: number
  assetId?: number
  category?: string
  assignedTo?: string
  progress?: number
  notes?: string
  tags?: string[]
}

export interface Task {
  id: number
  projectId?: number
  title: string
  description: string
  status: string
  priority: string
  estimatedHours?: number
  actualHours?: number
  estimatedCost?: number
  actualCost?: number
  assignedTo?: string
  dueDate?: string
  completedDate?: string
  materialsNeeded?: string
  category?: string
  dependencies?: number[]
  progress?: number
  notes?: string
  enhancement?: any
  enhancedAt?: string
}

// Legacy types for backward compatibility
export interface Expense {
  id: number
  name: string
  category: string
  amount: number
  expenseDate: string
  propertyId?: number
  projectId?: number
  isRecurring: boolean
  frequency?: string
  description?: string
}

// Context
interface DataContextType {
  // Data
  properties: Property[]
  assets: Asset[]
  repairs: Repair[]
  documents: Document[]
  transactions: Transaction[]
  projects: Project[]
  tasks: Task[]
  expenses: Expense[] // For backward compatibility
  units: Unit[]
  tenants: Tenant[]
  incomeEntries: IncomeEntry[]
  expenseEntries: ExpenseEntry[]

  // Property methods
  addProperty: (property: Omit<Property, "id">) => void
  updateProperty: (id: number, updates: Partial<Property>) => void
  deleteProperty: (id: number) => void
  getProperty: (id: number) => Property | undefined

  // Asset methods
  addAsset: (asset: Omit<Asset, "id">) => void
  updateAsset: (id: number, updates: Partial<Asset>) => void
  deleteAsset: (id: number) => void
  getAsset: (id: number) => Asset | undefined

  // Unit methods
  addUnit: (unit: Omit<Unit, "id">) => number
  updateUnit: (id: number, updates: Partial<Unit>) => void
  deleteUnit: (id: number) => void
  getUnit: (id: number) => Unit | undefined
  getUnitsForProperty: (propertyId: number) => Unit[]

  // Tenant methods
  addTenant: (tenant: Omit<Tenant, "id">) => void
  updateTenant: (id: number, updates: Partial<Tenant>) => void
  deleteTenant: (id: number) => void
  getTenant: (id: number) => Tenant | undefined
  getTenantsForProperty: (propertyId: number) => Tenant[]
  getTenantForUnit: (unitId: number) => Tenant | undefined

  // Financial methods
  addIncomeEntry: (income: Omit<IncomeEntry, "id">) => void
  updateIncomeEntry: (id: number, updates: Partial<IncomeEntry>) => void
  deleteIncomeEntry: (id: number) => void
  addExpenseEntry: (expense: Omit<ExpenseEntry, "id">) => void
  updateExpenseEntry: (id: number, updates: Partial<ExpenseEntry>) => void
  deleteExpenseEntry: (id: number) => void

  // Repair methods
  addRepair: (repair: Omit<Repair, "id">) => void
  updateRepair: (id: number, updates: Partial<Repair>) => void
  deleteRepair: (id: number) => void
  getRepair: (id: number) => Repair | undefined

  // Document methods
  addDocument: (document: Omit<Document, "id">) => void
  updateDocument: (id: number, updates: Partial<Document>) => void
  deleteDocument: (id: number) => void
  getDocument: (id: number) => Document | undefined

  // Transaction methods
  addTransaction: (transaction: Omit<Transaction, "id">) => void
  updateTransaction: (id: number, updates: Partial<Transaction>) => void
  deleteTransaction: (id: number) => void
  getTransaction: (id: number) => Transaction | undefined

  // Project methods
  addProject: (project: Omit<Project, "id">) => void
  updateProject: (id: number, updates: Partial<Project>) => void
  deleteProject: (id: number) => void
  getProject: (id: number) => Project | undefined

  // Task methods
  addTask: (task: Omit<Task, "id">) => void
  updateTask: (id: number, updates: Partial<Task>) => void
  deleteTask: (id: number) => void
  getTask: (id: number) => Task | undefined

  // Property-specific utility methods
  getPropertyExpenses: (propertyId: number) => number
  getPropertyMonthlyIncome: (propertyId: number) => number

  // Utility methods
  getActiveTasks: () => Task[]
  getOverdueTasks: () => Task[]
  getUpcomingTasks: () => Task[]
  getActiveProjects: () => Project[]
  getOverdueProjects: () => Project[]
  getRecentTransactions: (limit?: number) => Transaction[]
  getPropertyRepairs: (propertyId: number) => Repair[]
  getAssetRepairs: (assetId: number) => Repair[]
  getProjectTasks: (projectId: number) => Task[]
  getTotalPropertyValue: () => number
  getTotalAssetValue: () => number
  getMonthlyIncome: () => number
  getMonthlyExpenses: () => number
}

const DataContext = createContext<DataContextType | undefined>(undefined)

// Sample data
const sampleProperties: Property[] = [
  {
    id: 1,
    name: "Main Residence",
    address: "123 Main St, Anytown, ST 12345",
    type: "Single Family Home",
    value: 450000,
    purchasePrice: 420000,
    currentValue: 450000,
    purchaseDate: "2020-01-15",
    status: "Owner Occupied",
    bedrooms: 4,
    bathrooms: 3,
    squareFeet: 2400,
    yearBuilt: 2010,
    lastInspection: "2024-01-15",
    nextInspection: "2025-01-15",
    images: [],
    insurance: {
      provider: "State Farm",
      policyNumber: "SF-123456789",
      expirationDate: "2024-12-31",
      annualPremium: 1200,
    },
    taxes: {
      annualAmount: 5400,
      lastPaid: "2024-01-01",
      nextDue: "2025-01-01",
    },
  },
  {
    id: 2,
    name: "Rental Property #1",
    address: "456 Oak Ave, Somewhere, ST 67890",
    type: "Duplex",
    value: 320000,
    purchasePrice: 300000,
    currentValue: 320000,
    purchaseDate: "2019-06-01",
    monthlyRent: 2400,
    tenantName: "John & Jane Smith",
    tenantContact: "(555) 123-4567",
    leaseStart: "2024-01-01",
    leaseEnd: "2024-12-31",
    status: "Rented",
    bedrooms: 6,
    bathrooms: 4,
    squareFeet: 1800,
    yearBuilt: 1995,
    images: [],
  },
]

const sampleUnits: Unit[] = [
  {
    id: 1,
    propertyId: 2,
    unitNumber: "A",
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 900,
    monthlyRent: 1200,
    isOccupied: true,
    images: [],
  },
  {
    id: 2,
    propertyId: 2,
    unitNumber: "B",
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 900,
    monthlyRent: 1200,
    isOccupied: true,
    images: [],
  },
]

const sampleTenants: Tenant[] = [
  {
    id: 1,
    unitId: 1,
    propertyId: 2,
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@email.com",
    phone: "(555) 123-4567",
    leaseStart: "2024-01-01",
    leaseEnd: "2024-12-31",
    monthlyRent: 1200,
    securityDeposit: 1200,
    isActive: true,
  },
  {
    id: 2,
    unitId: 2,
    propertyId: 2,
    firstName: "Jane",
    lastName: "Doe",
    email: "jane.doe@email.com",
    phone: "(555) 987-6543",
    leaseStart: "2024-01-01",
    leaseEnd: "2024-12-31",
    monthlyRent: 1200,
    securityDeposit: 1200,
    isActive: true,
  },
]

const sampleIncomeEntries: IncomeEntry[] = [
  {
    id: 1,
    description: "January Rent - Unit A",
    amount: 1200,
    category: "Rental Income",
    source: "John Smith",
    date: "2024-01-01",
    propertyId: 2,
  },
  {
    id: 2,
    description: "January Rent - Unit B",
    amount: 1200,
    category: "Rental Income",
    source: "Jane Doe",
    date: "2024-01-01",
    propertyId: 2,
  },
  {
    id: 3,
    description: "Security Deposit - Unit A",
    amount: 1200,
    category: "Security Deposit",
    source: "John Smith",
    date: "2024-01-01",
    propertyId: 2,
  },
]

const sampleExpenseEntries: ExpenseEntry[] = [
  {
    id: 1,
    description: "Plumbing repair - Kitchen faucet",
    amount: 150,
    category: "Maintenance",
    vendor: "ABC Plumbing",
    date: "2024-01-15",
    propertyId: 1,
  },
  {
    id: 2,
    description: "Property insurance premium",
    amount: 100,
    category: "Insurance",
    vendor: "State Farm",
    date: "2024-01-01",
    propertyId: 1,
  },
  {
    id: 3,
    description: "Property tax payment",
    amount: 450,
    category: "Taxes",
    vendor: "City Tax Office",
    date: "2024-01-01",
    propertyId: 1,
  },
]

const sampleAssets: Asset[] = [
  {
    id: 1,
    name: "2020 Honda Civic",
    category: "Vehicle",
    value: 22000,
    purchasePrice: 25000,
    currentValue: 22000,
    purchaseDate: "2020-03-15",
    condition: "Good",
    location: "Garage",
    serialNumber: "1HGBH41JXMN109186",
    lastMaintenance: "2024-01-15",
    nextMaintenance: "2024-07-15",
    images: [],
  },
  {
    id: 2,
    name: "Riding Lawn Mower",
    category: "Equipment",
    value: 3500,
    purchasePrice: 3500,
    currentValue: 3200,
    purchaseDate: "2022-04-20",
    condition: "Excellent",
    location: "Shed",
    warrantyExpiration: "2025-04-20",
    images: [],
  },
]

const sampleRepairs: Repair[] = [
  {
    id: 1,
    propertyId: 1,
    title: "Fix Leaky Faucet",
    description: "Kitchen faucet is dripping constantly",
    priority: "Medium",
    status: "Scheduled",
    cost: 150,
    scheduledDate: "2024-02-15",
    contractor: "ABC Plumbing",
    contractorContact: "(555) 987-6543",
    category: "Plumbing",
    estimatedHours: 2,
  },
  {
    id: 2,
    assetId: 1,
    title: "Oil Change",
    description: "Regular maintenance oil change",
    priority: "Low",
    status: "Completed",
    cost: 45,
    completedDate: "2024-01-15",
    category: "Maintenance",
    actualHours: 0.5,
  },
]

const sampleDocuments: Document[] = [
  {
    id: 1,
    name: "Property Deed - Main Residence",
    type: "PDF",
    category: "Legal",
    uploadDate: "2024-01-01",
    size: 2048000,
    propertyId: 1,
    isImportant: true,
  },
  {
    id: 2,
    name: "Car Insurance Policy",
    type: "PDF",
    category: "Insurance",
    uploadDate: "2024-01-01",
    size: 1024000,
    assetId: 1,
    expirationDate: "2024-12-31",
  },
]

const sampleTransactions: Transaction[] = [
  {
    id: 1,
    type: "Income",
    category: "Rental Income",
    amount: 2400,
    date: "2024-02-01",
    description: "Monthly rent - Rental Property #1",
    propertyId: 2,
    paymentMethod: "Bank Transfer",
  },
  {
    id: 2,
    type: "Expense",
    category: "Maintenance",
    amount: 150,
    date: "2024-02-15",
    description: "Plumbing repair - Kitchen faucet",
    propertyId: 1,
    repairId: 1,
    taxDeductible: true,
  },
  {
    id: 3,
    type: "Expense",
    category: "Property Tax",
    amount: 450,
    date: "2024-01-15",
    description: "Monthly property tax payment",
    propertyId: 1,
  },
  {
    id: 4,
    type: "Expense",
    category: "Insurance",
    amount: 280,
    date: "2024-01-10",
    description: "Property insurance premium",
  },
]

const sampleProjects: Project[] = [
  {
    id: 1,
    title: "Kitchen Renovation",
    description: "Complete kitchen remodel including cabinets, countertops, and appliances",
    status: "Planning",
    priority: "High",
    startDate: "2024-03-01",
    dueDate: "2024-05-15",
    estimatedHours: 120,
    estimatedCost: 25000,
    propertyId: 1,
    category: "Renovation",
    progress: 15,
  },
  {
    id: 2,
    title: "Car Maintenance Schedule",
    description: "Regular maintenance and inspection schedule for 2020 Honda Civic",
    status: "In Progress",
    priority: "Medium",
    startDate: "2024-01-01",
    estimatedCost: 800,
    assetId: 1,
    category: "Maintenance",
    progress: 60,
  },
]

const sampleTasks: Task[] = [
  {
    id: 1,
    projectId: 1,
    title: "Design Kitchen Layout",
    description: "Create detailed kitchen layout with measurements and appliance placement",
    status: "Completed",
    priority: "High",
    estimatedHours: 8,
    actualHours: 6,
    completedDate: "2024-02-10",
    category: "Planning",
  },
  {
    id: 2,
    projectId: 1,
    title: "Order Kitchen Cabinets",
    description: "Place order for custom kitchen cabinets based on approved design",
    status: "In Progress",
    priority: "High",
    estimatedHours: 4,
    estimatedCost: 8000,
    dueDate: "2024-02-20",
    category: "Procurement",
  },
  {
    id: 3,
    projectId: 2,
    title: "Oil Change",
    description: "Regular oil change and filter replacement",
    status: "Completed",
    priority: "Medium",
    estimatedHours: 1,
    actualHours: 0.5,
    estimatedCost: 45,
    actualCost: 45,
    completedDate: "2024-01-15",
    category: "Maintenance",
  },
  {
    id: 4,
    title: "Fix Garage Door",
    description: "Repair garage door opener mechanism",
    status: "Todo",
    priority: "Medium",
    estimatedHours: 3,
    estimatedCost: 200,
    dueDate: "2024-02-25",
    category: "Repair",
  },
]

// Legacy expenses for backward compatibility
const sampleExpenses: Expense[] = [
  {
    id: 1,
    name: "Property Tax - Main Residence",
    category: "Taxes",
    amount: 450,
    expenseDate: "2024-01-15",
    propertyId: 1,
    isRecurring: true,
    frequency: "Monthly",
  },
  {
    id: 2,
    name: "Insurance Premium",
    category: "Insurance",
    amount: 280,
    expenseDate: "2024-01-10",
    isRecurring: true,
    frequency: "Monthly",
  },
  {
    id: 3,
    name: "Plumbing Repair",
    category: "Maintenance",
    amount: 150,
    expenseDate: "2024-02-15",
    propertyId: 1,
    isRecurring: false,
  },
]

// Provider component
export function DataProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<Property[]>(sampleProperties)
  const [assets, setAssets] = useState<Asset[]>(sampleAssets)
  const [repairs, setRepairs] = useState<Repair[]>(sampleRepairs)
  const [documents, setDocuments] = useState<Document[]>(sampleDocuments)
  const [transactions, setTransactions] = useState<Transaction[]>(sampleTransactions)
  const [projects, setProjects] = useState<Project[]>(sampleProjects)
  const [tasks, setTasks] = useState<Task[]>(sampleTasks)
  const [expenses] = useState<Expense[]>(sampleExpenses) // Legacy support
  const [units, setUnits] = useState<Unit[]>(sampleUnits)
  const [tenants, setTenants] = useState<Tenant[]>(sampleTenants)
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>(sampleIncomeEntries)
  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>(sampleExpenseEntries)

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem("personalManagementData")
    if (savedData) {
      try {
        const data = JSON.parse(savedData)
        if (data.properties) setProperties(data.properties)
        if (data.assets) setAssets(data.assets)
        if (data.repairs) setRepairs(data.repairs)
        if (data.documents) setDocuments(data.documents)
        if (data.transactions) setTransactions(data.transactions)
        if (data.projects) setProjects(data.projects)
        if (data.tasks) setTasks(data.tasks)
        if (data.units) setUnits(data.units)
        if (data.tenants) setTenants(data.tenants)
        if (data.incomeEntries) setIncomeEntries(data.incomeEntries)
        if (data.expenseEntries) setExpenseEntries(data.expenseEntries)
      } catch (error) {
        console.error("Error loading saved data:", error)
      }
    }
  }, [])

  // Save data to localStorage whenever state changes
  useEffect(() => {
    const dataToSave = {
      properties,
      assets,
      repairs,
      documents,
      transactions,
      projects,
      tasks,
      units,
      tenants,
      incomeEntries,
      expenseEntries,
    }
    localStorage.setItem("personalManagementData", JSON.stringify(dataToSave))
  }, [
    properties,
    assets,
    repairs,
    documents,
    transactions,
    projects,
    tasks,
    units,
    tenants,
    incomeEntries,
    expenseEntries,
  ])

  // Property methods
  const addProperty = (property: Omit<Property, "id">) => {
    const newProperty = { ...property, id: Date.now() }
    setProperties((prev) => [...prev, newProperty])
  }

  const updateProperty = (id: number, updates: Partial<Property>) => {
    setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))
  }

  const deleteProperty = (id: number) => {
    setProperties((prev) => prev.filter((p) => p.id !== id))
  }

  const getProperty = (id: number) => {
    return properties.find((p) => p.id === id)
  }

  // Asset methods
  const addAsset = (asset: Omit<Asset, "id">) => {
    const newAsset = { ...asset, id: Date.now() }
    setAssets((prev) => [...prev, newAsset])
  }

  const updateAsset = (id: number, updates: Partial<Asset>) => {
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)))
  }

  const deleteAsset = (id: number) => {
    setAssets((prev) => prev.filter((a) => a.id !== id))
  }

  const getAsset = (id: number) => {
    return assets.find((a) => a.id === id)
  }

  // Unit methods
  const addUnit = (unit: Omit<Unit, "id">) => {
    const newUnit = { ...unit, id: Date.now() }
    setUnits((prev) => [...prev, newUnit])
    return newUnit.id
  }

  const updateUnit = (id: number, updates: Partial<Unit>) => {
    setUnits((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)))
  }

  const deleteUnit = (id: number) => {
    setUnits((prev) => prev.filter((u) => u.id !== id))
  }

  const getUnit = (id: number) => {
    return units.find((u) => u.id === id)
  }

  const getUnitsForProperty = (propertyId: number) => {
    return units.filter((unit) => unit.propertyId === propertyId)
  }

  // Tenant methods
  const addTenant = (tenant: Omit<Tenant, "id">) => {
    const newTenant = { ...tenant, id: Date.now() }
    setTenants((prev) => [...prev, newTenant])
  }

  const updateTenant = (id: number, updates: Partial<Tenant>) => {
    setTenants((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)))
  }

  const deleteTenant = (id: number) => {
    setTenants((prev) => prev.filter((t) => t.id !== id))
  }

  const getTenant = (id: number) => {
    return tenants.find((t) => t.id === id)
  }

  const getTenantsForProperty = (propertyId: number) => {
    return tenants.filter((tenant) => tenant.propertyId === propertyId)
  }

  const getTenantForUnit = (unitId: number) => {
    return tenants.find((tenant) => tenant.unitId === unitId)
  }

  // Financial methods
  const addIncomeEntry = (income: Omit<IncomeEntry, "id">) => {
    const newIncome = { ...income, id: Date.now() }
    setIncomeEntries((prev) => [...prev, newIncome])
  }

  const updateIncomeEntry = (id: number, updates: Partial<IncomeEntry>) => {
    setIncomeEntries((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)))
  }

  const deleteIncomeEntry = (id: number) => {
    setIncomeEntries((prev) => prev.filter((i) => i.id !== id))
  }

  const addExpenseEntry = (expense: Omit<ExpenseEntry, "id">) => {
    const newExpense = { ...expense, id: Date.now() }
    setExpenseEntries((prev) => [...prev, newExpense])
  }

  const updateExpenseEntry = (id: number, updates: Partial<ExpenseEntry>) => {
    setExpenseEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)))
  }

  const deleteExpenseEntry = (id: number) => {
    setExpenseEntries((prev) => prev.filter((e) => e.id !== id))
  }

  // Repair methods
  const addRepair = (repair: Omit<Repair, "id">) => {
    const newRepair = { ...repair, id: Date.now() }
    setRepairs((prev) => [...prev, newRepair])
  }

  const updateRepair = (id: number, updates: Partial<Repair>) => {
    setRepairs((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)))
  }

  const deleteRepair = (id: number) => {
    setRepairs((prev) => prev.filter((r) => r.id !== id))
  }

  const getRepair = (id: number) => {
    return repairs.find((r) => r.id === id)
  }

  // Document methods
  const addDocument = (document: Omit<Document, "id">) => {
    const newDocument = { ...document, id: Date.now() }
    setDocuments((prev) => [...prev, newDocument])
  }

  const updateDocument = (id: number, updates: Partial<Document>) => {
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)))
  }

  const deleteDocument = (id: number) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }

  const getDocument = (id: number) => {
    return documents.find((d) => d.id === id)
  }

  // Transaction methods
  const addTransaction = (transaction: Omit<Transaction, "id">) => {
    const newTransaction = { ...transaction, id: Date.now() }
    setTransactions((prev) => [...prev, newTransaction])
  }

  const updateTransaction = (id: number, updates: Partial<Transaction>) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)))
  }

  const deleteTransaction = (id: number) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }

  const getTransaction = (id: number) => {
    return transactions.find((t) => t.id === id)
  }

  // Project methods
  const addProject = (project: Omit<Project, "id">) => {
    const newProject = { ...project, id: Date.now() }
    setProjects((prev) => [...prev, newProject])
  }

  const updateProject = (id: number, updates: Partial<Project>) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))
  }

  const deleteProject = (id: number) => {
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }

  const getProject = (id: number) => {
    return projects.find((p) => p.id === id)
  }

  // Task methods
  const addTask = (task: Omit<Task, "id">) => {
    const newTask = { ...task, id: Date.now() }
    setTasks((prev) => [...prev, newTask])
  }

  const updateTask = (id: number, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)))
  }

  const deleteTask = (id: number) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const getTask = (id: number) => {
    return tasks.find((t) => t.id === id)
  }

  // Property-specific utility methods
  const getPropertyExpenses = (propertyId: number) => {
    const currentMonth = new Date().toISOString().slice(0, 7)
    return transactions
      .filter((t) => t.type === "Expense" && t.propertyId === propertyId && t.date.startsWith(currentMonth))
      .reduce((total, t) => total + t.amount, 0)
  }

  const getPropertyMonthlyIncome = (propertyId: number) => {
    const propertyUnits = getUnitsForProperty(propertyId)
    return propertyUnits.filter((unit) => unit.isOccupied).reduce((total, unit) => total + unit.monthlyRent, 0)
  }

  // Utility methods
  const getActiveTasks = () => {
    return tasks.filter((task) => task.status !== "Completed")
  }

  const getOverdueTasks = () => {
    const today = new Date().toISOString().split("T")[0]
    return tasks.filter((task) => task.status !== "Completed" && task.dueDate && task.dueDate < today)
  }

  const getUpcomingTasks = () => {
    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    return tasks.filter((task) => task.status !== "Completed" && task.dueDate && task.dueDate <= nextWeek)
  }

  const getActiveProjects = () => {
    return projects.filter((project) => project.status !== "Completed")
  }

  const getOverdueProjects = () => {
    const today = new Date().toISOString().split("T")[0]
    return projects.filter((project) => project.status !== "Completed" && project.dueDate && project.dueDate < today)
  }

  const getRecentTransactions = (limit = 10) => {
    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit)
  }

  const getPropertyRepairs = (propertyId: number) => {
    return repairs.filter((repair) => repair.propertyId === propertyId)
  }

  const getAssetRepairs = (assetId: number) => {
    return repairs.filter((repair) => repair.assetId === assetId)
  }

  const getProjectTasks = (projectId: number) => {
    return tasks.filter((task) => task.projectId === projectId)
  }

  const getTotalPropertyValue = () => {
    return properties.reduce((total, property) => total + property.value, 0)
  }

  const getTotalAssetValue = () => {
    return assets.reduce((total, asset) => total + asset.value, 0)
  }

  const getMonthlyIncome = () => {
    return properties.reduce((total, property) => total + (property.monthlyRent || 0), 0)
  }

  const getMonthlyExpenses = () => {
    const currentMonth = new Date().toISOString().slice(0, 7)
    return transactions
      .filter((t) => t.type === "Expense" && t.date.startsWith(currentMonth))
      .reduce((total, t) => total + t.amount, 0)
  }

  const value: DataContextType = {
    // Data
    properties,
    assets,
    repairs,
    documents,
    transactions,
    projects,
    tasks,
    expenses, // Legacy support
    units,
    tenants,
    incomeEntries,
    expenseEntries,

    // Property methods
    addProperty,
    updateProperty,
    deleteProperty,
    getProperty,

    // Asset methods
    addAsset,
    updateAsset,
    deleteAsset,
    getAsset,

    // Unit methods
    addUnit,
    updateUnit,
    deleteUnit,
    getUnit,
    getUnitsForProperty,

    // Tenant methods
    addTenant,
    updateTenant,
    deleteTenant,
    getTenant,
    getTenantsForProperty,
    getTenantForUnit,

    // Financial methods
    addIncomeEntry,
    updateIncomeEntry,
    deleteIncomeEntry,
    addExpenseEntry,
    updateExpenseEntry,
    deleteExpenseEntry,

    // Repair methods
    addRepair,
    updateRepair,
    deleteRepair,
    getRepair,

    // Document methods
    addDocument,
    updateDocument,
    deleteDocument,
    getDocument,

    // Transaction methods
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getTransaction,

    // Project methods
    addProject,
    updateProject,
    deleteProject,
    getProject,

    // Task methods
    addTask,
    updateTask,
    deleteTask,
    getTask,

    // Property-specific utility methods
    getPropertyExpenses,
    getPropertyMonthlyIncome,

    // Utility methods
    getActiveTasks,
    getOverdueTasks,
    getUpcomingTasks,
    getActiveProjects,
    getOverdueProjects,
    getRecentTransactions,
    getPropertyRepairs,
    getAssetRepairs,
    getProjectTasks,
    getTotalPropertyValue,
    getTotalAssetValue,
    getMonthlyIncome,
    getMonthlyExpenses,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

// Hook to use the data context
export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}

// Export alias for backward compatibility
export const useDataStore = useData
export const DataStoreProvider = DataProvider
