"use client";

import {
  Mail,
  Inbox,
  Send,
  Archive,
  Star,
  Trash2,
  Paperclip,
} from "lucide-react";
import { AppSidebar, type AppSidebarItem } from "@/components/layout/app-sidebar";

export default function MailPage() {
  const sidebarItems: AppSidebarItem[] = [
    {
      id: "inbox",
      label: "Inbox",
      icon: Inbox,
      count: 12,
      isActive: true,
    },
    {
      id: "starred",
      label: "Starred",
      icon: Star,
      count: 3,
    },
    {
      id: "sent",
      label: "Sent",
      icon: Send,
    },
    {
      id: "archive",
      label: "Archive",
      icon: Archive,
    },
    {
      id: "trash",
      label: "Trash",
      icon: Trash2,
    },
  ]

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <AppSidebar items={sidebarItems} />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Email list */}
        <div className="flex-1 overflow-auto">
          <div className="border-b border-border">
            <div className="p-4 hover:bg-muted/30 cursor-pointer border-l-2 border-primary">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">John Doe</span>
                  <Star className="h-3 w-3 text-yellow-500" />
                </div>
                <span className="text-xs text-muted-foreground">2:30 PM</span>
              </div>
              <h3 className="text-sm font-medium mb-1">Re: Project Update</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                Thanks for the update on the project. I've reviewed the latest
                changes and they look great...
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Paperclip className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  2 attachments
                </span>
              </div>
            </div>
          </div>

          <div className="border-b border-border">
            <div className="p-4 hover:bg-muted/30 cursor-pointer">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Sarah Wilson</span>
                </div>
                <span className="text-xs text-muted-foreground">1:15 PM</span>
              </div>
              <h3 className="text-sm font-medium mb-1">Meeting Reminder</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                Don't forget about our team meeting tomorrow at 10 AM. We'll be
                discussing...
              </p>
            </div>
          </div>

          <div className="border-b border-border">
            <div className="p-4 hover:bg-muted/30 cursor-pointer">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">GitHub</span>
                </div>
                <span className="text-xs text-muted-foreground">11:30 AM</span>
              </div>
              <h3 className="text-sm mb-1">[repo/project] New pull request</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                A new pull request has been opened for review...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
