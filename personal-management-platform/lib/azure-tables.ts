import crypto from "crypto"
import bcrypt from "bcryptjs"

export const TABLE_NAMES = {
  PROPERTIES: "Properties",
  ASSETS: "Assets",
  REPAIRS: "Repairs",
  PROJECTS: "Projects",
  TASKS: "Tasks",
  UNITS: "Units",
  TENANTS: "Tenants",
  DOCUMENTS: "Documents",
  TRANSACTIONS: "Transactions",
  INCOME: "Income",
  EXPENSES: "Expenses",
} as const

// Parse connection string to get account name and key
function parseConnectionString(connectionString: string) {
  console.log("🔧 [SERVER] Parsing connection string...")
  const parts = connectionString.split(";")
  let accountName = ""
  let accountKey = ""

  for (const part of parts) {
    if (part.startsWith("AccountName=")) {
      accountName = part.substring("AccountName=".length)
    } else if (part.startsWith("AccountKey=")) {
      accountKey = part.substring("AccountKey=".length)
    }
  }

  console.log(`📊 [SERVER] Parsed account name: ${accountName ? "✅ Found" : "❌ Not found"}`)
  console.log(`🔑 [SERVER] Parsed account key: ${accountKey ? "✅ Found" : "❌ Not found"}`)

  return { accountName, accountKey }
}

// Generate Azure Storage authentication header for Table Service
function generateAuthHeader(
  method: string,
  accountName: string,
  accountKey: string,
  canonicalizedResource: string,
  date: string,
  contentLength = "",
  contentType = "",
): string {
  // For Table service, the string to sign format is different
  const stringToSign = [
    method,
    "", // Content-MD5 (empty for most operations)
    contentType,
    date,
    canonicalizedResource,
  ].join("\n")

  console.log(`🔐 [SERVER] String to sign: ${JSON.stringify(stringToSign)}`)

  const signature = crypto
    .createHmac("sha256", Buffer.from(accountKey, "base64"))
    .update(stringToSign, "utf8")
    .digest("base64")

  const authHeader = `SharedKey ${accountName}:${signature}`
  console.log(`🔑 [SERVER] Auth header generated: ${authHeader.substring(0, 50)}...`)

  return authHeader
}

// Initialize all tables using REST API
export async function initializeTables(): Promise<boolean> {
  console.log("🏗️ [SERVER] Starting table initialization via REST API...")

  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
  if (!connectionString) {
    console.log("❌ [SERVER] No connection string available")
    return false
  }

  try {
    const { accountName, accountKey } = parseConnectionString(connectionString)
    if (!accountName || !accountKey) {
      console.error("❌ [SERVER] Invalid connection string format")
      return false
    }

    const tableNames = Object.values(TABLE_NAMES)
    console.log(`📋 [SERVER] Creating ${tableNames.length} tables:`, tableNames)

    const results = await Promise.allSettled(
      tableNames.map(async (tableName) => {
        try {
          console.log(`🔨 [SERVER] Creating table: ${tableName}`)

          const date = new Date().toUTCString()
          const canonicalizedResource = `/${accountName}/Tables`
          const body = JSON.stringify({ TableName: tableName })

          const authHeader = generateAuthHeader(
            "POST",
            accountName,
            accountKey,
            canonicalizedResource,
            date,
            body.length.toString(),
            "application/json",
          )

          const url = `https://${accountName}.table.core.windows.net/Tables`

          const response = await fetch(url, {
            method: "POST",
            headers: {
              Authorization: authHeader,
              "x-ms-date": date,
              "x-ms-version": "2020-12-06",
              "Content-Type": "application/json",
              "Content-Length": body.length.toString(),
              Accept: "application/json;odata=nometadata",
            },
            body,
          })

          if (response.ok || response.status === 409) {
            console.log(
              `✅ [SERVER] Table ${tableName} ${response.status === 409 ? "already exists" : "created successfully"}`,
            )
            return true
          } else {
            const errorText = await response.text()
            console.error(`❌ [SERVER] Failed to create table ${tableName}: ${response.status} ${errorText}`)
            return false
          }
        } catch (error) {
          console.error(`❌ [SERVER] Error creating table ${tableName}:`, error)
          return false
        }
      }),
    )

    const successful = results.filter((r) => r.status === "fulfilled" && r.value).length
    const total = results.length

    console.log(`📊 [SERVER] Table creation results: ${successful}/${total} successful`)

    if (successful === total) {
      console.log("🎉 [SERVER] All tables initialized successfully!")
      return true
    } else {
      console.log(`⚠️ [SERVER] Some tables failed to initialize (${successful}/${total})`)
      return false
    }
  } catch (error) {
    console.error("💥 [SERVER] Error during table initialization:", error)
    return false
  }
}

