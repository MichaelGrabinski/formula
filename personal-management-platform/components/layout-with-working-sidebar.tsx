"use client"

import type React from "react"
import { useState } from "react"
import { WorkingSidebar } from "./working-sidebar"

export function LayoutWithWorkingSidebar({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <WorkingSidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  )
}
