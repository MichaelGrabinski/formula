import { NextResponse } from "next/server"
import { initializeTables } from "@/lib/azure-tables"

export async function POST() {
  console.log("🚀 [API] Initializing Azure Tables...")

  try {
    const success = await initializeTables()

    if (success) {
      console.log("✅ [API] Azure Tables initialized successfully")
      return NextResponse.json({ success: true, message: "Tables initialized successfully" })
    } else {
      console.log("❌ [API] Failed to initialize some tables")
      return NextResponse.json({ success: false, message: "Failed to initialize some tables" }, { status: 500 })
    }
  } catch (error) {
    console.error("💥 [API] Error initializing tables:", error)
    return NextResponse.json({ success: false, message: "Error initializing tables" }, { status: 500 })
  }
}