// Azure Table Service using REST API
export class AzureTableService<T extends Record<string, any>> {
  private accountName = ""
  private accountKey = ""
  private tableName: string
  private baseUrl = ""

  constructor(tableName: string) {
    this.tableName = tableName
    console.log(`🏗️ [SERVER] Initializing AzureTableService for table: ${tableName}`)
    this.initializeClient()
  }

  private initializeClient() {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
    if (!connectionString) {
      console.log(`❌ [SERVER] No connection string for table: ${this.tableName}`)
      return
    }

    try {
      const { accountName, accountKey } = parseConnectionString(connectionString)
      if (!accountName || !accountKey) {
        console.log(`❌ [SERVER] Invalid connection string for table: ${this.tableName}`)
        return
      }

      this.accountName = accountName
      this.accountKey = accountKey
      this.baseUrl = `https://${accountName}.table.core.windows.net`
      console.log(`✅ [SERVER] Table client initialized for: ${this.tableName}`)
    } catch (error) {
      console.error(`💥 [SERVER] Failed to initialize table client for ${this.tableName}:`, error)
    }
  }

  private serializeEntity(entity: T & { id: number }): any {
    console.log(`📝 [SERVER] Serializing entity for table ${this.tableName}:`, entity.id)
    const serialized: any = {
      PartitionKey: "default",
      RowKey: entity.id.toString(),
    }

    // Serialize all properties
    for (const [key, value] of Object.entries(entity)) {
      if (key === "id") continue

      if (value === null || value === undefined) {
        continue
      }

      if (typeof value === "object") {
        serialized[key] = JSON.stringify(value)
      } else {
        serialized[key] = value
      }
    }

    return serialized
  }

  private deserializeEntity(entity: any): T & { id: number } {
    const deserialized: any = {
      id: Number.parseInt(entity.RowKey),
    }

    // Deserialize all properties
    for (const [key, value] of Object.entries(entity)) {
      if (key === "PartitionKey" || key === "RowKey" || key === "Timestamp" || key === "odata.etag") {
        continue
      }

      if (typeof value === "string") {
        try {
          // Try to parse as JSON first
          deserialized[key] = JSON.parse(value as string)
        } catch {
          // If not JSON, keep as string
          deserialized[key] = value
        }
      } else {
        deserialized[key] = value
      }
    }

    return deserialized as T & { id: number }
  }

