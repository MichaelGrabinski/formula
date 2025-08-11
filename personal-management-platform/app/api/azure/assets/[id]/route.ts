import { type NextRequest, NextResponse } from "next/server"
import { AzureTableService, TABLE_NAMES } from "@/lib/azure-tables"
import type { Asset } from "@/lib/data-store-azure"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  console.log(`🔍 [API] Getting asset ${params.id} from Azure`)

  try {
    const service = new AzureTableService<Asset>(TABLE_NAMES.ASSETS)
    const asset = await service.get(Number.parseInt(params.id))

    if (asset) {
      console.log(`✅ [API] Asset ${params.id} retrieved`)
      return NextResponse.json(asset)
    } else {
      console.log(`ℹ️ [API] Asset ${params.id} not found`)
      return NextResponse.json({ error: "Asset not found" }, { status: 404 })
    }
  } catch (error) {
    console.error(`💥 [API] Error getting asset ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to get asset" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  console.log(`🔄 [API] Updating asset ${params.id} in Azure`)

  try {
    const asset: Asset = await request.json()
    const service = new AzureTableService<Asset>(TABLE_NAMES.ASSETS)

    await service.update(asset)

    console.log(`✅ [API] Asset ${params.id} updated`)
    return NextResponse.json(asset)
  } catch (error) {
    console.error(`💥 [API] Error updating asset ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to update asset" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  console.log(`🗑️ [API] Deleting asset ${params.id} from Azure`)

  try {
    const service = new AzureTableService<Asset>(TABLE_NAMES.ASSETS)
    await service.delete(Number.parseInt(params.id))

    console.log(`✅ [API] Asset ${params.id} deleted`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`💥 [API] Error deleting asset ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to delete asset" }, { status: 500 })
  }
}
