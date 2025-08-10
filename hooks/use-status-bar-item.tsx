"use client"

import { useEffect } from "react"
import { useStatusBar, StatusBarItem } from "@/contexts/status-bar-context"

export function useStatusBarItem(item: StatusBarItem | null) {
  const { registerItem, unregisterItem } = useStatusBar()

  useEffect(() => {
    if (item) {
      registerItem(item)
      return () => unregisterItem(item.id)
    }
  }, [item?.id, item?.content, item?.position, item?.priority, registerItem, unregisterItem])
}