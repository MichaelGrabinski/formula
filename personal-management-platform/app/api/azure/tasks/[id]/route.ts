import { type NextRequest, NextResponse } from "next/server"
import { AzureTableService, TABLE_NAMES } from "@/lib/azure-tables"
import type { Task } from "@/lib/data-store-azure"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  console.log(`🔍 [API] Getting task ${params.id} from Azure`)

  try {
    const service = new AzureTableService<Task>(TABLE_NAMES.TASKS)
    const task = await service.get(Number.parseInt(params.id))

    if (task) {
      console.log(`✅ [API] Task ${params.id} retrieved`)
      return NextResponse.json(task)
    } else {
      console.log(`ℹ️ [API] Task ${params.id} not found`)
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }
  } catch (error) {
    console.error(`💥 [API] Error getting task ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to get task" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  console.log(`🔄 [API] Updating task ${params.id} in Azure`)

  try {
    const task: Task = await request.json()
    const service = new AzureTableService<Task>(TABLE_NAMES.TASKS)

    await service.update(task)

    console.log(`✅ [API] Task ${params.id} updated`)
    return NextResponse.json(task)
  } catch (error) {
    console.error(`💥 [API] Error updating task ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  console.log(`🗑️ [API] Deleting task ${params.id} from Azure`)

  try {
    const service = new AzureTableService<Task>(TABLE_NAMES.TASKS)
    await service.delete(Number.parseInt(params.id))

    console.log(`✅ [API] Task ${params.id} deleted`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`💥 [API] Error deleting task ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 })
  }
}
