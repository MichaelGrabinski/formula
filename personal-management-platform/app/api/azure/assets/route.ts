import { type NextRequest, NextResponse } from "next/server"
import { AzureTableService, TABLE_NAMES } from "@/lib/azure-tables"
import type { Asset } from "@/lib/data-store-azure"

export async function GET() {
  console.log("📋 [API] Getting all assets from Azure")

  try {
    const service = new AzureTableService<Asset>(TABLE_NAMES.ASSETS)
    const assets = await service.getAll()

    console.log(`✅ [API] Retrieved ${assets.length} assets`)
    return NextResponse.json(assets)
  } catch (error) {
    console.error("💥 [API] Error getting assets:", error)
    return NextResponse.json({ error: "Failed to get assets" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  console.log("➕ [API] Creating new asset in Azure")

  try {
    const asset: Asset = await request.json()
    const service = new AzureTableService<Asset>(TABLE_NAMES.ASSETS)

    await service.create(asset)

    console.log(`✅ [API] Asset created with ID: ${asset.id}`)
    return NextResponse.json(asset, { status: 201 })
  } catch (error) {
    console.error("💥 [API] Error creating asset:", error)
    return NextResponse.json({ error: "Failed to create asset" }, { status: 500 })
  }
}
