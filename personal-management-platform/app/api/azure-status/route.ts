import { NextResponse } from "next/server"

export async function GET() {
  console.log("🔍 [SERVER] Checking Azure Tables status...")

  try {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING

    console.log(
      `🔑 [SERVER] Raw connection string: ${connectionString ? connectionString.substring(0, 50) + "..." : "Not found"}`,
    )
    console.log(`🔑 [SERVER] Connection string length: ${connectionString?.length || 0}`)
    console.log(`🔑 [SERVER] Contains AccountName: ${connectionString?.includes("AccountName=") || false}`)
    console.log(`   [SERVER] AZURE_STORAGE_CONNECTION_STRING: ${connectionString ? "✅ SET" : "❌ NOT SET"}`)

    const isValid = !!connectionString && connectionString.length > 0 && connectionString.includes("AccountName=")

    console.log(`📊 [SERVER] Azure Tables available: ${isValid}`)

    if (isValid) {
      console.log("🏗️ [SERVER] Connection string is valid, marking as connected")
    } else {
      console.log("❌ [SERVER] AZURE_STORAGE_CONNECTION_STRING validation failed")
    }

    return NextResponse.json({
      available: isValid,
      connected: isValid,
    })
  } catch (error) {
    console.error("💥 [SERVER] Error checking Azure status:", error)
    return NextResponse.json({
      available: false,
      connected: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
