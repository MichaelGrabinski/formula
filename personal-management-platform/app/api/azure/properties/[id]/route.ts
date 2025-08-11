import { type NextRequest, NextResponse } from "next/server"
import { AzureTableService, TABLE_NAMES } from "@/lib/azure-tables"
import type { Property } from "@/lib/data-store-azure"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  console.log(`🔍 [API] Getting property ${params.id} from Azure`)

  try {
    const service = new AzureTableService<Property>(TABLE_NAMES.PROPERTIES)
    const property = await service.get(Number.parseInt(params.id))

    if (property) {
      console.log(`✅ [API] Property ${params.id} retrieved`)
      return NextResponse.json(property)
    } else {
      console.log(`ℹ️ [API] Property ${params.id} not found`)
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }
  } catch (error) {
    console.error(`💥 [API] Error getting property ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to get property" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  console.log(`🔄 [API] Updating property ${params.id} in Azure`)

  try {
    const property: Property = await request.json()
    const service = new AzureTableService<Property>(TABLE_NAMES.PROPERTIES)

    await service.update(property)

    console.log(`✅ [API] Property ${params.id} updated`)
    return NextResponse.json(property)
  } catch (error) {
    console.error(`💥 [API] Error updating property ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to update property" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  console.log(`🗑️ [API] Deleting property ${params.id} from Azure`)

  try {
    const service = new AzureTableService<Property>(TABLE_NAMES.PROPERTIES)
    await service.delete(Number.parseInt(params.id))

    console.log(`✅ [API] Property ${params.id} deleted`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`💥 [API] Error deleting property ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to delete property" }, { status: 500 })
  }
}
