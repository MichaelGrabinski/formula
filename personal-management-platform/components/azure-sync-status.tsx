"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAzureData } from "@/lib/data-store-azure"
import { Cloud, CloudOff, RefreshCw, CheckCircle, AlertCircle } from "lucide-react"

export function AzureSyncStatus() {
  const { isAzureConnected, lastSyncTime, syncStatus, syncToAzure, syncFromAzure } = useAzureData()
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      await syncToAzure()
    } catch (error) {
      console.error("Sync failed:", error)
    } finally {
      setIsSyncing(false)
    }
  }

  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case "success":
        return <CheckCircle className="h-3 w-3 text-green-500" />
      case "error":
        return <AlertCircle className="h-3 w-3 text-red-500" />
      case "syncing":
        return <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
      default:
        return null
    }
  }

  const formatLastSync = () => {
    if (!lastSyncTime) return "Never"
    const now = new Date()
    const diff = now.getTime() - lastSyncTime.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className="space-y-2 p-2">
      <div className="flex items-center gap-2">
        {isAzureConnected ? (
          <Cloud className="h-4 w-4 text-blue-500" />
        ) : (
          <CloudOff className="h-4 w-4 text-gray-400" />
        )}
        <span className="text-sm font-medium">{isAzureConnected ? "Azure Connected" : "Local Only"}</span>
      </div>

      {isAzureConnected && (
        <>
          <div className="flex items-center gap-2">
            {getSyncStatusIcon()}
            <span className="text-xs text-muted-foreground">Last sync: {formatLastSync()}</span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleSync}
            disabled={isSyncing || syncStatus === "syncing"}
            className="w-full bg-transparent"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-1" />
                Sync Now
              </>
            )}
          </Button>
        </>
      )}

      {!isAzureConnected && (
        <Badge variant="secondary" className="text-xs">
          Offline Mode
        </Badge>
      )}
    </div>
  )
}
