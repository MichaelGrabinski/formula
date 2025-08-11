import { type NextRequest, NextResponse } from "next/server"
import { AzureTableService, TABLE_NAMES } from "@/lib/azure-tables"
import type { Project } from "@/lib/data-store-azure"

export async function GET() {
  console.log("📋 [API] Getting all projects from Azure")

  try {
    const service = new AzureTableService<Project>(TABLE_NAMES.PROJECTS)
    const projects = await service.getAll()

    console.log(`✅ [API] Retrieved ${projects.length} projects`)
    return NextResponse.json(projects)
  } catch (error) {
    console.error("💥 [API] Error getting projects:", error)
    return NextResponse.json({ error: "Failed to get projects" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  console.log("➕ [API] Creating new project in Azure")

  try {
    const project: Project = await request.json()
    const service = new AzureTableService<Project>(TABLE_NAMES.PROJECTS)

    await service.create(project)

    console.log(`✅ [API] Project created with ID: ${project.id}`)
    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error("💥 [API] Error creating project:", error)
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
  }
}
