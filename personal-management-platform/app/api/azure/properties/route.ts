import { type NextRequest, NextResponse } from "next/server"
import { AzureTableService, TABLE_NAMES } from "@/lib/azure-tables"
import type { Property } from "@/lib/data-store-azure"

export async function GET() {
  console.log("📋 [API] Getting all properties from Azure")

  try {
    const service = new AzureTableService<Property>(TABLE_NAMES.PROPERTIES)
    const properties = await service.getAll()

    console.log(`✅ [API] Retrieved ${properties.length} properties`)
    return NextResponse.json(properties)
  } catch (error) {
    console.error("💥 [API] Error getting properties:", error)
    return NextResponse.json({ error: "Failed to get properties" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  console.log("➕ [API] Creating new property in Azure")

  try {
    const property: Property = await request.json()
    const service = new AzureTableService<Property>(TABLE_NAMES.PROPERTIES)

    await service.create(property)

    console.log(`✅ [API] Property created with ID: ${property.id}`)
    return NextResponse.json(property, { status: 201 })
  } catch (error) {
    console.error("💥 [API] Error creating property:", error)
    return NextResponse.json({ error: "Failed to create property" }, { status: 500 })
  }
}
