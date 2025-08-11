import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { AzureTableService } from "@/lib/azure-tables"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password required." },
        { status: 400 }
      )
    }
    const passwordHash = await bcrypt.hash(password, 10)
    const userTable = new AzureTableService<{
      id: number
      email: string
      passwordHash: string
      role: string
    }>("users")
    // Check if user already exists
    const existingUsers = await userTable.query(`email eq '${email}'`)
    if (existingUsers.length > 0) {
      return NextResponse.json(
        { success: false, error: "User already exists." },
        { status: 409 }
      )
    }
    const id = Math.floor(Math.random() * 1000000)
    await userTable.create({ id, email, passwordHash, role: "admin" })
    return NextResponse.json({ success: true, email })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}
