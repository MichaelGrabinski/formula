import { type NextRequest, NextResponse } from "next/server"
import { AzureTableService, TABLE_NAMES } from "@/lib/azure-tables"
import type { Project } from "@/lib/data-store-azure"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  console.log(`🔍 [API] Getting project ${params.id} from Azure`)

  try {
    const service = new AzureTableService<Project>(TABLE_NAMES.PROJECTS)
    const project = await service.get(Number.parseInt(params.id))

    if (project) {
      console.log(`✅ [API] Project ${params.id} retrieved`)
      return NextResponse.json(project)
    } else {
      console.log(`ℹ️ [API] Project ${params.id} not found`)
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }
  } catch (error) {
    console.error(`💥 [API] Error getting project ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to get project" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  console.log(`🔄 [API] Updating project ${params.id} in Azure`)

  try {
    const project: Project = await request.json()
    const service = new AzureTableService<Project>(TABLE_NAMES.PROJECTS)

    await service.update(project)

    console.log(`✅ [API] Project ${params.id} updated`)
    return NextResponse.json(project)
  } catch (error) {
    console.error(`💥 [API] Error updating project ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  console.log(`🗑️ [API] Deleting project ${params.id} from Azure`)

  try {
    const service = new AzureTableService<Project>(TABLE_NAMES.PROJECTS)
    await service.delete(Number.parseInt(params.id))

    console.log(`✅ [API] Project ${params.id} deleted`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`💥 [API] Error deleting project ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 })
  }
}
