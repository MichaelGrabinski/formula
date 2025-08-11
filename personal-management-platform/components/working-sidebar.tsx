"use client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FolderKanban,
  Building2,
  Wrench,
  DollarSign,
  FileText,
  BarChart3,
  MessageSquare,
  Home,
  Menu,
  ChevronLeft,
} from "lucide-react"

const navigationItems = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Management",
    items: [
      {
        title: "Projects & Tasks",
        url: "/projects",
        icon: FolderKanban,
      },
      {
        title: "Assets & Properties",
        url: "/assets",
        icon: Building2,
      },
      {
        title: "Repairs & Maintenance",
        url: "/repairs",
        icon: Wrench,
      },
      {
        title: "Financial",
        url: "/financial",
        icon: DollarSign,
      },
    ],
  },
  {
    title: "Resources",
    items: [
      {
        title: "Documents",
        url: "/documents",
        icon: FileText,
      },
      {
        title: "Reports",
        url: "/reports",
        icon: BarChart3,
      },
      {
        title: "AI Assistant",
        url: "/ai-chat",
        icon: MessageSquare,
      },
    ],
  },
]

interface WorkingSidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

export function WorkingSidebar({ isCollapsed, onToggle }: WorkingSidebarProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out h-screen",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b min-h-16">
        <div className="flex items-center gap-2 overflow-hidden">
          <Home className="h-6 w-6 shrink-0 text-blue-600" />
          {!isCollapsed && <span className="font-semibold text-lg text-gray-900 truncate">Personal Manager</span>}
        </div>
        <Button variant="ghost" size="sm" onClick={onToggle} className="shrink-0 hover:bg-gray-100">
          {isCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {navigationItems.map((section) => (
          <div key={section.title}>
            {!isCollapsed && (
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{section.title}</h3>
            )}
            <div className="space-y-1">
              {section.items.map((item) => (
                <a
                  key={item.title}
                  href={item.url}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 group",
                    isCollapsed && "justify-center px-2",
                  )}
                  title={isCollapsed ? item.title : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0 text-gray-600 group-hover:text-gray-900" />
                  {!isCollapsed && <span className="text-sm font-medium truncate">{item.title}</span>}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t">
        <div className={cn("flex items-center gap-2 text-xs text-gray-500", isCollapsed && "justify-center")}>
          {!isCollapsed && <span>v1.0.0</span>}
        </div>
      </div>
    </div>
  )
}

export function SidebarTriggerButton({ onToggle }: { onToggle: () => void }) {
  return (
    <Button variant="ghost" size="sm" onClick={onToggle} className="hover:bg-gray-100">
      <Menu className="h-4 w-4" />
    </Button>
  )
}
