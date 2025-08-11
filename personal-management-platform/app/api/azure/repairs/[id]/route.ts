import { type NextRequest, NextResponse } from "next/server"
import { AzureTableService, TABLE_NAMES } from "@/lib/azure-tables"
import type { Repair } from "@/lib/data-store-azure"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  console.log(`🔍 [API] Getting repair ${params.id} from Azure`)

  try {
    const service = new AzureTableService<Repair>(TABLE_NAMES.REPAIRS)
    const repair = await service.get(Number.parseInt(params.id))

    if (repair) {
      console.log(`✅ [API] Repair ${params.id} retrieved`)
      return NextResponse.json(repair)
    } else {
      console.log(`ℹ️ [API] Repair ${params.id} not found`)
      return NextResponse.json({ error: "Repair not found" }, { status: 404 })
    }
  } catch (error) {
    console.error(`💥 [API] Error getting repair ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to get repair" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  console.log(`🔄 [API] Updating repair ${params.id} in Azure`)

  try {
    const repair: Repair = await request.json()
    const service = new AzureTableService<Repair>(TABLE_NAMES.REPAIRS)

    await service.update(repair)

    console.log(`✅ [API] Repair ${params.id} updated`)
    return NextResponse.json(repair)
  } catch (error) {
    console.error(`💥 [API] Error updating repair ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to update repair" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  console.log(`🗑️ [API] Deleting repair ${params.id} from Azure`)

  try {
    const service = new AzureTableService<Repair>(TABLE_NAMES.REPAIRS)
    await service.delete(Number.parseInt(params.id))

    console.log(`✅ [API] Repair ${params.id} deleted`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`💥 [API] Error deleting repair ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to delete repair" }, { status: 500 })
  }
}
