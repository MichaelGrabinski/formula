import { type NextRequest, NextResponse } from "next/server"
import { AzureTableService, TABLE_NAMES } from "@/lib/azure-tables"
import type { Task } from "@/lib/data-store-azure"

export async function GET() {
  console.log("📋 [API] Getting all tasks from Azure")

  try {
    const service = new AzureTableService<Task>(TABLE_NAMES.TASKS)
    const tasks = await service.getAll()

    console.log(`✅ [API] Retrieved ${tasks.length} tasks`)
    return NextResponse.json(tasks)
  } catch (error) {
    console.error("💥 [API] Error getting tasks:", error)
    return NextResponse.json({ error: "Failed to get tasks" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  console.log("➕ [API] Creating new task in Azure")

  try {
    const task: Task = await request.json()
    const service = new AzureTableService<Task>(TABLE_NAMES.TASKS)

    await service.create(task)

    console.log(`✅ [API] Task created with ID: ${task.id}`)
    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error("💥 [API] Error creating task:", error)
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
  }
}