  async create(entity: T & { id: number }): Promise<void> {
    if (!this.accountName || !this.accountKey) {
      console.log(`❌ [SERVER] No credentials available for ${this.tableName}`)
      throw new Error("Azure Tables not available")
    }

    try {
      console.log(`➕ [SERVER] Creating entity in ${this.tableName} with ID: ${entity.id}`)

      const date = new Date().toUTCString()
      const canonicalizedResource = `/${this.accountName}/${this.tableName}`
      const serialized = this.serializeEntity(entity)
      const body = JSON.stringify(serialized)

      const authHeader = generateAuthHeader(
        "POST",
        this.accountName,
        this.accountKey,
        canonicalizedResource,
        date,
        body.length.toString(),
        "application/json",
      )

      const url = `${this.baseUrl}/${this.tableName}`

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "x-ms-date": date,
          "x-ms-version": "2020-12-06",
          "Content-Type": "application/json",
          "Content-Length": body.length.toString(),
          Accept: "application/json;odata=nometadata",
        },
        body,
      })

      if (response.ok) {
        console.log(`✅ [SERVER] Entity created successfully in ${this.tableName}`)
      } else if (response.status === 409) {
        console.log(`ℹ️ [SERVER] Entity ${entity.id} already exists in ${this.tableName}, updating instead`)
        await this.update(entity)
      } else {
        const errorText = await response.text()
        console.error(`💥 [SERVER] Failed to create entity in ${this.tableName}: ${response.status} ${errorText}`)
        throw new Error(`Failed to create entity: ${response.status}`)
      }
    } catch (error) {
      console.error(`💥 [SERVER] Error creating entity in ${this.tableName}:`, error)
      throw error
    }
  }

  async update(entity: T & { id: number }): Promise<void> {
    if (!this.accountName || !this.accountKey) {
      console.log(`❌ [SERVER] No credentials available for ${this.tableName}`)
      throw new Error("Azure Tables not available")
    }

    try {
      console.log(`🔄 [SERVER] Updating entity in ${this.tableName} with ID: ${entity.id}`)

      const date = new Date().toUTCString()
      const canonicalizedResource = `/${this.accountName}/${this.tableName}(PartitionKey='default',RowKey='${entity.id}')`
      const serialized = this.serializeEntity(entity)
      const body = JSON.stringify(serialized)

      const authHeader = generateAuthHeader(
        "PUT",
        this.accountName,
        this.accountKey,
        canonicalizedResource,
        date,
        body.length.toString(),
        "application/json",
      )

      const url = `${this.baseUrl}/${this.tableName}(PartitionKey='default',RowKey='${entity.id}')`

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: authHeader,
          "x-ms-date": date,
          "x-ms-version": "2020-12-06",
          "Content-Type": "application/json",
          "Content-Length": body.length.toString(),
          Accept: "application/json;odata=nometadata",
          "If-Match": "*",
        },
        body,
      })

      if (response.ok) {
        console.log(`✅ [SERVER] Entity updated successfully in ${this.tableName}`)
      } else {
        const errorText = await response.text()
        console.error(`💥 [SERVER] Failed to update entity in ${this.tableName}: ${response.status} ${errorText}`)
        throw new Error(`Failed to update entity: ${response.status}`)
      }
    } catch (error) {
      console.error(`💥 [SERVER] Error updating entity in ${this.tableName}:`, error)
      throw error
    }
  }

  async delete(id: number): Promise<void> {
    if (!this.accountName || !this.accountKey) {
      console.log(`❌ [SERVER] No credentials available for ${this.tableName}`)
      throw new Error("Azure Tables not available")
    }

    try {
      console.log(`🗑️ [SERVER] Deleting entity from ${this.tableName} with ID: ${id}`)

      const date = new Date().toUTCString()
      const canonicalizedResource = `/${this.accountName}/${this.tableName}(PartitionKey='default',RowKey='${id}')`

      const authHeader = generateAuthHeader("DELETE", this.accountName, this.accountKey, canonicalizedResource, date)

      const url = `${this.baseUrl}/${this.tableName}(PartitionKey='default',RowKey='${id}')`

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: authHeader,
          "x-ms-date": date,
          "x-ms-version": "2020-12-06",
          Accept: "application/json;odata=nometadata",
          "If-Match": "*",
        },
      })

      if (response.ok || response.status === 404) {
        console.log(`✅ [SERVER] Entity deleted successfully from ${this.tableName}`)
      } else {
        const errorText = await response.text()
        console.error(`💥 [SERVER] Failed to delete entity from ${this.tableName}: ${response.status} ${errorText}`)
        throw new Error(`Failed to delete entity: ${response.status}`)
      }
    } catch (error) {
      console.error(`💥 [SERVER] Error deleting entity from ${this.tableName}:`, error)
      throw error
    }
  }

  async get(id: number): Promise<(T & { id: number }) | null> {
    if (!this.accountName || !this.accountKey) {
      console.log(`❌ [SERVER] No credentials available for ${this.tableName}`)
      throw new Error("Azure Tables not available")
    }

    try {
      console.log(`🔍 [SERVER] Getting entity from ${this.tableName} with ID: ${id}`)

      const date = new Date().toUTCString()
      const canonicalizedResource = `/${this.accountName}/${this.tableName}(PartitionKey='default',RowKey='${id}')`

      const authHeader = generateAuthHeader("GET", this.accountName, this.accountKey, canonicalizedResource, date)

      const url = `${this.baseUrl}/${this.tableName}(PartitionKey='default',RowKey='${id}')`

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: authHeader,
          "x-ms-date": date,
          "x-ms-version": "2020-12-06",
          Accept: "application/json;odata=nometadata",
        },
      })

      if (response.ok) {
        const entity = await response.json()
        const result = this.deserializeEntity(entity)
        console.log(`✅ [SERVER] Entity retrieved from ${this.tableName}`)
        return result
      } else if (response.status === 404) {
        console.log(`ℹ️ [SERVER] Entity ${id} not found in ${this.tableName}`)
        return null
      } else {
        const errorText = await response.text()
        console.error(`💥 [SERVER] Failed to get entity from ${this.tableName}: ${response.status} ${errorText}`)
        throw new Error(`Failed to get entity: ${response.status}`)
      }
    } catch (error) {
      console.error(`💥 [SERVER] Error getting entity from ${this.tableName}:`, error)
      throw error
    }
  }

  async getAll(): Promise<(T & { id: number })[]> {
    if (!this.accountName || !this.accountKey) {
      console.log(`❌ [SERVER] No credentials available for ${this.tableName}`)
      return []
    }

    try {
      console.log(`📋 [SERVER] Getting all entities from ${this.tableName}`)

      const date = new Date().toUTCString()
      const canonicalizedResource = `/${this.accountName}/${this.tableName}()`

      const authHeader = generateAuthHeader("GET", this.accountName, this.accountKey, canonicalizedResource, date)

      const url = `${this.baseUrl}/${this.tableName}()?$filter=PartitionKey eq 'default'`

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: authHeader,
          "x-ms-date": date,
          "x-ms-version": "2020-12-06",
          Accept: "application/json;odata=nometadata",
        },
      })

      if (response.ok) {
        const data = await response.json()
        const entities = data.value || []
        const results = entities.map((entity: any) => this.deserializeEntity(entity))
        console.log(`✅ [SERVER] Retrieved ${results.length} entities from ${this.tableName}`)
        return results
      } else {
        const errorText = await response.text()
        console.error(`💥 [SERVER] Failed to get all entities from ${this.tableName}: ${response.status} ${errorText}`)
        return []
      }
    } catch (error) {
      console.error(`💥 [SERVER] Error getting all entities from ${this.tableName}:`, error)
      return []
    }
  }

  async query(filter: string): Promise<(T & { id: number })[]> {
    if (!this.accountName || !this.accountKey) {
      console.log(`❌ [SERVER] No credentials available for ${this.tableName}`)
      return []
    }

    try {
      console.log(`🔍 [SERVER] Querying entities from ${this.tableName} with filter: ${filter}`)

      const date = new Date().toUTCString()
      const canonicalizedResource = `/${this.accountName}/${this.tableName}()`

      const authHeader = generateAuthHeader("GET", this.accountName, this.accountKey, canonicalizedResource, date)

      const url = `${this.baseUrl}/${this.tableName}()?$filter=PartitionKey eq 'default' and ${filter}`

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: authHeader,
          "x-ms-date": date,
          "x-ms-version": "2020-12-06",
          Accept: "application/json;odata=nometadata",
        },
      })

      if (response.ok) {
        const data = await response.json()
        const entities = data.value || []
        const results = entities.map((entity: any) => this.deserializeEntity(entity))
        console.log(`✅ [SERVER] Query returned ${results.length} entities from ${this.tableName}`)
        return results
      } else {
        const errorText = await response.text()
        console.error(`💥 [SERVER] Failed to query entities from ${this.tableName}: ${response.status} ${errorText}`)
        return []
      }
    } catch (error) {
      console.error(`💥 [SERVER] Error querying entities from ${this.tableName}:`, error)
      return []
    }
  }
}

export async function verifyUser(email: string, password: string) {
  // Query users table for matching email
  const userTable = new AzureTableService<{ email: string; passwordHash: string; role: string }>("users")
  const users = await userTable.query(`email eq '${email}'`)
  if (users.length === 0) return null
  const user = users[0]
  // Compare password
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return null
  return { id: user.id, email: user.email, role: user.role }
}
