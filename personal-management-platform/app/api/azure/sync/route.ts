import { type NextRequest, NextResponse } from "next/server"
import { AzureTableService, TABLE_NAMES, initializeTables } from "@/lib/azure-tables"
import type { Property, Asset, Repair, Project, Task } from "@/lib/data-store-azure"

export async function POST(request: NextRequest) {
  console.log("🔄 [API] Starting bulk sync to Azure...")

  try {
    // First, ensure tables exist
    console.log("🏗️ [API] Ensuring tables exist...")
    const tablesInitialized = await initializeTables()

    if (!tablesInitialized) {
      console.log("❌ [API] Failed to initialize tables")
      return NextResponse.json({ error: "Failed to initialize tables" }, { status: 500 })
    }

    const data = await request.json()
    const { properties, assets, repairs, projects, tasks } = data

    console.log(
      `📊 [API] Syncing data: ${properties?.length || 0} properties, ${assets?.length || 0} assets, ${repairs?.length || 0} repairs, ${projects?.length || 0} projects, ${tasks?.length || 0} tasks`,
    )

    const results = await Promise.allSettled([
      // Sync properties
      ...(properties || []).map(async (property: Property) => {
        const service = new AzureTableService<Property>(TABLE_NAMES.PROPERTIES)
        await service.create(property)
        return { type: "property", id: property.id }
      }),

      // Sync assets
      ...(assets || []).map(async (asset: Asset) => {
        const service = new AzureTableService<Asset>(TABLE_NAMES.ASSETS)
        await service.create(asset)
        return { type: "asset", id: asset.id }
      }),

      // Sync repairs
      ...(repairs || []).map(async (repair: Repair) => {
        const service = new AzureTableService<Repair>(TABLE_NAMES.REPAIRS)
        await service.create(repair)
        return { type: "repair", id: repair.id }
      }),

      // Sync projects
      ...(projects || []).map(async (project: Project) => {
        const service = new AzureTableService<Project>(TABLE_NAMES.PROJECTS)
        await service.create(project)
        return { type: "project", id: project.id }
      }),

      // Sync tasks
      ...(tasks || []).map(async (task: Task) => {
        const service = new AzureTableService<Task>(TABLE_NAMES.TASKS)
        await service.create(task)
        return { type: "task", id: task.id }
      }),
    ])

    const successful = results.filter((r) => r.status === "fulfilled").length
    const total = results.length

    console.log(`📊 [API] Sync results: ${successful}/${total} successful`)

    if (successful === total) {
      console.log("🎉 [API] All data synced successfully!")
      return NextResponse.json({
        success: true,
        message: `Successfully synced ${successful} items`,
        details: { successful, total },
      })
    } else {
      console.log(`⚠️ [API] Some sync operations failed (${successful}/${total})`)
      return NextResponse.json(
        {
          success: false,
          message: `Synced ${successful}/${total} items`,
          details: { successful, total },
        },
        { status: 207 }, // Multi-status
      )
    }
  } catch (error) {
    console.error("💥 [API] Error during bulk sync:", error)
    return NextResponse.json({ error: "Bulk sync failed" }, { status: 500 })
  }
}
