"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Import types from the original data store
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

// Context type
interface AzureDataContextType {
  // Data
  properties: Property[]
  assets: Asset[]
  repairs: Repair[]
  documents: Document[]
  transactions: Transaction[]
  projects: Project[]
  tasks: Task[]
  units: Unit[]
  tenants: Tenant[]
  incomeEntries: IncomeEntry[]
  expenseEntries: ExpenseEntry[]

  // State
  isLoading: boolean
  isInitialized: boolean
  isAzureConnected: boolean
  lastSyncTime: Date | null
  syncStatus: "idle" | "syncing" | "error" | "success"

  // Methods
  addProperty: (property: Omit<Property, "id">) => Promise<void>
  updateProperty: (id: number, updates: Partial<Property>) => Promise<void>
  deleteProperty: (id: number) => Promise<void>
  getProperty: (id: number) => Property | undefined

  addAsset: (asset: Omit<Asset, "id">) => Promise<void>
  updateAsset: (id: number, updates: Partial<Asset>) => Promise<void>
  deleteAsset: (id: number) => Promise<void>
  getAsset: (id: number) => Asset | undefined

  addRepair: (repair: Omit<Repair, "id">) => Promise<void>
  updateRepair: (id: number, updates: Partial<Repair>) => Promise<void>
  deleteRepair: (id: number) => Promise<void>
  getRepair: (id: number) => Repair | undefined

  addProject: (project: Omit<Project, "id">) => Promise<void>
  updateProject: (id: number, updates: Partial<Project>) => Promise<void>
  deleteProject: (id: number) => Promise<void>
  getProject: (id: number) => Project | undefined

  addTask: (task: Omit<Task, "id">) => Promise<void>
  updateTask: (id: number, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: number) => Promise<void>
  getTask: (id: number) => Task | undefined

  // Unit methods
  addUnit: (unit: Omit<Unit, "id">) => Promise<void>
  updateUnit: (id: number, updates: Partial<Unit>) => Promise<void>

  // Utility methods
  getActiveTasks: () => Task[]
  getOverdueTasks: () => Task[]
  getUpcomingTasks: () => Task[]
  getActiveProjects: () => Project[]
  getOverdueProjects: () => Project[]
  getTotalPropertyValue: () => number
  getTotalAssetValue: () => number
  getMonthlyIncome: () => number
  getMonthlyExpenses: () => number

  // Sync methods
  syncToAzure: () => Promise<void>
  syncFromAzure: () => Promise<void>
  clearLocalData: () => void
}

const AzureDataContext = createContext<AzureDataContextType | undefined>(undefined)

