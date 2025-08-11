import { type NextRequest, NextResponse } from "next/server"
import { AzureTableService, TABLE_NAMES } from "@/lib/azure-tables"
import type { Repair } from "@/lib/data-store-azure"

export async function GET() {
  console.log("📋 [API] Getting all repairs from Azure")

  try {
    const service = new AzureTableService<Repair>(TABLE_NAMES.REPAIRS)
    const repairs = await service.getAll()

    console.log(`✅ [API] Retrieved ${repairs.length} repairs`)
    return NextResponse.json(repairs)
  } catch (error) {
    console.error("💥 [API] Error getting repairs:", error)
    return NextResponse.json({ error: "Failed to get repairs" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  console.log("➕ [API] Creating new repair in Azure")

  try {
    const repair: Repair = await request.json()
    const service = new AzureTableService<Repair>(TABLE_NAMES.REPAIRS)

    await service.create(repair)

    console.log(`✅ [API] Repair created with ID: ${repair.id}`)
    return NextResponse.json(repair, { status: 201 })
  } catch (error) {
    console.error("💥 [API] Error creating repair:", error)
    return NextResponse.json({ error: "Failed to create repair" }, { status: 500 })
  }
}