export function AzureDataProvider({ children }: { children: ReactNode }) {
  // State
  const [properties, setProperties] = useState<Property[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [repairs, setRepairs] = useState<Repair[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>([])
  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isAzureConnected, setIsAzureConnected] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "error" | "success">("idle")

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true)

      try {
        // Check if Azure is available by making a test API call
        console.log("🔍 Checking Azure connection via API...")
        const response = await fetch("/api/azure-status")
        const { available, connected } = await response.json()

        console.log("📊 Azure status:", { available, connected })
        setIsAzureConnected(connected)

        if (connected) {
          // Initialize Azure tables first, then load data
          console.log("🏗️ Initializing Azure tables...")
          try {
            const initResponse = await fetch("/api/azure/init", { method: "POST" })
            const initResult = await initResponse.json()

            if (initResult.success) {
              console.log("✅ Azure tables initialized successfully")
              // Now load data from Azure
              console.log("🔄 Loading data from Azure...")
              await loadFromAzure()
            } else {
              console.log("❌ Failed to initialize Azure tables, using local data")
              loadLocalData()
            }
          } catch (initError) {
            console.error("💥 Error initializing Azure tables:", initError)
            loadLocalData()
          }
        } else {
          // Fallback to local data
          console.log("📂 Loading local data...")
          loadLocalData()
        }
      } catch (error) {
        console.error("💥 Failed to initialize data:", error)
        setIsAzureConnected(false)
        loadLocalData()
      } finally {
        setIsLoading(false)
        setIsInitialized(true)
      }
    }

    initializeData()
  }, [])

  // Load data from localStorage with sample data fallback
  const loadLocalData = () => {
    try {
      const savedData = localStorage.getItem("personalManagementData")
      if (savedData) {
        const data = JSON.parse(savedData)
        setProperties(data.properties || sampleProperties)
        setAssets(data.assets || sampleAssets)
        setRepairs(data.repairs || sampleRepairs)
        setProjects(data.projects || sampleProjects)
        setTasks(data.tasks || sampleTasks)
        setDocuments(data.documents || [])
        setTransactions(data.transactions || [])
        setUnits(data.units || [])
        setTenants(data.tenants || [])
        setIncomeEntries(data.incomeEntries || [])
        setExpenseEntries(data.expenseEntries || [])
      } else {
        // Use sample data
        setProperties(sampleProperties)
        setAssets(sampleAssets)
        setRepairs(sampleRepairs)
        setProjects(sampleProjects)
        setTasks(sampleTasks)
        setDocuments([])
        setTransactions([])
        setUnits([])
        setTenants([])
        setIncomeEntries([])
        setExpenseEntries([])
      }
    } catch (error) {
      console.error("💥 Error loading local data:", error)
      // Use sample data as fallback
      setProperties(sampleProperties)
      setAssets(sampleAssets)
      setRepairs(sampleRepairs)
      setProjects(sampleProjects)
      setTasks(sampleTasks)
    }
  }

  // Load data from Azure via API
  const loadFromAzure = async () => {
    try {
      const [propertiesRes, assetsRes, repairsRes, projectsRes, tasksRes] = await Promise.all([
        fetch("/api/azure/properties"),
        fetch("/api/azure/assets"),
        fetch("/api/azure/repairs"),
        fetch("/api/azure/projects"),
        fetch("/api/azure/tasks"),
      ])

      const [azureProperties, azureAssets, azureRepairs, azureProjects, azureTasks] = await Promise.all([
        propertiesRes.json(),
        assetsRes.json(),
        repairsRes.json(),
        projectsRes.json(),
        tasksRes.json(),
      ])

      // Use Azure data if available, otherwise use sample data
      setProperties(azureProperties.length > 0 ? azureProperties : sampleProperties)
      setAssets(azureAssets.length > 0 ? azureAssets : sampleAssets)
      setRepairs(azureRepairs.length > 0 ? azureRepairs : sampleRepairs)
      setProjects(azureProjects.length > 0 ? azureProjects : sampleProjects)
      setTasks(azureTasks.length > 0 ? azureTasks : sampleTasks)

      setLastSyncTime(new Date())
    } catch (error) {
      console.error("💥 Error loading from Azure:", error)
      loadLocalData()
    }
  }

  // Save to localStorage
  const saveToLocal = () => {
    try {
      const dataToSave = {
        properties,
        assets,
        repairs,
        projects,
        tasks,
        documents,
        transactions,
        units,
        tenants,
        incomeEntries,
        expenseEntries,
      }
      localStorage.setItem("personalManagementData", JSON.stringify(dataToSave))
    } catch (error) {
      console.error("💥 Error saving to localStorage:", error)
    }
  }

  // Save data whenever state changes
  useEffect(() => {
    if (isInitialized) {
      saveToLocal()
    }
  }, [
    properties,
    assets,
    repairs,
    projects,
    tasks,
    documents,
    transactions,
    units,
    tenants,
    incomeEntries,
    expenseEntries,
    isInitialized,
  ])

  // Property methods
  const addProperty = async (property: Omit<Property, "id">) => {
    const newProperty = { ...property, id: Date.now() }
    setProperties((prev) => [...prev, newProperty])

    if (isAzureConnected) {
      try {
        await fetch("/api/azure/properties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newProperty),
        })
      } catch (error) {
        console.error("💥 Failed to sync property to Azure:", error)
      }
    }
  }

  const updateProperty = async (id: number, updates: Partial<Property>) => {
    setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))

    if (isAzureConnected) {
      try {
        const property = properties.find((p) => p.id === id)
        if (property) {
          await fetch(`/api/azure/properties/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...property, ...updates }),
          })
        }
      } catch (error) {
        console.error("💥 Failed to sync property update to Azure:", error)
      }
    }
  }

  const deleteProperty = async (id: number) => {
    setProperties((prev) => prev.filter((p) => p.id !== id))

    if (isAzureConnected) {
      try {
        await fetch(`/api/azure/properties/${id}`, { method: "DELETE" })
      } catch (error) {
        console.error("💥 Failed to delete property from Azure:", error)
      }
    }
  }

  const getProperty = (id: number) => {
    return properties.find((p) => p.id === id)
  }

  // Asset methods
  const addAsset = async (asset: Omit<Asset, "id">) => {
    const newAsset = { ...asset, id: Date.now() }
    setAssets((prev) => [...prev, newAsset])

    if (isAzureConnected) {
      try {
        await fetch("/api/azure/assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newAsset),
        })
      } catch (error) {
        console.error("💥 Failed to sync asset to Azure:", error)
      }
    }
  }

  const updateAsset = async (id: number, updates: Partial<Asset>) => {
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)))

    if (isAzureConnected) {
      try {
        const asset = assets.find((a) => a.id === id)
        if (asset) {
          await fetch(`/api/azure/assets/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...asset, ...updates }),
          })
        }
      } catch (error) {
        console.error("💥 Failed to sync asset update to Azure:", error)
      }
    }
  }

  const deleteAsset = async (id: number) => {
    setAssets((prev) => prev.filter((a) => a.id !== id))

    if (isAzureConnected) {
      try {
        await fetch(`/api/azure/assets/${id}`, { method: "DELETE" })
      } catch (error) {
        console.error("💥 Failed to delete asset from Azure:", error)
      }
    }
  }

  const getAsset = (id: number) => {
    return assets.find((a) => a.id === id)
  }

  // Repair methods
  const addRepair = async (repair: Omit<Repair, "id">) => {
    const newRepair = { ...repair, id: Date.now() }
    setRepairs((prev) => [...prev, newRepair])

    if (isAzureConnected) {
      try {
        await fetch("/api/azure/repairs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newRepair),
        })
      } catch (error) {
        console.error("💥 Failed to sync repair to Azure:", error)
      }
    }
  }

  const updateRepair = async (id: number, updates: Partial<Repair>) => {
    setRepairs((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)))

    if (isAzureConnected) {
      try {
        const repair = repairs.find((r) => r.id === id)
        if (repair) {
          await fetch(`/api/azure/repairs/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...repair, ...updates }),
          })
        }
      } catch (error) {
        console.error("💥 Failed to sync repair update to Azure:", error)
      }
    }
  }

  const deleteRepair = async (id: number) => {
    setRepairs((prev) => prev.filter((r) => r.id !== id))

    if (isAzureConnected) {
      try {
        await fetch(`/api/azure/repairs/${id}`, { method: "DELETE" })
      } catch (error) {
        console.error("💥 Failed to delete repair from Azure:", error)
      }
    }
  }

  const getRepair = (id: number) => {
    return repairs.find((r) => r.id === id)
  }

  // Project methods
  const addProject = async (project: Omit<Project, "id">) => {
    const newProject = { ...project, id: Date.now() }
    setProjects((prev) => [...prev, newProject])

    if (isAzureConnected) {
      try {
        await fetch("/api/azure/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newProject),
        })
      } catch (error) {
        console.error("💥 Failed to sync project to Azure:", error)
      }
    }
  }

  const updateProject = async (id: number, updates: Partial<Project>) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))

    if (isAzureConnected) {
      try {
        const project = projects.find((p) => p.id === id)
        if (project) {
          await fetch(`/api/azure/projects/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...project, ...updates }),
          })
        }
      } catch (error) {
        console.error("💥 Failed to sync project update to Azure:", error)
      }
    }
  }

  const deleteProject = async (id: number) => {
    setProjects((prev) => prev.filter((p) => p.id !== id))

    if (isAzureConnected) {
      try {
        await fetch(`/api/azure/projects/${id}`, { method: "DELETE" })
      } catch (error) {
        console.error("💥 Failed to delete project from Azure:", error)
      }
    }
  }

  const getProject = (id: number) => {
    return projects.find((p) => p.id === id)
  }

  // Task methods
  const addTask = async (task: Omit<Task, "id">) => {
    const newTask = { ...task, id: Date.now() }
    setTasks((prev) => [...prev, newTask])

    if (isAzureConnected) {
      try {
        await fetch("/api/azure/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newTask),
        })
      } catch (error) {
        console.error("💥 Failed to sync task to Azure:", error)
      }
    }
  }

  const updateTask = async (id: number, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)))

    if (isAzureConnected) {
      try {
        const task = tasks.find((t) => t.id === id)
        if (task) {
          await fetch(`/api/azure/tasks/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...task, ...updates }),
          })
        }
      } catch (error) {
        console.error("💥 Failed to sync task update to Azure:", error)
      }
    }
  }

  const deleteTask = async (id: number) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))

    if (isAzureConnected) {
      try {
        await fetch(`/api/azure/tasks/${id}`, { method: "DELETE" })
      } catch (error) {
        console.error("💥 Failed to delete task from Azure:", error)
      }
    }
  }

  const getTask = (id: number) => {
    return tasks.find((t) => t.id === id)
  }

  // Unit methods
  const addUnit = async (unit: Omit<Unit, "id">) => {
    const newUnit = { ...unit, id: Date.now() }
    setUnits((prev) => [...prev, newUnit])
    if (isAzureConnected) {
      try {
        await fetch("/api/azure/units", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newUnit),
        })
      } catch (error) {
        console.error("💥 Failed to sync unit to Azure:", error)
      }
    }
  }

  const updateUnit = async (id: number, updates: Partial<Unit>) => {
    setUnits((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)))
    if (isAzureConnected) {
      try {
        const unit = units.find((u) => u.id === id)
        if (unit) {
          await fetch(`/api/azure/units/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...unit, ...updates }),
          })
        }
      } catch (error) {
        console.error("💥 Failed to sync unit update to Azure:", error)
      }
    }
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

  const getTotalPropertyValue = () => {
    return properties.reduce((sum, property) => sum + (property.currentValue || property.value || 0), 0)
  }

  const getTotalAssetValue = () => {
    return assets.reduce((sum, asset) => sum + (asset.currentValue || asset.value || 0), 0)
  }

  const getMonthlyIncome = () => {
    // Sum monthlyRent from all occupied units and tenants
    const unitIncome = units.filter((unit) => unit.isOccupied).reduce((total, unit) => total + (unit.monthlyRent || 0), 0)
    const tenantIncome = tenants.filter((tenant) => tenant.isActive).reduce((total, tenant) => total + (tenant.monthlyRent || 0), 0)
    return unitIncome + tenantIncome
  }

  const getMonthlyExpenses = () => {
    // Sum all transactions of type 'Expense' for the current month
    const currentMonth = new Date().toISOString().slice(0, 7)
    return transactions.filter((t) => t.type === "Expense" && t.date.startsWith(currentMonth)).reduce((total, t) => total + t.amount, 0)
  }

  // Sync methods
  const syncToAzure = async () => {
    // Implement Azure sync logic here
    // ...
  }

  const syncFromAzure = async () => {
    // Implement Azure sync logic here
    // ...
  }

  const clearLocalData = () => {
    localStorage.removeItem("personalManagementData")
    loadLocalData()
  }

  const value: AzureDataContextType = {
    // Data
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

    // State
    isLoading,
    isInitialized,
    isAzureConnected,
    lastSyncTime,
    syncStatus,

    // Methods
    addProperty,
    updateProperty,
    deleteProperty,
    getProperty,
    addAsset,
    updateAsset,
    deleteAsset,
    getAsset,
    addRepair,
    updateRepair,
    deleteRepair,
    getRepair,
    addProject,
    updateProject,
    deleteProject,
    getProject,
    addTask,
    updateTask,
    deleteTask,
    getTask,
    addUnit,
    updateUnit,

    // Utility methods
    getActiveTasks,
    getOverdueTasks,
    getUpcomingTasks,
    getActiveProjects,
    getOverdueProjects,
    getTotalPropertyValue,
    getTotalAssetValue,
    getMonthlyIncome,
    getMonthlyExpenses,

    // Sync methods
    syncToAzure,
    syncFromAzure,
    clearLocalData,
  }

  return <AzureDataContext.Provider value={value}>{children}</AzureDataContext.Provider>
}

export function useAzureData() {
  const context = useContext(AzureDataContext)
  if (context === undefined) {
    throw new Error("useAzureData must be used within an AzureDataProvider")
  }
  return context
}
